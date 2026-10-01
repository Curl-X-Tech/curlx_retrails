import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

import anyio
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, EmailStr

from app.core.config import settings

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "emails"


class EmailPayload(BaseModel):
    """Data model representing a prepared email message."""

    to_email: EmailStr
    subject: str
    html_content: str
    text_content: str | None = None


class EmailService:
    """Core email service handling template rendering and SMTP delivery."""

    def __init__(self, templates_dir: Path = TEMPLATES_DIR) -> None:
        self.templates_dir = templates_dir
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )
        # Outbox buffer for automated testing and local inspection
        self.outbox: list[dict[str, Any]] = []

    def clear_outbox(self) -> None:
        """Clears the in-memory email outbox."""
        self.outbox.clear()

    def render_template(self, template_name: str, context: dict[str, Any]) -> str:
        """Renders a Jinja2 email template with default system variables."""
        merged_context = {
            "project_name": settings.PROJECT_NAME,
            "frontend_host": settings.FRONTEND_HOST,
            **context,
        }
        template = self.jinja_env.get_template(template_name)
        return template.render(merged_context)

    def _send_smtp_sync(
        self,
        email_to: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
    ) -> bool:
        """Synchronous helper that connects to SMTP server and transmits message."""
        from_header = (
            f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            if settings.EMAILS_FROM_NAME
            else str(settings.EMAILS_FROM_EMAIL)
        )

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = from_header
        message["To"] = email_to

        if text_content:
            message.attach(MIMEText(text_content, "plain", "utf-8"))
        message.attach(MIMEText(html_content, "html", "utf-8"))

        if not settings.SMTP_HOST:
            logger.info(
                "SMTP_HOST is not configured. Email to %s saved to dev outbox.",
                email_to,
            )
            return True

        if settings.SMTP_SSL:
            with smtplib.SMTP_SSL(
                host=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                timeout=15,
            ) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(
                    str(settings.EMAILS_FROM_EMAIL), [email_to], message.as_string()
                )
        else:
            with smtplib.SMTP(
                host=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                timeout=15,
            ) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(
                    str(settings.EMAILS_FROM_EMAIL), [email_to], message.as_string()
                )

        logger.info("Email transmitted successfully to: %s", email_to)
        return True

    async def send_email(
        self,
        email_to: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
    ) -> bool:
        """Sends an email asynchronously via SMTP or logs to outbox in dev/test mode."""
        if not settings.SMTP_HOST:
            email_record = {
                "to": email_to,
                "subject": subject,
                "html": html_content,
                "text": text_content,
            }
            self.outbox.append(email_record)
            banner = (
                f"\n================================================================\n"
                f"  EMAIL DISPATCH (DEV OUTBOX):\n"
                f"  To:      {email_to}\n"
                f"  Subject: {subject}\n"
                f"================================================================\n"
            )
            print(banner, flush=True)
            return True

        try:
            return await anyio.to_thread.run_sync(
                self._send_smtp_sync,
                email_to,
                subject,
                html_content,
                text_content,
            )
        except (smtplib.SMTPException, OSError, ValueError) as exc:
            logger.error("Failed to send email to %s via SMTP: %s", email_to, exc)
            return False

    async def send_reset_password_email(
        self,
        email_to: str,
        token: str,
        user_name: str | None = None,
    ) -> bool:
        """Renders and delivers a password reset link to the target user."""
        reset_link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
        valid_hours = settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS
        subject = f"Password Reset Request - {settings.PROJECT_NAME}"

        context = {
            "email_to": email_to,
            "user_name": user_name or "",
            "reset_link": reset_link,
            "token": token,
            "valid_hours": valid_hours,
        }

        html_content = self.render_template("reset_password.html", context)
        text_content = self.render_template("reset_password.txt", context)

        if not settings.SMTP_HOST:
            banner = (
                f"\n================================================================\n"
                f"  PASSWORD RESET LINK FOR {email_to}:\n"
                f"  {reset_link}\n"
                f"  Token: {token}\n"
                f"================================================================\n"
            )
            print(banner, flush=True)
        else:
            logger.info("Password reset email dispatched to %s", email_to)

        return await self.send_email(
            email_to=email_to,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )


# Global Singleton instance
email_service = EmailService()

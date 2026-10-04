import logging
from pathlib import Path
from typing import Any

import httpx
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
    """Core email service handling template rendering and Resend API delivery."""

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

    async def _send_resend_api(
        self,
        email_to: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
    ) -> bool:
        """Sends an email using Resend's REST API."""
        from_header = (
            f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            if settings.EMAILS_FROM_NAME
            else str(settings.EMAILS_FROM_EMAIL)
        )
        payload: dict[str, Any] = {
            "from": from_header,
            "to": [email_to],
            "subject": subject,
            "html": html_content,
        }
        if text_content:
            payload["text"] = text_content

        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                json=payload,
                headers=headers,
            )
            if response.is_success:
                data = response.json()
                logger.info("Email delivered via Resend API to %s: ID %s", email_to, data.get("id"))
                return True
            else:
                logger.error(
                    "Resend API error sending email to %s: %s %s",
                    email_to,
                    response.status_code,
                    response.text,
                )
                return False

    async def send_email(
        self,
        email_to: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
    ) -> bool:
        """Sends an email via Resend API or logs to dev console and outbox in local mode."""
        if settings.RESEND_API_KEY:
            try:
                return await self._send_resend_api(
                    email_to=email_to,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                )
            except Exception as exc:
                logger.error("Failed to send email to %s via Resend API: %s", email_to, exc)
                return False

        # In dev/local mode without RESEND_API_KEY, record to in-memory outbox and write formatted log
        email_record = {
            "to": email_to,
            "subject": subject,
            "html": html_content,
            "text": text_content,
        }
        self.outbox.append(email_record)

        # Visual console output for local development terminal
        dev_log_box = (
            f"\n"
            f"┌─────────────────────────────────── [DEV EMAIL OUTBOX] ───────────────────────────────────┐\n"
            f"│ To:      {email_to:<78} │\n"
            f"│ From:    {str(settings.EMAILS_FROM_EMAIL):<78} │\n"
            f"│ Subject: {subject:<78} │\n"
            f"├──────────────────────────────────────────────────────────────────────────────────────────┤\n"
            f"│ Body Preview:                                                                            │\n"
            f"│ {(text_content or html_content)[:140].replace(chr(10), ' '):<88} │\n"
            f"└──────────────────────────────────────────────────────────────────────────────────────────┘\n"
        )
        print(dev_log_box, flush=True)
        logger.info("[DEV EMAIL] Dispatched to %s: %s", email_to, subject)
        return True

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

        return await self.send_email(
            email_to=email_to,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )


# Global Singleton instance
email_service = EmailService()

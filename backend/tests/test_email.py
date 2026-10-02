from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient

from app.models import User
from app.services.email import EmailService, email_service


def test_email_template_rendering():
    """Verify Jinja2 email templates render valid HTML and plain text."""
    service = EmailService()
    context = {
        "email_to": "driver@example.com",
        "user_name": "Alex Driver",
        "reset_link": "http://localhost:5173/reset-password?token=test-jwt-token",
        "token": "test-jwt-token",
        "valid_hours": 24,
    }

    html = service.render_template("reset_password.html", context)
    text = service.render_template("reset_password.txt", context)

    assert "Alex Driver" in html
    assert "http://localhost:5173/reset-password?token=test-jwt-token" in html
    assert "24 hours" in html
    assert "ReTrails" in html

    assert "Alex Driver" in text
    assert "http://localhost:5173/reset-password?token=test-jwt-token" in text
    assert "24 hours" in text


@pytest.mark.asyncio
async def test_send_email_dev_outbox():
    """Verify email service saves messages to dev outbox when SMTP is not configured."""
    service = EmailService()
    service.clear_outbox()

    success = await service.send_email(
        email_to="recipient@example.com",
        subject="Test Dispatch Notification",
        html_content="<p>Test Content</p>",
        text_content="Test Content",
    )

    assert success is True
    assert len(service.outbox) == 1
    assert service.outbox[0]["to"] == "recipient@example.com"
    assert service.outbox[0]["subject"] == "Test Dispatch Notification"
    assert service.outbox[0]["html"] == "<p>Test Content</p>"
    assert service.outbox[0]["text"] == "Test Content"


@pytest.mark.asyncio
async def test_send_reset_password_email():
    """Verify send_reset_password_email generates proper link and outbox entry."""
    service = EmailService()
    service.clear_outbox()

    token = "sample_secure_reset_token_123"
    success = await service.send_reset_password_email(
        email_to="user@example.com",
        token=token,
        user_name="John Doe",
    )

    assert success is True
    assert len(service.outbox) == 1
    record = service.outbox[0]
    assert record["to"] == "user@example.com"
    assert "Password Reset Request" in record["subject"]
    assert f"token={token}" in record["html"]
    assert f"token={token}" in record["text"]


@pytest.mark.asyncio
async def test_send_email_smtp_mock():
    """Verify SMTP connection and transmission when SMTP_HOST is configured."""
    service = EmailService()
    service.clear_outbox()

    mock_smtp_instance = MagicMock()
    mock_smtp_class = MagicMock(return_value=mock_smtp_instance)
    mock_smtp_instance.__enter__.return_value = mock_smtp_instance

    with (
        patch("app.services.email.settings.SMTP_HOST", "smtp.example.com"),
        patch("app.services.email.settings.SMTP_PORT", 587),
        patch("app.services.email.settings.SMTP_TLS", True),
        patch("app.services.email.settings.SMTP_USER", "smtp_user"),
        patch("app.services.email.settings.SMTP_PASSWORD", "smtp_pass"),
        patch("smtplib.SMTP", mock_smtp_class),
    ):
        success = await service.send_email(
            email_to="driver@example.com",
            subject="Delivery Assigned",
            html_content="<p>Delivery details</p>",
            text_content="Delivery details",
        )

        assert success is True
        mock_smtp_class.assert_called_once_with(
            host="smtp.example.com", port=587, timeout=15
        )
        mock_smtp_instance.starttls.assert_called_once()
        mock_smtp_instance.login.assert_called_once_with("smtp_user", "smtp_pass")
        mock_smtp_instance.sendmail.assert_called_once()


@pytest.mark.asyncio
async def test_forgot_password_and_reset_flow(client: AsyncClient, test_user: User):
    """Test end-to-end forgot-password and reset-password API flow."""
    email_service.clear_outbox()

    # 1. Request forgot password
    forgot_resp = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": test_user.email},
    )
    assert forgot_resp.status_code == 202

    # 2. Verify email was dispatched to outbox
    assert len(email_service.outbox) >= 1
    sent_email = next(e for e in email_service.outbox if e["to"] == test_user.email)
    assert "Password Reset Request" in sent_email["subject"]

    # Extract token from the rendered text
    # The template text contains "token=<TOKEN>"
    text = sent_email["text"]
    assert "token=" in text
    token_str = text.split("token=")[1].split("\n")[0].split(" ")[0].strip()

    # 3. Reset password using the token
    new_password = "NewlyResetPassword123!"
    reset_resp = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token_str, "password": new_password},
    )
    assert reset_resp.status_code == 200

    # 4. Confirm login works with new password
    login_resp = await client.post(
        "/api/v1/auth/jwt/login",
        data={"username": test_user.email, "password": new_password},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

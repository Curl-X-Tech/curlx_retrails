"""Object storage service supporting MinIO, AWS S3, and local filesystem fallback."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

LOCAL_UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


class StorageService:
    """Unified object storage interface for delivery photos, signatures, and media artifacts."""

    def __init__(self) -> None:
        self.backend = settings.STORAGE_BACKEND.lower()
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.public_url = settings.S3_PUBLIC_URL.rstrip("/")
        self.bucket = settings.S3_BUCKET_NAME
        self.access_key = settings.S3_ACCESS_KEY
        self.secret_key = settings.S3_SECRET_KEY
        self.region = settings.S3_REGION

    def _get_boto_client(self) -> Any:
        try:
            import boto3
            from botocore.config import Config

            return boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
                config=Config(signature_version="s3v4"),
            )
        except ImportError:
            logger.warning("boto3 is not installed; falling back to local storage handler.")
            return None

    def ensure_bucket_exists(self) -> None:
        """Ensures the S3/MinIO bucket or local uploads folder exists."""
        if self.backend == "local":
            LOCAL_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
            return

        client = self._get_boto_client()
        if client is None:
            LOCAL_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
            return

        try:
            buckets = [b["Name"] for b in client.list_buckets().get("Buckets", [])]
            if self.bucket not in buckets:
                client.create_bucket(Bucket=self.bucket)
                logger.info("Created MinIO/S3 bucket: %s", self.bucket)
        except Exception as exc:
            logger.warning(
                "Could not auto-create MinIO bucket %s (will use local fallback if offline): %s", self.bucket, exc
            )

    def upload_bytes(self, key: str, data: bytes, content_type: str = "image/webp") -> str:
        """Uploads binary payload to MinIO/S3 or local storage and returns the accessible URL."""
        clean_key = key.lstrip("/")

        if self.backend != "local":
            client = self._get_boto_client()
            if client:
                try:
                    client.put_object(
                        Bucket=self.bucket,
                        Key=clean_key,
                        Body=data,
                        ContentType=content_type,
                    )
                    return f"{self.public_url}/{self.bucket}/{clean_key}"
                except Exception as exc:
                    logger.warning("Failed to upload to S3/MinIO (%s); falling back to local write: %s", clean_key, exc)

        # Local fallback
        dest_path = LOCAL_UPLOADS_DIR / clean_key
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(data)
        return f"/uploads/{clean_key}"

    def generate_presigned_upload_url(
        self, key: str, content_type: str = "image/webp", expires_in: int = 3600
    ) -> dict[str, str]:
        """Generates pre-signed upload URL for client-side direct camera photo uploads."""
        clean_key = key.lstrip("/")
        client = self._get_boto_client()

        if client and self.backend != "local":
            try:
                url = client.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={"Bucket": self.bucket, "Key": clean_key, "ContentType": content_type},
                    ExpiresIn=expires_in,
                )
                return {
                    "upload_url": url,
                    "file_url": f"{self.public_url}/{self.bucket}/{clean_key}",
                    "key": clean_key,
                }
            except Exception as exc:
                logger.warning("Failed to generate presigned upload URL: %s", exc)

        return {
            "upload_url": f"/api/v1/uploads/{clean_key}",
            "file_url": f"/uploads/{clean_key}",
            "key": clean_key,
        }


storage_service = StorageService()

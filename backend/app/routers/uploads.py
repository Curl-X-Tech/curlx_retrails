"""API router for Proof of Delivery (POD) photo capture and media uploads via MinIO/S3."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.entities.user import User
from app.guards import require_authenticated_user
from app.services.storage import storage_service

router = APIRouter(prefix="/uploads", tags=["Uploads & Media"])


@router.post("/pod", summary="Upload Proof of Delivery photo")
async def upload_pod_photo(
    file: Annotated[UploadFile, File(description="Delivery photo captured via camera or gallery")],
    current_user: Annotated[User | None, Depends(require_authenticated_user)],
) -> dict[str, str]:
    """Receives a driver camera photo for Proof of Delivery, uploads to MinIO/S3, and returns file URL."""
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/heic"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image content type: {file.content_type}. Allowed: {allowed_types}",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded image exceeds 10MB limit.",
        )

    ext = "webp" if file.content_type == "image/webp" else "jpg"
    key = f"pod/{uuid.uuid4().hex}.{ext}"
    url = storage_service.upload_bytes(key=key, data=content, content_type=file.content_type)

    return {
        "file_url": url,
        "key": key,
        "filename": file.filename or key,
        "content_type": file.content_type,
        "size_bytes": str(len(content)),
    }


@router.get("/presigned-url", summary="Generate direct MinIO / S3 upload URL")
async def get_presigned_upload_url(
    content_type: str = Query("image/webp", description="MIME type of the target image"),
    folder: str = Query("pod", description="Target folder prefix (e.g. pod, damages, signatures)"),
    current_user: Annotated[User | None, Depends(require_authenticated_user)] = None,
) -> dict[str, str]:
    """Generates a direct pre-signed PUT URL so mobile PWAs can upload heavy photos directly to MinIO/S3."""
    ext = "webp" if "webp" in content_type else "jpg"
    key = f"{folder.strip('/')}/{uuid.uuid4().hex}.{ext}"
    return storage_service.generate_presigned_upload_url(key=key, content_type=content_type)

from fastapi import APIRouter, HTTPException
from app.utils.minio_client import generate_presigned_url, BUCKET_NAME

router = APIRouter()


@router.get("/upload-url")
def get_presigned_upload_url(file_name: str, content_type: str = None):
    """
    Generate a presigned PUT URL for direct browser upload to MinIO.

    Uses custom AWS Signature V4 implementation that signs with the external
    host (localhost:9000) so browsers can upload directly to MinIO.
    """
    try:
        url = generate_presigned_url(
            method="PUT",
            bucket_name=BUCKET_NAME,
            object_name=file_name,
            expires_seconds=600,  # 10 minutes
        )
        return {"upload_url": url, "file_name": file_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")


@router.get("/download-url")
def get_presigned_download_url(file_name: str):
    """
    Generate a presigned GET URL for direct browser download from MinIO.
    """
    try:
        url = generate_presigned_url(
            method="GET",
            bucket_name=BUCKET_NAME,
            object_name=file_name,
            expires_seconds=600,  # 10 minutes
        )
        return {"download_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")

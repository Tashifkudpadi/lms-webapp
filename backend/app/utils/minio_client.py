# app/utils/minio_client.py
import hashlib
import hmac
from datetime import datetime, timedelta
from urllib.parse import quote, urlencode

from minio import Minio
from app.config import settings

# Internal MinIO client (for server-to-server operations within Docker)
# Used for: bucket creation, file deletion, listing, etc.
minio_client = Minio(
    f"{settings.MINIO_ENDPOINT}:{settings.MINIO_PORT}",
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

BUCKET_NAME = settings.MINIO_BUCKET

# Create bucket if it doesn't exist
try:
    if not minio_client.bucket_exists(BUCKET_NAME):
        minio_client.make_bucket(BUCKET_NAME)
        print(f"Created MinIO bucket: {BUCKET_NAME}")
    else:
        print(f"MinIO bucket '{BUCKET_NAME}' already exists")
except Exception as e:
    print(f"MinIO init error: {e}")


def _sign(key: bytes, msg: str) -> bytes:
    """HMAC-SHA256 signing helper."""
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()


def _get_signature_key(secret_key: str, date_stamp: str, region: str, service: str) -> bytes:
    """Generate AWS Signature V4 signing key."""
    k_date = _sign(('AWS4' + secret_key).encode('utf-8'), date_stamp)
    k_region = _sign(k_date, region)
    k_service = _sign(k_region, service)
    k_signing = _sign(k_service, 'aws4_request')
    return k_signing


def generate_presigned_url(
    method: str,
    bucket_name: str,
    object_name: str,
    expires_seconds: int = 600,
    host: str = None,
    secure: bool = False,
) -> str:
    """
    Generate a presigned URL with AWS Signature V4.

    This function generates presigned URLs with a custom host for the signature,
    allowing the URL to work when the signing host differs from the MinIO server's
    internal hostname (e.g., localhost vs minio in Docker).

    Args:
        method: HTTP method (GET or PUT)
        bucket_name: S3 bucket name
        object_name: Object key/path
        expires_seconds: URL expiration time in seconds (default 600 = 10 minutes)
        host: The host:port for the URL (default: from settings)
        secure: Use HTTPS if True (default: from settings)

    Returns:
        Presigned URL string
    """
    if host is None:
        host = f"{settings.MINIO_EXTERNAL_ENDPOINT}:{settings.MINIO_EXTERNAL_PORT}"
    if secure is None:
        secure = settings.MINIO_EXTERNAL_SECURE

    access_key = settings.MINIO_ACCESS_KEY
    secret_key = settings.MINIO_SECRET_KEY
    region = "us-east-1"  # MinIO default region
    service = "s3"

    # Current time
    now = datetime.utcnow()
    amz_date = now.strftime('%Y%m%dT%H%M%SZ')
    date_stamp = now.strftime('%Y%m%d')

    # Credential scope
    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"

    # Canonical URI (URL-encoded object path)
    canonical_uri = f"/{bucket_name}/{quote(object_name, safe='')}"

    # Canonical query string (sorted alphabetically)
    query_params = {
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': f"{access_key}/{credential_scope}",
        'X-Amz-Date': amz_date,
        'X-Amz-Expires': str(expires_seconds),
        'X-Amz-SignedHeaders': 'host',
    }
    canonical_querystring = '&'.join(
        f"{quote(k, safe='')}={quote(v, safe='')}"
        for k, v in sorted(query_params.items())
    )

    # Canonical headers (host header that browser will send)
    canonical_headers = f"host:{host}\n"
    signed_headers = "host"

    # Payload hash (UNSIGNED-PAYLOAD for presigned URLs)
    payload_hash = "UNSIGNED-PAYLOAD"

    # Canonical request
    canonical_request = '\n'.join([
        method,
        canonical_uri,
        canonical_querystring,
        canonical_headers,
        signed_headers,
        payload_hash,
    ])

    # String to sign
    canonical_request_hash = hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
    string_to_sign = '\n'.join([
        'AWS4-HMAC-SHA256',
        amz_date,
        credential_scope,
        canonical_request_hash,
    ])

    # Calculate signature
    signing_key = _get_signature_key(secret_key, date_stamp, region, service)
    signature = hmac.new(signing_key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

    # Build final URL
    protocol = "https" if secure else "http"
    final_querystring = f"{canonical_querystring}&X-Amz-Signature={signature}"

    return f"{protocol}://{host}{canonical_uri}?{final_querystring}"


def delete_file_from_minio(file_url: str) -> bool:
    """
    Delete a file from MinIO given its URL.

    Args:
        file_url: The file URL (e.g., http://localhost:9000/bucket/filename.pdf)

    Returns:
        True if deleted successfully, False otherwise
    """
    if not file_url:
        return False

    try:
        # Extract object name from URL
        # URL format: http://localhost:9000/bucket/object_name
        parts = file_url.split("/")
        if len(parts) < 4:
            return False

        # Get the object name (last part of the URL)
        object_name = parts[-1]

        # Delete from MinIO
        minio_client.remove_object(BUCKET_NAME, object_name)
        print(f"Deleted file from MinIO: {object_name}")
        return True
    except Exception as e:
        print(f"Error deleting file from MinIO: {e}")
        return False

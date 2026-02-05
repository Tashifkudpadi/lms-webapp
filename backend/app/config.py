from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_hostname: str
    database_port: str
    database_password: str
    database_name: str
    database_username: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    # MinIO internal (for server-to-server operations within Docker)
    MINIO_ENDPOINT: str
    MINIO_PORT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    MINIO_SECURE: bool

    # MinIO external (for browser-accessible presigned URLs)
    MINIO_EXTERNAL_ENDPOINT: str = "localhost"
    MINIO_EXTERNAL_PORT: str = "9000"
    MINIO_EXTERNAL_SECURE: bool = False

    class Config:
        env_file = ".env"
        model_config = {"from_attributes": True}


settings = Settings()

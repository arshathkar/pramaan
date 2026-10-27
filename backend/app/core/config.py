"""Pramaan application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # ── Identity ──
    APP_NAME: str = "Pramaan"
    APP_ENV: Literal["dev", "demo", "prod"] = "demo"

    # ── Database ──
    DATABASE_URL: str = "sqlite+aiosqlite:///./pramaan.db"

    # ── Security secrets ──
    APP_SECRET_KEY: str = "CHANGE-ME-generate-with-scripts-gen_secrets"
    JWT_SECRET: str = "CHANGE-ME-generate-with-scripts-gen_secrets"
    FILE_ENC_KEY: str = "CHANGE-ME-generate-with-scripts-gen_secrets"
    COOKIE_SECURE: bool = False  # True behind HTTPS in prod

    # ── Demo clock ──
    DEMO_TODAY: str | None = "2026-10-23"  # ISO date; None = use real clock

    # ── OCR ──
    TESSERACT_CMD: str = "tesseract"
    OCR_ENGINE: Literal["tesseract", "paddle"] = "tesseract"

    # ── Features ──
    ENABLE_SCENE_CHECK: bool = False
    ASSISTANT_MODE: Literal["full", "predefined_only"] = "full"

    # ── Paths ──
    MODEL_DIR: str = "backend/models"
    UPLOAD_DIR: str = "backend/uploads"

    # ── Limits ──
    RETENTION_DAYS: int = 365
    MAX_UPLOAD_MB: int = 15
    MAX_VIDEO_MB: int = 50
    MAX_FILES_PER_APP: int = 25
    SLA_DAYS: int = 5
    RECTIFICATION_DAYS: int = 15

    # ── Authority mock ──
    AUTHORITY_BASE_URL: str = "http://localhost:8100"
    AUTHORITY_SIM_TOKEN: str = "sim-token-change-me"

    # ── Optional services ──
    SMTP_HOST: str | None = None
    LOG_LEVEL: str = "INFO"

    # ── Ports ──
    API_PORT: int = 8000
    AUTHORITY_PORT: int = 8100

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}


settings = Settings()

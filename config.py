import os
from dotenv import load_dotenv

# Завантажуємо змінні з .env
load_dotenv()


BASE_CSP = {
    "default-src": "'self'",
    "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:"],
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
}


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": {"charset": "utf8mb4"},
    }
    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
    WEATHER_CITY = os.getenv("WEATHER_CITY", "Sumy")
    SCHEDULER_API_ENABLED = True
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_STRATEGY = "fixed-window"
    TALISMAN_ENABLED = True
    CONTENT_SECURITY_POLICY = BASE_CSP
    TALISMAN_FORCE_HTTPS = False
    WTF_CSRF_ENABLED = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_SECURE = os.getenv("REMEMBER_COOKIE_SECURE", "false").lower() == "true"
    PREFERRED_URL_SCHEME = "http"
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    APP_VERSION = os.getenv("APP_VERSION", "0.1.0")


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    WTF_CSRF_ENABLED = False
    TALISMAN_ENABLED = False
    SCHEDULER_API_ENABLED = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}


class ProductionConfig(Config):
    DEBUG = False
    TALISMAN_FORCE_HTTPS = True
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = "https"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": {"charset": "utf8mb4"},
    }

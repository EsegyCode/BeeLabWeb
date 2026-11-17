import os
from dotenv import load_dotenv

load_dotenv()


BASE_CSP = {
    "default-src": "'self'",
    "script-src": ["'self'"],
    "style-src": ["'self'"],
    "font-src": ["'self'", "data:"],
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
        "pool_recycle": 280,
        "connect_args": {"charset": "utf8mb4"},
    }
    APP_NAME = os.getenv("APP_NAME", "BeeLab")
    APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
    APP_URL = os.getenv("APP_URL")
    SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL")
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    TELEGRAM_BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME")
    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
    WEATHER_CITY = os.getenv("WEATHER_CITY", "Sumy")
    DEFAULT_TIMEZONE = os.getenv("DEFAULT_TIMEZONE", "Europe/Kyiv")
    ITEMS_PER_PAGE = int(os.getenv("ITEMS_PER_PAGE", "20"))
    WEATHER_CACHE_MINUTES = int(os.getenv("WEATHER_CACHE_MINUTES", "20"))
    BRIEFING_HOUR = int(os.getenv("BRIEFING_HOUR", "8"))
    MAX_IMPORT_ROWS = int(os.getenv("MAX_IMPORT_ROWS", "1000"))
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
        "pool_recycle": 280,
        "connect_args": {"charset": "utf8mb4"},
    }

    def validate(self):
        if not os.getenv("SECRET_KEY"):
            raise RuntimeError("SECRET_KEY is required in production")
        if not os.getenv("DATABASE_URL"):
            raise RuntimeError("DATABASE_URL is required in production")


def get_config():
    env = os.getenv("FLASK_ENV", "production").lower()
    mapping = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
    }
    config = mapping.get(env, ProductionConfig)
    if env == "production":
        if not os.getenv("SECRET_KEY"):
            raise RuntimeError("SECRET_KEY is required in production")
        if not os.getenv("DATABASE_URL"):
            raise RuntimeError("DATABASE_URL is required in production")
    return config
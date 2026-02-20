# config.py
import os


class Config:
    # Секретний ключ для сесій
    SECRET_KEY = os.environ.get('SECRET_KEY') or "bee_secret_key_123"

    # Налаштування бази даних
    LOCAL_DB = "mysql+pymysql://root:admin_password@127.0.0.1:3308/beekeeping_db"
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or LOCAL_DB
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Налаштування API погоди
    WEATHER_API_KEY = "86e44870c51f3c1e84810cc34f209a05"
    WEATHER_CITY = "Sumy"
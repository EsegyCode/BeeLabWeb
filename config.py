import os
from dotenv import load_dotenv

# Завантажуємо змінні з .env
load_dotenv()

class Config:
    # Секретний ключ для сесій
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_key_dont_use_in_production')

    # Налаштування бази даних
    # Тепер ми НЕ пишемо пароль тут. Він прийде з .env через змінну DATABASE_URL
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Налаштування API погоди
    WEATHER_API_KEY = os.getenv('WEATHER_API_KEY')
    WEATHER_CITY = "Sumy"

    SCHEDULER_API_ENABLED = True
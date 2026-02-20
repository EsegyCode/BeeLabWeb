from main import create_app
from models import db

app = create_app()

with app.app_context():
    db.drop_all()   # Видаляє всі старі таблиці
    db.create_all() # Створює нові згідно з оновленими моделями
    print("✅ База даних успішно очищена та оновлена!")
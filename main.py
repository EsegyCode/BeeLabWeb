from flask import Flask
from flask_login import LoginManager
from models import db, User
from config import Config
from flask_apscheduler import APScheduler
from core.scheduler_tasks import send_daily_briefing

# Blueprints
from routes.auth import auth_bp
from routes.hives import hives_bp
from routes.analytics import analytics_bp

# 1. Створюємо об'єкт планувальника ПОЗА функцією create_app
scheduler = APScheduler()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    app.register_blueprint(auth_bp)
    app.register_blueprint(hives_bp)
    app.register_blueprint(analytics_bp)

    with app.app_context():
        db.create_all()

    # 2. Ініціалізуємо планувальник тут, але старт винесемо
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()

        # Налаштовуємо запуск щодня о 08:00 ранку
        @scheduler.task('cron', id='daily_briefing_job', hour=8, minute=0)
        def scheduled_briefing():
            print("INFO: Запуск планового ранкового звіту...")
            send_daily_briefing(app)

    return app

if __name__ == "__main__":
    app = create_app()
    # 3. Використовуй use_reloader=False, якщо хочеш уникнути подвійного запуску при дебазі
    app.run(debug=True, port=5000, use_reloader=False)
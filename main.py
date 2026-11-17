import os

from flask import Flask
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix

from config import DevelopmentConfig, ProductionConfig, TestingConfig
from extensions import csrf, limiter, scheduler, talisman
from models import db, User

# Blueprints
from routes.auth import auth_bp
from routes.hives import hives_bp
from routes.analytics import analytics_bp
from routes.finance import finance_bp
from core.scheduler_tasks import send_daily_briefing


def create_app(config_object=None):
    if config_object is None:
        env = os.getenv("FLASK_ENV", "development").lower()
        config_object = {
            "development": DevelopmentConfig,
            "testing": TestingConfig,
            "production": ProductionConfig,
        }.get(env, DevelopmentConfig)

    app = Flask(__name__)
    app.config.from_object(config_object)

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    db.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)
    limiter.storage_uri = app.config.get("RATELIMIT_STORAGE_URI", "memory://")

    if app.config.get("TALISMAN_ENABLED", True):
        talisman.init_app(
            app,
            force_https=app.config.get("TALISMAN_FORCE_HTTPS", False),
            content_security_policy=app.config.get("CONTENT_SECURITY_POLICY"),
        )

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    app.register_blueprint(auth_bp)
    app.register_blueprint(hives_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(finance_bp)

    with app.app_context():
        db.create_all()

    if app.config.get("SCHEDULER_API_ENABLED", True) and not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()

        @scheduler.task("cron", id="daily_briefing_job", hour=8, minute=0)
        def scheduled_briefing():
            print("INFO: Запуск планового ранкового звіту...")
            send_daily_briefing(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", debug=True, port=5000, use_reloader=False)

import mimetypes
import os

from flask import Flask, render_template, url_for
from markupsafe import Markup
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix

from config import DevelopmentConfig, ProductionConfig, TestingConfig, get_config
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
        config_object = get_config()

    app = Flask(__name__)
    app.config.from_object(config_object)

    mimetypes.add_type("text/css", ".css")
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("font/woff2", ".woff2")
    mimetypes.add_type("font/woff", ".woff")
    mimetypes.add_type("font/ttf", ".ttf")

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
    login_manager.login_message = "Увійдіть, щоб отримати доступ до цієї сторінки."
    login_manager.login_message_category = "warning"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    app.register_blueprint(auth_bp)
    app.register_blueprint(hives_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(finance_bp)

    @app.errorhandler(403)
    def forbidden(error):
        return render_template("errors/403.html"), 403

    @app.errorhandler(404)
    def not_found(error):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(error):
        return render_template("errors/500.html"), 500

    with app.app_context():
        db.create_all()

    if app.config.get("SCHEDULER_API_ENABLED", True) and not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()

        @scheduler.task("cron", id="daily_briefing_job", hour=8, minute=0)
        def scheduled_briefing():
            print("INFO: Запуск планового ранкового звіту...")
            send_daily_briefing(app)

    @app.context_processor
    def inject_app_meta():
        def icon(name, cls=""):
            return Markup(
                f'<svg class="icon {cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'
            )

        return {
            "APP_NAME": app.config.get("APP_NAME", "BeeLab"),
            "APP_VERSION": app.config.get("APP_VERSION", "0.1.0"),
            "SUPPORT_EMAIL": app.config.get("SUPPORT_EMAIL"),
            "TELEGRAM_BOT_USERNAME": app.config.get("TELEGRAM_BOT_USERNAME"),
            "icon": icon,
        }

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", debug=True, port=5000, use_reloader=False)

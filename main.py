from flask import Flask
from flask_login import LoginManager
from models import db, User
from config import Config

#Blueprints
from routes.auth import auth_bp
from routes.hives import hives_bp
from routes.analytics import analytics_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'  # Префікс Blueprint
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # РЕЄСТРАЦІЯ
    app.register_blueprint(auth_bp)
    app.register_blueprint(hives_bp)
    app.register_blueprint(analytics_bp)

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
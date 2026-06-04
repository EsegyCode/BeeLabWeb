import pytest

from config import TestingConfig
from main import create_app
from models import db, User


class TestConfig(TestingConfig):
    SECRET_KEY = "test-secret"


@pytest.fixture()
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def create_user(username="20010714", password="20010714", **kwargs):
    user = User(username=username, **kwargs)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture()
def user(app):
    with app.app_context():
        return create_user()


@pytest.fixture()
def logged_in_client(client, user):
    client.post("/login", data={"username": "20010714", "password": "20010714"})
    return client

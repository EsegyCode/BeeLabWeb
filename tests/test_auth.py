from models import User, db


def test_register_validates_password(client, app):
    response = client.post(
        "/register",
        data={"username": "newuser", "password": "123", "contact": "test"},
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        assert User.query.filter_by(username="newuser").first() is None


def test_register_and_login_with_valid_credentials(client, app):
    response = client.post(
        "/register",
        data={"username": "20010714", "password": "20010714", "contact": ""},
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        assert User.query.filter_by(username="20010714").first() is not None

    response = client.post(
        "/login",
        data={"username": "20010714", "password": "20010714"},
        follow_redirects=True,
    )

    assert response.status_code == 200
    assert "btn-orange" in response.text


def test_profile_validates_telegram_id(logged_in_client, app):
    response = logged_in_client.post(
        "/profile",
        data={"city": "Kyiv", "telegram_id": "@bad"},
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        user = User.query.filter_by(username="20010714").first()
        assert user.telegram_id is None


def test_profile_updates_clean_values(logged_in_client, app):
    logged_in_client.post(
        "/profile",
        data={"city": "Kyiv", "telegram_id": "123456789"},
        follow_redirects=True,
    )

    with app.app_context():
        db.session.expire_all()
        user = User.query.filter_by(username="20010714").first()
        assert user.city == "Kyiv"
        assert user.telegram_id == "123456789"

from datetime import date, timedelta

from models import FutureTask, Hives, HiveInspection, User, db
from tests.conftest import create_user


def test_add_hive_validates_required_number(logged_in_client, app):
    response = logged_in_client.post(
        "/add_hive",
        data={"hive_number": "", "queen_year": str(date.today().year), "bee_species": "Карніка"},
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        assert Hives.query.count() == 0


def test_add_hive_creates_owned_hive_with_status(logged_in_client, app):
    response = logged_in_client.post(
        "/add_hive",
        data={
            "hive_number": "12",
            "queen_year": str(date.today().year),
            "bee_species": "Карніка",
            "install_date": date.today().isoformat(),
            "has_queen_cells": "on",
        },
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        hive = Hives.query.filter_by(hive_number="12").one()
        assert hive.owner.username == "20010714"
        assert hive.current_status == "⚠️ МАТОЧНИКИ"
        assert hive.install_date == date.today()


def test_add_hive_rejects_duplicates_per_user(logged_in_client, app):
    payload = {
        "hive_number": "12",
        "queen_year": str(date.today().year),
        "bee_species": "Карніка",
        "install_date": date.today().isoformat(),
    }
    logged_in_client.post("/add_hive", data=payload)
    logged_in_client.post("/add_hive", data=payload)

    with app.app_context():
        assert Hives.query.filter_by(hive_number="12").count() == 1


def test_user_cannot_view_another_users_hive(client, app):
    with app.app_context():
        owner = create_user(username="owner", password="20010714")
        create_user(username="other", password="20010714")
        hive = Hives(hive_number="1", queen_year=date.today().year, user_id=owner.id)
        db.session.add(hive)
        db.session.commit()
        hive_id = hive.id

    client.post("/login", data={"username": "other", "password": "20010714"})
    response = client.get(f"/hive/{hive_id}")

    assert response.status_code == 403


def test_inspection_validates_honey_level(logged_in_client, app):
    with app.app_context():
        user = User.query.filter_by(username="20010714").one()
        hive = Hives(hive_number="1", queen_year=date.today().year, user_id=user.id)
        db.session.add(hive)
        db.session.commit()
        hive_id = hive.id

    response = logged_in_client.post(
        f"/hive/{hive_id}",
        data={"honey_level": "bad", "condition": "ok"},
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        assert HiveInspection.query.count() == 0


def test_quick_action_feeding_updates_hive_and_schedules_task(logged_in_client, app):
    with app.app_context():
        user = User.query.filter_by(username="20010714").one()
        hive = Hives(hive_number="1", queen_year=date.today().year, user_id=user.id)
        db.session.add(hive)
        db.session.commit()
        hive_id = hive.id

    logged_in_client.post(f"/hive/{hive_id}/quick_action/feeding")

    with app.app_context():
        hive = db.session.get(Hives, hive_id)
        task = FutureTask.query.filter_by(hive_id=hive_id).one()
        assert hive.last_feeding_date == date.today()
        assert task.planned_date == date.today() + timedelta(days=4)
        assert task.task_type == "Перевірка корму"


def test_quick_action_rejects_unknown_action(logged_in_client, app):
    with app.app_context():
        user = User.query.filter_by(username="20010714").one()
        hive = Hives(hive_number="1", queen_year=date.today().year, user_id=user.id)
        db.session.add(hive)
        db.session.commit()
        hive_id = hive.id

    response = logged_in_client.post(
        f"/hive/{hive_id}/quick_action/unknown",
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        assert FutureTask.query.count() == 0

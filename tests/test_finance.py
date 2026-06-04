from datetime import date
from decimal import Decimal

from models import ExpenseLog, HoneyHarvestLog, HoneySaleLog, User
from routes.finance import finance_stats_for_user, honey_stock_for_user


def current_test_user_id(app):
    with app.app_context():
        return User.query.filter_by(username="20010714").one().id


def test_finance_page_requires_login(client):
    response = client.get("/finance")

    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_add_expense(logged_in_client, user, app):
    user_id = current_test_user_id(app)
    response = logged_in_client.post(
        "/finance",
        data={
            "form_type": "expense",
            "amount": "125.50",
            "category": "Кормова база",
            "description": "Цукор",
            "date": date.today().isoformat(),
        },
        follow_redirects=True,
    )

    assert response.status_code == 200
    with app.app_context():
        expense = ExpenseLog.query.filter_by(user_id=user_id).one()
        assert expense.amount == Decimal("125.50")
        assert expense.category == "Кормова база"
        assert expense.description == "Цукор"


def test_honey_stock_after_harvest_and_sale(logged_in_client, user, app):
    user_id = current_test_user_id(app)
    logged_in_client.post(
        "/finance",
        data={
            "form_type": "harvest",
            "kg": "40",
            "date": date.today().isoformat(),
            "note": "Липа",
        },
    )
    logged_in_client.post(
        "/finance",
        data={
            "form_type": "sale",
            "kg": "12.5",
            "price_per_kg": "180",
            "date": date.today().isoformat(),
            "note": "Роздріб",
        },
    )

    with app.app_context():
        assert HoneyHarvestLog.query.filter_by(user_id=user_id).one().kg == Decimal("40.00")
        sale = HoneySaleLog.query.filter_by(user_id=user_id).one()
        assert sale.kg == Decimal("12.50")
        assert sale.total_amount == Decimal("2250.00")
        assert honey_stock_for_user(user_id) == Decimal("27.50")
        stats = finance_stats_for_user(user_id)
        assert stats["total_revenue"] == Decimal("2250.00")
        assert stats["stock_kg"] == Decimal("27.50")


def test_sale_cannot_exceed_honey_stock(logged_in_client, user, app):
    user_id = current_test_user_id(app)
    logged_in_client.post(
        "/finance",
        data={
            "form_type": "harvest",
            "kg": "5",
            "date": date.today().isoformat(),
            "note": "",
        },
    )
    response = logged_in_client.post(
        "/finance",
        data={
            "form_type": "sale",
            "kg": "6",
            "price_per_kg": "200",
            "date": date.today().isoformat(),
            "note": "",
        },
        follow_redirects=True,
    )

    assert response.status_code == 200
    assert "Недостатньо меду на складі" in response.text
    with app.app_context():
        assert HoneySaleLog.query.filter_by(user_id=user_id).count() == 0
        assert honey_stock_for_user(user_id) == Decimal("5.00")

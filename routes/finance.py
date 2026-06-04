from collections import defaultdict
from decimal import Decimal

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from sqlalchemy import func

from models import db, ExpenseLog, HoneyHarvestLog, HoneySaleLog
from validators import (
    EXPENSE_CATEGORIES,
    ValidationError,
    validate_date,
    validate_decimal,
    validate_expense_category,
    validate_finance_note,
    validate_honey_sale_quantity,
)


finance_bp = Blueprint('finance', __name__)


def honey_stock_for_user(user_id):
    harvested = db.session.query(func.coalesce(func.sum(HoneyHarvestLog.kg), 0)).filter_by(user_id=user_id).scalar()
    sold = db.session.query(func.coalesce(func.sum(HoneySaleLog.kg), 0)).filter_by(user_id=user_id).scalar()
    return Decimal(harvested or 0) - Decimal(sold or 0)


def finance_stats_for_user(user_id):
    total_expenses = db.session.query(func.coalesce(func.sum(ExpenseLog.amount), 0)).filter_by(user_id=user_id).scalar()
    total_revenue = db.session.query(func.coalesce(func.sum(HoneySaleLog.total_amount), 0)).filter_by(user_id=user_id).scalar()
    stock_kg = honey_stock_for_user(user_id)
    total_expenses = Decimal(total_expenses or 0)
    total_revenue = Decimal(total_revenue or 0)
    return {
        "total_expenses": total_expenses,
        "total_revenue": total_revenue,
        "balance": total_revenue - total_expenses,
        "stock_kg": stock_kg,
    }


def chart_data_for_user(user_id):
    expenses = ExpenseLog.query.filter_by(user_id=user_id).order_by(ExpenseLog.date.asc()).all()
    sales = HoneySaleLog.query.filter_by(user_id=user_id).order_by(HoneySaleLog.date.asc()).all()

    by_date = defaultdict(lambda: {"expenses": Decimal("0.00"), "revenue": Decimal("0.00")})
    for expense in expenses:
        by_date[expense.date.isoformat()]["expenses"] += Decimal(expense.amount)
    for sale in sales:
        by_date[sale.date.isoformat()]["revenue"] += Decimal(sale.total_amount)

    labels = sorted(by_date.keys())
    return {
        "labels": labels,
        "expenses": [float(by_date[label]["expenses"]) for label in labels],
        "revenue": [float(by_date[label]["revenue"]) for label in labels],
    }


@finance_bp.route('/finance', methods=['GET', 'POST'])
@login_required
def finance():
    if request.method == 'POST':
        form_type = request.form.get('form_type')
        try:
            if form_type == 'expense':
                expense = ExpenseLog(
                    amount=validate_decimal(request.form.get('amount'), field_name="Сума"),
                    category=validate_expense_category(request.form.get('category')),
                    description=validate_finance_note(request.form.get('description'), field_name="Опис"),
                    date=validate_date(request.form.get('date'), default=None, field_name="Дата витрати"),
                    user_id=current_user.id,
                )
                db.session.add(expense)
                db.session.commit()
                flash("Витрату додано.", "success")

            elif form_type == 'harvest':
                harvest = HoneyHarvestLog(
                    kg=validate_decimal(request.form.get('kg'), field_name="Кількість меду"),
                    date=validate_date(request.form.get('date'), default=None, field_name="Дата збору"),
                    note=validate_finance_note(request.form.get('note')),
                    user_id=current_user.id,
                )
                db.session.add(harvest)
                db.session.commit()
                flash("Збір меду додано на склад.", "success")

            elif form_type == 'sale':
                available_kg = honey_stock_for_user(current_user.id)
                kg = validate_honey_sale_quantity(request.form.get('kg'), available_kg)
                price_per_kg = validate_decimal(request.form.get('price_per_kg'), field_name="Ціна за кг")
                sale = HoneySaleLog(
                    kg=kg,
                    price_per_kg=price_per_kg,
                    total_amount=(kg * price_per_kg).quantize(Decimal("0.01")),
                    date=validate_date(request.form.get('date'), default=None, field_name="Дата продажу"),
                    note=validate_finance_note(request.form.get('note')),
                    user_id=current_user.id,
                )
                db.session.add(sale)
                db.session.commit()
                flash("Продаж меду додано.", "success")

            else:
                flash("Невідомий тип форми.", "danger")
        except ValidationError as exc:
            db.session.rollback()
            flash(str(exc), "danger")

        return redirect(url_for('finance.finance'))

    stats = finance_stats_for_user(current_user.id)
    expenses = ExpenseLog.query.filter_by(user_id=current_user.id).order_by(ExpenseLog.date.desc(), ExpenseLog.id.desc()).limit(10).all()
    harvests = HoneyHarvestLog.query.filter_by(user_id=current_user.id).order_by(HoneyHarvestLog.date.desc(), HoneyHarvestLog.id.desc()).limit(10).all()
    sales = HoneySaleLog.query.filter_by(user_id=current_user.id).order_by(HoneySaleLog.date.desc(), HoneySaleLog.id.desc()).limit(10).all()
    stock_progress = min(100, int((stats["stock_kg"] / Decimal("100")) * 100)) if stats["stock_kg"] > 0 else 0

    return render_template(
        'finance.html',
        categories=EXPENSE_CATEGORIES,
        chart_data=chart_data_for_user(current_user.id),
        expenses=expenses,
        harvests=harvests,
        sales=sales,
        stats=stats,
        stock_progress=stock_progress,
    )

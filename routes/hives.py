# routes/hives.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
from models import db, Hives, HiveInspection, FutureTask
from core.weather import get_weather
from datetime import date, timedelta

hives_bp = Blueprint('hives', __name__)


@hives_bp.route('/')
@login_required
def index():
    # Ключ беремо з конфігу через current_app
    api_key = current_app.config.get('WEATHER_API_KEY')
    temp = get_weather(current_user.city, api_key)
    hives = Hives.query.filter_by(user_id=current_user.id).all()

    stats = {
        "total": len(hives),
        "critical": Hives.query.filter_by(user_id=current_user.id).filter(
            Hives.current_status.like('%МАТОЧНИКИ%')).count(),
        "attention": Hives.query.filter_by(user_id=current_user.id).filter(Hives.current_status.like('%уваги%')).count()
    }
    return render_template('index.html', hives=hives, stats=stats, temp=temp)


@hives_bp.route('/add_hive', methods=['GET', 'POST'])
@login_required
def add_hive():
    if request.method == 'POST':
        q_year = request.form.get('queen_year') or date.today().year
        new_hive = Hives(
            hive_number=request.form.get('hive_number'),
            bee_species=request.form.get('bee_species'),
            queen_year=int(q_year),
            user_id=current_user.id,
            current_status="все добре",
            honey_level="Немає"
        )
        db.session.add(new_hive)
        db.session.commit()
        flash("Вулик додано!", "success")
        return redirect(url_for('hives.index'))
    return render_template('add_hive.html', now_date=date.today().strftime('%Y-%m-%d'))


@hives_bp.route('/hive/<int:hive_id>', methods=['GET', 'POST'])
@login_required
def view_hive(hive_id):
    hive = db.session.get(Hives, hive_id)
    if not hive or hive.user_id != current_user.id:
        return "Доступ заборонено", 403

    if request.method == 'POST':
        # Логіка огляду... (така ж як була)
        db.session.commit()
        return redirect(url_for('hives.index'))

    inspections = HiveInspection.query.filter_by(hive_id=hive_id).order_by(HiveInspection.id.desc()).all()
    return render_template('view_hive.html', hive=hive, inspections=inspections, today=date.today())


@hives_bp.route('/calendar')
@login_required
def calendar():
    tasks = FutureTask.query.join(Hives).filter(Hives.user_id == current_user.id,
                                                FutureTask.is_completed == False).all()
    return render_template('calendar.html', tasks=tasks, today=date.today())
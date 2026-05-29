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
    api_key = current_app.config.get('WEATHER_API_KEY')
    temp = get_weather(current_user.city, api_key)
    hives = Hives.query.filter_by(user_id=current_user.id).all()

    # 1. Рахуємо критичні (маточники)
    critical_count = Hives.query.filter_by(user_id=current_user.id).filter(
        Hives.current_status.like('%МАТОЧНИКИ%')).count()

    # 2. Рахуємо ті, що потребують уваги
    # (слово "уваги" АБО рік матки <= 2023, бо зараз 2026)
    attention_count = Hives.query.filter_by(user_id=current_user.id).filter(
        (Hives.current_status.like('%уваги%')) | (Hives.queen_year <= 2023)
    ).count()

    stats = {
        "total": len(hives),
        "critical": critical_count,
        "attention": attention_count
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
        # Отримуємо дані з форми огляду
        has_qc = 'has_queen_cells' in request.form
        hive.honey_level = request.form.get('honey_level')
        hive.current_status = "⚠️ МАТОЧНИКИ" if has_qc else "🟢 Оглянуто"

        insp = HiveInspection(
            hive_id=hive.id,
            condition_description=request.form.get('condition'),
            has_queen_cells=has_qc,
            inspection_honey_level=hive.honey_level
        )
        db.session.add(insp)
        db.session.commit()
        flash("Огляд збережено", "success")
        return redirect(url_for('hives.view_hive', hive_id=hive.id))

    inspections = HiveInspection.query.filter_by(hive_id=hive_id).order_by(HiveInspection.id.desc()).all()
    return render_template('view_hive.html', hive=hive, inspections=inspections, today=date.today())

@hives_bp.route('/hive/<int:hive_id>/quick_action/<action>', methods=['POST'])
@login_required
def quick_action(hive_id, action):
    hive = db.session.get(Hives, hive_id)
    if not hive or hive.user_id != current_user.id:
        return "Помилка доступу", 403

    today = date.today()
    if action == 'feeding':
        hive.current_status = "🟢 Підкормлено"
        db.session.add(FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=4), task_type="Перевірка корму"))
    elif action == 'mite_plate':
        hive.current_status = "🟢 Пластини встановлено"
        db.session.add(FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=21), task_type="Зняти пластини"))
    elif action == 'harvest':
        hive.current_status = "🧺 Медозбір проведено"
        hive.honey_level = "Немає"
    # НОВА ДІЯ:
    elif action == 'attention':
        hive.current_status = "🟡 Потребує уваги"

    db.session.commit()
    flash(f"Статус вулика №{hive.hive_number} оновлено", "success")
    return redirect(url_for('hives.view_hive', hive_id=hive.id))

@hives_bp.route('/calendar/complete/<int:task_id>', methods=['POST'])
@login_required
def complete_task(task_id): # <--- Назва має бути точно така
    task = db.session.get(FutureTask, task_id)
    if task and task.hive.user_id == current_user.id:
        task.is_completed = True
        db.session.commit()
        flash("Завдання виконано!", "success")
    else:
        flash("Помилка доступу або завдання не знайдено", "danger")
    return redirect(url_for('hives.calendar'))

@hives_bp.route('/calendar')
@login_required
def calendar():
    tasks = FutureTask.query.join(Hives).filter(Hives.user_id == current_user.id,
                                                FutureTask.is_completed == False).all()
    return render_template('calendar.html', tasks=tasks, today=date.today())

@hives_bp.route('/instructions')
def instructions():
    return render_template('instructions.html')


@hives_bp.route('/hive/<int:hive_id>/delete', methods=['POST'])
@login_required
def delete_hive(hive_id):
    # Шукаємо вулик в базі даних
    hive = db.session.get(Hives, hive_id)

    # Перевірка безпеки: чи існує вулик і чи належить він поточному користувачу
    if not hive or hive.user_id != current_user.id:
        flash("Помилка доступу або вулик не знайдено", "danger")
        return redirect(url_for('hives.index'))

    try:
        # Завдяки налаштуванню cascade="all, delete-orphan" у файлі models.py,
        # всі пов'язані завдання та огляди цього вулика видаляться автоматично!
        db.session.delete(hive)
        db.session.commit()
        flash(f"Вулик №{hive.hive_number} успішно видалено.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Не вдалося видалити вулик: {str(e)}", "danger")

    return redirect(url_for('hives.index'))
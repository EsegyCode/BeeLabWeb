import os
import io
import requests
from flask import Flask, render_template, request, redirect, url_for, send_file, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Hives, HiveInspection, FutureTask
from importer import import_hives_from_excel
from fpdf import FPDF
from datetime import datetime, timedelta, date


# --- ФУНКЦІЯ ПЕРЕВІРКИ ПОГОДИ ---
def get_weather_data(city="Sumy"):
    api_key = "ТВІЙ_API_KEY_ТУТ"  # Встав свій ключ
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    try:
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            return data['main']['temp']
    except:
        return None
    return None


def create_app():
    app = Flask(__name__)
    app.secret_key = "bee_secret_key_123"

    # Конфігурація бази даних
    local_url = "mysql+pymysql://root:admin_password@127.0.0.1:3308/beekeeping_db"
    docker_url = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = docker_url if docker_url else local_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # --- НАЛАШТУВАННЯ LOGIN MANAGER ---
    login_manager = LoginManager()
    login_manager.login_view = 'login'
    login_manager.login_message = "Будь ласка, увійдіть для доступу до системи."
    login_manager.login_message_category = "info"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        # Виправлено LegacyAPIWarning: використовуємо db.session.get
        return db.session.get(User, int(user_id))

    with app.app_context():
        db.create_all()

    # --- МАРШРУТИ АВТЕНТИФІКАЦІЇ ---

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            name = request.form.get('name')

            if User.query.filter_by(email=email).first():
                flash('Цей Email вже зареєстровано!', 'danger')
                return redirect(url_for('register'))

            new_user = User(email=email, full_name=name)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            flash('Реєстрація успішна! Тепер ви можете увійти.', 'success')
            return redirect(url_for('login'))
        return render_template('register.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            user = User.query.filter_by(email=email).first()

            if user and user.check_password(password):
                login_user(user)
                flash(f'Вітаємо, {user.full_name}!', 'success')
                return redirect(url_for('index'))

            flash('Невірний email або пароль', 'danger')
        return render_template('login.html')

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('Ви вийшли з системи.', 'info')
        return redirect(url_for('login'))

    # --- ОСНОВНІ МАРШРУТИ ПАСІКИ ---

    @app.route('/')
    @login_required
    def index():
        temp = get_weather_data(current_user.city)
        hives = Hives.query.filter_by(user_id=current_user.id).all()

        if temp and 10 <= temp <= 15:
            for h in hives:
                if not h.is_first_inspection_done:
                    h.current_status = f"🟡 Планова робота на днях ({(date.today() + timedelta(days=2)).strftime('%d.%m')})"
            db.session.commit()

        stats = {
            "total": len(hives),
            "critical": Hives.query.filter_by(user_id=current_user.id).filter(
                Hives.current_status.like('%МАТОЧНИКИ%')).count(),
            "attention": Hives.query.filter_by(user_id=current_user.id).filter(
                Hives.current_status.like('%уваги%')).count()
        }
        return render_template('index.html', hives=hives, stats=stats, temp=temp)

    @app.route('/add_hive', methods=['GET', 'POST'])
    @login_required
    def add_hive():
        if request.method == 'POST':
            # Отримуємо рік з форми
            q_year = request.form.get('queen_year')

            # Якщо рік не вказано, використовуємо поточний
            if not q_year or q_year.strip() == "":
                q_year = date.today().year
            else:
                q_year = int(q_year)

            new_hive = Hives(
                hive_number=request.form.get('hive_number'),
                bee_species=request.form.get('bee_species'),
                queen_year=q_year,  # Використовуємо оброблений рік
                user_id=current_user.id,
                current_status="все добре",
                honey_level="Немає"
            )
            db.session.add(new_hive)
            db.session.commit()
            flash("Вулик додано успішно!", "success")
            return redirect(url_for('index'))
        return render_template('add_hive.html', now_date=date.today().strftime('%Y-%m-%d'))

    @app.route('/hive/<int:hive_id>/quick_action/<action>', methods=['POST'])
    @login_required
    def quick_action(hive_id, action):  # Назва функції має бути quick_action
        hive = db.session.get(Hives, hive_id)
        if not hive or hive.user_id != current_user.id:
            flash("Доступ заборонено!", "danger")
            return redirect(url_for('index'))

        today = date.today()
        if action == 'feeding':
            hive.last_feeding_date = today
            hive.current_status = "🟢 Підкормлено (очікування)"
            db.session.add(FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=4),
                                      task_type="Потребує уваги (після підкормки)"))

        elif action == 'mite_plate':
            hive.mite_plate_date = today
            hive.current_status = "🟢 Є пластина (21 день)"
            db.session.add(FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=21),
                                      task_type="Потребує уваги (зняти пластину)"))

        elif action == 'harvest':
            hive.honey_level = "Немає"
            hive.current_status = "🟡 Після медозбору (через 3 дні пластини)"
            db.session.add(FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=3),
                                      task_type="Поставити пластини (після меду)"))

        db.session.commit()
        return redirect(url_for('view_hive', hive_id=hive.id))

        inspections = HiveInspection.query.filter_by(hive_id=hive_id).order_by(HiveInspection.id.desc()).all()
        return render_template('view_hive.html', hive=hive, inspections=inspections, today=date.today())

    @app.route('/calendar')
    @login_required
    def calendar():
        tasks = FutureTask.query.join(Hives).filter(Hives.user_id == current_user.id,
                                                    FutureTask.is_completed == False).order_by(
            FutureTask.planned_date.asc()).all()
        return render_template('calendar.html', tasks=tasks, today=date.today())

    @app.route('/task/complete/<int:task_id>', methods=['POST'])
    @login_required
    def complete_task(task_id):
        task = db.session.get(FutureTask, task_id)
        if task and task.hive.user_id == current_user.id:
            task.is_completed = True
            db.session.commit()
            flash("Завдання виконано!", "success")
        return redirect(url_for('calendar'))

    # --- МАРШРУТ АНАЛІТИКИ ТА ІМПОРТУ (ВИПРАВЛЕНО 404) ---
    @app.route('/analytics', methods=['GET', 'POST'])
    @login_required
    def analytics():
        if request.method == 'POST':
            file = request.files.get('file')
            if file:
                # Передаємо current_user.id, щоб імпортовані вулики належали саме тобі
                success, message = import_hives_from_excel(file, current_user.id)
                flash(message, "success" if success else "danger")
                if success:
                    return redirect(url_for('index'))

        stats = {
            "total": Hives.query.filter_by(user_id=current_user.id).count(),
            "critical": Hives.query.filter_by(user_id=current_user.id).filter(
                Hives.current_status.like('%МАТОЧНИКИ%')).count(),
            "attention": Hives.query.filter_by(user_id=current_user.id).filter(
                Hives.current_status.like('%уваги%')).count()
        }
        return render_template('analytics.html', stats=stats)

    @app.route('/export/pdf')
    @login_required
    def export_pdf():
        from fpdf import FPDF, XPos, YPos
        import os

        hives = Hives.query.filter_by(user_id=current_user.id).all()
        pdf = FPDF()
        pdf.add_page()

        # Шлях до шрифту
        font_path = os.path.join(app.root_path, 'static', 'fonts', 'DejaVuSans.ttf')

        # ПЕРЕВІРКА: чи існує файл фізично?
        if os.path.exists(font_path):
            print(f"✅ Шрифт знайдено: {font_path}")
            # Додаємо шрифт (без параметра uni=True, він більше не потрібен)
            pdf.add_font('DejaVu', '', font_path)
            pdf.set_font('DejaVu', '', 14)
            has_unicode = True
        else:
            print(f"❌ ШРИФТ НЕ ЗНАЙДЕНО за шляхом: {font_path}")
            pdf.set_font("Helvetica", size=12)
            has_unicode = False

        # ЗАГОЛОВОК
        title_text = f"Звіт BeeLab: {current_user.full_name}"
        if not has_unicode:
            title_text = f"BeeLab Report: {current_user.full_name}"  # Латиниця, якщо шрифту немає

        pdf.cell(190, 10, text=title_text, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
        pdf.ln(10)

        # ТАБЛИЦЯ / СПИСОК
        pdf.set_font('DejaVu', '', 11) if has_unicode else pdf.set_font("Helvetica", size=10)

        pdf.cell(40, 10, text="Номер вулика", border=1)
        pdf.cell(60, 10, text="Порода", border=1)
        pdf.cell(90, 10, text="Статус", border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        for h in hives:
            # Очищуємо текст від емодзі
            clean_status = h.current_status.replace('🟡', '').replace('⚠️', '').replace('🟢', '')

            pdf.cell(40, 10, text=str(h.hive_number), border=1)
            pdf.cell(60, 10, text=str(h.bee_species), border=1)
            pdf.cell(90, 10, text=clean_status, border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Генерація файлу
        output = io.BytesIO(pdf.output())
        return send_file(
            output,
            download_name=f"BeeLab_Report_{date.today()}.pdf",
            as_attachment=True,
            mimetype='application/pdf'
        )

    @app.route('/export/excel')
    @login_required
    def export_excel():
        import pandas as pd

        # 1. Отримуємо дані вуликів користувача
        hives = Hives.query.filter_by(user_id=current_user.id).all()
        hives_data = [{
            "Номер вулика": h.hive_number,
            "Порода": h.bee_species,
            "Рік матки": h.queen_year,
            "Статус": h.current_status,
            "Рівень меду": h.honey_level,
            "Дата встановлення": h.install_date
        } for h in hives]

        # 2. Отримуємо всі огляди цих вуликів
        inspections = HiveInspection.query.join(Hives).filter(Hives.user_id == current_user.id).all()
        inspections_data = [{
            "Вулик №": insp.hive.hive_number,
            "Дата огляду": insp.inspection_date,
            "Стан": insp.condition_description,
            "Маточники": "Так" if insp.has_queen_cells else "Ні",
            "Мед при огляді": insp.inspection_honey_level
        } for insp in inspections]

        # 3. Створюємо Excel в пам'яті
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            pd.DataFrame(hives_data).to_excel(writer, sheet_name='Пасіка', index=False)
            pd.DataFrame(inspections_data).to_excel(writer, sheet_name='Журнал оглядів', index=False)

        output.seek(0)

        return send_file(
            output,
            download_name=f"BeeLab_Export_{date.today()}.xlsx",
            as_attachment=True,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
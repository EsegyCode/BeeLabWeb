import os
import io
import requests
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, send_file, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Hives, HiveInspection, FutureTask
from importer import import_hives_from_excel
from fpdf import FPDF, XPos, YPos
from datetime import datetime, timedelta, date


def get_weather_data(city="Sumy"):
    api_key = "ТВІЙ_API_KEY"  # ЗАМІНИ НА СВІЙ
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    try:
        r = requests.get(url, timeout=3)
        return r.json()['main']['temp'] if r.status_code == 200 else None
    except:
        return None


def create_app():
    app = Flask(__name__)
    app.secret_key = "bee_secret_key_123"

    local_url = "mysql+pymysql://root:admin_password@127.0.0.1:3308/beekeeping_db"
    docker_url = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = docker_url if docker_url else local_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    with app.app_context():
        db.create_all()

    # --- АВТЕНТИФІКАЦІЯ ---
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            user = User.query.filter_by(email=request.form.get('email')).first()
            if user and user.check_password(request.form.get('password')):
                login_user(user)
                return redirect(url_for('index'))
            flash('Невірний пароль!', 'danger')
        return render_template('login.html')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            if User.query.filter_by(email=request.form.get('email')).first():
                flash('Email вже існує!', 'warning')
                return redirect(url_for('register'))
            u = User(email=request.form.get('email'), full_name=request.form.get('name'))
            u.set_password(request.form.get('password'))
            db.session.add(u)
            db.session.commit()
            return redirect(url_for('login'))
        return render_template('register.html')

    @app.route('/logout')
    def logout():
        logout_user()
        return redirect(url_for('login'))

    # --- ПАСІКА ---
    @app.route('/')
    @login_required
    def index():
        temp = get_weather_data(current_user.city)
        hives = Hives.query.filter_by(user_id=current_user.id).all()
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
            q_year = request.form.get('queen_year')
            if not q_year: q_year = date.today().year

            h = Hives(
                hive_number=request.form.get('hive_number'),
                bee_species=request.form.get('bee_species'),
                queen_year=int(q_year),
                user_id=current_user.id,
                current_status="все добре"
            )
            db.session.add(h)
            db.session.commit()
            return redirect(url_for('index'))
        return render_template('add_hive.html', now_date=date.today().strftime('%Y-%m-%d'))

    @app.route('/hive/<int:hive_id>', methods=['GET', 'POST'])
    @login_required
    def view_hive(hive_id):
        hive = db.session.get(Hives, hive_id)
        if not hive or hive.user_id != current_user.id:
            return "Вулик не знайдено", 404

        if request.method == 'POST':
            has_qc = 'has_queen_cells' in request.form
            h_level = request.form.get('honey_level')
            hive.honey_level = h_level
            hive.current_status = "⚠️ МАТОЧНИКИ" if has_qc else "🟢 Оглянуто"

            insp = HiveInspection(hive_id=hive.id, condition_description=request.form.get('condition'),
                                  has_queen_cells=has_qc, inspection_honey_level=h_level)
            db.session.add(insp)
            db.session.commit()
            flash("Огляд збережено", "success")
            return redirect(url_for('index'))

        inspections = HiveInspection.query.filter_by(hive_id=hive_id).order_by(HiveInspection.id.desc()).all()
        return render_template('view_hive.html', hive=hive, inspections=inspections, today=date.today())

    @app.route('/hive/<int:hive_id>/quick_action/<action>', methods=['POST'])
    @login_required
    def quick_action(hive_id, action):
        hive = db.session.get(Hives, hive_id)
        if not hive or hive.user_id != current_user.id: return "Помилка", 403

        today = date.today()
        if action == 'feeding':
            hive.current_status = "🟢 Підкормлено"
            db.session.add(
                FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=4), task_type="Перевірка корму"))
        elif action == 'mite_plate':
            hive.current_status = "🟢 Пластини стоять"
            db.session.add(
                FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=21), task_type="Зняти пластини"))

        db.session.commit()
        return redirect(url_for('view_hive', hive_id=hive.id))

    @app.route('/analytics', methods=['GET', 'POST'])
    @login_required
    def analytics():
        if request.method == 'POST':
            file = request.files.get('file')
            if file:
                success, msg = import_hives_from_excel(file, current_user.id)
                flash(msg, "success" if success else "danger")
        stats = {"total": Hives.query.filter_by(user_id=current_user.id).count(),
                 "attention": Hives.query.filter_by(user_id=current_user.id).filter(
                     Hives.current_status.like('%уваги%')).count(),
                 "critical": Hives.query.filter_by(user_id=current_user.id).filter(
                     Hives.current_status.like('%МАТОЧНИКИ%')).count()}
        return render_template('analytics.html', stats=stats)

    @app.route('/export/excel')
    @login_required
    def export_excel():
        hives = Hives.query.filter_by(user_id=current_user.id).all()
        df = pd.DataFrame([{"№": h.hive_number, "Порода": h.bee_species, "Статус": h.current_status} for h in hives])
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False)
        output.seek(0)
        return send_file(output, download_name="Beelab.xlsx", as_attachment=True)

    @app.route('/calendar')
    @login_required
    def calendar():
        tasks = FutureTask.query.join(Hives).filter(Hives.user_id == current_user.id,
                                                    FutureTask.is_completed == False).all()
        return render_template('calendar.html', tasks=tasks, today=date.today())

    @app.route('/task/complete/<int:task_id>', methods=['POST'])
    @login_required
    def complete_task(task_id):
        task = db.session.get(FutureTask, task_id)
        # Перевіряємо, чи існує завдання і чи належить воно поточному користувачу
        if task and task.hive.user_id == current_user.id:
            task.is_completed = True
            db.session.commit()
            flash("Завдання виконано!", "success")
        else:
            flash("Помилка доступу до завдання", "danger")
        return redirect(url_for('calendar'))

    @app.route('/export/pdf')
    @login_required
    def export_pdf():
        from fpdf import FPDF, XPos, YPos
        import os

        # Отримуємо дані
        hives = Hives.query.filter_by(user_id=current_user.id).all()

        pdf = FPDF()
        pdf.add_page()

        # Шлях до шрифту для кирилиці
        font_path = os.path.join(app.root_path, 'static', 'fonts', 'DejaVuSans.ttf')

        if os.path.exists(font_path):
            pdf.add_font('DejaVu', '', font_path)
            pdf.set_font('DejaVu', '', 14)
            has_unicode = True
        else:
            pdf.set_font("Helvetica", size=12)
            has_unicode = False

        # Заголовок
        title = f"Звіт пасіки: {current_user.full_name}" if has_unicode else f"BeeLab Report: {current_user.full_name}"
        pdf.cell(190, 10, text=title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
        pdf.ln(10)

        # Таблиця вуликів
        pdf.set_font('DejaVu', '', 10) if has_unicode else pdf.set_font("Helvetica", size=10)

        # Шапка таблиці
        pdf.cell(30, 10, text="№ Вулика", border=1)
        pdf.cell(50, 10, text="Порода", border=1)
        pdf.cell(110, 10, text="Поточний статус", border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        for h in hives:
            # Очищуємо статус від емодзі для PDF
            clean_status = h.current_status.replace('🟡', '').replace('⚠️', '').replace('🟢', '')

            pdf.cell(30, 10, text=str(h.hive_number), border=1)
            pdf.cell(50, 10, text=str(h.bee_species), border=1)
            pdf.cell(110, 10, text=clean_status, border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        output = io.BytesIO(pdf.output())
        return send_file(
            output,
            download_name=f"BeeLab_Report_{date.today()}.pdf",
            as_attachment=True,
            mimetype='application/pdf'
        )

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
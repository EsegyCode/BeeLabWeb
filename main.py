import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from datetime import date, timedelta

# Імпортуємо нашу базу та моделі
from models import db, User, Hives, HiveInspection, FutureTask
# Імпортуємо логіку, яку ми винесли в окремі модулі
from importer import import_hives_from_excel
from core.weather import get_weather
from core.exports import generate_excel_report, generate_pdf_report


def create_app():
    app = Flask(__name__)
    app.secret_key = "bee_secret_key_123"

    # Конфігурація бази даних
    local_url = "mysql+pymysql://root:admin_password@127.0.0.1:3308/beekeeping_db"
    docker_url = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = docker_url if docker_url else local_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Налаштування Login Manager
    login_manager = LoginManager()
    login_manager.login_view = 'login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    with app.app_context():
        db.create_all()

        # --- МАРШРУТИ АВТЕНТИФІКАЦІЇ ---
        @app.route('/login', methods=['GET', 'POST'])
        def login():
            if request.method == 'POST':
                user = User.query.filter_by(email=request.form.get('email')).first()
                if user and user.check_password(request.form.get('password')):
                    login_user(user)
                    return redirect(url_for('index'))
                flash('Невірний email або пароль!', 'danger')
            return render_template('login.html')

        @app.route('/register', methods=['GET', 'POST'])
        def register():
            if request.method == 'POST':
                if User.query.filter_by(email=request.form.get('email')).first():
                    flash('Цей Email вже зареєстровано!', 'warning')
                    return redirect(url_for('register'))
                u = User(email=request.form.get('email'), full_name=request.form.get('name'))
                u.set_password(request.form.get('password'))
                db.session.add(u)
                db.session.commit()
                flash('Реєстрація успішна!', 'success')
                return redirect(url_for('login'))
            return render_template('register.html')

        @app.route('/logout')
        @login_required
        def logout():
            logout_user()
            return redirect(url_for('login'))

        # --- ОСНОВНІ МАРШРУТИ ПАСІКИ ---
        @app.route('/')
        @login_required
        def index():
            api_key = "ТВІЙ_API_KEY"
            temp = get_weather(current_user.city, api_key)
            hives = Hives.query.filter_by(user_id=current_user.id).all()

            stats = {
                "total": len(hives),
                "critical": Hives.query.filter_by(user_id=current_user.id).filter(
                    Hives.current_status.like('%МАТОЧНИКИ%')).count(),
                "attention": Hives.query.filter_by(user_id=current_user.id).filter(
                    Hives.current_status.like('%уваги%')).count()
            }
            return render_template('index.html', hives=hives, stats=stats, temp=temp)

        @app.route('/hive/<int:hive_id>', methods=['GET', 'POST'])
        @login_required
        def view_hive(hive_id):
            hive = db.session.get(Hives, hive_id)
            if not hive or hive.user_id != current_user.id:
                return "Вулик не знайдено", 404

            if request.method == 'POST':
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
                return redirect(url_for('index'))

            inspections = HiveInspection.query.filter_by(hive_id=hive_id).order_by(HiveInspection.id.desc()).all()
            return render_template('view_hive.html', hive=hive, inspections=inspections, today=date.today())

        # --- ЕКСПОРТ ДАНИХ ---
        @app.route('/export/excel')
        @login_required
        def export_excel():
            hives = Hives.query.filter_by(user_id=current_user.id).all()
            return generate_excel_report(hives, current_user.full_name)

        @app.route('/export/pdf')
        @login_required
        def export_pdf():
            hives = Hives.query.filter_by(user_id=current_user.id).all()
            font_path = os.path.join(app.root_path, 'static', 'fonts', 'DejaVuSans.ttf')

            # Викликаємо функцію
            pdf_output = generate_pdf_report(hives, current_user.full_name, font_path)

            return send_file(
                pdf_output,
                download_name=f"BeeLab_Report_{date.today()}.pdf",
                as_attachment=True,
                mimetype='application/pdf'
            )

        # --- АНАЛІТИКА ТА ІМПОРТ ---
        @app.route('/analytics', methods=['GET', 'POST'])
        @login_required
        def analytics():
            if request.method == 'POST':
                file = request.files.get('file')
                if file:
                    success, msg = import_hives_from_excel(file, current_user.id)
                    flash(msg, "success" if success else "danger")

            stats = {
                "total": Hives.query.filter_by(user_id=current_user.id).count(),
                "attention": Hives.query.filter_by(user_id=current_user.id).filter(
                    Hives.current_status.like('%уваги%')).count(),
                "critical": Hives.query.filter_by(user_id=current_user.id).filter(
                    Hives.current_status.like('%МАТОЧНИКИ%')).count()
            }
            return render_template('analytics.html', stats=stats)

        @app.route('/hive/<int:hive_id>/quick_action/<action>', methods=['POST'])
        @login_required
        def quick_action(hive_id, action):
            hive = db.session.get(Hives, hive_id)
            if not hive or hive.user_id != current_user.id:
                return "Помилка доступу", 403

            today = date.today()
            if action == 'feeding':
                hive.current_status = "🟢 Підкормлено"
                db.session.add(
                    FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=4), task_type="Перевірка корму"))
            elif action == 'mite_plate':
                hive.current_status = "🟢 Пластини встановлено"
                db.session.add(
                    FutureTask(hive_id=hive.id, planned_date=today + timedelta(days=21), task_type="Зняти пластини"))

            db.session.commit()
            return redirect(url_for('view_hive', hive_id=hive.id))

        # --- КАЛЕНДАР ТА ЗАВДАННЯ ---
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
            if task and task.hive.user_id == current_user.id:
                task.is_completed = True
                db.session.commit()
                flash("Завдання виконано!", "success")
            else:
                flash("Помилка: завдання не знайдено", "danger")
            return redirect(url_for('calendar'))

        @app.route('/add_hive', methods=['GET', 'POST'])
        @login_required
        def add_hive():
            if request.method == 'POST':
                # Отримуємо дані з форми
                h_number = request.form.get('hive_number')
                species = request.form.get('bee_species')
                q_year = request.form.get('queen_year')

                # Якщо рік не вказано, ставимо поточний (як ми домовлялися)
                if not q_year or q_year.strip() == "":
                    q_year = date.today().year
                else:
                    q_year = int(q_year)

                new_hive = Hives(
                    hive_number=h_number,
                    bee_species=species,
                    queen_year=q_year,
                    user_id=current_user.id,  # Прив'язка до поточного юзера
                    current_status="все добре",
                    honey_level="Немає"
                )

                db.session.add(new_hive)
                db.session.commit()
                flash(f"Вулик №{h_number} успішно додано!", "success")
                return redirect(url_for('index'))

            return render_template('add_hive.html', now_date=date.today().strftime('%Y-%m-%d'))

        return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
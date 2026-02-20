import os
import io
from flask import Flask, render_template, request, redirect, url_for, send_file, flash
from models import db, Hives, HiveInspection, FutureTask
from importer import import_hives_from_excel
from fpdf import FPDF
from datetime import datetime, timedelta


def create_app():
    app = Flask(__name__)
    app.secret_key = "bee_secret_key_123"  # Необхідно для роботи flash-повідомлень

    # Конфігурація підключення
    local_url = "mysql+pymysql://root:admin_password@127.0.0.1:3308/beekeeping_db"
    docker_url = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = docker_url if docker_url else local_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        try:
            db.create_all()
            print("✅ Підключення до бази beekeeping_db успішне!")
        except Exception as e:
            print(f"❌ Помилка підключення: {e}")

    # --- МАРШРУТИ ---

    @app.route('/')
    def index():
        hives = Hives.query.all()
        # Рахуємо реальну статистику за статусами для головного екрану
        stats = {
            "total": len(hives),
            "critical": Hives.query.filter(Hives.current_status.like('%маточники%')).count(),
            "attention": Hives.query.filter(Hives.current_status.like('%уваги%')).count()
        }
        return render_template('index.html', hives=hives, stats=stats)

    @app.route('/add_hive', methods=['GET', 'POST'])
    def add_hive():
        if request.method == 'POST':
            number = request.form.get('hive_number')
            species = request.form.get('bee_species')
            new_hive = Hives(hive_number=number, bee_species=species, current_status='все добре')
            db.session.add(new_hive)
            db.session.commit()
            return redirect(url_for('index'))
        return render_template('add_hive.html')

    @app.route('/analytics', methods=['GET', 'POST'])
    def analytics():
        if request.method == 'POST':
            file = request.files.get('file')
            if file:
                # Використовуємо твій новий модуль importer.py
                success, message = import_hives_from_excel(file)
                if success:
                    flash(message, "success")
                    return redirect(url_for('index'))
                else:
                    flash(message, "danger")

        # Статистика для сторінки аналітики
        hives_count = Hives.query.count()
        stats = {
            "total": hives_count,
            "critical": Hives.query.filter(Hives.current_status.like('%маточники%')).count(),
            "attention": Hives.query.filter(Hives.current_status.like('%уваги%')).count()
        }
        return render_template('analytics.html', stats=stats)

    @app.route('/hive/<int:hive_id>', methods=['GET', 'POST'])
    def view_hive(hive_id):
        hive = Hives.query.get_or_404(hive_id)

        if request.method == 'POST':
            has_queen_cells = 'has_queen_cells' in request.form
            condition = request.form.get('condition')

            # 1. Створюємо запис про огляд
            inspection = HiveInspection(
                hive_id=hive.id,
                condition_description=condition,
                has_queen_cells=has_queen_cells
            )

            # 2. Логіка планування: маточники = 3 дні, норма
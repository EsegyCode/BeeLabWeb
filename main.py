import os
import io
from flask import Flask, render_template, request, redirect, url_for, send_file, flash
from models import db, Hives, HiveInspection, FutureTask
from importer import import_hives_from_excel
from fpdf import FPDF
from datetime import datetime, timedelta


def create_app():
    app = Flask(__name__)
    app.secret_key = "bee_secret_key_123"

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
        filter_type = request.args.get('filter')

        # Логіка фільтрації списку
        if filter_type == 'attention':
            hives = Hives.query.filter(Hives.current_status.like('%уваги%')).all()
        elif filter_type == 'critical':
            hives = Hives.query.filter(Hives.current_status.like('%МАТОЧНИКИ%')).all()
        else:
            hives = Hives.query.all()

        # Статистика (завжди по всій базі)
        stats = {
            "total": Hives.query.count(),
            "critical": Hives.query.filter(Hives.current_status.like('%МАТОЧНИКИ%')).count(),
            "attention": Hives.query.filter(Hives.current_status.like('%уваги%')).count()
        }
        return render_template('index.html', hives=hives, stats=stats, active_filter=filter_type)

    @app.route('/add_hive', methods=['GET', 'POST'])
    def add_hive():
        if request.method == 'POST':
            number = request.form.get('hive_number')
            species = request.form.get('bee_species')
            q_year = int(request.form.get('queen_year')) if request.form.get('queen_year') else None
            i_date = request.form.get('install_date')

            has_qc = 'has_queen_cells' in request.form

            # Розумний статус при додаванні
            if has_qc:
                status = "⚠️ МАТОЧНИКИ (контроль!)"
            elif q_year and q_year <= (datetime.now().year - 3):
                status = "🟡 Потребує уваги (стара матка)"
            else:
                status = "все добре"

            try:
                new_hive = Hives(
                    hive_number=number,
                    bee_species=species,
                    queen_year=q_year,
                    install_date=datetime.strptime(i_date, '%Y-%m-%d').date() if i_date else datetime.now().date(),
                    current_status=status
                )
                db.session.add(new_hive)
                db.session.commit()
                flash(f"Вулик №{number} зареєстровано!", "success")
                return redirect(url_for('index'))
            except Exception as e:
                db.session.rollback()
                flash(f"Помилка: {str(e)}", "danger")

        today = datetime.now().strftime('%Y-%m-%d')
        return render_template('add_hive.html', now_date=today)

    @app.route('/hive/<int:hive_id>', methods=['GET', 'POST'])
    def view_hive(hive_id):
        hive = Hives.query.get_or_404(hive_id)
        if request.method == 'POST':
            has_queen_cells = 'has_queen_cells' in request.form
            condition = request.form.get('condition', '')

            new_inspection = HiveInspection(
                hive_id=hive.id,
                inspection_date=datetime.now(),
                condition_description=condition,
                has_queen_cells=has_queen_cells
            )

            # Логіка статусів та дат
            if has_queen_cells:
                hive.current_status = "⚠️ МАТОЧНИКИ (контроль!)"
                days = 3
            elif hive.queen_year and int(hive.queen_year) <= (datetime.now().year - 3):
                hive.current_status = "🟡 Потребує уваги (стара матка)"
                days = 10
            elif "слаб" in condition.lower() or "хвор" in condition.lower():
                hive.current_status = "🟡 Потребує уваги (стан сім'ї)"
                days = 7
            else:
                hive.current_status = "все добре"
                days = 10

            next_date = datetime.now() + timedelta(days=days)
            new_task = FutureTask(
                hive_id=hive.id,
                planned_date=next_date,
                task_type=hive.current_status,
                is_completed=False
            )

            db.session.add(new_inspection)
            db.session.add(new_task)
            db.session.commit()
            flash(f"Огляд збережено. Наступний візит: {next_date.strftime('%d.%m')}", "success")
            return redirect(url_for('index'))

        inspections = HiveInspection.query.filter_by(hive_id=hive_id).order_by(HiveInspection.id.desc()).all()
        return render_template('view_hive.html', hive=hive, inspections=inspections)

    @app.route('/hive/<int:hive_id>/quick_attention', methods=['POST'])
    def quick_attention(hive_id):
        hive = Hives.query.get_or_404(hive_id)
        hive.current_status = "🟡 Потребує уваги (встановлено вручну)"
        db.session.commit()
        flash(f"Вулик №{hive.hive_number} позначено для уваги!", "warning")
        return redirect(url_for('index'))

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
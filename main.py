import os
from flask import Flask, render_template, request, redirect, url_for
from models import db, Hives, HiveInspection, FutureTask


# Переконайся, що файл utils.py існує поруч
# from utils import schedule_next_visit

def create_app():
    app = Flask(__name__)

    # Конфігурація підключення (твій DB_CONFIG)
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

    # --- МАРШРУТИ ПРОПИСУЄМО ВСЕРЕДИНІ АБО ПЕРЕДАЄМО APP ---

    @app.route('/')
    def index():
        hives = Hives.query.all()
        # Поки що пуста аналітика для тесту
        stats = {"total": len(hives), "critical": 0, "attention": 0}
        return render_template('index.html', hives=hives, stats=stats)

    @app.route('/add_hive', methods=['GET', 'POST'])
    def add_hive():
        if request.method == 'POST':
            number = request.form.get('hive_number')
            species = request.form.get('bee_species')

            new_hive = Hives(
                hive_number=number,
                bee_species=species,
                current_status='все добре'
            )
            db.session.add(new_hive)
            db.session.commit()
            return redirect(url_for('index'))

        return render_template('add_hive.html')

    return app


# ЗАПУСК
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
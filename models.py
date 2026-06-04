from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date

db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)  # Логін (напр. Mykola_K)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    contact_info = db.Column(db.String(100))  # Твій номер або пошта на випадок втрати
    telegram_id = db.Column(db.String(20), unique=True, nullable=True)
    city = db.Column(db.String(50), default="Sumy")  # Для персоналізованої погоди

    # Зв'язок: один користувач -> багато вуликів
    hives = db.relationship('Hives', backref='owner', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Hives(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hive_number = db.Column(db.String(20), nullable=False)
    bee_species = db.Column(db.String(50))
    queen_year = db.Column(db.Integer)
    install_date = db.Column(db.Date, default=date.today)
    current_status = db.Column(db.String(200), default="все добре")
    honey_level = db.Column(db.String(50), default="Немає")

    # Нове поле: прив'язка до користувача
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    last_feeding_date = db.Column(db.Date)
    mite_plate_date = db.Column(db.Date)
    is_first_inspection_done = db.Column(db.Boolean, default=False)

    inspections = db.relationship('HiveInspection', backref='hive', lazy=True, cascade="all, delete-orphan")
    tasks = db.relationship('FutureTask', backref='hive', lazy=True, cascade="all, delete-orphan")


class HiveInspection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hive_id = db.Column(db.Integer, db.ForeignKey('hives.id'), nullable=False)
    inspection_date = db.Column(db.Date, default=date.today)
    condition_description = db.Column(db.Text)
    has_queen_cells = db.Column(db.Boolean, default=False)
    inspection_honey_level = db.Column(db.String(50))


class FutureTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hive_id = db.Column(db.Integer, db.ForeignKey('hives.id'), nullable=False)
    planned_date = db.Column(db.Date, nullable=False)
    task_type = db.Column(db.String(100))
    is_completed = db.Column(db.Boolean, default=False)


class ExpenseLog(db.Model):
    __tablename__ = 'expense_logs'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    date = db.Column(db.Date, nullable=False, default=date.today)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship('User', backref=db.backref('expense_logs', lazy=True, cascade="all, delete-orphan"))


class HoneyHarvestLog(db.Model):
    __tablename__ = 'honey_harvest_logs'

    id = db.Column(db.Integer, primary_key=True)
    kg = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    note = db.Column(db.String(500))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship('User', backref=db.backref('honey_harvest_logs', lazy=True, cascade="all, delete-orphan"))


class HoneySaleLog(db.Model):
    __tablename__ = 'honey_sale_logs'

    id = db.Column(db.Integer, primary_key=True)
    kg = db.Column(db.Numeric(10, 2), nullable=False)
    price_per_kg = db.Column(db.Numeric(10, 2), nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    note = db.Column(db.String(500))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship('User', backref=db.backref('honey_sale_logs', lazy=True, cascade="all, delete-orphan"))

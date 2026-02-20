from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Date
from datetime import date, datetime

db = SQLAlchemy()


class Hives(db.Model):  # Змінено Base на db.Model для роботи з Flask-SQLAlchemy
    __tablename__ = 'hives'
    id = Column(Integer, primary_key=True)
    hive_number = Column(Integer, unique=True, nullable=False)
    install_date = db.Column(db.Date)  # Дата встановлення вулика
    bee_species = Column(String(30))
    current_status = Column(Text)
    queen_year = db.Column(db.Integer)

    # Relations
    inspections = db.relationship('HiveInspection', backref='hive', lazy=True, cascade='all, delete-orphan')
    future_tasks = db.relationship('FutureTask', backref='hive', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Hives {self.hive_number}>'


class HiveInspection(db.Model):  # Змінено на db.Model
    __tablename__ = 'inspections'

    id = Column(Integer, primary_key=True)
    # Вказуй 'hives.id' (таблиця.стовпець), а не просто назву таблиці
    hive_id = Column(Integer, ForeignKey('hives.id'), nullable=False)

    # Виправлено помилку в utcnow та прибрано дужки ()
    inspection_date = Column(Date, nullable=False, default=date.today)
    condition_description = Column(Text)
    last_works = Column(Text)

    # Логіка для моделі
    has_queen_cells = Column(Boolean, default=False, nullable=False)
    has_honey = Column(Boolean, default=True)


class FutureTask(db.Model):  # Змінено на db.Model
    __tablename__ = 'future_tasks'

    # Прибрано AUTO_INCREMENT (він іде автоматично з primary_key)
    id = Column(Integer, primary_key=True)
    hive_id = Column(Integer, ForeignKey('hives.id'), nullable=False)
    planned_date = Column(Date, nullable=False)
    task_type = Column(String(30), nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
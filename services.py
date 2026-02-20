from datetime import timedelta
from models import db, FutureTask


def schedule_next_visit(hive_id, last_inspection):
    days_delay = 12
    task = "Плановий огляд"

    # Перевірка на маточники (пріоритет №1)
    if last_inspection.has_queen_cells:
        days_delay = 3
        task = "ПЕРЕВІРКА РОЇННЯ (Критично)"

    # Перевірка на хвороби або статус "погано"
    elif last_inspection.condition_description and "хвороба" in last_inspection.condition_description.lower():
        days_delay = 5
        task = "Лікувальний огляд"

    planned_date = last_inspection.inspection_date + timedelta(days=days_delay)

    new_task = FutureTask(
        hive_id=hive_id,
        planned_date=planned_date,
        task_type=task
    )
    db.session.add(new_task)
    db.session.commit()
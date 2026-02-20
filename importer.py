import pandas as pd
from models import db, Hives
from datetime import date


def import_hives_from_excel(file, user_id):
    """
    Імпортує вулики з Excel файлу.
    Якщо рік матки порожній, встановлює поточний рік.
    Прив'язує кожен вулик до конкретного користувача.
    """
    try:
        # Читаємо файл Excel
        df = pd.read_excel(file)

        # Перевірка наявності обов'язкових колонок
        required_columns = ['hive_number', 'bee_species', 'queen_year']
        for col in required_columns:
            if col not in df.columns:
                return False, f"Помилка: У файлі відсутня колонка '{col}'"

        count = 0
        current_year = date.today().year

        for _, row in df.iterrows():
            # Отримуємо номер вулика як рядок
            h_number = str(row['hive_number']).strip()

            # Перевіряємо, чи не існує вже такий вулик у цього користувача
            existing_hive = Hives.query.filter_by(hive_number=h_number, user_id=user_id).first()
            if existing_hive:
                continue

            # Логіка року матки: якщо порожньо (NaN), ставимо поточний рік
            q_year = row['queen_year']
            if pd.isna(q_year) or q_year == "":
                q_year = current_year
            else:
                try:
                    q_year = int(q_year)
                except (ValueError, TypeError):
                    q_year = current_year

            # Створюємо новий запис вулика
            new_hive = Hives(
                hive_number=h_number,
                bee_species=str(row['bee_species']) if pd.notnull(row['bee_species']) else "Не вказано",
                queen_year=q_year,
                user_id=user_id,  # Обов'язкова прив'язка до акаунта
                current_status="Імпортовано (все добре)",
                honey_level="Немає",
                is_first_inspection_done=False
            )

            db.session.add(new_hive)
            count += 1

        db.session.commit()
        return True, f"Успішно додано {count} нових вуликів!"

    except Exception as e:
        db.session.rollback()
        return False, f"Критична помилка при імпорті: {str(e)}"
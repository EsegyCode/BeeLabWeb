import pandas as pd
from models import Hives, db


def import_hives_from_excel(file_storage):
    try:
        df = pd.read_excel(file_storage)

        # Оновлюємо перевірку необхідних колонок
        required_columns = ['Номер', 'Порода', 'Рік матки']
        if not all(col in df.columns for col in required_columns):
            return False, "У файлі мають бути колонки: Номер, Порода, Рік матки"

        added_count = 0
        skipped_count = 0

        for _, row in df.iterrows():
            hive_num = int(row['Номер'])
            exists = Hives.query.filter_by(hive_number=hive_num).first()

            if not exists:
                new_hive = Hives(
                    hive_number=hive_num,
                    bee_species=str(row['Порода']),
                    queen_year=int(row['Рік матки']),  # Записуємо рік матки
                    current_status='все добре'
                )
                db.session.add(new_hive)
                added_count += 1
            else:
                skipped_count += 1

        db.session.commit()
        return True, f"Додано: {added_count}, пропущено: {skipped_count}."
    except Exception as e:
        db.session.rollback()
        return False, f"Помилка: {str(e)}"
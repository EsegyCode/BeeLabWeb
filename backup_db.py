import os
import shutil
from datetime import datetime


def do_backup():
    # Назва папки для бекапів
    backup_folder = 'backups'
    if not os.path.exists(backup_folder):
        os.makedirs(backup_folder)

    # Формуємо ім'я файлу: backup_2026_02_20.db
    date_str = datetime.now().strftime("%Y_%m_%d")
    backup_name = f"beelab_backup_{date_str}.db"

    # Шлях до твоєї поточної бази (зміни на свій шлях)
    original_db = 'beekeeping.db'

    shutil.copy2(original_db, os.path.join(backup_folder, backup_name))
    print(f"✅ Бекап створено: {backup_name}")


if __name__ == "__main__":
    do_backup()
from datetime import date
from models import db, FutureTask, Hives, User
from core.telegram import send_telegram_message


def send_daily_briefing(app):
    with app.app_context():
        today = date.today()
        # Знаходимо всіх користувачів, у яких прив'язаний Telegram
        users = User.query.filter(User.telegram_id.isnot(None)).all()

        for user in users:
            # Шукаємо завдання конкретно цього користувача
            tasks = FutureTask.query.join(Hives).filter(
                Hives.user_id == user.id,
                FutureTask.planned_date == today,
                FutureTask.is_completed == False
            ).all()

            if tasks:
                message = f"🐝 <b>Пане {user.username}, Ваш план на сьогодні:</b>\n\n"
                for task in tasks:
                    message += f"📍 Вулик №{task.hive.hive_number}: {task.task_type}\n"

                # Надсилаємо саме цьому користувачу на його ID
                send_telegram_message(message, chat_id=user.telegram_id)
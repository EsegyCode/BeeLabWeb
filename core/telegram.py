import requests
import os


def send_telegram_message(message, chat_id=None):
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    # Якщо chat_id не передано, використовуємо твій з .env (як дефолтний)
    target_id = chat_id or os.getenv('TELEGRAM_CHAT_ID')

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": target_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"Помилка відправки в Telegram: {e}")
        return False
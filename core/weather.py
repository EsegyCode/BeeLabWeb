# core/weather.py
import requests

def get_weather(city, api_key):
    if not api_key: return None
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    try:
        r = requests.get(url, timeout=3)
        return r.json()['main']['temp'] if r.status_code == 200 else None
    except:
        return None
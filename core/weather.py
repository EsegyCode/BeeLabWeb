import requests

def get_weather(city, api_key):
    if not api_key or api_key == "86e44870c51f3c1e84810cc34f209a05":
        return None
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    try:
        r = requests.get(url, timeout=3)
        if r.status_code == 200:
            return r.json()['main']['temp']
    except:
        pass
    return None
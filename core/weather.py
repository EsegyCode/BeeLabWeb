import logging
import os
import time

import requests

# Simple in-process weather cache: {city: {"temp": float, "at": epoch}}
_WEATHER_CACHE = {}


def get_weather(city, api_key):
    city = (city or os.getenv("WEATHER_CITY", "Sumy")).strip()
    if not api_key:
        logging.warning("Weather API key is not configured")
        return None

    cache_minutes = int(os.getenv("WEATHER_CACHE_MINUTES", "20"))
    now = time.time()
    cached = _WEATHER_CACHE.get(city.lower())
    if cached and now - cached["at"] < cache_minutes * 60:
        return cached["temp"]

    url = "http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": api_key,
        "units": "metric",
    }
    try:
        response = requests.get(url, params=params, timeout=4)
        if response.status_code == 200:
            temp = response.json()["main"]["temp"]
            _WEATHER_CACHE[city.lower()] = {"temp": temp, "at": now}
            return temp
        logging.warning("Weather API returned HTTP %s for city %s", response.status_code, city)
        if cached:
            return cached["temp"]
    except (requests.RequestException, KeyError, TypeError, ValueError) as exc:
        logging.warning("Weather request failed: %s", type(exc).__name__)
        if cached:
            return cached["temp"]
    return None
// src/utils/weather.ts
// OpenWeatherMap API with KV caching

import type { KVNamespace } from '@cloudflare/workers-types';

const CACHE_TTL = 20 * 60; // 20 хвилин

export async function getWeather(city: string, apiKey: string | undefined, kv: KVNamespace): Promise<number | null> {
  if (!apiKey) return null;

  const cacheKey = `weather:${city.toLowerCase()}`;
  const cached = await kv.get(cacheKey);
  if (cached) return parseFloat(cached);

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ua`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { main?: { temp?: number } };
    const temp = data?.main?.temp;
    if (temp == null) return null;
    const rounded = Math.round(temp * 10) / 10;
    await kv.put(cacheKey, String(rounded), { expirationTtl: CACHE_TTL });
    return rounded;
  } catch {
    return null;
  }
}

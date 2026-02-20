FROM python:3.11-slim

# Встановлюємо робочу директорію
WORKDIR /app

# Встановлюємо залежності для роботи з MySQL
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо список бібліотек та встановлюємо їх
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо весь код проекту
COPY . .

# Відкриваємо порт 5000
EXPOSE 5000

# Команда для запуску
CMD ["python", "main.py"]
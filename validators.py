import re
from decimal import Decimal, InvalidOperation
from datetime import date, datetime
from numbers import Integral, Real


HONEY_LEVELS = ["Немає", "Майже немає", "Середньо", "Велика кількість", "Повний вулик"]
BEE_SPECIES = ["Карпатка", "Бакфаст", "Українська степова", "Карніка", "Інша"]
QUICK_ACTIONS = {"feeding", "mite_plate", "harvest", "attention"}
EXPENSE_CATEGORIES = [
    "Препарати та лікування",
    "Кормова база",
    "Логістика та пальне",
    "Господарчі витрати",
]


class ValidationError(ValueError):
    pass


def clean_text(value, *, required=False, max_length=255, field_name="Поле"):
    if value is None:
        text = ""
    elif isinstance(value, Integral):
        text = str(value)
    elif isinstance(value, Real) and value.is_integer():
        text = str(int(value))
    else:
        text = str(value).strip()
    if required and not text:
        raise ValidationError(f"{field_name} є обов'язковим.")
    if len(text) > max_length:
        raise ValidationError(f"{field_name} має бути не довшим за {max_length} символів.")
    return text


def validate_username(value):
    username = clean_text(value, required=True, max_length=50, field_name="Логін")
    if len(username) < 3:
        raise ValidationError("Логін має містити щонайменше 3 символи.")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", username):
        raise ValidationError("Логін може містити латинські літери, цифри, крапку, дефіс або підкреслення.")
    return username


def validate_password(value):
    password = value or ""
    if len(password) < 6:
        raise ValidationError("Пароль має містити щонайменше 6 символів.")
    if len(password) > 128:
        raise ValidationError("Пароль занадто довгий.")
    return password


def validate_contact(value):
    return clean_text(value, max_length=100, field_name="Контактні дані")


def validate_city(value):
    city = clean_text(value, max_length=50, field_name="Місто")
    return city or "Sumy"


def validate_telegram_id(value):
    telegram_id = clean_text(value, max_length=20, field_name="Telegram ID")
    if telegram_id and not re.fullmatch(r"\d{5,20}", telegram_id):
        raise ValidationError("Telegram ID має складатися з 5-20 цифр.")
    return telegram_id or None


def validate_hive_number(value):
    hive_number = clean_text(value, required=True, max_length=20, field_name="Номер вулика")
    if not re.fullmatch(r"[A-Za-zА-Яа-яІіЇїЄєҐґ0-9_-]+", hive_number):
        raise ValidationError("Номер вулика може містити літери, цифри, дефіс або підкреслення.")
    return hive_number


def validate_bee_species(value):
    species = clean_text(value, max_length=50, field_name="Порода бджіл")
    return species if species in BEE_SPECIES else "Інша"


def validate_queen_year(value, *, default_year=None):
    default_year = default_year or date.today().year
    raw_year = clean_text(value, max_length=4, field_name="Рік матки")
    if not raw_year:
        return default_year
    try:
        queen_year = int(raw_year)
    except ValueError as exc:
        raise ValidationError("Рік матки має бути числом.") from exc
    max_year = date.today().year + 1
    if queen_year < 2000 or queen_year > max_year:
        raise ValidationError(f"Рік матки має бути в межах 2000-{max_year}.")
    return queen_year


def validate_date(value, *, default=None, field_name="Дата", allow_future=False):
    if not value:
        return default
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValidationError(f"{field_name} має бути у форматі РРРР-ММ-ДД.") from exc
    if not allow_future and parsed > date.today():
        raise ValidationError(f"{field_name} не може бути в майбутньому.")
    return parsed


def validate_honey_level(value):
    honey_level = clean_text(value, max_length=50, field_name="Рівень меду")
    if honey_level not in HONEY_LEVELS:
        raise ValidationError("Невідомий рівень меду.")
    return honey_level


def validate_condition(value):
    return clean_text(value, max_length=2000, field_name="Нотатки огляду")


def validate_quick_action(value):
    action = clean_text(value, required=True, max_length=50, field_name="Дія")
    if action not in QUICK_ACTIONS:
        raise ValidationError("Невідома швидка дія.")
    return action


def validate_decimal(value, *, field_name="Значення", min_value=Decimal("0.01")):
    raw_value = clean_text(value, required=True, max_length=30, field_name=field_name).replace(",", ".")
    try:
        decimal_value = Decimal(raw_value).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError) as exc:
        raise ValidationError(f"{field_name} має бути числом.") from exc
    if decimal_value < min_value:
        raise ValidationError(f"{field_name} має бути не меншим за {min_value}.")
    return decimal_value


def validate_expense_category(value):
    category = clean_text(value, required=True, max_length=100, field_name="Категорія")
    if category not in EXPENSE_CATEGORIES:
        raise ValidationError("Невідома категорія витрат.")
    return category


def validate_finance_note(value, *, field_name="Примітка"):
    return clean_text(value, max_length=500, field_name=field_name)


def validate_honey_sale_quantity(kg, available_kg):
    kg = validate_decimal(kg, field_name="Кількість меду")
    if kg > available_kg:
        raise ValidationError("Недостатньо меду на складі")
    return kg

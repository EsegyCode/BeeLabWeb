from datetime import date, timedelta

import pytest

from validators import (
    ValidationError,
    validate_date,
    validate_hive_number,
    validate_password,
    validate_queen_year,
    validate_telegram_id,
    validate_username,
)


def test_username_accepts_project_login():
    assert validate_username("20010714") == "20010714"


@pytest.mark.parametrize("username", ["", "ab", "кирилиця", "bad space"])
def test_username_rejects_invalid_values(username):
    with pytest.raises(ValidationError):
        validate_username(username)


def test_password_requires_minimum_length():
    with pytest.raises(ValidationError):
        validate_password("12345")


def test_hive_number_is_trimmed_and_validated():
    assert validate_hive_number("  A-12 ") == "A-12"
    with pytest.raises(ValidationError):
        validate_hive_number("bad number!")


def test_queen_year_bounds_are_dynamic():
    assert validate_queen_year("") == date.today().year
    assert validate_queen_year(str(date.today().year)) == date.today().year
    with pytest.raises(ValidationError):
        validate_queen_year(str(date.today().year + 2))


def test_date_rejects_future_by_default():
    with pytest.raises(ValidationError):
        validate_date((date.today() + timedelta(days=1)).isoformat())


def test_telegram_id_is_optional_but_numeric():
    assert validate_telegram_id("") is None
    assert validate_telegram_id("123456789") == "123456789"
    with pytest.raises(ValidationError):
        validate_telegram_id("@nickname")

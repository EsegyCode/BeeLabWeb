from io import BytesIO

import pandas as pd

from importer import import_hives_from_excel
from models import Hives, User, db


def excel_file(rows):
    output = BytesIO()
    pd.DataFrame(rows).to_excel(output, index=False)
    output.seek(0)
    return output


def test_import_rejects_missing_required_columns(app):
    with app.app_context():
        user = User(username="20010714")
        user.set_password("20010714")
        db.session.add(user)
        db.session.commit()

        success, message = import_hives_from_excel(excel_file([{"hive_number": "1"}]), user.id)

        assert success is False
        assert "відсутня колонка" in message


def test_import_adds_valid_rows_and_skips_invalid_or_duplicate_rows(app):
    with app.app_context():
        user = User(username="20010714")
        user.set_password("20010714")
        db.session.add(user)
        db.session.commit()
        db.session.add(Hives(hive_number="1", bee_species="Карніка", queen_year=2024, user_id=user.id))
        db.session.commit()

        success, message = import_hives_from_excel(
            excel_file(
                [
                    {"hive_number": "1", "bee_species": "Карніка", "queen_year": 2024},
                    {"hive_number": "2", "bee_species": "Бакфаст", "queen_year": 2024},
                    {"hive_number": "bad number!", "bee_species": "Карніка", "queen_year": 2024},
                    {"hive_number": "3", "bee_species": "Unknown", "queen_year": 3000},
                ]
            ),
            user.id,
        )

        assert success is True
        assert "2 нових" in message
        assert Hives.query.filter_by(user_id=user.id).count() == 3
        assert Hives.query.filter_by(hive_number="3").one().bee_species == "Інша"

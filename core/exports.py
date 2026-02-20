# core/exports.py
import io
import pandas as pd
from fpdf import FPDF, XPos, YPos
from datetime import date
import os
from flask import send_file


def generate_excel_report(hives, user_full_name):
    df = pd.DataFrame([{"№": h.hive_number, "Порода": h.bee_species, "Статус": h.current_status} for h in hives])
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Пасіка')
    output.seek(0)
    return send_file(output, download_name=f"BeeLab_{user_full_name}_{date.today()}.xlsx", as_attachment=True)


def generate_pdf_report(hives, user_full_name, font_path):
    from fpdf import FPDF, XPos, YPos
    import io
    from datetime import date

    pdf = FPDF()
    pdf.add_page()

    # Налаштування шрифту
    if os.path.exists(font_path):
        pdf.add_font('DejaVu', '', font_path)
        pdf.set_font('DejaVu', '', 14)
        has_unicode = True
    else:
        pdf.set_font("Helvetica", size=12)
        has_unicode = False

    # 1. ЗАГОЛОВОК
    title = f"Звіт BeeLab: {user_full_name}" if has_unicode else f"BeeLab Report: {user_full_name}"
    pdf.cell(190, 10, text=title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
    pdf.ln(10)

    # 2. ШАПКА ТАБЛИЦІ
    pdf.set_font('DejaVu', '', 11) if has_unicode else pdf.set_font("Helvetica", 'B', 11)

    pdf.cell(30, 10, text="№ Вулика", border=1)
    pdf.cell(50, 10, text="Порода", border=1)
    pdf.cell(40, 10, text="Рік матки", border=1)
    pdf.cell(70, 10, text="Статус", border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # 3. ЦИКЛ ВИВОДУ ДАНИХ (саме його бракувало!)
    pdf.set_font('DejaVu', '', 10) if has_unicode else pdf.set_font("Helvetica", size=10)

    for h in hives:
        # Очищуємо статус від емодзі, бо PDF їх не підтримує
        clean_status = h.current_status.replace('🟡', '').replace('⚠️', '').replace('🟢', '')

        pdf.cell(30, 10, text=str(h.hive_number), border=1)
        pdf.cell(50, 10, text=str(h.bee_species), border=1)
        pdf.cell(40, 10, text=str(h.queen_year), border=1)
        pdf.cell(70, 10, text=clean_status, border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Повертаємо файл
    output = io.BytesIO(pdf.output())
    return output
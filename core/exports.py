import io
import os
import pandas as pd
from fpdf import FPDF, XPos, YPos
from datetime import date


def generate_excel_report(hives):
    df = pd.DataFrame([{
        "№ Вулика": h.hive_number,
        "Порода": h.bee_species,
        "Рік матки": h.queen_year,
        "Статус": h.current_status
    } for h in hives])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Пасіка')
    output.seek(0)
    return output


def generate_pdf_report(hives, user_full_name, font_path):
    pdf = FPDF()
    pdf.add_page()

    if os.path.exists(font_path):
        pdf.add_font('DejaVu', '', font_path)
        pdf.set_font('DejaVu', '', 14)
        has_unicode = True
    else:
        pdf.set_font("Helvetica", size=12)
        has_unicode = False

    title = f"Звіт BeeLab: {user_full_name}" if has_unicode else f"BeeLab Report"
    pdf.cell(190, 10, text=title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
    pdf.ln(10)

    # Таблиця
    pdf.set_font('DejaVu', '', 10) if has_unicode else pdf.set_font("Helvetica", size=10)
    pdf.cell(40, 10, text="№ Вулика", border=1)
    pdf.cell(60, 10, text="Порода", border=1)
    pdf.cell(90, 10, text="Статус", border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    for h in hives:
        status = h.current_status.replace('🟡', '').replace('⚠️', '').replace('🟢', '')
        pdf.cell(40, 10, text=str(h.hive_number), border=1)
        pdf.cell(60, 10, text=str(h.bee_species), border=1)
        pdf.cell(90, 10, text=status, border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    output = io.BytesIO(pdf.output())
    return output
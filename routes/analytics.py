from flask import Blueprint, render_template, request, flash, send_file, current_app
from flask_login import login_required, current_user
from models import Hives
from importer import import_hives_from_excel
from core.exports import generate_excel_report, generate_pdf_report
from datetime import date
import os

# Створюємо Blueprint
analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics', methods=['GET', 'POST'])
@login_required
def analytics():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            success, msg = import_hives_from_excel(file, current_user.id)
            flash(msg, "success" if success else "danger")

    stats = {
        "total": Hives.query.filter_by(user_id=current_user.id).count(),
        "attention": Hives.query.filter_by(user_id=current_user.id).filter(
            Hives.current_status.like('%уваги%')).count(),
        "critical": Hives.query.filter_by(user_id=current_user.id).filter(
            Hives.current_status.like('%МАТОЧНИКИ%')).count()
    }
    return render_template('analytics.html', stats=stats)

@analytics_bp.route('/export/excel')
@login_required
def export_excel():
    hives = Hives.query.filter_by(user_id=current_user.id).all()
    output = generate_excel_report(hives)
    return send_file(output, download_name=f"BeeLab_{date.today()}.xlsx", as_attachment=True)

@analytics_bp.route('/export/pdf')
@login_required
def export_pdf():
    hives = Hives.query.filter_by(user_id=current_user.id).all()
    font_path = os.path.join(current_app.root_path, 'static', 'fonts', 'DejaVuSans.ttf')
    pdf_file = generate_pdf_report(hives, current_user.full_name, font_path)
    return send_file(
        pdf_file,
        download_name=f"BeeLab_Report_{date.today()}.pdf",
        as_attachment=True,
        mimetype='application/pdf'
    )
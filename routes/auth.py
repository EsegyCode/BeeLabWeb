from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import db, User
from validators import (
    ValidationError,
    validate_city,
    validate_contact,
    validate_password,
    validate_telegram_id,
    validate_username,
)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            username = validate_username(request.form.get('username'))
            password = request.form.get('password') or ''
        except ValidationError:
            username = ''
            password = ''

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('hives.index'))

        flash('Невірний логін або пароль!', 'danger')
    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            username = validate_username(request.form.get('username'))
            password = validate_password(request.form.get('password'))
            contact = validate_contact(request.form.get('contact'))
        except ValidationError as exc:
            flash(str(exc), 'danger')
            return redirect(url_for('auth.register'))

        if User.query.filter_by(username=username).first():
            flash('Цей логін вже зайнятий!', 'warning')
            return redirect(url_for('auth.register'))

        new_user = User(
            username=username,
            contact_info=contact
        )
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        flash('Реєстрація успішна! Тепер увійдіть.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('register.html')


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        try:
            current_user.telegram_id = validate_telegram_id(request.form.get('telegram_id'))
            current_user.city = validate_city(request.form.get('city'))
        except ValidationError as exc:
            flash(str(exc), 'danger')
            return redirect(url_for('auth.profile'))

        db.session.commit()
        flash('Профіль успішно оновлено!', 'success')
        return redirect(url_for('auth.profile'))
    return render_template('profile.html')

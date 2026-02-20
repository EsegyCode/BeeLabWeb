from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(email=request.form.get('email')).first()
        if user and user.check_password(request.form.get('password')):
            login_user(user)
            return redirect(url_for('hives.index')) # Тепер посилання через Blueprint
        flash('Невірний email або пароль!', 'danger')
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        if User.query.filter_by(email=request.form.get('email')).first():
            flash('Цей Email вже зареєстровано!', 'warning')
            return redirect(url_for('auth.register'))
        u = User(email=request.form.get('email'), full_name=request.form.get('name'))
        u.set_password(request.form.get('password'))
        db.session.add(u)
        db.session.commit()
        flash('Реєстрація успішна!', 'success')
        return redirect(url_for('auth.login'))
    return render_template('register.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
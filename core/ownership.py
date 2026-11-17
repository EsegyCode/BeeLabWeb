from flask import abort
from flask_login import current_user
from models import db


def get_owned_or_404(model, object_id, owner_attr="user_id"):
    obj = db.session.get(model, object_id)
    if obj is None:
        abort(404)
    owner_id = getattr(obj, owner_attr, None)
    if owner_id is None or owner_id != getattr(current_user, "id", None):
        abort(403)
    return obj


def get_task_owned_or_404(task_id):
    from models import FutureTask, Hives

    task = db.session.get(FutureTask, task_id)
    if task is None or task.hive is None or task.hive.user_id != getattr(current_user, "id", None):
        abort(403)
    return task

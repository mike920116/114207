# services/admin/__init__.py
from flask import Blueprint
from .admin_chat import admin_chat_bp

admin_bp = Blueprint(
    "admin", __name__,
    url_prefix="/admin",
    template_folder="../../templates/admin"
)

# ⚠️ ❌ 不要在這裡 import admin_chat_bp
# from .admin_chat import admin_chat_bp  ← 移除

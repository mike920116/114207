from flask import Blueprint

admin_bp = Blueprint(
    "admin", __name__,
    url_prefix="/admin",
    template_folder="../../templates/admin",
)

# -------- 原有 import（users / diaries / dashboard …）---------
from .admin_chat import admin_chat_bp          # 已存在
from .admin import *                            # 既有功能
from .admin_announcement import *              # ⬅️ 新增

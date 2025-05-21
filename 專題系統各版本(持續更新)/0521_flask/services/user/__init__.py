from flask import Blueprint

# 建立使用者藍圖
user_bp = Blueprint(
    "user", __name__,
    url_prefix="/user",
    template_folder="../../templates/user"
)

# 導入功能模組
from .user import load_user
from .settings import settings_bp

# 導出藍圖供app.py使用
__all__ = ("user_bp", "settings_bp", "load_user") 
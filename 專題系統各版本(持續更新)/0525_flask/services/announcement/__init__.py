from flask import Blueprint

announcement_bp = Blueprint(
    "announcement", __name__,
    url_prefix="/api",                 # 對外 URL
)

# 導入實際邏輯 → announcement.py
from .announcement import *            # noqa: E402,F401

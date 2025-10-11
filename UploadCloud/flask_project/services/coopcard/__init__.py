"""
好友互動模組 (CoopCard)
提供好友請求、好友列表、好友互動等功能
"""

from flask import Blueprint

# 建立好友互動藍圖
coopcard_bp = Blueprint(
    "coopcard", __name__,
    url_prefix="/coopcard",
    template_folder="../../templates/coopcard"
)

# 導入功能模組
from . import coopcard
from . import user_id_api  # 導入用戶 ID 相關的 API

# 導出藍圖供app.py使用
__all__ = ('coopcard_bp',)
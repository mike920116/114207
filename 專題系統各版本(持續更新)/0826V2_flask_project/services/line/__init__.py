"""
LINE Bot 模組
提供 LINE Bot webhook 功能
"""

from flask import Blueprint

# 建立 LINE Webhook 藍圖
line_webhook_bp = Blueprint(
    "line_webhook", __name__, 
    url_prefix="/line"
)

# 導入功能模組
from . import webhook

# 導出藍圖供app.py使用
__all__ = ('line_webhook_bp',)

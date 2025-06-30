"""
公告模組
提供公告功能的 API
"""

from flask import Blueprint

# 建立公告藍圖
announcement_bp = Blueprint(
    "announcement", __name__,
    url_prefix="/api"
)

# 導入功能模組
from . import announcement

# 導出藍圖供app.py使用
__all__ = ('announcement_bp',)

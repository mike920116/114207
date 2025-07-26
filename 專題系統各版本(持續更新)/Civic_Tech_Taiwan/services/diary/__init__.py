"""
日記模組
提供日記的 CRUD 功能
"""

from flask import Blueprint

# 建立日記藍圖
diary_bp = Blueprint(
    "diary", __name__,
    url_prefix="/diary",
    template_folder="../../templates/diary"
)

# 導入功能模組
from . import diary

# 導出藍圖供app.py使用
__all__ = ('diary_bp',)
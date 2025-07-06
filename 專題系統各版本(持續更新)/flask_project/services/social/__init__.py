"""
社交模組
提供社交功能
"""

from flask import Blueprint

# 建立社交藍圖
social_bp = Blueprint(
    "social", __name__,
    url_prefix="/social",
    template_folder="../../templates/social"
)

# 導入功能模組
from . import social_main

# 導出藍圖供app.py使用
__all__ = ('social_bp',)

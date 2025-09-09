"""
支援模組
提供幫助文檔、FAQ 和舉報功能
"""

from flask import Blueprint

# 建立支援藍圖
support_bp = Blueprint(
    "support", __name__,
    url_prefix="/support",
    template_folder="../../templates/support"
)

# 導入功能模組
from . import support
from . import support_report

# 導出藍圖供app.py使用
__all__ = ('support_bp',)

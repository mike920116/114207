from flask import Blueprint

# 建立日記藍圖
diary_bp = Blueprint(
    "diary", __name__,
    url_prefix="/diary",
    template_folder="../../templates/diary"
)

# 讓外部可以直接導入
from .diary import *

# 導出藍圖供app.py使用
__all__ = ("diary_bp",) 
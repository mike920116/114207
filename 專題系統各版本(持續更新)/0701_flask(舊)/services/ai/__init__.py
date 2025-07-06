"""
AI 模組
提供 AI 聊天功能
"""

from flask import Blueprint

# 建立 AI 聊天藍圖
ai_chat_bp = Blueprint(
    "ai_chat", __name__, 
    url_prefix="/ai",
    template_folder="../../templates/ai"
)

# 導入功能模組
from . import ai_chat

# 導出藍圖供app.py使用
__all__ = ('ai_chat_bp',)
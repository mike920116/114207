"""
AI 模組
提供 AI 聊天功能、情緒AI分析功能和情緒洞察統計功能
"""

from flask import Blueprint

# 建立 AI 聊天藍圖
ai_chat_bp = Blueprint(
    "ai_chat", __name__, 
    url_prefix="/ai",
    template_folder="../../templates/ai"
)

# 建立情緒AI藍圖
emotion_ai_bp = Blueprint(
    "emotion_ai", __name__,
    url_prefix="/ai",
    template_folder="../../templates/ai"
)

# 建立情緒洞察統計藍圖
emo_stats_bp = Blueprint(
    "emo_stats", __name__,
    url_prefix="/ai",
    template_folder="../../templates/ai"
)

# 導入功能模組
from . import ai_chat
from . import emotion_ai
from . import emo_stats

# 導出藍圖供app.py使用
__all__ = ('ai_chat_bp', 'emotion_ai_bp', 'emo_stats_bp')
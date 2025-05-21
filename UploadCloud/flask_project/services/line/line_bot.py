# services/line/line_bot.py

from linebot import LineBotApi
from linebot.models import TextSendMessage
import os

# 從 .env 讀取 Token 與 User ID 清單（多個用 , 分隔）
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
ADMIN_USER_IDS = [uid.strip() for uid in os.getenv("ADMIN_LINE_USER_IDS", "").split(",") if uid.strip()]

# 初始化 LineBot API
line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)

def notify_admins(message: str):
    for user_id in ADMIN_USER_IDS:
        try:
            line_bot_api.push_message(user_id, TextSendMessage(text=message))
        except Exception as e:
            print(f"❌ 發送失敗（{user_id}）：{e}")

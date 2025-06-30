# services/line/line_bot.py

from linebot import LineBotApi
from linebot.models import TextSendMessage
import os
import logging

LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
RECIPIENT_IDS = [uid.strip() for uid in os.getenv("ADMIN_LINE_USER_IDS", "").split(",") if uid.strip()]

line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)

def notify_admins(message: str):
    for recipient in RECIPIENT_IDS:
        try:
            line_bot_api.push_message(recipient, TextSendMessage(text=message))
        except Exception as e:
            logging.error(f"LINE 訊息傳送失敗 ({recipient}): {e}")

# services/line/line_bot.py

from linebot import LineBotApi
from linebot.models import TextSendMessage
import os
import logging

LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
RECIPIENT_IDS = [uid.strip() for uid in os.getenv("ADMIN_LINE_USER_IDS", "").split(",") if uid.strip()]

# 檢查環境變數配置
if not LINE_CHANNEL_ACCESS_TOKEN:
    logging.warning("LINE_CHANNEL_ACCESS_TOKEN 未設定，LINE Bot 功能將無法使用")
    line_bot_api = None
else:
    line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)

if not RECIPIENT_IDS:
    logging.warning("ADMIN_LINE_USER_IDS 未設定，無法發送管理員通知")

def notify_admins(message: str):
    """
    發送訊息給管理員
    
    Args:
        message (str): 要發送的訊息內容
    """
    if not line_bot_api:
        logging.warning("LINE Bot API 未初始化，無法發送通知")
        return False
    
    if not RECIPIENT_IDS:
        logging.warning("沒有設定管理員 LINE ID，無法發送通知")
        return False
    
    success_count = 0
    for recipient in RECIPIENT_IDS:
        try:
            line_bot_api.push_message(recipient, TextSendMessage(text=message))
            logging.info(f"✅ LINE 通知已發送給 {recipient}")
            success_count += 1
        except Exception as e:
            logging.error(f"❌ LINE 通知發送失敗（{recipient}）：{e}")
    
    return success_count > 0

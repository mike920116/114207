"""
LINE Bot Webhook 處理模組

提供 LINE Bot 整合功能：
- 接收 LINE Webhook 事件
- 處理文字訊息事件
- 管理員通知功能
- 訊息轉發與回應

環境變數需求：
- LINE_CHANNEL_SECRET: LINE Bot 頻道密鑰
- LINE_CHANNEL_ACCESS_TOKEN: LINE Bot 存取權杖

主要路由：
- /webhook: LINE Webhook 接收端點

安全機制：
- 驗證 X-Line-Signature 標頭
- 自動檢查環境變數配置
- 異常處理與日誌記錄
"""

from flask import request
from linebot import LineBotApi, WebhookHandler
from linebot.models import MessageEvent, TextMessage, TextSendMessage
import os, logging
from . import line_webhook_bp  # 從 __init__.py 導入 Blueprint

LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET")
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")

# 只在環境變數存在時初始化 LINE Bot
if LINE_CHANNEL_SECRET and LINE_CHANNEL_ACCESS_TOKEN:
    handler = WebhookHandler(LINE_CHANNEL_SECRET)
    line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)
else:
    handler = None
    line_bot_api = None
    logging.warning("LINE Bot 環境變數未設定，LINE 功能將無法使用")

@line_webhook_bp.route("/webhook", methods=["POST"])
def webhook_callback():
    """
    LINE Webhook 回調處理器
    
    接收 LINE 平台發送的事件，驗證簽名並轉發至事件處理器
    
    Headers:
        X-Line-Signature: LINE 平台簽名
        
    Returns:
        tuple: HTTP 狀態碼和訊息
    """
    if not handler:
        logging.warning("LINE Bot 未初始化，無法處理 webhook")
        return "LINE Bot not configured", 503
        
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data(as_text=True)

    try:
        handler.handle(body, signature)
    except Exception as e:
        logging.exception("LINE webhook 驗證失敗")
        return "NG", 400

    return "OK", 200

# 只在 handler 存在時註冊事件處理器
if handler:
    @handler.add(MessageEvent, message=TextMessage)
    def handle_message(event):
        user_id = getattr(event.source, 'user_id', None)
        group_id = getattr(event.source, 'group_id', None)
        text = event.message.text

        # 記錄訊息到日誌系統而非 print
        logging.info(f"LINE 收到訊息: {text[:50]}...")
        if user_id:
            logging.debug(f"使用者 ID: {user_id}")
        if group_id:
            logging.debug(f"群組 ID: {group_id}")
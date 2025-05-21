# services/line/webhook.py

from flask import Blueprint, request
from linebot import WebhookHandler
from linebot.models import MessageEvent
import os, logging

line_webhook_bp = Blueprint("line_webhook", __name__, url_prefix="/line")

LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET")
handler = WebhookHandler(LINE_CHANNEL_SECRET)

@line_webhook_bp.route("/webhook", methods=["POST"])
def webhook_callback():
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data(as_text=True)

    try:
        handler.handle(body, signature)
    except Exception as e:
        logging.exception("LINE webhook 驗證失敗")
        return "NG", 400

    return "OK", 200

@handler.add(MessageEvent)
def handle_message(event):
    user_id = getattr(event.source, 'user_id', None)
    group_id = getattr(event.source, 'group_id', None)

    if user_id:
        print(f"📌 LINE 使用者 ID：{user_id}")
    if group_id:
        print(f"📣 群組 ID：{group_id}")

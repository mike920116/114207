"""
管理員模組
提供管理員功能的 Blueprint 和相關工具
"""

from flask import Blueprint

# 建立管理員主藍圖
admin_bp = Blueprint(
    'admin', __name__,
    url_prefix='/admin',
    template_folder="../../templates/admin"
)

# 建立管理員聊天藍圖
admin_chat_bp = Blueprint(
    "admin_chat", __name__,
    url_prefix="/admin/chat",
    template_folder="../../templates/admin"
)

# 建立管理員公告藍圖
admin_announcement_bp = Blueprint(
    "admin_announce", __name__,
    url_prefix="/admin/announcements",
    template_folder="../../templates/admin"
)

# 建立管理員舉報藍圖
admin_report_bp = Blueprint(
    "admin_report", __name__,
    url_prefix="/admin/report",
    template_folder="../../templates/admin"
)


# 導入功能模組（這會註冊路由到上面的 Blueprint）
from . import admin
from . import admin_chat
from . import admin_announcement
from . import admin_report

# 導出藍圖供app.py使用
__all__ = ('admin_bp', 'admin_chat_bp', 'admin_announcement_bp','admin_report_bp')

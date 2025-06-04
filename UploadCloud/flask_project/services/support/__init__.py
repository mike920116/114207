from flask import Blueprint

# ── Support Blueprint ────────────────────────────────
support_bp = Blueprint(
    "support",                        # Blueprint 名稱
    __name__,
    url_prefix="/support",            # 走 /support/...
    template_folder="../../templates/support"
)

# 匯入路由（放在下方可避免循環匯入）
from .support import *               # noqa: F401

__all__ = ("support_bp",)            # 給 app.py 導入用

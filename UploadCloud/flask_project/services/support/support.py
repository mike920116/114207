"""
用戶支援服務模組

提供用戶支援和幫助功能：
- 平台使用說明
- 常見問題解答
- 幫助文檔展示
- 使用者服務條款與知情同意書

主要路由：
- /support/usage: 使用說明頁面
- /support/faq: 常見問題頁面
- /support/terms: 使用者服務條款與知情同意書
"""

from flask import render_template
from . import support_bp  # 從 __init__.py 導入 Blueprint

# ── 使用說明 ──────────────────────────────────────────
@support_bp.route("/usage")
def support_usage():
    """
    顯示平台使用說明頁面

    Returns:
        str: 使用說明 HTML 頁面
    """
    return render_template("support/usage.html")

# ── 常見問題 ──────────────────────────────────────────
@support_bp.route("/faq")
def support_faq():
    """
    顯示常見問題解答頁面

    Returns:
        str: 常見問題 HTML 頁面
    """
    return render_template("support/faq.html")

# ── 使用者服務條款與知情同意書 ──────────────────────────────────────────
@support_bp.route("/terms")
def support_terms():
    """
    顯示使用者服務條款與知情同意書頁面

    Returns:
        str: 服務條款 HTML 頁面
    """
    return render_template("support/terms_of_service.html")

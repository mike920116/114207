from flask import render_template
from . import support_bp

# ── 使用說明 ──────────────────────────────────────────
@support_bp.route("/usage")
def support_usage():
    return render_template("support/usage.html")

# ── 常見問題 ──────────────────────────────────────────
@support_bp.route("/faq")
def support_faq():
    return render_template("support/faq.html")

from flask import Blueprint

social_bp = Blueprint(
    "social", __name__,
    url_prefix="/social",
    template_folder="../../templates/social"
)

from . import social_main  # 導入功能

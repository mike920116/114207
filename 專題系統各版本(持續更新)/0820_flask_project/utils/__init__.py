"""
工具模組
提供資料庫連接和其他共用工具函數
"""

from .db import get_connection

__all__ = ['get_connection']
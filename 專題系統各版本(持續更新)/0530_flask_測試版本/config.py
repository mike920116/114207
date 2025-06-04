# -*- coding: utf-8 -*-
"""
Flask 應用程式配置檔案
根據 .env 檔案載入環境變數並提供統一的配置管理
"""
import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

class Config:
    """基礎配置類"""
    
    # Flask 基本設定
    SECRET_KEY = os.environ.get('SECRET_KEY', '2025_flask_project')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    
    # 伺服器設定 (供外部訪問時使用)
    SERVER_NAME = os.environ.get('SERVER_NAME')  # 例如: '192.168.1.100:5000'
    
    # 資料庫設定
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = int(os.environ.get('DB_PORT', 3306))
    DB_NAME = os.environ.get('DB_NAME', 'flaskdb')
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'NTUB')
    
    # DIFY API 設定
    DIFY_API_URL = os.environ.get('DIFY_API_URL', 'https://api.dify.ai/v1/chat-messages')
    DIFY_API_KEY_FOR_DIARY = os.environ.get('DIFY_API_KEY_For_Diary')
    DIFY_API_KEY_FOR_CHAT = os.environ.get('DIFY_API_KEY_For_Chat')
    
    # 郵件設定
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.zoho.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # 管理員設定
    ADMIN_EMAILS = set(email.strip() for email in os.environ.get('ADMIN_EMAILS', '').split(',') if email.strip())
    
    @classmethod
    def get_db_config(cls):
        """獲取資料庫配置字典"""
        return {
            'host': cls.DB_HOST,
            'port': cls.DB_PORT,
            'database': cls.DB_NAME,
            'user': cls.DB_USER,
            'password': cls.DB_PASSWORD,        'charset': 'utf8mb4'
        }
    
    @classmethod
    def get_mail_config(cls):
        """獲取郵件配置字典"""
        return {
            'server': cls.MAIL_SERVER,
            'port': cls.MAIL_PORT,
            'use_tls': cls.MAIL_USE_TLS,
            'username': cls.MAIL_USERNAME,
            'password': cls.MAIL_PASSWORD,
            'sender': cls.MAIL_DEFAULT_SENDER
        }
    
    @classmethod
    def validate_config(cls):
        """驗證必要的配置是否存在"""
        errors = []
        
        # 檢查 DIFY API Keys
        if not cls.DIFY_API_KEY_FOR_DIARY:
            errors.append("DIFY_API_KEY_For_Diary 未設定")
        if not cls.DIFY_API_KEY_FOR_CHAT:
            errors.append("DIFY_API_KEY_For_Chat 未設定")
        
        # 檢查郵件設定
        if not cls.MAIL_USERNAME:
            errors.append("MAIL_USERNAME 未設定")
        if not cls.MAIL_PASSWORD:
            errors.append("MAIL_PASSWORD 未設定")
        if not cls.MAIL_DEFAULT_SENDER:
            errors.append("MAIL_DEFAULT_SENDER 未設定")
        
        # 檢查管理員郵件
        if not cls.ADMIN_EMAILS:
            errors.append("ADMIN_EMAILS 未設定")
        
        return errors

class DevelopmentConfig(Config):
    """開發環境配置"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """生產環境配置"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """測試環境配置"""
    DEBUG = True
    TESTING = True
    DB_NAME = 'test_flaskdb'  # 使用測試資料庫

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """根據環境變數獲取對應的配置類"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
郵件配置測試腳本
用於驗證郵件系統配置是否正確
"""

from config import get_config

def test_mail_configuration():
    """測試郵件配置"""
    print("🔍 測試郵件配置...")
    
    try:
        # 載入配置
        config = get_config()
        mail_config = config.get_mail_config()
        
        print("\n📧 郵件配置資訊:")
        print(f"  伺服器: {mail_config['server']}")
        print(f"  連接埠: {mail_config['port']}")
        print(f"  使用 TLS: {mail_config['use_tls']}")
        print(f"  使用者名稱: {mail_config['username']}")
        print(f"  發送者: {mail_config['sender']}")
        print(f"  密碼: {'*' * len(mail_config['password']) if mail_config['password'] else '未設定'}")
        
        # 檢查必要欄位
        required_fields = ['server', 'port', 'username', 'password', 'sender']
        missing_fields = []
        
        for field in required_fields:
            if not mail_config.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            print(f"\n❌ 缺少必要的配置欄位: {', '.join(missing_fields)}")
            return False
        else:
            print("\n✅ 所有必要的郵件配置欄位都已設定")
            return True
            
    except Exception as e:
        print(f"\n❌ 配置測試失敗: {str(e)}")
        return False

def test_mail_connection():
    """測試郵件伺服器連接（不實際發送郵件）"""
    print("\n🔗 測試郵件伺服器連接...")
    
    try:
        import smtplib
        from config import get_config
        
        config = get_config()
        mail_config = config.get_mail_config()
        
        # 嘗試連接到郵件伺服器
        with smtplib.SMTP(mail_config['server'], mail_config['port']) as server:
            server.starttls()
            # 只測試連接，不進行實際登入以避免安全風險
            print("✅ 成功連接到郵件伺服器")
            return True
            
    except Exception as e:
        print(f"❌ 郵件伺服器連接失敗: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("     Flask 專案郵件配置測試")
    print("=" * 50)
    
    # 測試配置
    config_ok = test_mail_configuration()
    
    # 如果配置正確，測試連接
    if config_ok:
        test_mail_connection()
    
    print("\n" + "=" * 50)
    print("測試完成")
    print("=" * 50)

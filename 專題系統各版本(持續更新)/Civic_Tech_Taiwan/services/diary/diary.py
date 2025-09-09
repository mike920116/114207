"""
日記管理模組

提供個人日記記錄與情緒分析功能：
- 日記撰寫與儲存
- AI 情緒分析（整合 Dify API）
- 日記歷史記錄檢視

主要功能：
- 用戶撰寫日記內容
- 透過 Dify API 進行情緒分析
- 儲存日記與分析結果至資料庫
- 提供日記列表瀏覽功能

主要路由：
- /diary/form: 日記撰寫表單
- /diary/save: 儲存日記
- /diary/list: 日記列表檢視
"""

from flask import render_template, request, jsonify,session
from flask_login import login_required, current_user
from utils import db
from utils.encryption import encrypt, decrypt
from datetime import datetime
import os,base64,logging
from dotenv import load_dotenv
from . import diary_bp  # 從 __init__.py 導入 Blueprint

# DIFY_API_KEY_For_Diary
load_dotenv()  # 載入環境變數
DIFY_API_KEY_For_Diary = os.getenv("DIFY_API_KEY_For_Diary")

# 顯示日記頁面
@diary_bp.route('/form')
@login_required  # 需要登入才能存取
def diary_form():
    """
    顯示日記撰寫表單頁面
    
    Returns:
        str: 渲染後的日記表單 HTML 頁面
    """
    return render_template('diary/diary_form.html')

# 儲存日記
@diary_bp.route('/save', methods=['POST'])
@login_required
def save_diary():
    """
    處理日記儲存請求
    
    流程：
    1. 接收日記內容和情緒狀態
    2. 呼叫 Dify API 進行情緒分析
    3. 將日記內容和分析結果儲存至資料庫
    
    JSON Payload:
        content (str): 日記內容
        state (str): 用戶自填情緒狀態
        
    Returns:
        JSON: 包含成功狀態、訊息和情緒分析結果
    """
    try:
        import requests  # 確保你有在上面匯入
        request_data = request.get_json()
        content = request_data.get('content', '').strip()
        user_emotion = request_data.get('state', '').strip()

        # 記錄接收到的數據
        logging.info(f"收到日記提交 - 用戶: {current_user.id}, 內容長度: {len(content)}, 情緒: {user_emotion}")

        if not content and not user_emotion:
            return jsonify({'success': False, 'message': '請輸入日記內容或情緒狀態'})

        # 如果沒有內容但有情緒，使用預設內容
        if not content and user_emotion:
            content = f"今天的心情是：{user_emotion}"
            logging.info(f"自動生成日記內容: {content}")

        # 呼叫 Dify 取得情緒分析
        dify_query = content if content else f"用戶情緒狀態：{user_emotion}"
        dify_payload = {
            "inputs": {
                "question": dify_query
            },
            "query": dify_query,
            "conversation_id": None,
            "response_mode": "blocking",
            "user": "normaluser",
        }

        dify_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DIFY_API_KEY_For_Diary}"
        }

        dify_response = requests.post("https://api.dify.ai/v1/chat-messages", json=dify_payload, headers=dify_headers)

        if dify_response.status_code != 200:
            print("Dify 錯誤狀態碼:", dify_response.status_code)
            print("Dify 回傳內容:", dify_response.text)
            return jsonify({'success': False, 'message': 'DIFY API 回傳錯誤', 'error': dify_response.text})

        ai_analysis_response = dify_response.json()
        ai_result = ai_analysis_response.get('answer', '無法取得分析結果')

        current_time = datetime.now()

        # 1. 取得 session 中金鑰（Base64 解碼）
        encoded_key = session.get('encryption_key')
        
        if not encoded_key:
            return jsonify({'success': False, 'message': '金鑰不存在，請重新登入後再試'})

        try:
            aes_key = base64.b64decode(encoded_key)
        except Exception as e:
            logging.error(f"金鑰解碼失敗 - 用戶: {current_user.id}, 錯誤: {str(e)}")
            return jsonify({'success': False, 'message': '金鑰格式異常，請重新登入後再試'})

        # 2. 加密內容與分析結果
        try:
            # 確保內容不為空
            content_to_encrypt = str(content) if content else "（空白日記）"
            ai_result_to_encrypt = str(ai_result) if ai_result else "（無AI分析）"
            
            logging.info(f"準備加密 - 內容長度: {len(content_to_encrypt)}, AI分析長度: {len(ai_result_to_encrypt)}")
            
            enc_content = encrypt(content_to_encrypt, aes_key)
            enc_analysis = encrypt(ai_result_to_encrypt, aes_key)
            
            logging.info(f"加密完成 - 加密內容長度: {len(enc_content)}, 加密分析長度: {len(enc_analysis)}")
            
        except Exception as e:
            logging.error(f"加密失敗 - 用戶: {current_user.id}, 錯誤: {str(e)}")
            return jsonify({'success': False, 'message': '數據加密失敗，請稍後再試'})

        # 3. 儲存到資料庫（加密後內容）
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("""
            INSERT INTO DiaryRecords (User_Email, Diary_Content, AI_analysis_content, Created_at, Updated_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (current_user.id, enc_content, enc_analysis, current_time, current_time))
        database_connection.commit()
        database_connection.close()

        return jsonify({'success': True, 'message': '日記與情緒分析已儲存成功', 'emotion_detail': ai_result})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'發生錯誤: {str(e)}'})


@diary_bp.route('/list')
@login_required
def diary_list():
    try:
        # 0. 首先檢查金鑰有效性
        key_valid, key_message = check_encryption_key_validity()
        if not key_valid:
            logging.warning(f"用戶 {current_user.id} 金鑰檢查失敗: {key_message}")
            return render_template('diary/diary_list.html',
                                   error_message=f"會話已過期或金鑰異常（{key_message}），請重新登入後再試")
        
        # 1. 從資料庫撈資料（目前是加密的）
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("""
            SELECT Diary_id, Diary_Content, AI_analysis_content, Created_at 
            FROM DiaryRecords 
            WHERE User_Email = %s 
            ORDER BY Created_at DESC
        """, (current_user.id,))
        rows = database_cursor.fetchall()
        database_connection.close()

        # 2. 解碼 session 金鑰
        encoded_key = session.get('encryption_key')
        if not encoded_key:
            # 如果沒有金鑰，可能是 session 過期或使用者未正確登入
            return render_template('diary/diary_list.html',
                                   error_message="解密金鑰不存在，請重新登入後再試")

        try:
            aes_key = base64.b64decode(encoded_key)
        except Exception as e:
            logging.error(f"金鑰解碼失敗 - 用戶: {current_user.id}, 錯誤: {str(e)}")
            return render_template('diary/diary_list.html',
                                   error_message="金鑰格式異常，請重新登入後再試")

        # 3. 解密每一筆日記
        decrypted_diaries = []
        logging.info(f"用戶 {current_user.id} 開始解密 {len(rows)} 筆日記")
        
        for diary_id, enc_content, enc_analysis, created_at in rows:
            logging.info(f"處理日記 ID: {diary_id}, 內容長度: {len(enc_content) if enc_content else 0}, 分析長度: {len(enc_analysis) if enc_analysis else 0}")
            
            # 使用安全解密函數
            content = safe_decrypt(enc_content, aes_key, "日記內容")
            analysis = safe_decrypt(enc_analysis, aes_key, "AI分析")

            decrypted_diaries.append({
                'id': diary_id,
                'content': content,
                'analysis': analysis,
                'created_at': created_at
            })

        # 4. 傳給模板
        return render_template('diary/diary_list.html', diaries=decrypted_diaries)

    except Exception as e:
        return render_template('diary/diary_list.html', error_message=f'發生錯誤: {str(e)}')

def safe_decrypt(encrypted_data, key, context=""):
    """
    安全解密函數，提供詳細的錯誤處理
    
    Args:
        encrypted_data (str): 加密的數據
        key (bytes): 解密金鑰
        context (str): 錯誤上下文資訊
        
    Returns:
        str: 解密後的內容或錯誤訊息
    """
    if not encrypted_data or encrypted_data.strip() == '':
        return f"[{context}內容為空]"
    
    try:
        # 檢查是否為有效的 Base64 字符串
        try:
            raw_data = base64.b64decode(encrypted_data)
            logging.info(f"{context} Base64 解碼成功，原始數據長度: {len(raw_data)}")
        except Exception as e:
            logging.error(f"{context} Base64 解碼失敗: {str(e)}")
            return f"[{context}數據格式錯誤: 非有效的 Base64 編碼]"
        
        # 嘗試解密
        decrypted_content = decrypt(encrypted_data, key)
        
        # 檢查解密後內容是否合理
        if not decrypted_content:
            logging.warning(f"{context} 解密成功但內容為空字符串")
            return f"[此{context}當時未填寫內容]"
        
        if decrypted_content.strip() == '':
            logging.warning(f"{context} 解密成功但內容只有空白字符")
            return f"[此{context}當時只有空白字符]"
            
        logging.info(f"{context} 解密成功，內容長度: {len(decrypted_content)}")
        return decrypted_content
        
    except UnicodeDecodeError as e:
        logging.warning(f"{context}UTF-8 解碼錯誤 - 用戶: {current_user.id}, 錯誤: {str(e)}")
        return f"[{context}解密錯誤: 金鑰不匹配，請重新登入]"
    except ValueError as e:
        logging.error(f"{context}數據格式錯誤 - 用戶: {current_user.id}, 錯誤: {str(e)}")
        return f"[{context}解密錯誤: 數據格式異常]"
    except Exception as e:
        logging.error(f"{context}解密失敗 - 用戶: {current_user.id}, 錯誤: {str(e)}")
        return f"[{context}解密錯誤: {str(e)}]"

def check_encryption_key_validity():
    """
    檢查當前 session 中的加密金鑰是否有效
    
    Returns:
        tuple: (is_valid, message)
    """
    try:
        encoded_key = session.get('encryption_key')
        if not encoded_key:
            return False, "加密金鑰不存在"
        
        # 檢查能否成功解碼
        aes_key = base64.b64decode(encoded_key)
        
        if len(aes_key) != 32:  # AES-256 需要 32 字節金鑰
            return False, "金鑰長度不正確"
        
        return True, "金鑰有效"
        
    except Exception as e:
        return False, f"金鑰檢查失敗: {str(e)}"

# ── 日記表單頁面 ──────────────────────────────────────────

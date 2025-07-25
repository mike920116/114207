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

from flask import render_template, request, jsonify
from flask_login import login_required, current_user
from utils import db
from datetime import datetime
import os
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
        content = request_data.get('content', '')
        user_emotion = request_data.get('state', '')

        if not content and not user_emotion:
            return jsonify({'success': False, 'message': '請輸入日記內容或情緒狀態'})

        # 呼叫 Dify 取得情緒分析
        dify_payload = {
            "inputs": {
                "question": content
            },
            "query": content,
            "conversation_id": None,
            "response_mode": "blocking",
            "user": str(current_user.id)
        }

        dify_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DIFY_API_KEY_For_Diary}"
        }

        dify_response = requests.post("https://api.dify.ai/v1/chat-messages", json=dify_payload, headers=dify_headers)

        if dify_response.status_code != 200:
            return jsonify({'success': False, 'message': 'DIFY API 回傳錯誤', 'error': dify_response.text})

        ai_analysis_response = dify_response.json()
        ai_result = ai_analysis_response.get('answer', '無法取得分析結果')

        current_time = datetime.now()

        # 儲存到資料庫
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("""
            INSERT INTO DiaryRecords (User_Email, Diary_Content, AI_analysis_content, Created_at, Updated_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (current_user.id, content, ai_result, current_time, current_time))
        database_connection.commit()
        database_connection.close()

        return jsonify({'success': True, 'message': '日記與情緒分析已儲存成功', 'emotion_detail': ai_result})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'發生錯誤: {str(e)}'})


# 顯示日記列表
@diary_bp.route('/list')
@login_required  # 需要登入才能存取
def diary_list():
    """
    顯示用戶日記列表頁面
    
    從資料庫獲取當前用戶的所有日記記錄，依建立時間降序排列
    
    Returns:
        str: 渲染後的日記列表 HTML 頁面
    """
    try:
        # 從資料庫獲取用戶的所有日記
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("""
            SELECT Diary_id, Diary_Content, AI_analysis_content, Created_at 
            FROM DiaryRecords 
            WHERE User_Email = %s 
            ORDER BY Created_at DESC
        """, (current_user.id,))
        diaries = database_cursor.fetchall()
        database_connection.close()
        
        return render_template('diary/diary_list.html', diaries=diaries)
    except Exception as e:
        return render_template('diary/diary_list.html', error_message=f'發生錯誤: {str(e)}')
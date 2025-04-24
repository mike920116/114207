from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from utils import db
from datetime import datetime
import os
from dotenv import load_dotenv

#DIFY_diary_API_TOKEN
load_dotenv() # 載入環境變數
DIFY_diary_API_TOKEN = os.getenv("DIFY_diary_API_TOKEN")

# 建立日記藍圖
diary_bp = Blueprint('diary', __name__)

# 顯示日記頁面
@diary_bp.route('/form')
@login_required  # 需要登入才能存取
def diary_form():
    return render_template('diary_form.html')

# 儲存日記
@diary_bp.route('/save', methods=['POST'])
@login_required
def save_diary():
    try:
        import requests  # 確保你有在上面匯入
        data = request.get_json()
        content = data.get('content', '')
        user_emotion = data.get('state', '')

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
            "Authorization": f"Bearer {DIFY_diary_API_TOKEN}"
        }

        dify_response = requests.post("https://api.dify.ai/v1/chat-messages", json=dify_payload, headers=dify_headers)

        if dify_response.status_code != 200:
            return jsonify({'success': False, 'message': 'DIFY API 回傳錯誤', 'error': dify_response.text})

        dify_data = dify_response.json()
        dify_emotion_result = dify_data.get('answer', '無法取得分析結果')

        current_time = datetime.now()

        # 儲存到資料庫
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO diaryrecords (User_Email, Diary_Content, Emotion_status, Created_at, Updated_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (current_user.id, content, dify_emotion_result, current_time, current_time))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': '日記與情緒分析已儲存成功', 'emotion_detail': dify_emotion_result})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'發生錯誤: {str(e)}'})


# 顯示日記列表
@diary_bp.route('/list')
@login_required  # 需要登入才能存取
def diary_list():
    try:
        # 從資料庫獲取用戶的所有日記
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT Diary_id, Diary_Content, Emotion_status, Created_at 
            FROM diaryrecords 
            WHERE User_Email = %s 
            ORDER BY Created_at DESC
        """, (current_user.id,))
        diaries = cursor.fetchall()
        conn.close()
        
        return render_template('diary_list.html', diaries=diaries)
    except Exception as e:
        return render_template('diary_list.html', error_message=f'發生錯誤: {str(e)}') 
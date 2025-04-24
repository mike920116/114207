from flask import Blueprint, render_template, request, redirect, jsonify, session
from flask_login import login_required, current_user
from utils import db
from datetime import datetime

# 建立日記藍圖
diary_bp = Blueprint('diary', __name__)

# 顯示日記頁面
@diary_bp.route('/form')
@login_required  # 需要登入才能存取
def diary_form():
    return render_template('diary_form.html')

# 儲存日記
@diary_bp.route('/save', methods=['POST'])
@login_required  # 需要登入才能存取
def save_diary():
    try:
        # 取得表單資料
        data = request.get_json()
        content = data.get('content', '')
        emotion_status = data.get('state', '')
        
        # 確保有內容
        if not content and not emotion_status:
            return jsonify({'success': False, 'message': '請輸入日記內容或情緒狀態'})
        
        # 生成時間戳
        current_time = datetime.now()
        
        # 將日記資料寫入資料庫
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO diaryrecords (User_Email, Diary_Content, Emotion_status, Created_at, Updated_at) 
            VALUES (%s, %s, %s, %s, %s)
        """, (current_user.id, content, emotion_status, current_time, current_time))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': '日記已成功儲存'})
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
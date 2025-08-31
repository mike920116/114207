"""
日記管理模組

提供個人日記記錄與情緒分析功能：
- 日記撰寫與儲存
- AI 情緒分析（整合 Dify API）
- 日記歷史記錄檢視
- 日記匯出功能

主要功能：
- 用戶撰寫日記內容
- 透過 Dify API 進行情緒分析
- 儲存日記與分析結果至資料庫
- 提供日記列表瀏覽功能
- 匯出使用者日記（解密後）

主要路由：
- /diary/form: 日記撰寫表單
- /diary/save: 儲存日記
- /diary/list: 日記列表檢視
- /diary/export: 匯出日記
"""

from flask import render_template, request, jsonify, session, Response, make_response
from flask_login import login_required, current_user
from utils import db
from utils.encryption import encrypt, decrypt
from datetime import datetime
import os, base64, logging, io, urllib.parse
from dotenv import load_dotenv
from . import diary_bp  # 從 __init__.py 導入 Blueprint

# PDF生成相關套件
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
from reportlab.lib.colors import black, darkblue, darkred

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
        logging.info(f"Received diary submission - User: {current_user.id}, Content length: {len(content)}, Emotion: {user_emotion}")

        if not content and not user_emotion:
            return jsonify({'success': False, 'message': '請輸入日記內容或情緒狀態'})

        # 如果沒有內容但有情緒，使用預設內容
        if not content and user_emotion:
            content = f"今天的心情是：{user_emotion}"
            logging.info(f"Auto-generated diary content: {content}")

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

        dify_response = requests.post("http://35.234.53.71/v1/chat-messages", json=dify_payload, headers=dify_headers)

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
            
            logging.info(f"Preparing encryption - Content length: {len(content_to_encrypt)}, AI analysis length: {len(ai_result_to_encrypt)}")
            
            enc_content = encrypt(content_to_encrypt, aes_key)
            enc_analysis = encrypt(ai_result_to_encrypt, aes_key)
            
            logging.info(f"Encryption completed - Encrypted content length: {len(enc_content)}, Encrypted analysis length: {len(enc_analysis)}")
            
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
        logging.info(f"User {current_user.id} started decrypting {len(rows)} diaries")
        
        for diary_id, enc_content, enc_analysis, created_at in rows:
            logging.info(f"Processing diary ID: {diary_id}, Content length: {len(enc_content) if enc_content else 0}, Analysis length: {len(enc_analysis) if enc_analysis else 0}")
            
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
        return f"[{context} content is empty]"
    
    try:
        # 檢查是否為有效的 Base64 字符串
        try:
            raw_data = base64.b64decode(encrypted_data)
            logging.info(f"{context} Base64 decode success, raw data length: {len(raw_data)}")
        except Exception as e:
            logging.error(f"{context} Base64 decode failed: {str(e)}")
            return f"[{context} data format error: invalid Base64 encoding]"
        
        # 嘗試解密
        decrypted_content = decrypt(encrypted_data, key)
        
        # 檢查解密後內容是否合理
        if not decrypted_content:
            logging.warning(f"{context} decrypt success but content is empty")
            return f"[{context} was not filled]"
        
        if decrypted_content.strip() == '':
            logging.warning(f"{context} decrypt success but content is whitespace only")
            return f"[{context} contains only whitespace]"
            
        logging.info(f"{context} decrypt success, content length: {len(decrypted_content)}")
        return decrypted_content
        
    except UnicodeDecodeError as e:
        logging.warning(f"{context} UTF-8 decode error - User: {current_user.id}, Error: {str(e)}")
        return f"[{context} decrypt error: key mismatch, please login again]"
    except ValueError as e:
        logging.error(f"{context} data format error - User: {current_user.id}, Error: {str(e)}")
        return f"[{context} decrypt error: data format exception]"
    except Exception as e:
        logging.error(f"{context} decrypt failed - User: {current_user.id}, Error: {str(e)}")
        return f"[{context} decrypt error: {str(e)}]"

def check_encryption_key_validity():
    """
    檢查當前 session 中的加密金鑰是否有效
    
    Returns:
        tuple: (is_valid, message)
    """
    try:
        encoded_key = session.get('encryption_key')
        if not encoded_key:
            return False, "encryption key not found"
        
        # 檢查能否成功解碼
        aes_key = base64.b64decode(encoded_key)
        
        if len(aes_key) != 32:  # AES-256 需要 32 字節金鑰
            return False, "key length incorrect"
        
        return True, "key valid"
        
    except Exception as e:
        return False, f"key check failed: {str(e)}"

@diary_bp.route('/delete/<int:diary_id>', methods=['POST'])
@login_required
def delete_diary(diary_id):
    """
    刪除指定的日記
    
    Args:
        diary_id (int): 要刪除的日記ID
        
    Returns:
        JSON: 包含成功狀態和訊息
    """
    try:
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 首先檢查日記是否存在且屬於當前用戶
        database_cursor.execute("""
            SELECT Diary_id FROM DiaryRecords 
            WHERE Diary_id = %s AND User_Email = %s
        """, (diary_id, current_user.id))
        
        diary_record = database_cursor.fetchone()
        
        if not diary_record:
            database_connection.close()
            return jsonify({
                'success': False, 
                'message': '日記不存在或您沒有權限刪除此日記'
            })
        
        # 執行刪除操作
        database_cursor.execute("""
            DELETE FROM DiaryRecords 
            WHERE Diary_id = %s AND User_Email = %s
        """, (diary_id, current_user.id))
        
        database_connection.commit()
        database_connection.close()
        
        logging.info(f"User {current_user.id} successfully deleted diary ID: {diary_id}")
        
        return jsonify({
            'success': True, 
            'message': '日記已成功刪除'
        })
        
    except Exception as e:
        logging.error(f"刪除日記失敗 - 用戶: {current_user.id}, 日記ID: {diary_id}, 錯誤: {str(e)}")
        
        return jsonify({
            'success': False, 
            'message': f'刪除失敗: {str(e)}'
        })


@diary_bp.route('/export')
@login_required
def export_diary():
    """
    匯出使用者的所有日記為PDF格式
    
    功能：
    1. 檢查金鑰有效性
    2. 從資料庫取得用戶所有日記
    3. 解密日記內容和AI分析
    4. 生成PDF檔案供下載
    
    Returns:
        Response: PDF檔案回應或錯誤頁面
    """
    try:
        # 檢查金鑰有效性
        key_valid, key_message = check_encryption_key_validity()
        if not key_valid:
            logging.warning(f"User {current_user.id} export diary key check failed: {key_message}")
            return jsonify({
                'success': False, 
                'message': f'Session expired or key error ({key_message}), please login again'
            }), 400
        
        # 從資料庫撈取所有日記
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("""
            SELECT Diary_id, Diary_Content, AI_analysis_content, Created_at, Updated_at
            FROM DiaryRecords 
            WHERE User_Email = %s 
            ORDER BY Created_at ASC
        """, (current_user.id,))
        rows = database_cursor.fetchall()
        database_connection.close()
        
        if not rows:
            return jsonify({
                'success': False, 
                'message': 'No diary records found to export'
            }), 404
        
        # 生成PDF並返回
        pdf_buffer = generate_diary_pdf(rows, "All Diaries")
        
        # 生成安全的檔案名稱（使用英文以避免編碼問題）
        current_time_filename = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"diary_export_all_{current_time_filename}.pdf"
        encoded_filename = urllib.parse.quote(safe_filename)
        
        # 建立回應 - 確保沒有中文字符
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="{safe_filename}"'
        response.headers['Cache-Control'] = 'no-cache'
        
        pdf_buffer.close()
        
        # 使用英文日誌避免編碼問題
        logging.info(f"User {current_user.id} successfully exported all diary PDF")
        
        return response
        
    except Exception as e:
        logging.error(f"Export diary PDF failed - User: {current_user.id}, Error: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Export failed: {str(e)}'
        }), 500


@diary_bp.route('/export/<int:diary_id>')
@login_required
def export_single_diary(diary_id):
    """
    匯出單筆日記為PDF格式
    
    Args:
        diary_id (int): 要匯出的日記ID
        
    Returns:
        Response: PDF檔案回應或錯誤頁面
    """
    try:
        # 檢查金鑰有效性
        key_valid, key_message = check_encryption_key_validity()
        if not key_valid:
            logging.warning(f"User {current_user.id} export single diary key check failed: {key_message}")
            return jsonify({
                'success': False, 
                'message': f'Session expired or key error ({key_message}), please login again'
            }), 400
        
        # 從資料庫撈取指定日記
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("""
            SELECT Diary_id, Diary_Content, AI_analysis_content, Created_at, Updated_at
            FROM DiaryRecords 
            WHERE Diary_id = %s AND User_Email = %s
        """, (diary_id, current_user.id))
        row = database_cursor.fetchone()
        database_connection.close()
        
        if not row:
            return jsonify({
                'success': False, 
                'message': 'Diary not found or no permission to access'
            }), 404
        
        # 將單筆記錄轉為列表格式
        rows = [row]
        
        # 生成PDF並返回
        pdf_buffer = generate_diary_pdf(rows, f"Diary #{diary_id}")
        
        # 生成安全的檔案名稱（使用英文以避免編碼問題）
        current_time_filename = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"diary_export_{diary_id}_{current_time_filename}.pdf"
        encoded_filename = urllib.parse.quote(safe_filename)
        
        # 建立回應 - 確保沒有中文字符
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="{safe_filename}"'
        response.headers['Cache-Control'] = 'no-cache'
        
        pdf_buffer.close()
        
        # 使用英文日誌避免編碼問題
        logging.info(f"User {current_user.id} successfully exported single diary PDF - ID: {diary_id}")
        
        return response
        
    except Exception as e:
        logging.error(f"Export single diary PDF failed - User: {current_user.id}, Diary ID: {diary_id}, Error: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Export failed: {str(e)}'
        }), 500


def generate_diary_pdf(rows, title_suffix=""):
    """
    生成日記PDF的通用函數
    
    Args:
        rows: 日記資料列表
        title_suffix: 標題後綴
        
    Returns:
        BytesIO: PDF緲衝區
    """
    # 解碼金鑰
    encoded_key = session.get('encryption_key')
    aes_key = base64.b64decode(encoded_key)
    
    # 註冊中文字體 (使用系統字體)
    default_font = 'Helvetica'
    try:
        # Windows 系統字體路徑 - 使用支援中文的字體
        font_paths = [
            "C:/Windows/Fonts/msyh.ttc",  # 微軟雅黑
            "C:/Windows/Fonts/simhei.ttf", # 黑體
            "C:/Windows/Fonts/simsun.ttc"  # 宋體
        ]
        
        font_registered = False
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    pdfmetrics.registerFont(TTFont('ChineseFont', font_path))
                    default_font = 'ChineseFont'
                    font_registered = True
                    logging.info(f"Chinese font registered successfully: {font_path}")
                    break
                except Exception as e:
                    logging.warning(f"Failed to register font {font_path}: {e}")
                    continue
        
        if not font_registered:
            logging.warning("No Chinese font found, using default Helvetica font")
            
    except Exception as e:
        logging.warning(f"Font registration failed: {e}")
    
    # 建立PDF文件 - 使用英文屬性避免編碼問題
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=72, 
        leftMargin=72, 
        topMargin=72, 
        bottomMargin=18,
        title="Diary Export",
        author="Diary System",
        subject="Personal Diary Records"
    )
    
    # 準備樣式
    styles = getSampleStyleSheet()
    
    # 自定義樣式 - 使用中文字體
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=darkblue,
        alignment=1,  # 置中
        fontName=default_font
    )
    
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=6,
        textColor=darkred,
        fontName=default_font
    )
    
    content_style = ParagraphStyle(
        'ContentStyle',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        leftIndent=20,
        fontName=default_font
    )
    
    analysis_style = ParagraphStyle(
        'AnalysisStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=20,
        leftIndent=20,
        textColor=darkblue,
        fontName=default_font
    )
    
    # PDF內容
    story = []
    
    # 標題 - 使用英文格式避免編碼問題
    current_time = datetime.now().strftime('%Y-%m-%d')
    if title_suffix:
        title_text = f"My Diary Records - {title_suffix} - {current_time}"
    else:
        title_text = f"My Diary Records - {current_time}"
    title = Paragraph(title_text, title_style)
    story.append(title)
    story.append(Spacer(1, 12))
    
    # 解密並寫入每筆日記
    successful_exports = 0
    failed_exports = 0
    
    for i, (diary_id, enc_content, enc_analysis, created_at, updated_at) in enumerate(rows):
        try:
            # 解密內容
            content = safe_decrypt(enc_content, aes_key, "diary_content")
            analysis = safe_decrypt(enc_analysis, aes_key, "ai_analysis")
            
            # 日記標題和日期 - 使用中英文混合但安全格式
            if len(rows) == 1:
                diary_title = f"Diary (ID: {diary_id})"
            else:
                diary_title = f"Diary {i + 1} (ID: {diary_id})"
            story.append(Paragraph(diary_title, styles['Heading2']))
            
            # 創建日期 - 使用安全的日期格式
            date_text = f"Created: {created_at.strftime('%Y-%m-%d %H:%M') if created_at else 'Unknown'}"
            if updated_at and updated_at != created_at:
                date_text += f" | Updated: {updated_at.strftime('%Y-%m-%d %H:%M')}"
            
            story.append(Paragraph(date_text, date_style))
            story.append(Spacer(1, 6))
            
            # 日記內容 - 安全處理中文字符
            story.append(Paragraph("Content:", styles['Heading3']))
            # 處理可能的特殊字符和確保UTF-8編碼
            try:
                safe_content = content.encode('utf-8').decode('utf-8')
                safe_content = safe_content.replace('<', '&lt;').replace('>', '&gt;').replace('&', '&amp;')
                story.append(Paragraph(safe_content, content_style))
            except UnicodeError:
                story.append(Paragraph("[Content encoding error]", content_style))
            
            # AI分析 - 安全處理中文字符
            story.append(Paragraph("AI Analysis:", styles['Heading3']))
            try:
                safe_analysis = analysis.encode('utf-8').decode('utf-8')
                safe_analysis = safe_analysis.replace('<', '&lt;').replace('>', '&gt;').replace('&', '&amp;')
                story.append(Paragraph(safe_analysis, analysis_style))
            except UnicodeError:
                story.append(Paragraph("[Analysis encoding error]", analysis_style))
            
            # 分隔線 (只有多筆時才加)
            if len(rows) > 1:
                story.append(Spacer(1, 12))
                story.append(Paragraph("─" * 50, styles['Normal']))
                story.append(Spacer(1, 20))
            
            successful_exports += 1
            
        except Exception as e:
            logging.error(f"Export diary ID {diary_id} error: {str(e)}")
            # 錯誤記錄
            if len(rows) > 1:
                error_title = f"Diary {i + 1} (ID: {diary_id}) - Decryption Failed"
            else:
                error_title = f"Diary (ID: {diary_id}) - Decryption Failed"
            story.append(Paragraph(error_title, styles['Heading2']))
            story.append(Paragraph(f"Error: {str(e)}", analysis_style))
            story.append(Spacer(1, 20))
            failed_exports += 1
    
    # 統計資訊 (只有多筆時才顯示)
    if len(rows) > 1:
        story.append(PageBreak())
        story.append(Paragraph("Export Statistics", styles['Heading1']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Total diaries: {len(rows)}", styles['Normal']))
        story.append(Paragraph(f"Successfully exported: {successful_exports}", styles['Normal']))
        story.append(Paragraph(f"Failed exports: {failed_exports}", styles['Normal']))
        story.append(Paragraph(f"Export time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    
    # 生成PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


# ── 日記表單頁面 ──────────────────────────────────────────
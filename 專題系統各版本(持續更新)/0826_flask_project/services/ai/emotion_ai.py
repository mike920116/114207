# -*- coding: utf-8 -*-
"""
情緒AI分析聊天服務模組 - 簡化版本
基於backup_chatbot的簡潔設計，移除WebSocket和資料庫依賴

提供使用者與情緒AI的聊天功能，整合以下特色：
- Dify API 情緒分析整合
- 雙向情緒分析（用戶+AI）
- 同步HTTP通訊模式

主要路由：
- /ai/emotion: 情緒AI聊天頁面
- /ai/emotion/api: 情緒分析API（簡化版本）
"""

import os, requests, logging, json, re, time
from datetime import datetime
from flask import render_template, request, jsonify
from flask_login import login_required, current_user

# 從 __init__.py 導入 Blueprint
from . import emotion_ai_bp

# ─── Dify 連線設定 ──────────────────────────────────────────
DIFY_API_URL = os.getenv("DIFY_API_URL", "https://api.dify.ai/v1/chat-messages")
DIFY_KEY = os.getenv("DIFY_API_KEY_For_Emobot")
HEADERS = {
    "Authorization": f"Bearer {DIFY_KEY}",
    "Content-Type": "application/json"
}

# ==================== 工具函數 ====================

def safe_log(message):
    """安全的文件日誌函數 - 避免編碼問題影響主程序"""
    try:
        logging.info(f"[EmotionAI] {message}")
    except:
        pass

def to_str(v):
    """將任何值轉成str（None → None）"""
    return str(v) if v is not None else None

# ==================== 情緒分析處理函數 ====================

def build_analysis_template(emotions=None, confidence=None, overall_tone=None):
    """建構標準情緒分析模板"""
    safe_log(f"[分析模板] 開始處理: emotions={len(emotions) if emotions else 0}")
    
    if not emotions or len(emotions) == 0:
        safe_log("[分析模板] 沒有情緒數據，返回None")
        return None
    
    try:
        total_pct = 0
        processed_emotions = []
        
        for emotion in emotions:
            pct = emotion.get('percentage', 0)
            emotion_name = emotion.get('emotion', 'Unknown')
            
            # 強健的字符串轉數字轉換
            if isinstance(pct, str):
                try:
                    clean_pct = pct.strip().replace('%', '')
                    pct_float = float(clean_pct)
                    safe_log(f"[百分比轉換] 成功: {emotion_name} = {pct} → {pct_float}")
                except (ValueError, AttributeError) as e:
                    safe_log(f"[百分比轉換] 失敗: {emotion_name} = '{pct}', 錯誤: {e}")
                    continue
            elif isinstance(pct, (int, float)):
                pct_float = float(pct)
                safe_log(f"[百分比轉換] 數字格式: {emotion_name} = {pct_float}")
            else:
                safe_log(f"[百分比轉換] 未知格式: {emotion_name} = {type(pct)}")
                continue
            
            emotion_copy = emotion.copy()
            emotion_copy['percentage_float'] = pct_float
            processed_emotions.append(emotion_copy)
            total_pct += pct_float
        
        if len(processed_emotions) == 0:
            safe_log("[分析模板] 沒有有效的情緒數據")
            return None
            
        if total_pct <= 0:
            safe_log(f"[分析模板] total_pct無效: {total_pct}")
            return None
        
        # 正常化處理並轉換為字符串格式
        final_emotions = []
        for emotion in processed_emotions:
            normalized_pct = (emotion['percentage_float'] / total_pct) * 100
            final_emotion = {
                'emotion': emotion.get('emotion'),
                'percentage': f"{normalized_pct:.1f}",
                'reason': emotion.get('reason', f"檢測到{emotion.get('emotion')}情緒")
            }
            final_emotions.append(final_emotion)
        
        result = {
            "primary_emotions": final_emotions,
            "confidence": str(confidence) if confidence is not None else "7",
            "overall_tone": overall_tone if overall_tone else "中性"
        }
        
        safe_log(f"[分析模板] 成功處理 {len(final_emotions)} 個情緒")
        return result
        
    except Exception as e:
        safe_log(f"[分析模板] 處理異常: {str(e)}")
        return None

def generate_default_analysis():
    """生成預設情緒分析數據"""
    return {
        "primary_emotions": [
            {"emotion": "平靜", "percentage": "60.0", "reason": "無法分析具體情緒，提供預設回應"},
            {"emotion": "友善", "percentage": "25.0", "reason": "系統預設情緒"},
            {"emotion": "理解", "percentage": "15.0", "reason": "系統處理中"}
        ],
        "confidence": "5",
        "overall_tone": "中性偏正面"
    }

def is_default_analysis(analysis):
    """檢查是否為預設分析數據"""
    if not analysis:
        return False
    return "無法分析具體情緒" in str(analysis.get('primary_emotions', []))

# ==================== API服務層 ====================

def call_dify_api(user_message):
    """統一的Dify API調用服務"""
    if not DIFY_API_URL or not DIFY_KEY:
        return False, 'API配置錯誤，請檢查環境變數', 500
    
    payload = {
        'inputs': {},
        'query': user_message,
        'response_mode': 'blocking',
        'conversation_id': '',
        'user': current_user.id if current_user.is_authenticated else 'anonymous'
    }
    
    try:
        response = requests.post(DIFY_API_URL, headers=HEADERS, json=payload, timeout=30)
        
        if response.status_code != 200:
            error_detail = f'HTTP {response.status_code}'
            try:
                error_json = response.json()
                error_detail += f': {error_json.get("message", response.text)}'
            except:
                error_detail += f': {response.text}'
            return False, error_detail, response.status_code
        
        return True, response.json(), 200
        
    except requests.exceptions.Timeout:
        return False, 'API請求超時，請稍後重試', 504
    except requests.exceptions.ConnectionError:
        return False, '無法連接到AI服務，請檢查網路連線', 503
    except requests.exceptions.RequestException as e:
        return False, f'網路請求錯誤: {str(e)}', 500

# ==================== JSON處理層 ====================

def fix_json_syntax(text):
    """修復常見的JSON語法錯誤"""
    if text.strip().startswith('{\n  {'):
        text = text.strip()
        text = re.sub(r'^\{\s*\n\s*\{', '[{', text)
        text = re.sub(r'},\s*\n\s*\{', '},{', text)
        text = re.sub(r'\}\s*\n\s*\}$', '}]', text)
    
    def fix_reason_quotes(match):
        reason_content = match.group(1).strip()
        reason_content = reason_content.replace('"', '\\"')
        return f'"reason": "{reason_content}"}}'
    
    text = re.sub(r'"reason":\s*([^"]\S[^}]*?)\s*}', fix_reason_quotes, text)
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)
    
    return text

def parse_dify_response(response_text):
    """解析Dify API回應，提取AI回覆和情緒分析"""
    safe_log(f"[JSON解析] 開始解析響應，長度: {len(response_text)}")
    
    cleaned_text = response_text.strip()
    
    try:
        # 處理外層大括號包裝的格式
        if cleaned_text.startswith('{\n  {') and cleaned_text.endswith('}\n}'):
            inner_content = cleaned_text[2:-2].strip()
            cleaned_text = '[' + inner_content + ']'
            safe_log("[JSON解析] 檢測到外層大括號格式，已轉換為數組")
        
        try:
            data = json.loads(cleaned_text)
        except json.JSONDecodeError:
            fixed_text = _fix_common_json_issues(cleaned_text)
            data = json.loads(fixed_text)
            safe_log("[JSON解析] 使用修復後的JSON成功解析")
        
        if isinstance(data, dict):
            data = [data]
        elif not isinstance(data, list):
            raise ValueError("解析結果不是預期的格式")
        
        # 提取數據
        ai_response = ""
        user_analysis = {}
        ai_analysis = {}
        
        for obj in data:
            if not isinstance(obj, dict):
                continue
                
            if 'response_from_ai' in obj:
                ai_response = obj['response_from_ai']
                
            elif 'analysis_for_user' in obj:
                user_data = obj['analysis_for_user']
                if isinstance(user_data, dict) and user_data.get('primary_emotions'):
                    user_analysis = _normalize_emotion_analysis(user_data)
                    
            elif 'analysis_for_ai' in obj:
                ai_data = obj['analysis_for_ai']
                if isinstance(ai_data, dict) and ai_data.get('primary_emotions'):
                    ai_analysis = _normalize_emotion_analysis(ai_data)
        
        if not ai_response:
            safe_log("[JSON解析] 警告: 未找到AI回應")
            ai_response = "抱歉，我現在無法分析您的情緒。"
            
        if not user_analysis:
            user_analysis = generate_default_analysis()
            safe_log("[JSON解析] 用戶情緒分析使用默認值")
            
        if not ai_analysis:
            ai_analysis = generate_default_analysis()
            safe_log("[JSON解析] AI情緒分析使用默認值")
        
        safe_log("[JSON解析] 解析成功完成")
        return user_analysis, ai_response, ai_analysis
        
    except Exception as e:
        safe_log(f"[JSON解析] 解析失敗: {str(e)}")
        return generate_default_analysis(), "抱歉，我現在無法分析您的情緒。", generate_default_analysis()

def _fix_common_json_issues(json_str):
    """修復常見的JSON格式問題"""
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    json_str = re.sub(r'"reason":\s*([^"][^}]*)}', r'"reason": "\1"}', json_str)
    json_str = re.sub(r'\s+', ' ', json_str)
    return json_str

def _normalize_emotion_analysis(analysis_data):
    """標準化情緒分析數據格式"""
    try:
        emotions = analysis_data.get('primary_emotions', [])
        if not emotions:
            return None
            
        processed_emotions = []
        total_percentage = 0
        
        for emotion in emotions:
            if not isinstance(emotion, dict):
                continue
                
            emotion_name = emotion.get('emotion', '')
            percentage = emotion.get('percentage', 0)
            
            if isinstance(percentage, str):
                try:
                    percentage = float(percentage.replace('%', '').strip())
                except ValueError:
                    continue
            elif not isinstance(percentage, (int, float)):
                continue
            
            if percentage > 0:
                processed_emotions.append({
                    'emotion': emotion_name,
                    'percentage': str(percentage),
                    'reason': emotion.get('reason', f'檢測到{emotion_name}情緒')
                })
                total_percentage += percentage
        
        if not processed_emotions or total_percentage <= 0:
            return None
        
        for emotion in processed_emotions:
            original_pct = float(emotion['percentage'])
            normalized_pct = (original_pct / total_percentage) * 100
            emotion['percentage'] = f"{normalized_pct:.1f}"
        
        return {
            'primary_emotions': processed_emotions,
            'confidence': str(analysis_data.get('confidence', 7)),
            'overall_tone': analysis_data.get('overall_tone', '中性')
        }
        
    except Exception as e:
        safe_log(f"[情緒分析標準化] 處理失敗: {str(e)}")
        return None

# ==================== Flask 路由處理 ====================

@emotion_ai_bp.route('/emotion')
@login_required
def emotion_chat_page():
    """情緒AI聊天頁面"""
    safe_log(f"[頁面載入] 用戶 {current_user.id} 進入情緒AI聊天頁面")
    
    # 獲取用戶頭像資訊
    try:
        from utils.db import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT User_Avatar FROM User WHERE User_Email = %s", (current_user.id,))
        user_data = cursor.fetchone()
        user_avatar = user_data[0] if user_data and user_data[0] else None
        cursor.close()
        conn.close()
    except Exception as e:
        safe_log(f"[頁面載入] 獲取用戶頭像失敗: {str(e)}")
        user_avatar = None
    
    # 準備JavaScript變數
    js_user_avatar = f'"{user_avatar}"' if user_avatar else 'null'
    js_username = f'"{current_user.id}"' if current_user.is_authenticated else '"訪客"'
    
    return render_template("ai/emotion_chat.html", 
                         user_avatar=user_avatar,
                         js_user_avatar=js_user_avatar,
                         js_username=js_username)

@emotion_ai_bp.route('/emotion/api', methods=['POST'])
@login_required
def emotion_chat_api():
    """處理情緒AI訊息並進行雙向情緒分析 - 簡化版本"""
    try:
        request_data = request.get_json(silent=True) or {}
        user_message = (request_data.get("message") or "").strip()
        
        if not user_message:
            return jsonify({"error": "請輸入內容"}), 400

        safe_log(f"[情緒AI API] 用戶 {current_user.id} 發送訊息: {user_message[:50]}...")

        # 呼叫Dify API進行情緒分析
        success, api_result, status_code = call_dify_api(user_message)
        
        if not success:
            return jsonify({'error': f'Dify API 錯誤: {api_result}'}), status_code
        
        # 處理API回應
        raw_answer = api_result.get('answer', '')
        if raw_answer:
            user_analysis, ai_response, ai_analysis = parse_dify_response(raw_answer)
        else:
            user_analysis = generate_default_analysis()
            ai_response = '抱歉，我無法處理您的請求。'
            ai_analysis = generate_default_analysis()
        
        # 確保有AI回應
        if not ai_response:
            ai_response = '我理解您的感受，讓我們繼續對話。'

        safe_log(f"[情緒AI API] 處理成功，直接返回HTTP響應")
        
        # 直接返回HTTP響應，不使用WebSocket
        return jsonify({
            'success': True,
            'user_message': user_message,
            'analysis_for_user': user_analysis,
            'ai_response': ai_response,
            'analysis_for_ai': ai_analysis
        })
        
    except Exception as e:
        safe_log(f"[情緒AI API] 系統錯誤: {str(e)}")
        return jsonify({'error': f'伺服器內部錯誤: {str(e)}'}), 500

@emotion_ai_bp.route('/emotion_debug')
@login_required
def emotion_debug_page():
    """情緒AI調試頁面"""
    safe_log(f"[調試頁面] 用戶 {current_user.id} 進入情緒AI調試頁面")
    return render_template("ai/emotion_debug.html")

@emotion_ai_bp.route('/emotion_debug', methods=['POST'])
@login_required
def emotion_debug_api():
    """情緒AI調試API - 提供詳細的處理步驟信息"""
    try:
        request_data = request.get_json(silent=True) or {}
        user_message = (request_data.get("message") or "").strip()
        debug_mode = request_data.get("debug_mode", "full")
        
        if not user_message:
            return jsonify({"error": "請輸入內容"}), 400

        safe_log(f"[情緒AI調試] 用戶 {current_user.id} 發送調試請求: {user_message[:50]}...")

        # 步驟1: 用戶輸入與請求構建
        step1_data = {
            "original_message": user_message,
            "user_id": current_user.id if current_user.is_authenticated else 'anonymous',
            "debug_mode": debug_mode,
            "timestamp": json.dumps(str(datetime.now()), ensure_ascii=False),
            "request_config": {
                "dify_api_url": DIFY_API_URL,
                "has_api_key": bool(DIFY_KEY),
                "headers": {k: v for k, v in HEADERS.items() if k != "Authorization"}
            }
        }

        # 步驟2: 調用Dify API
        success, api_result, status_code = call_dify_api(user_message)
        
        if not success:
            return jsonify({
                'error': f'Dify API 錯誤: {api_result}',
                'debug_info': {
                    'step1_user_input': step1_data,
                    'step2_api_raw_response': {
                        'error': api_result,
                        'status_code': status_code,
                        'success': False
                    }
                }
            }), status_code

        step2_data = {
            "api_success": success,
            "status_code": status_code,
            "raw_response": api_result,
            "response_keys": list(api_result.keys()) if isinstance(api_result, dict) else [],
            "answer_length": len(api_result.get('answer', '')) if isinstance(api_result, dict) else 0
        }

        # 步驟3: JSON結構解析過程
        raw_answer = api_result.get('answer', '')
        try:
            user_analysis, ai_response, ai_analysis = parse_dify_response(raw_answer)
            
            step3_data = {
                "raw_answer": raw_answer,
                "parsing_success": True,
                "user_analysis_found": bool(user_analysis and not is_default_analysis(user_analysis)),
                "ai_response_found": bool(ai_response),
                "ai_analysis_found": bool(ai_analysis and not is_default_analysis(ai_analysis)),
                "parsing_method": "json_parsing_with_fallback"
            }
        except Exception as e:
            user_analysis = generate_default_analysis()
            ai_response = '抱歉，我現在無法分析您的情緒。'
            ai_analysis = generate_default_analysis()
            
            step3_data = {
                "raw_answer": raw_answer,
                "parsing_success": False,
                "parsing_error": str(e),
                "fallback_used": True
            }

        # 步驟4: 洞察補充項目處理 (模擬實現)
        sidebar_recommendations = generate_sidebar_recommendations(user_analysis, ai_response)
        step4_data = {
            "recommendations_generated": len(sidebar_recommendations),
            "recommendation_types": [item.get('type') for item in sidebar_recommendations],
            "processing_method": "emotion_based_generation",
            "items": sidebar_recommendations
        }

        # 步驟5: 最終前端展示數據
        final_data = {
            'success': True,
            'user_message': user_message,
            'analysis_for_user': user_analysis,
            'ai_response': ai_response,
            'analysis_for_ai': ai_analysis,
            'sidebar_recommendations': sidebar_recommendations
        }
        
        step5_data = {
            "final_response_structure": list(final_data.keys()),
            "user_emotions_count": len(user_analysis.get('primary_emotions', [])) if user_analysis else 0,
            "ai_emotions_count": len(ai_analysis.get('primary_emotions', [])) if ai_analysis else 0,
            "ai_response_length": len(ai_response),
            "recommendations_count": len(sidebar_recommendations),
            "complete_data": final_data
        }

        # 情緒分析詳細結果
        emotion_analysis_detail = {
            "user_emotions": user_analysis.get('primary_emotions', []) if user_analysis else [],
            "user_confidence": user_analysis.get('confidence', '未知') if user_analysis else '未知',
            "user_tone": user_analysis.get('overall_tone', '未知') if user_analysis else '未知',
            "ai_emotions": ai_analysis.get('primary_emotions', []) if ai_analysis else [],
            "ai_confidence": ai_analysis.get('confidence', '未知') if ai_analysis else '未知',
            "ai_tone": ai_analysis.get('overall_tone', '未知') if ai_analysis else '未知'
        }

        # 洞察項目詳細檢視
        insight_items_detail = {
            "items": sidebar_recommendations,
            "total_items": len(sidebar_recommendations),
            "addable_items": len([item for item in sidebar_recommendations if item.get('addable', True)]),
            "item_types": list(set(item.get('type', 'unknown') for item in sidebar_recommendations)),
            "summary_length": sum(len(item.get('desc', '')) for item in sidebar_recommendations)
        }

        # 組合調試信息
        debug_info = {
            'step1_user_input': step1_data,
            'step2_api_raw_response': step2_data,
            'step3_json_parsing': step3_data,
            'step4_sidebar_reco_processing': step4_data,
            'step5_final_frontend_data': step5_data,
            'emotion_analysis_detail': emotion_analysis_detail,
            'insight_items_detail': insight_items_detail
        }

        safe_log(f"[情緒AI調試] 調試信息生成完成，共 {len(debug_info)} 個步驟")
        
        return jsonify({
            'success': True,
            'debug_info': debug_info,
            'final_response': final_data
        })
        
    except Exception as e:
        safe_log(f"[情緒AI調試] 系統錯誤: {str(e)}")
        return jsonify({'error': f'伺服器內部錯誤: {str(e)}'}), 500

def generate_sidebar_recommendations(user_analysis, ai_response):
    """根據情緒分析生成側邊欄推薦項目"""
    recommendations = []
    
    if not user_analysis or not user_analysis.get('primary_emotions'):
        return recommendations
    
    try:
        # 基於主要情緒生成推薦
        primary_emotions = user_analysis.get('primary_emotions', [])
        dominant_emotion = primary_emotions[0].get('emotion', '').lower() if primary_emotions else ''
        
        # 情緒對應的推薦映射
        emotion_recommendations = {
            '焦慮': [
                {'type': 'meditation', 'title': '冥想練習', 'desc': '5分鐘深呼吸冥想，幫助緩解焦慮', 'addable': True},
                {'type': 'book', 'title': '焦慮自助指南', 'desc': '學習管理焦慮的實用技巧', 'addable': True}
            ],
            '開心': [
                {'type': 'activity', 'title': '戶外活動', 'desc': '趁著好心情，出去散步或運動', 'addable': True},
                {'type': 'goal', 'title': '設定新目標', 'desc': '利用積極心態制定新的計劃', 'addable': True}
            ],
            '悲傷': [
                {'type': 'music', 'title': '療癒音樂', 'desc': '聆聽舒緩的音樂來調節情緒', 'addable': True},
                {'type': 'psychology', 'title': '情緒日記', 'desc': '寫下感受，幫助處理負面情緒', 'addable': True}
            ],
            '憤怒': [
                {'type': 'activity', 'title': '運動發洩', 'desc': '通過運動釋放憤怒情緒', 'addable': True},
                {'type': 'meditation', 'title': '情緒調節練習', 'desc': '學習健康的憤怒管理方法', 'addable': True}
            ]
        }
        
        # 查找匹配的推薦
        for emotion_key, recs in emotion_recommendations.items():
            if emotion_key in dominant_emotion:
                recommendations.extend(recs)
                break
        
        # 如果沒有匹配的情緒，提供通用推薦
        if not recommendations:
            recommendations = [
                {'type': 'psychology', 'title': '情緒管理技巧', 'desc': '學習基本的情緒調節方法', 'addable': True},
                {'type': 'meditation', 'title': '正念練習', 'desc': '培養當下意識，提升情緒穩定性', 'addable': True}
            ]
        
        # 添加ID和時間戳
        for i, rec in enumerate(recommendations):
            rec['id'] = f"rec_{int(time.time())}_{i}"
            rec['generated_at'] = str(datetime.now())
        
        safe_log(f"[推薦生成] 為情緒 '{dominant_emotion}' 生成了 {len(recommendations)} 個推薦")
        
    except Exception as e:
        safe_log(f"[推薦生成] 錯誤: {str(e)}")
        recommendations = [
            {'type': 'psychology', 'title': '通用建議', 'desc': '保持積極心態，關注當下', 'addable': True, 'id': 'default_rec'}
        ]
    
    return recommendations

@emotion_ai_bp.route('/emotion/health')
def emotion_health_check():
    """情緒AI健康檢查端點"""
    return jsonify({'status': 'healthy', 'service': '情緒AI分析聊天服務'})

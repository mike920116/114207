# -*- coding: utf-8 -*-
"""
情緒洞察統計模組 - emo_stats.py
基於emotion_history資料表的情緒數據分析與統計功能

提供以下核心功能：
- 情緒趨勢分析
- 情緒分布統計
- 統計摘要計算
- 數據匯出功能

主要路由：
- /ai/emo_stats        # 計算主導情緒傾向
        total_score = positive_score + negative_score + neutral_score
        if total_score > 0:
            positive_ratio = positive_score / total_score
            negative_ratio = negative_score / total_score
            
            if positive_ratio > negative_ratio + 0.1:  # 10% 的緩衝區間
                emotion_direction = '正向心態'
            elif negative_ratio > positive_ratio + 0.1:
                emotion_direction = '較為負面'
            else:
                emotion_direction = '情緒平衡'
        else:
            emotion_direction = '無明確傾向'- /ai/emo_stats/api/*: 各種統計API端點
"""

import os, json, logging
from datetime import datetime, timedelta, date
from flask import render_template, request, jsonify, make_response
from flask_login import login_required, current_user
from collections import defaultdict, Counter

# 從 __init__.py 導入 Blueprint
from . import emo_stats_bp

def safe_log(message):
    """安全的日誌記錄函數"""
    try:
        logging.info(f"[EmoStats] {message}")
    except:
        pass

# ==================== 智能情緒分類函數 ====================

def extract_emotion_type_and_percentage(emotion_data):
    """
    從情緒數據中提取類型和百分比
    優先使用 Dify 提供的 type 標籤和 percentage
    """
    emotion_type = emotion_data.get('type', '').lower()
    if emotion_type not in ['positive', 'negative', 'neutral']:
        emotion_type = 'neutral'
    
    # 提取百分比數值
    percentage_str = emotion_data.get('percentage', '0')
    try:
        if isinstance(percentage_str, str):
            percentage = float(percentage_str.replace('%', ''))
        else:
            percentage = float(percentage_str)
    except (ValueError, TypeError):
        percentage = 0.0
    
    return emotion_type, percentage

# ==================== 輔助函數 ====================

def get_user_emotion_history(user_email, start_date=None, end_date=None, limit=None):
    """獲取用戶情緒歷史記錄"""
    try:
        from utils.db import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        
        # 建構查詢條件
        conditions = ["user_email = %s"]
        params = [user_email]
        
        if start_date:
            conditions.append("created_at >= %s")
            params.append(start_date)
        
        if end_date:
            conditions.append("created_at <= %s")
            params.append(end_date)
        
        where_clause = " AND ".join(conditions)
        limit_clause = f" LIMIT {limit}" if limit else ""
        
        sql = f"""SELECT id, user_emotions, ai_emotions, confidence_score, 
                         overall_tone, session_id, created_at, message_content
                  FROM emotion_history 
                  WHERE {where_clause}
                  ORDER BY created_at DESC{limit_clause}"""
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # 轉換為字典格式
        records = []
        for row in results:
            record = {
                'id': row[0],
                'user_emotions': json.loads(row[1]) if row[1] else None,
                'ai_emotions': json.loads(row[2]) if row[2] else None,
                'confidence_score': row[3],
                'overall_tone': row[4],
                'session_id': row[5],
                'created_at': row[6],
                'message_content': row[7]
            }
            records.append(record)
        
        safe_log(f"獲取用戶 {user_email} 的 {len(records)} 條情緒記錄")
        return records
        
    except Exception as e:
        safe_log(f"獲取情緒歷史記錄失敗: {str(e)}")
        return []

# ==================== 統計計算函數 ====================

def calculate_emotion_summary(user_email, days=7, today_only=False):
    """計算情緒統計摘要"""
    try:
        if today_only:
            # 只統計今天的數據
            today = datetime.now().date()
            start_date = datetime.combine(today, datetime.min.time())
            end_date = datetime.combine(today, datetime.max.time())
        else:
            # 獲取指定天數的數據
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
        
        records = get_user_emotion_history(user_email, start_date, end_date)
        
        if not records:
            return {
                'total_interactions': 0,
                'emotion_direction': '無數據',
                'avg_confidence': 0,
                'emotion_stability': 0,
                'date_range': f'{start_date.strftime("%Y-%m-%d")} 至 {end_date.strftime("%Y-%m-%d")}'
            }
        
        # 統計計算
        total_interactions = len(records)
        
        # 使用百分比進行精確統計
        positive_score = 0.0
        negative_score = 0.0
        neutral_score = 0.0
        confidence_scores = []
        
        for record in records:
            if record['user_emotions'] and 'primary_emotions' in record['user_emotions']:
                emotions = record['user_emotions']['primary_emotions']
                
                # 統計所有情緒的百分比
                for emotion_data in emotions:
                    emotion_type, percentage = extract_emotion_type_and_percentage(emotion_data)
                    
                    if emotion_type == 'positive':
                        positive_score += percentage
                    elif emotion_type == 'negative':
                        negative_score += percentage
                    else:
                        neutral_score += percentage
            
            if record['confidence_score']:
                confidence_scores.append(record['confidence_score'])
        
        # 計算主導情緒傾向
        total_score = positive_score + negative_score + neutral_score
        if total_score > 0:
            positive_ratio = positive_score / total_score
            negative_ratio = negative_score / total_score
            
            if positive_ratio > negative_ratio + 0.1:  # 10% 的緩衝區間
                emotion_direction = '正向心態'
            elif negative_ratio > positive_ratio + 0.1:
                emotion_direction = '較為負面'
            else:
                emotion_direction = '情緒平衡'
        else:
            emotion_direction = '無明確傾向'
        
        # 平均信心度
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        # 情緒穩定度（基於信心度變異）
        if len(confidence_scores) > 1:
            variance = sum((x - avg_confidence) ** 2 for x in confidence_scores) / len(confidence_scores)
            emotion_stability = max(0, 100 - (variance * 10))
        else:
            emotion_stability = avg_confidence * 10
        
        return {
            'total_interactions': total_interactions,
            'emotion_direction': emotion_direction,
            'avg_confidence': round(avg_confidence, 1),
            'emotion_stability': round(emotion_stability, 1),
            'date_range': f'{start_date.strftime("%Y-%m-%d")} 至 {end_date.strftime("%Y-%m-%d")}',
            'positive_score': round(positive_score, 1),
            'negative_score': round(negative_score, 1),
            'neutral_score': round(neutral_score, 1)
        }
        
    except Exception as e:
        safe_log(f"計算情緒摘要失敗: {str(e)}")
        return {
            'total_interactions': 0,
            'emotion_direction': '計算錯誤',
            'avg_confidence': 0,
            'emotion_stability': 0,
            'date_range': '無法計算',
            'positive_count': 0,
            'negative_count': 0
        }

def get_emotion_trends(user_email, days=7):
    """獲取情緒趨勢數據 - 基於百分比統計"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        records = get_user_emotion_history(user_email, start_date, end_date)
        
        # 按日期分組統計
        daily_data = defaultdict(lambda: {'positive_score': 0.0, 'negative_score': 0.0, 'neutral_score': 0.0, 'interaction_count': 0})
        
        for record in records:
            record_date = record['created_at'].date()
            date_str = record_date.strftime('%Y-%m-%d')
            
            # 統計該記錄的情緒
            if record['user_emotions'] and 'primary_emotions' in record['user_emotions']:
                emotions = record['user_emotions']['primary_emotions']
                daily_data[date_str]['interaction_count'] += 1
                
                # 統計所有情緒的百分比
                for emotion_data in emotions:
                    emotion_type, percentage = extract_emotion_type_and_percentage(emotion_data)
                    
                    if emotion_type == 'positive':
                        daily_data[date_str]['positive_score'] += percentage
                    elif emotion_type == 'negative':
                        daily_data[date_str]['negative_score'] += percentage
                    else:
                        daily_data[date_str]['neutral_score'] += percentage
        
        # 生成趨勢數據
        trend_data = {
            'dates': [],
            'positive_scores': [],
            'negative_scores': [],
            'neutral_scores': [],
            'interaction_counts': []
        }
        
        # 填充每一天的數據
        current_date = start_date.date()
        while current_date <= end_date.date():
            date_str = current_date.strftime('%Y-%m-%d')
            date_display = current_date.strftime('%m/%d')
            
            trend_data['dates'].append(date_display)
            
            if date_str in daily_data:
                day_data = daily_data[date_str]
                trend_data['positive_scores'].append(round(day_data['positive_score'], 1))
                trend_data['negative_scores'].append(round(day_data['negative_score'], 1))
                trend_data['neutral_scores'].append(round(day_data['neutral_score'], 1))
                trend_data['interaction_counts'].append(day_data['interaction_count'])
            else:
                trend_data['positive_scores'].append(0.0)
                trend_data['negative_scores'].append(0.0)
                trend_data['neutral_scores'].append(0.0)
                trend_data['interaction_counts'].append(0)
            
            current_date += timedelta(days=1)
        
        return trend_data
        
    except Exception as e:
        safe_log(f"獲取情緒趨勢失敗: {str(e)}")
        return {
            'dates': [],
            'positive_scores': [],
            'negative_scores': [],
            'neutral_scores': [],
            'interaction_counts': []
        }

def get_today_emotion_trends(user_email):
    """獲取今日按小時的情緒趨勢數據"""
    try:
        # 獲取今日數據
        today = datetime.now().date()
        start_date = datetime.combine(today, datetime.min.time())
        end_date = datetime.combine(today, datetime.max.time())
        
        records = get_user_emotion_history(user_email, start_date, end_date)
        
        # 按小時分組統計
        hourly_data = defaultdict(lambda: {'emotions': Counter(), 'positive': 0, 'negative': 0})
        
        # 定義正向和負面情緒
        positive_emotions = ['開心', '快樂', '喜悅', '平靜', '放鬆', '友善', '理解', '自在', '滿足', '愉快', '輕鬆', '舒適', '安心', '希望', '感激', '興奮', '滿意', '溫暖']
        negative_emotions = ['悲傷', '難過', '憂鬱', '焦慮', '緊張', '擔心', '憤怒', '生氣', '壓力', '煩躁', '不安', '沮喪', '失望', '恐懼', '害怕', '痛苦', '疲憊', '厭煩', '孤單', '無助', '煩惱', '挫折']
        
        for record in records:
            record_hour = record['created_at'].hour
            hour_key = f"{record_hour:02d}:00"
            
            # 統計情緒
            if record['user_emotions'] and 'primary_emotions' in record['user_emotions']:
                emotions = record['user_emotions']['primary_emotions']
                if emotions:
                    dominant = emotions[0]['emotion']
                    hourly_data[hour_key]['emotions'][dominant] += 1
                    
                    # 分類正向/負面情緒 - 更新分類列表
                    positive_emotions = ['開心', '快樂', '喜悅', '平靜', '放鬆', '友善', '理解', '自在', '滿足', '愉快', '輕鬆', '舒適', '安心', '希望', '感激', '興奮', '滿意', '溫暖']
                    negative_emotions = ['悲傷', '難過', '憂鬱', '焦慮', '緊張', '擔心', '憤怒', '生氣', '壓力', '煩躁', '不安', '沮喪', '失望', '恐懼', '害怕', '痛苦', '疲憊', '厭煩', '孤單', '無助', '煩惱', '挫折']
                    
                    if dominant in positive_emotions:
                        hourly_data[hour_key]['positive'] += 1
                    elif dominant in negative_emotions:
                        hourly_data[hour_key]['negative'] += 1
        
        # 生成24小時的完整趨勢數據
        trend_data = {
            'dates': [],
            'dominant_emotions': [],
            'positive_counts': [],
            'negative_counts': [],
            'interaction_counts': []
        }
        
        # 填充24小時的數據
        for hour in range(24):
            hour_key = f"{hour:02d}:00"
            trend_data['dates'].append(hour_key)
            
            if hour_key in hourly_data:
                hour_data = hourly_data[hour_key]
                
                # 主導情緒
                if hour_data['emotions']:
                    dominant = hour_data['emotions'].most_common(1)[0][0]
                    trend_data['dominant_emotions'].append(dominant)
                else:
                    trend_data['dominant_emotions'].append('無數據')
                
                # 正向和負面情緒數量
                trend_data['positive_counts'].append(hour_data['positive'])
                trend_data['negative_counts'].append(hour_data['negative'])
                
                # 互動次數
                trend_data['interaction_counts'].append(sum(hour_data['emotions'].values()))
            else:
                trend_data['dominant_emotions'].append('無數據')
                trend_data['positive_counts'].append(0)
                trend_data['negative_counts'].append(0)
                trend_data['interaction_counts'].append(0)
        
        return trend_data
        
    except Exception as e:
        safe_log(f"獲取今日情緒趨勢失敗: {str(e)}")
        return {
            'dates': [],
            'dominant_emotions': [],
            'positive_counts': [],
            'negative_counts': [],
            'interaction_counts': []
        }

def get_emotion_distribution(user_email, days=7, today_only=False):
    """獲取情緒分布數據 - 基於百分比統計"""
    try:
        if today_only:
            # 只統計今天的數據
            today = datetime.now().date()
            start_date = datetime.combine(today, datetime.min.time())
            end_date = datetime.combine(today, datetime.max.time())
        else:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
        
        records = get_user_emotion_history(user_email, start_date, end_date)
        
        total_positive_percentage = 0
        total_negative_percentage = 0
        total_neutral_percentage = 0
        total_records = 0
        
        for record in records:
            if record['user_emotions'] and 'primary_emotions' in record['user_emotions']:
                emotions_list = record['user_emotions']['primary_emotions']
                if emotions_list:
                    # 處理emotions_list中的每個情緒
                    for emotion_data in emotions_list:
                        emotion_type, percentage = extract_emotion_type_and_percentage(emotion_data)
                        
                        if emotion_type and percentage > 0:
                            if emotion_type == 'positive':
                                total_positive_percentage += percentage
                            elif emotion_type == 'negative':
                                total_negative_percentage += percentage
                            else:  # neutral or unknown
                                total_neutral_percentage += percentage
                    
                    total_records += 1
        
        # 準備分布數據
        distribution_data = {
            'labels': [],
            'data': [],
            'colors': []
        }
        
        if total_records > 0:
            # 計算平均百分比
            avg_positive = round(total_positive_percentage / total_records, 1)
            avg_negative = round(total_negative_percentage / total_records, 1)
            avg_neutral = round(total_neutral_percentage / total_records, 1)
            
            if avg_positive > 0:
                distribution_data['labels'].append('正向情緒')
                distribution_data['data'].append(avg_positive)
                distribution_data['colors'].append('#32CD32')  # 綠色
            
            if avg_negative > 0:
                distribution_data['labels'].append('負面情緒')
                distribution_data['data'].append(avg_negative)
                distribution_data['colors'].append('#FF6347')  # 紅色
            
            if avg_neutral > 0:
                distribution_data['labels'].append('中性/其他')
                distribution_data['data'].append(avg_neutral)
                distribution_data['colors'].append('#808080')  # 灰色
        
        return distribution_data
        
    except Exception as e:
        safe_log(f"獲取情緒分布失敗: {str(e)}")
        return {
            'labels': [],
            'data': [],
            'colors': []
        }

# ==================== Flask 路由處理 ====================

@emo_stats_bp.route('/emo_stats')
@login_required
def emo_stats_page():
    """情緒洞察主頁面"""
    safe_log(f"用戶 {current_user.id} 進入情緒洞察頁面")
    
    # 獲取用戶頭像（沿用emotion_ai的邏輯）
    try:
        from utils.db import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT User_Avatar FROM User WHERE User_Email = %s", (current_user.id,))
        user_data = cursor.fetchone()
        user_avatar = user_data[0] if user_data and user_data[0] else None
        cursor.close()
        conn.close()
        
        if user_avatar and not user_avatar.startswith(('http://', 'https://', '/')):
            user_avatar = f'/static/icons/avatars/{user_avatar}'
    except Exception as e:
        safe_log(f"獲取用戶頭像失敗: {str(e)}")
        user_avatar = None
    
    return render_template("ai/emo_stats.html", user_avatar=user_avatar)

@emo_stats_bp.route('/emo_stats/api/summary')
@login_required
def api_emotion_summary():
    """獲取情緒統計摘要API"""
    try:
        days_param = request.args.get('days', 7)
        
        # 支持"today"字符串和數字
        if days_param == 'today' or days_param == '0':
            # 今日摘要使用today_only參數
            summary = calculate_emotion_summary(current_user.id, today_only=True)
        else:
            days = int(days_param)
            summary = calculate_emotion_summary(current_user.id, days)
        
        return jsonify({
            'success': True,
            'summary': summary
        })
        
    except Exception as e:
        safe_log(f"情緒摘要API錯誤: {str(e)}")
        return jsonify({'error': f'獲取統計摘要失敗: {str(e)}'}), 500

@emo_stats_bp.route('/emo_stats/api/trends')
@login_required
def api_emotion_trends():
    """獲取情緒趨勢API"""
    try:
        days_param = request.args.get('days', 7)
        
        # 支持"today"字符串和數字
        if days_param == 'today' or days_param == '0':
            trends = get_today_emotion_trends(current_user.id)
        else:
            days = int(days_param)
            trends = get_emotion_trends(current_user.id, days)
        
        return jsonify({
            'success': True,
            'trends': trends
        })
        
    except Exception as e:
        safe_log(f"情緒趨勢API錯誤: {str(e)}")
        return jsonify({'error': f'獲取情緒趨勢失敗: {str(e)}'}), 500

@emo_stats_bp.route('/emo_stats/api/distribution')
@login_required
def api_emotion_distribution():
    """獲取情緒分布API"""
    try:
        days_param = request.args.get('days', 7)
        
        # 支持"today"字符串和數字
        if days_param == 'today' or days_param == '0':
            distribution = get_emotion_distribution(current_user.id, today_only=True)
        else:
            days = int(days_param)
            distribution = get_emotion_distribution(current_user.id, days)
        
        return jsonify({
            'success': True,
            'distribution': distribution
        })
        
    except Exception as e:
        safe_log(f"情緒分布API錯誤: {str(e)}")
        return jsonify({'error': f'獲取情緒分布失敗: {str(e)}'}), 500

@emo_stats_bp.route('/emo_stats/api/history')
@login_required
def api_emotion_history():
    """獲取情緒歷史記錄API"""
    try:
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        records = get_user_emotion_history(current_user.id, start_date, end_date, limit)
        
        # 簡化記錄格式用於前端顯示
        simplified_records = []
        for record in records:
            simplified = {
                'id': record['id'],
                'date': record['created_at'].strftime('%Y-%m-%d %H:%M'),
                'dominant_emotion': '未知',
                'confidence': record['confidence_score'],
                'overall_tone': record['overall_tone'],
                'message_preview': record['message_content'][:50] + '...' if record['message_content'] else '無內容'
            }
            
            # 提取主導情緒
            if record['user_emotions'] and 'primary_emotions' in record['user_emotions']:
                emotions = record['user_emotions']['primary_emotions']
                if emotions:
                    simplified['dominant_emotion'] = emotions[0]['emotion']
            
            simplified_records.append(simplified)
        
        return jsonify({
            'success': True,
            'history': simplified_records,
            'total_count': len(simplified_records)
        })
        
    except Exception as e:
        safe_log(f"情緒歷史API錯誤: {str(e)}")
        return jsonify({'error': f'獲取情緒歷史失敗: {str(e)}'}), 500

@emo_stats_bp.route('/emo_stats/health')
def emotion_stats_health_check():
    """情緒統計健康檢查端點"""
    return jsonify({'status': 'healthy', 'service': '情緒洞察統計服務'})

# -*- coding: utf-8 -*-
"""
用戶等級系統

提供完整的用戶等級管理功能：
- 等級計算和升級邏輯
- 積分統計和進度追蹤
- 等級歷史記錄管理
- 升級通知機制

等級制度：
1. 🌱 新手村民 (0分) - 社群新人
2. 🌿 活躍居民 (100分) - 開始參與
3. 🌳 熱心分享者 (300分) - 積極分享
4. ⭐ 社群達人 (600分) - 知名用戶  
5. 🏆 內容創作者 (1000分) - 優質創作
6. 👑 社群領袖 (1500分) - 意見領袖
7. 💎 傳奇貢獻者 (2500分) - 傳奇人物

積分計算公式：
總積分 = (發文數量 × 10) + (獲讚數量 × 3) + (評論數量 × 5) + (登入天數 × 2)
"""

from datetime import datetime, date
import pymysql


class UserLevelSystem:
    """用戶等級系統"""
    
    # 等級配置
    LEVEL_CONFIG = {
        1: {
            'title': '新手村民',
            'emoji': '🌱',
            'color': '#95a5a6',
            'bg_color': '#ecf0f1',
            'min_points': 0,
            'description': '剛加入社群的新朋友，開始探索社群的奇妙世界',
            'privileges': ['基礎發文', '點讚評論', '查看貼文']
        },
        2: {
            'title': '活躍居民', 
            'emoji': '🌿',
            'color': '#27ae60',
            'bg_color': '#d5f4e6',
            'min_points': 100,
            'description': '開始活躍的社群成員，積極參與討論互動',
            'privileges': ['圖片上傳', '表情回應', '分享轉發']
        },
        3: {
            'title': '熱心分享者',
            'emoji': '🌳', 
            'color': '#2ecc71',
            'bg_color': '#d4edda',
            'min_points': 300,
            'description': '熱愛分享的活躍用戶，為社群帶來豐富內容',
            'privileges': ['置頂留言', '話題標籤', '私訊功能']
        },
        4: {
            'title': '社群達人',
            'emoji': '⭐',
            'color': '#f39c12',
            'bg_color': '#fff3cd',
            'min_points': 600,
            'description': '社群中的知名人物，影響力日益增長',
            'privileges': ['推薦貼文', '活動發起', '用戶認證']
        },
        5: {
            'title': '內容創作者',
            'emoji': '🏆',
            'color': '#e67e22',
            'bg_color': '#fdebd0',
            'min_points': 1000,
            'description': '優質內容的創造者，創作具有獨特價值',
            'privileges': ['專屬標籤', '內容推廣', '創作獎勵']
        },
        6: {
            'title': '社群領袖',
            'emoji': '👑',
            'color': '#9b59b6',
            'bg_color': '#e8d5f0',
            'min_points': 1500,
            'description': '社群中的意見領袖，引領社群發展方向',
            'privileges': ['管理權限', '版主協助', '活動主辦']
        },
        7: {
            'title': '傳奇貢獻者',
            'emoji': '💎',
            'color': '#3498db',
            'bg_color': '#d1ecf1',
            'min_points': 2500,
            'description': '社群的傳奇人物，留下不朽的貢獻足跡',
            'privileges': ['全部權限', '榮譽徽章', '終身會員']
        }
    }
    
    @classmethod
    def calculate_points(cls, posts_count=0, likes_received=0, comments_made=0, login_days=0):
        """
        計算用戶總積分
        
        Args:
            posts_count (int): 發文數量
            likes_received (int): 獲得讚數
            comments_made (int): 發表評論數
            login_days (int): 登入天數
            
        Returns:
            int: 總積分
        """
        return (posts_count * 10) + (likes_received * 3) + (comments_made * 5) + (login_days * 2)
    
    @classmethod
    def get_level_by_points(cls, points):
        """
        根據積分獲取等級
        
        Args:
            points (int): 用戶積分
            
        Returns:
            int: 用戶等級 (1-7)
        """
        for level in range(7, 0, -1):
            if points >= cls.LEVEL_CONFIG[level]['min_points']:
                return level
        return 1
    
    @classmethod
    def get_level_info(cls, level):
        """
        獲取等級信息
        
        Args:
            level (int): 等級
            
        Returns:
            dict: 等級詳細信息
        """
        return cls.LEVEL_CONFIG.get(level, cls.LEVEL_CONFIG[1])
    
    @classmethod
    def get_next_level_info(cls, current_level):
        """
        獲取下一等級信息
        
        Args:
            current_level (int): 當前等級
            
        Returns:
            dict or None: 下一等級信息，如果已是最高等級則返回 None
        """
        next_level = min(current_level + 1, 7)
        if next_level == current_level:
            return None
        return cls.LEVEL_CONFIG[next_level]
    
    @classmethod
    def calculate_progress_to_next_level(cls, current_points, current_level):
        """
        計算到下一等級的進度
        
        Args:
            current_points (int): 當前積分
            current_level (int): 當前等級
            
        Returns:
            float: 進度百分比 (0-100)
        """
        if current_level >= 7:
            return 100.0
        
        current_min = cls.LEVEL_CONFIG[current_level]['min_points']
        next_min = cls.LEVEL_CONFIG[current_level + 1]['min_points']
        
        if current_points >= next_min:
            return 100.0
        
        progress = ((current_points - current_min) / (next_min - current_min)) * 100
        return max(0.0, min(100.0, progress))
    
    @classmethod
    def get_all_levels(cls):
        """
        獲取所有等級信息
        
        Returns:
            dict: 所有等級的詳細信息
        """
        return cls.LEVEL_CONFIG
    
    @classmethod
    def get_points_needed_for_next_level(cls, current_points, current_level):
        """
        計算升到下一等級需要的積分
        
        Args:
            current_points (int): 當前積分
            current_level (int): 當前等級
            
        Returns:
            int: 需要的積分數，如果已是最高等級則返回 0
        """
        if current_level >= 7:
            return 0
        
        next_min = cls.LEVEL_CONFIG[current_level + 1]['min_points']
        return max(0, next_min - current_points)


def update_user_level_and_stats(user_email, db_connection=None):
    """
    更新用戶等級和統計數據
    
    Args:
        user_email (str): 用戶郵箱
        db_connection: 資料庫連接（可選）
        
    Returns:
        dict: 更新結果包含等級變化信息
    """
    from utils.db import get_connection
    
    connection = db_connection or get_connection()
    should_close = db_connection is None
    
    try:
        cursor = connection.cursor()
        
        # 計算用戶統計數據
        # 1. 發文數量
        cursor.execute("SELECT COUNT(*) FROM Posts WHERE User_Email = %s AND Is_public = TRUE", (user_email,))
        posts_count = cursor.fetchone()[0]
        
        # 2. 獲得的讚數
        cursor.execute("""
            SELECT COUNT(*) FROM Likes l 
            JOIN Posts p ON l.Post_id = p.Post_id 
            WHERE p.User_Email = %s AND p.Is_public = TRUE
        """, (user_email,))
        likes_received = cursor.fetchone()[0]
        
        # 3. 發表的評論數
        cursor.execute("SELECT COUNT(*) FROM Comments WHERE User_Email = %s", (user_email,))
        comments_made = cursor.fetchone()[0]
        
        # 4. 登入天數（簡化處理，基於註冊時間計算）
        cursor.execute("SELECT DATEDIFF(NOW(), Created_at) + 1 FROM User WHERE User_Email = %s", (user_email,))
        result = cursor.fetchone()
        login_days = result[0] if result else 1
        
        # 計算總積分
        total_points = UserLevelSystem.calculate_points(posts_count, likes_received, comments_made, login_days)
        
        # 計算等級
        new_level = UserLevelSystem.get_level_by_points(total_points)
        
        # 獲取當前等級
        cursor.execute("SELECT user_level FROM User WHERE User_Email = %s", (user_email,))
        result = cursor.fetchone()
        old_level = result[0] if result else 1
        
        # 更新用戶數據
        cursor.execute("""
            UPDATE User SET 
                user_level = %s,
                user_points = %s,
                posts_count = %s,
                likes_received = %s,
                comments_made = %s,
                login_days = %s,
                last_level_update = %s
            WHERE User_Email = %s
        """, (new_level, total_points, posts_count, likes_received, comments_made, login_days, datetime.now(), user_email))
        
        # 如果等級提升，記錄歷史
        if new_level > old_level:
            old_info = UserLevelSystem.get_level_info(old_level)
            new_info = UserLevelSystem.get_level_info(new_level)
            
            cursor.execute("""
                INSERT INTO UserLevelHistory 
                (user_email, old_level, new_level, old_title, new_title, points_earned, reason)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_email, old_level, new_level, old_info['title'], new_info['title'], total_points, '發文活動'))
        
        connection.commit()
        
        return {
            'success': True,
            'level_changed': new_level > old_level,
            'old_level': old_level,
            'new_level': new_level,
            'total_points': total_points,
            'stats': {
                'posts_count': posts_count,
                'likes_received': likes_received,
                'comments_made': comments_made,
                'login_days': login_days
            }
        }
        
    except Exception as e:
        print(f"更新用戶等級錯誤: {e}")
        return {'success': False, 'error': str(e)}
    finally:
        if should_close:
            connection.close()


def get_user_level_info(user_email, db_connection=None):
    """
    獲取用戶完整等級信息
    
    Args:
        user_email (str): 用戶郵箱
        db_connection: 資料庫連接（可選）
        
    Returns:
        dict: 用戶等級詳細信息
    """
    from utils.db import get_connection
    
    connection = db_connection or get_connection()
    should_close = db_connection is None
    
    try:
        cursor = connection.cursor()
        
        # 先更新用戶數據確保最新
        update_result = update_user_level_and_stats(user_email, connection)
        
        if not update_result['success']:
            return {'success': False, 'message': '獲取用戶信息失敗'}
        
        cursor.execute("""
            SELECT user_level, user_points, posts_count, likes_received, 
                   comments_made, login_days 
            FROM User WHERE User_Email = %s
        """, (user_email,))
        
        result = cursor.fetchone()
        
        if result:
            level, points, posts, likes, comments, days = result
            level_info = UserLevelSystem.get_level_info(level)
            next_level_info = UserLevelSystem.get_next_level_info(level)
            progress = UserLevelSystem.calculate_progress_to_next_level(points, level)
            
            response_data = {
                'success': True,
                'current_level': {
                    'level': level,
                    'title': level_info['title'],
                    'emoji': level_info['emoji'],
                    'color': level_info['color'],
                    'bg_color': level_info['bg_color'],
                    'description': level_info['description'],
                    'privileges': level_info['privileges']
                },
                'points': points,
                'progress_to_next': round(progress, 1),
                'stats': {
                    'posts_count': posts,
                    'likes_received': likes,
                    'comments_made': comments,
                    'login_days': days
                }
            }
            
            if next_level_info:
                response_data['next_level'] = {
                    'title': next_level_info['title'],
                    'emoji': next_level_info['emoji'],
                    'min_points': next_level_info['min_points'],
                    'points_needed': UserLevelSystem.get_points_needed_for_next_level(points, level)
                }
            
            return response_data
        
        return {'success': False, 'message': '找不到用戶信息'}
        
    except Exception as e:
        print(f"獲取用戶等級信息錯誤: {e}")
        return {'success': False, 'message': '獲取等級信息失敗'}
    finally:
        if should_close:
            connection.close()

"""
門診預約服務模組

提供門診預約相關的功能，包括：
- 預約表單頁面
- 預約提交處理
- 預約紀錄查詢
- 預約狀態管理

作者：AI Assistant
日期：2025-07-26
"""

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from datetime import datetime
import uuid

# 創建 Blueprint
clinic_bp = Blueprint('clinic', __name__)

# 假資料：醫院和醫師
HOSPITAL_DATA = {
    'hospital1': {
        'name': '衛生福利部桃園醫院',
        'doctors': [
            {'value': 'doctor1', 'name': '王志明醫師 - 兒童發展評估中心'},
            {'value': 'doctor2', 'name': '李佳玲醫師 - 物理治療科'},
            {'value': 'doctor3', 'name': '陳美華醫師 - 職能治療科'}
        ]
    },
    'hospital2': {
        'name': '敏盛醫院三民院區',
        'doctors': [
            {'value': 'doctor4', 'name': '李美華醫師 - 聯合評估科'},
            {'value': 'doctor5', 'name': '張建宏醫師 - 心理輔導科'},
            {'value': 'doctor6', 'name': '林秀英醫師 - 聽覺評估科'}
        ]
    },
    'hospital3': {
        'name': '立倫診所',
        'doctors': [
            {'value': 'doctor7', 'name': '張志強醫師 - 職能治療科'},
            {'value': 'doctor8', 'name': '劉佩君醫師 - 語言治療科'},
            {'value': 'doctor9', 'name': '吳志明醫師 - 物理治療科'}
        ]
    },
    'hospital4': {
        'name': '林口長庚紀念醫院',
        'doctors': [
            {'value': 'doctor10', 'name': '王小明醫師 - 兒童發展評估中心'},
            {'value': 'doctor11', 'name': '鄭國華醫師 - 藝術治療科'},
            {'value': 'doctor12', 'name': '許美玲醫師 - 音樂治療科'}
        ]
    },
    'hospital5': {
        'name': '兒童發展復健站（大溪區）',
        'doctors': [
            {'value': 'doctor13', 'name': '林惠美醫師 - 語言治療科'},
            {'value': 'doctor14', 'name': '黃淑雯醫師 - 職能治療科'},
            {'value': 'doctor15', 'name': '陳志豪醫師 - 物理治療科'}
        ]
    }
}

# 假資料：已預約紀錄
APPOINTMENT_RECORDS = [
    # 衛生福利部桃園醫院的預約紀錄
    {
        'id': '#APT001',
        'hospital': '衛生福利部桃園醫院',
        'doctor': '王志明醫師',
        'datetime': '2025-07-30 09:00',
        'status': 'confirmed',
        'parent_name': '張家長',
        'child_name': '張小明',
        'child_age': '8',
        'contact_phone': '0912345678',
        'symptoms': '注意力不集中，學習困難，需要兒童發展聯合評估',
        'diary_permission': True,
        'created_at': '2025-07-25 14:30'
    },
    {
        'id': '#APT002',
        'hospital': '衛生福利部桃園醫院',
        'doctor': '李佳玲醫師',
        'datetime': '2025-08-01 10:30',
        'status': 'pending',
        'parent_name': '陳家長',
        'child_name': '陳小華',
        'child_age': '6',
        'contact_phone': '0987654321',
        'symptoms': '肌肉張力不足，需要物理治療評估',
        'diary_permission': False,
        'created_at': '2025-07-26 11:20'
    },
    {
        'id': '#APT003',
        'hospital': '衛生福利部桃園醫院',
        'doctor': '陳美華醫師',
        'datetime': '2025-07-28 14:00',
        'status': 'completed',
        'parent_name': '劉家長',
        'child_name': '劉小美',
        'child_age': '7',
        'contact_phone': '0965432187',
        'symptoms': '精細動作發展遲緩，需要職能治療評估',
        'diary_permission': True,
        'created_at': '2025-07-20 16:45'
    },
    
    # 敏盛醫院三民院區的預約紀錄
    {
        'id': '#APT004',
        'hospital': '敏盛醫院三民院區',
        'doctor': '李美華醫師',
        'datetime': '2025-08-05 14:30',
        'status': 'pending',
        'parent_name': '李家長',
        'child_name': '李小美',
        'child_age': '6',
        'contact_phone': '0987654321',
        'symptoms': '社交困難，情緒起伏大，需要心理輔導和聽覺評估',
        'diary_permission': True,
        'created_at': '2025-07-26 09:15'
    },
    {
        'id': '#APT005',
        'hospital': '敏盛醫院三民院區',
        'doctor': '張建宏醫師',
        'datetime': '2025-08-03 16:00',
        'status': 'confirmed',
        'parent_name': '黃家長',
        'child_name': '黃小安',
        'child_age': '5',
        'contact_phone': '0923456789',
        'symptoms': '焦慮情緒，需要心理輔導評估',
        'diary_permission': True,
        'created_at': '2025-07-25 13:30'
    },
    {
        'id': '#APT006',
        'hospital': '敏盛醫院三民院區',
        'doctor': '林秀英醫師',
        'datetime': '2025-07-29 11:00',
        'status': 'cancelled',
        'parent_name': '吳家長',
        'child_name': '吳小強',
        'child_age': '4',
        'contact_phone': '0911223344',
        'symptoms': '聽力篩檢，疑似聽覺障礙',
        'diary_permission': False,
        'created_at': '2025-07-24 10:15'
    },
    
    # 立倫診所的預約紀錄
    {
        'id': '#APT007',
        'hospital': '立倫診所',
        'doctor': '張志強醫師',
        'datetime': '2025-07-20 10:00',
        'status': 'completed',
        'parent_name': '王家長',
        'child_name': '王小寶',
        'child_age': '7',
        'contact_phone': '0911223344',
        'symptoms': '語言發展遲緩，需要語言治療和藝術治療評估',
        'diary_permission': True,
        'created_at': '2025-07-24 11:20'
    },
    {
        'id': '#APT008',
        'hospital': '立倫診所',
        'doctor': '劉佩君醫師',
        'datetime': '2025-08-06 15:30',
        'status': 'pending',
        'parent_name': '林家長',
        'child_name': '林小雯',
        'child_age': '6',
        'contact_phone': '0932165487',
        'symptoms': '構音障礙，語言表達困難',
        'diary_permission': True,
        'created_at': '2025-07-26 14:20'
    },
    
    # 林口長庚紀念醫院的預約紀錄
    {
        'id': '#APT009',
        'hospital': '林口長庚紀念醫院',
        'doctor': '王小明醫師',
        'datetime': '2025-08-08 09:30',
        'status': 'confirmed',
        'parent_name': '鄭家長',
        'child_name': '鄭小剛',
        'child_age': '9',
        'contact_phone': '0945678912',
        'symptoms': '注意力不足過動症，需要綜合評估',
        'diary_permission': True,
        'created_at': '2025-07-25 17:00'
    },
    {
        'id': '#APT010',
        'hospital': '林口長庚紀念醫院',
        'doctor': '鄭國華醫師',
        'datetime': '2025-08-04 14:00',
        'status': 'pending',
        'parent_name': '許家長',
        'child_name': '許小芳',
        'child_age': '5',
        'contact_phone': '0956789123',
        'symptoms': '情緒調節困難，需要藝術治療',
        'diary_permission': False,
        'created_at': '2025-07-26 12:45'
    },
    
    # 兒童發展復健站（大溪區）的預約紀錄
    {
        'id': '#APT011',
        'hospital': '兒童發展復健站（大溪區）',
        'doctor': '林惠美醫師',
        'datetime': '2025-08-02 16:00',
        'status': 'pending',
        'parent_name': '黃家長',
        'child_name': '黃小安',
        'child_age': '5',
        'contact_phone': '0923456789',
        'symptoms': '構音障礙，口語表達能力不佳，需要語言治療',
        'diary_permission': True,
        'created_at': '2025-07-26 10:45'
    },
    {
        'id': '#APT012',
        'hospital': '兒童發展復健站（大溪區）',
        'doctor': '黃淑雯醫師',
        'datetime': '2025-08-07 13:30',
        'status': 'confirmed',
        'parent_name': '周家長',
        'child_name': '周小明',
        'child_age': '6',
        'contact_phone': '0967890234',
        'symptoms': '手眼協調困難，需要職能治療',
        'diary_permission': True,
        'created_at': '2025-07-25 09:30'
    }
]

@clinic_bp.route('/appointment')
@login_required
def appointment_page():
    """
    門診預約頁面
    
    顯示預約表單和已預約紀錄
    
    Returns:
        str: 渲染後的 HTML 頁面
    """
    return render_template(
        'clinic/appointment.html',
        hospital_data=HOSPITAL_DATA,
        appointment_records=APPOINTMENT_RECORDS
    )

@clinic_bp.route('/history')
@login_required
def appointment_history():
    """
    預約紀錄頁面
    
    顯示所有預約紀錄和統計資訊
    
    Returns:
        str: 渲染後的 HTML 頁面
    """
    return render_template(
        'clinic/appointment_history.html',
        appointment_records=APPOINTMENT_RECORDS
    )

@clinic_bp.route('/api/doctors/<hospital_id>')
@login_required
def get_doctors(hospital_id):
    """
    獲取指定醫院的醫師列表
    
    Args:
        hospital_id (str): 醫院 ID
        
    Returns:
        JSON: 醫師列表
    """
    try:
        if hospital_id in HOSPITAL_DATA:
            doctors = HOSPITAL_DATA[hospital_id]['doctors']
            return jsonify({
                'success': True,
                'doctors': doctors
            })
        else:
            return jsonify({
                'success': False,
                'message': '找不到指定的醫院'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'獲取醫師列表失敗：{str(e)}'
        }), 500

@clinic_bp.route('/api/appointment', methods=['POST'])
@login_required
def submit_appointment():
    """
    提交門診預約
    
    處理預約表單提交，驗證資料並儲存預約記錄
    
    Returns:
        JSON: 提交結果
    """
    try:
        # 獲取表單資料
        data = request.get_json()
        
        # 基本驗證
        required_fields = [
            'hospital', 'doctor', 'date', 'time',
            'parent_name', 'contact_phone', 'child_name', 'child_age'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'缺少必填欄位：{field}'
                }), 400
        
        # 電話號碼格式驗證
        phone = data.get('contact_phone', '').strip()
        if not _validate_phone(phone):
            return jsonify({
                'success': False,
                'message': '請輸入正確的電話號碼格式'
            }), 400
        
        # 日期驗證
        appointment_date = data.get('date')
        if not _validate_date(appointment_date):
            return jsonify({
                'success': False,
                'message': '預約日期不能早於今天'
            }), 400
        
        # 生成預約編號
        appointment_id = _generate_appointment_id()
        
        # 獲取醫院和醫師名稱
        hospital_info = _get_hospital_info(data.get('hospital'))
        doctor_info = _get_doctor_info(data.get('hospital'), data.get('doctor'))
        
        if not hospital_info or not doctor_info:
            return jsonify({
                'success': False,
                'message': '無效的醫院或醫師選擇'
            }), 400
        
        # 創建預約記錄
        appointment_record = {
            'id': appointment_id,
            'user_id': current_user.id,
            'hospital': hospital_info['name'],
            'doctor': doctor_info['name'],
            'datetime': f"{data.get('date')} {data.get('time')}",
            'status': 'pending',  # 預設為待確認
            'parent_name': data.get('parent_name'),
            'child_name': data.get('child_name'),
            'child_age': data.get('child_age'),
            'contact_phone': data.get('contact_phone'),
            'symptoms': data.get('symptoms', ''),
            'diary_permission': data.get('diary_permission', False),
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M')
        }
        
        # 在實際應用中，這裡應該將記錄儲存到資料庫
        # 目前只是添加到記憶體中的假資料列表
        APPOINTMENT_RECORDS.insert(0, appointment_record)
        
        # 格式化回傳資料
        datetime_str = f"{data.get('date')} {data.get('time')}-{_get_time_slot_end(data.get('time'))}"
        
        return jsonify({
            'success': True,
            'message': '預約提交成功！',
            'appointment': {
                'id': appointment_id,
                'hospital': hospital_info['name'],
                'doctor': doctor_info['name'],
                'datetime': datetime_str
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'預約提交失敗：{str(e)}'
        }), 500

@clinic_bp.route('/api/appointment/<appointment_id>')
@login_required
def get_appointment(appointment_id):
    """
    獲取預約詳情
    
    Args:
        appointment_id (str): 預約編號
        
    Returns:
        JSON: 預約詳情
    """
    try:
        # 查找預約記錄
        appointment = None
        for record in APPOINTMENT_RECORDS:
            if record['id'] == appointment_id:
                appointment = record
                break
        
        if not appointment:
            return jsonify({
                'success': False,
                'message': '找不到指定的預約記錄'
            }), 404
        
        return jsonify({
            'success': True,
            'appointment': appointment
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'獲取預約詳情失敗：{str(e)}'
        }), 500

@clinic_bp.route('/api/appointment/<appointment_id>/cancel', methods=['POST'])
@login_required
def cancel_appointment(appointment_id):
    """
    取消預約
    
    Args:
        appointment_id (str): 預約編號
        
    Returns:
        JSON: 取消結果
    """
    try:
        # 查找並更新預約記錄
        for record in APPOINTMENT_RECORDS:
            if record['id'] == appointment_id:
                # 檢查是否為當前用戶的預約（在實際應用中）
                record['status'] = 'cancelled'
                record['cancelled_at'] = datetime.now().strftime('%Y-%m-%d %H:%M')
                
                return jsonify({
                    'success': True,
                    'message': '預約已成功取消'
                })
        
        return jsonify({
            'success': False,
            'message': '找不到指定的預約記錄'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'取消預約失敗：{str(e)}'
        }), 500

# 輔助函數
def _validate_phone(phone):
    """驗證電話號碼格式"""
    import re
    phone_pattern = r'^09\d{8}$|^0\d{1,2}-?\d{6,8}$'
    return bool(re.match(phone_pattern, phone))

def _validate_date(date_str):
    """驗證預約日期不能早於今天"""
    try:
        appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = datetime.now().date()
        return appointment_date >= today
    except ValueError:
        return False

def _generate_appointment_id():
    """生成預約編號"""
    timestamp = str(int(datetime.now().timestamp()))[-6:]
    return f"#APT{timestamp}"

def _get_hospital_info(hospital_id):
    """獲取醫院資訊"""
    return HOSPITAL_DATA.get(hospital_id)

def _get_doctor_info(hospital_id, doctor_id):
    """獲取醫師資訊"""
    hospital = HOSPITAL_DATA.get(hospital_id)
    if not hospital:
        return None
    
    for doctor in hospital['doctors']:
        if doctor['value'] == doctor_id:
            return doctor
    return None

def _get_time_slot_end(start_time):
    """計算時段結束時間"""
    try:
        hours, minutes = map(int, start_time.split(':'))
        end_minutes = minutes + 30
        end_hours = hours + (end_minutes // 60)
        end_minutes = end_minutes % 60
        return f"{end_hours:02d}:{end_minutes:02d}"
    except:
        return "未知"

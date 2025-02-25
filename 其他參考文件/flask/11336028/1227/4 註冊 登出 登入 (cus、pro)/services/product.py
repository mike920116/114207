# 匯入模組
from flask import request, render_template
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask import Blueprint
from utils import db

# 產生客戶服務藍圖
product_bp = Blueprint('product_bp', __name__)

#客戶清單
@product_bp.route('/list')
@login_required
def product_list(): 
    #取得資料庫連線 
    connection = db.get_connection() 
    
    #產生執行sql命令的物件   
    cursor = connection.cursor() 
    
    #執行SQL    
    cursor.execute('SELECT prono, proname, price FROM product order by prono;')
    
    #取回SQL執行後的所有資料
    data = cursor.fetchall()
    
    #設定參數, 準備傳給網頁
    if data:
        #如果有資料
        params = [{'prono': d[0], 'proname': d[1], 'price': d[2]} for d in data]
    else:
        #如果無資料
        params = None
          
    #關閉資料庫連線    
    connection.close() 
    
    #將參數送給網頁, 讓資料嵌入網頁中  
    return render_template('/product/list.html', data=params)
#-----------------------
# 匯入flask及db模組
#-----------------------
from flask import Flask, render_template
import db

#-----------------------
# 產生一個Flask網站物件
#-----------------------
app = Flask(__name__)

#-----------------------
# 在網站中定義路由
#-----------------------
#主畫面
@app.route('/')
def index():
    return render_template('index.html') 

#客戶清單
@app.route('/customer/list')
def customer_list(): 
    #取得資料庫連線 
    connection = db.get_connection() 
    
    #產生執行sql命令的物件   
    cursor = connection.cursor() 
    
    #執行SQL

    sql = '''
            SELECT 
                product.prono, 
                product.proname, 
                product.supno, 
                supplier.supname, 
                product.typno, 
                protype.typname
            FROM 
                product
            JOIN 
                supplier ON product.supno = supplier.supno
            JOIN 
                protype ON product.typno = protype.typno;
          '''   
     
    cursor.execute(sql)
    
    #取回SQL執行後的所有資料
    data = cursor.fetchall()
    
    #設定參數, 準備傳給網頁
    if data:
        #如果有資料
        params = [{'prono': d[0], 'proname': d[1], 'supno': d[2], 'supname': d[3],'typno':d[4],'typname':d[5]} for d in data]
    else:
        #如果無資料
        params = None
          
    #關閉資料庫連線    
    connection.close() 
    
    #將參數送給網頁, 讓資料嵌入網頁中  
    return render_template('/customer/list.html', data=params)

#-----------------------
# 啟動Flask網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)
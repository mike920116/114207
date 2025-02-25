#-----------------------
# 匯入模組
#-----------------------
from flask import Flask, render_template, request
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
    cursor.execute('SELECT cusno, cusname, address, tel FROM customer order by cusno;')
    
    #取回SQL執行後的所有資料
    data = cursor.fetchall()
    
    #設定參數, 準備傳給網頁
    if data:
        #如果有資料
        params = [{'cusno': d[0], 'cusname': d[1], 'address': d[2], 'tel': d[3]} for d in data]
    else:
        #如果無資料
        params = None
          
    #關閉資料庫連線    
    connection.close() 
    
    #將參數送給網頁, 讓資料嵌入網頁中  
    return render_template('/customer/list.html', data=params)

#-----------------------
#客戶清單
@app.route('/product/list')
def product_list(): 
    #取得資料庫連線 
    connection = db.get_connection() 
    
    #產生執行sql命令的物件   
    cursor = connection.cursor() 
    
    #執行SQL    
    cursor.execute('SELECT prono, proname, price, stockAmt FROM product order by prono;')
    
    #取回SQL執行後的所有資料
    data = cursor.fetchall()
    
    #設定參數, 準備傳給網頁
    if data:
        #如果有資料
        params = [{'prono': d[0], 'proname': d[1], 'price': d[2], 'stockAmt': d[3]} for d in data]
    else:
        #如果無資料
        params = None
          
    #關閉資料庫連線    
    connection.close() 
    
    #將參數送給網頁, 讓資料嵌入網頁中  
    return render_template('/product/list.html', data=params)

#-----------------------

#客戶查詢表單
@app.route('/customer/read/form')
def customer_read_form():
    return render_template('/customer/read_form.html') 

#客戶查詢
@app.route('/customer/read', methods=['GET'])
def customer_read():    
    #取得資料庫連線    
    connection = db.get_connection()  
    
    #取得執行sql命令的cursor
    cursor = connection.cursor()   
    
    #取得傳入參數
    cusno = request.values.get('cusno').strip()
    
    #執行sql命令並取回資料    
    cursor.execute('SELECT * FROM customer WHERE cusno=%s', (cusno,))
    data = cursor.fetchone()

    if data:
        params = {'cusno':data[0], 'cusname':data[1], 'address':data[4], 'tel':data[8], 'photo':data[10]}
    else:
        params = None
        
    #關閉連線   
    connection.close()  
        
    #回傳網頁
    return render_template('customer/read.html', data=params) 

#-----------------------

#客戶查詢表單
@app.route('/product/read/form')
def product_read_form():
    return render_template('/product/read_form.html') 

#客戶查詢
@app.route('/product/read', methods=['GET'])
def product_read():    
    #取得資料庫連線    
    connection = db.get_connection()  
    
    #取得執行sql命令的cursor
    cursor = connection.cursor()   
    
    #取得傳入參數
    prono = request.values.get('prono').strip()
    
    #執行sql命令並取回資料    
    cursor.execute('SELECT * FROM product WHERE prono=%s', (prono,))
    data = cursor.fetchone()

    if data:
        params = {'prono':data[0], 'proname':data[1], 'price':data[4], 'stockAmt':data[5]}
    else:
        params = None
        
    #關閉連線   
    connection.close()  
        
    #回傳網頁
    return render_template('product/read.html', data=params) 
        
#-----------------------
# 啟動Flask網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)
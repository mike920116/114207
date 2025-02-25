#-----------------------
# 匯入flask及db模組
#-----------------------
from flask import Flask, request, render_template
import os
import uuid
import db

#檢查上傳檔案類型
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ('png', 'jpg', 'jpeg', 'gif')

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

#------------
# 查詢
#------------
#客戶查詢表單
@app.route('/customer/read/form')
def customer_read_form():
    return render_template('customer/read_form.html') 

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
        params = {'cusno':data[0], 'cusname':data[1], 'address':data[4], 'photo':data[10]}
    else:
        params = None
        
    #關閉連線   
    connection.close()  
        
    #回傳網頁
    return render_template('/customer/read.html', data=params) 

#------------
# 新增
#------------
#客戶新增表單
@app.route('/customer/create/form')
def customer_create_form():
    return render_template('/customer/create_form.html') 

#客戶新增
@app.route('/customer/create', methods=['POST'])
def customer_create():
    try:
        #取得上傳圖檔
        photo = request.files['photo']
        filename = None
        
        #檢查是否有選擇圖片, 並且檔案類型是png, jpg, jpeg, gif其中之一
        if photo and allowed_file(photo.filename):
            #產生一個唯一的檔名, 並且儲存圖檔
            filename = str(uuid.uuid4()) + '.' + photo.filename.rsplit('.', 1)[1].lower()
            photo.save(os.path.join('static/photos', filename))
            
        #取得參數
        cusno = request.form.get('cusno')
        cusname = request.form.get('cusname')
        address = request.form.get('address')

        #取得資料庫連線
        conn = db.get_connection()

        #將資料寫入customer表
        cursor = conn.cursor()
        cursor.execute("INSERT INTO customer (cusno, cusname, address, photo) VALUES (%s, %s, %s, %s)", (cusno, cusname, address, filename))
        
        conn.commit()
        conn.close()

        #回傳畫面
        return render_template('/customer/create.html', success=True)
    except:
        #回傳失敗畫面
        return render_template('/customer/create.html', success=False)
               
#-----------------------
# 啟動Flask網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)
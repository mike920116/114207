#-----------------------
# 匯入flask及db模組
#-----------------------
from flask import Flask, request, render_template, render_template, redirect, url_for, session
import os
import uuid
import bcrypt
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
#客戶清單--------------------------------------------------------------------------------------------
@app.route('/customer/list')
def customer_list(): 
    #取得資料庫連線 
    connection = db.get_connection() 
    
    #產生執行sql命令的物件   
    cursor = connection.cursor() 
    
    #執行SQL    
    cursor.execute('SELECT cusno, cusname, address, contactor FROM customer order by cusno;')
    
    #取回SQL執行後的所有資料
    data = cursor.fetchall()
    
    #設定參數, 準備傳給網頁
    if data:
        #如果有資料
        params = [{'cusno': d[0], 'cusname': d[1], 'address': d[2], 'contactor': d[3]} for d in data]
    else:
        #如果無資料
        params = None
          
    #關閉資料庫連線    
    connection.close() 
    
    #將參數送給網頁, 讓資料嵌入網頁中  
    return render_template('/customer/list.html', data=params) 

#客戶新增表單--------------------------------------------------------------------------------------------
@app.route('/customer/create/form')
def customer_create_form():
    return render_template('customer/create_form.html') 

#客戶新增--------------------------------------------------------------------------------------------
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

        #取得使用者的輸入值
        cusno = request.form.get('cusno').strip()
        cusname = request.form.get('cusname').strip()
        address = request.form.get('address').strip()

        #取得資料庫連線
        conn = db.get_connection()

        #將資料寫入客戶資料表
        cursor = conn.cursor()
        cursor.execute("INSERT INTO customer (cusno, cusname, address, photo) VALUES (%s, %s, %s, %s)", (cusno, cusname, address, filename))
        
        conn.commit()
        conn.close()

        #回傳成功畫面
        return render_template('customer/create.html', success=True)
    except:
        #回傳失敗畫面
        return render_template('customer/create.html', success=False)
#客戶刪除表單--------------------------------------------------------------------------------------------
@app.route('/customer/delete/form')
def customer_delete_form():
    return render_template('customer/delete_form.html') 

#客戶刪除--------------------------------------------------------------------------------------------
@app.route('/customer/delete', methods=['GET'])
def customer_delete():
    try:
        #取得使用者的輸入值
        cusno = request.values.get('cusno').strip()
        
        #取得資料庫連線
        conn = db.get_connection()

        #刪除客戶資料
        cursor = conn.cursor()
        cursor.execute("DELETE FROM customer WHERE cusno=%s", (cusno,))
        
        #取得刪除的記錄筆數
        deleted_rows = cursor.rowcount  

        conn.commit()
        conn.close()

        if deleted_rows > 0:
            #回傳成功畫面
            return render_template('customer/delete.html', success=True)
        else:
            #回傳失敗畫面
            return render_template('customer/delete.html', success=False)
    except Exception as e:
        print(e)
        #回傳失敗畫面
        return render_template('customer/delete.html', success=False)

#客戶取出表單--------------------------------------------------------------------------------------------
@app.route('/customer/update/fetch')
def customer_update_fetch():    
    return render_template('customer/update_fetch.html') 

#客戶更改表單--------------------------------------------------------------------------------------------
@app.route('/customer/update/form', methods=['GET'])
def customer_update_form(): 
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
        params = {'cusno':data[0], 'cusname':data[1], 'address':data[4], 'tel':data[8]}
    else:
        params = None
        
    #關閉連線   
    connection.close()  
        
    #回傳網頁
    return render_template('/customer/update_form.html', data=params) 

#客戶更改--------------------------------------------------------------------------------------------
@app.route('/customer/update', methods=['POST'])
def customer_update():
    try:
        #取得使用者的輸入值
        cusno = request.form.get('cusno').strip()
        cusname = request.form.get('cusname').strip()
        address = request.form.get('address').strip()
        tel = request.form.get('tel').strip()

        #取得資料庫連線
        conn = db.get_connection()

        #將資料寫入客戶資料表
        cursor = conn.cursor()
        cursor.execute("UPDATE customer SET cusname=%s, address=%s, tel=%s WHERE cusno=%s", (cusname, address, tel, cusno))
        
        conn.commit()
        conn.close()

        #回傳成功畫面
        return render_template('customer/update.html', success=True)
    except:
        #回傳失敗畫面
        return render_template('customer/update.html', success=False)
# 查詢--------------------------------------------------------------------------------------------
#客戶查詢表單--------------------------------------------------------------------------------------------
@app.route('/customer/read/form')
def customer_read_form():
    return render_template('customer/read_form.html') 
#客戶查詢--------------------------------------------------------------------------------------------
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
        params = {'cusno':data[0], 'cusname':data[1], 'address':data[4], 'photo':data[9]}
    else:
        params = None
        
    #關閉連線   
    connection.close()  
        
    #回傳網頁
    return render_template('/customer/read.html', data=params) 

# --------------------------------------------------------------------------------------------
# 產品清單--------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------
@app.route('/product/list')
def product_list(): 
    # 取得資料庫連線
    connection = db.get_connection() 
    
    # 取得當前頁面，預設為第 1 頁
    page = request.args.get('page', 1, type=int)
    
    # 每頁顯示 10 筆資料
    per_page = 10
    
    # 計算資料的起始索引位置
    offset = (page - 1) * per_page
    
    # 產生執行sql命令的物件
    cursor = connection.cursor() 
    
    # 取得總資料數
    cursor.execute('SELECT COUNT(*) FROM product')
    total_count = cursor.fetchone()[0]
    
    # 計算總頁數
    total_pages = (total_count // per_page) + (1 if total_count % per_page > 0 else 0)
    
    # 執行SQL，取得當前頁面的資料
    cursor.execute('SELECT prono, proname, price, stockAmt FROM product ORDER BY prono LIMIT %s OFFSET %s', (per_page, offset))
    
    # 取回SQL執行後的所有資料
    data = cursor.fetchall()
    
    # 設定參數，準備傳給網頁
    if data:
        params = [{'prono': d[0], 'proname': d[1], 'price': d[2], 'stockAmt': d[3]} for d in data]
    else:
        params = None
          
    # 關閉資料庫連線
    connection.close() 
    
    # 將參數送給網頁，並傳遞分頁資訊
    return render_template('/product/list.html', data=params, page=page, total_pages=total_pages)

#產品新增表單--------------------------------------------------------------------------------------------
@app.route('/product/create/form')
def product_create_form():
    return render_template('product/create_form.html') 

#產品新增--------------------------------------------------------------------------------------------
@app.route('/product/create', methods=['POST'])
def product_create():
    try:
        #取得上傳圖檔
        picture = request.files['picture']
        filename = None
        
        #檢查是否有選擇圖片, 並且檔案類型是png, jpg, jpeg, gif其中之一
        if picture and allowed_file(picture.filename):
            #產生一個唯一的檔名, 並且儲存圖檔
            filename = str(uuid.uuid4()) + '.' + picture.filename.rsplit('.', 1)[1].lower()
            picture.save(os.path.join('static/photos', filename))

        #取得使用者的輸入值
        prono = request.form.get('prono').strip()
        proname = request.form.get('proname').strip()
        price = request.form.get('price').strip()

        #取得資料庫連線
        conn = db.get_connection()

        #將資料寫入產品資料表
        cursor = conn.cursor()
        cursor.execute("INSERT INTO product (prono, proname, price, picture) VALUES (%s, %s, %s, %s)", (prono, proname, price, filename))
        
        conn.commit()
        conn.close()

        #回傳成功畫面
        return render_template('product/create.html', success=True)
    except:
        #回傳失敗畫面
        return render_template('product/create.html', success=False)
#客戶刪除表單--------------------------------------------------------------------------------------------
@app.route('/product/delete/form')
def product_delete_form():
    return render_template('product/delete_form.html') 

#客戶刪除--------------------------------------------------------------------------------------------
@app.route('/product/delete', methods=['GET'])
def product_delete():
    try:
        #取得使用者的輸入值
        cusno = request.values.get('prono').strip()
        
        #取得資料庫連線
        conn = db.get_connection()

        #刪除客戶資料
        cursor = conn.cursor()
        cursor.execute("DELETE FROM product WHERE prono=%s", (prono,))
        
        #取得刪除的記錄筆數
        deleted_rows = cursor.rowcount  

        conn.commit()
        conn.close()

        if deleted_rows > 0:
            #回傳成功畫面
            return render_template('product/delete.html', success=True)
        else:
            #回傳失敗畫面
            return render_template('product/delete.html', success=False)
    except Exception as e:
        print(e)
        #回傳失敗畫面
        return render_template('product/delete.html', success=False)

#產品取出表單--------------------------------------------------------------------------------------------
@app.route('/product/update/fetch')
def product_update_fetch():    
    return render_template('product/update_fetch.html') 

#產品更改表單--------------------------------------------------------------------------------------------
@app.route('/product/update/form', methods=['GET'])
def product_update_form(): 
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
        params = {'prono':data[0], 'proname':data[1], 'price':data[4], 'picture':data[9]}
    else:
        params = None
        
    #關閉連線   
    connection.close()  
        
    #回傳網頁
    return render_template('/product/update_form.html', data=params) 

#產品更改--------------------------------------------------------------------------------------------
@app.route('/product/update', methods=['POST'])
def product_update():
    try:
        #取得使用者的輸入值
        prono = request.form.get('prono').strip()
        proname = request.form.get('proname').strip()
        price = request.form.get('price').strip()

        #取得資料庫連線
        conn = db.get_connection()

        #將資料寫入客戶資料表
        cursor = conn.cursor()
        cursor.execute("UPDATE product SET proname=%s, proname=%s, price=%s WHERE prono=%s", (prono, proname, price, prono))
        
        conn.commit()
        conn.close()

        #回傳成功畫面
        return render_template('product/update.html', success=True)
    except:
        #回傳失敗畫面
        return render_template('product/update.html', success=False)
# 查詢--------------------------------------------------------------------------------------------
#產品查詢表單--------------------------------------------------------------------------------------------
@app.route('/product/read/form')
def product_read_form():
    return render_template('product/read_form.html') 
#產品查詢--------------------------------------------------------------------------------------------
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
        params = {'prono':data[0], 'proname':data[1], 'price':data[4], 'picture':data[9]}
    else:
        params = None
        
    #關閉連線   
    connection.close()  
        
    #回傳網頁
    return render_template('/product/read.html', data=params) 

#進貨表單--------------------------------------------------------------------------------------------
@app.route('/transaction/buy/form')
def transaction_buy_form():
    return render_template('/transaction/buy_form.html') 

#進貨--------------------------------------------------------------------------------------------
@app.route('/transaction/buy', methods=['POST'])
def transaction_buy(): 
    try:
        # 取得使用者的輸入值
        ordno = request.form.get('ordno').strip()
        cusno = request.form.get('cusno').strip()
        empno = request.form.get('empno').strip()
        orddate = request.form.get('orddate')        
        transfee = request.form.get('transfee')
        
        # 取得產品編號與數量，並轉換為 JSON 格式
        prono_list = request.form.getlist('prono[]')
        amt_list = request.form.getlist('amt[]')

        import json
        prono_json = json.dumps(prono_list)  # 轉換為 JSON 格式
        amt_json = json.dumps(amt_list)      # 轉換為 JSON 格式

        # 取得資料庫連線
        conn = db.get_connection()
        cursor = conn.cursor()

        # 呼叫存儲程序 transaction_buy
        cursor.callproc('transaction_buy', 
                        (ordno, cusno, empno, orddate, transfee, prono_json, amt_json))
        
        # 確定資料有寫入DB
        conn.commit()

        # 回傳成功畫面
        return render_template('transaction/buy.html', success=True)
    except Exception as e:
        # 將資料庫復原至未寫入狀態
        conn.rollback()

        # 回傳失敗畫面
        return render_template('transaction/buy.html', success=False, error=e)
    finally:
        conn.close()


#使用者登入--------------------------------------------------------------------------------------------
@app.route('/user/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    
    # 查詢用戶資料
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        # 登入成功，設置 Session
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['avatar_url'] = user.get('avatar_url', '/static/imgs/default_avatar.jpg')  # 默認頭像
        return redirect(url_for('homepage'))
    else:
        return render_template('user/login.html', error="帳號或密碼錯誤")


#-----------------------
# 啟動Flask網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)
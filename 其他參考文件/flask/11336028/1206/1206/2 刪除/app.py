#-----------------------
# 匯入flask及db模組
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

#客戶新增表單
@app.route('/customer/create/form')
def customer_create_form():
    return render_template('customer/create_form.html') 

#客戶新增
@app.route('/customer/create', methods=['POST'])
def customer_create():
    try:
        #取得使用者的輸入值
        cusno = request.form.get('cusno').strip()
        cusname = request.form.get('cusname').strip()
        address = request.form.get('address').strip()

        #取得資料庫連線
        conn = db.get_connection()

        #將資料寫入客戶資料表
        cursor = conn.cursor()
        cursor.execute("INSERT INTO customer (cusno, cusname, address) VALUES (%s, %s, %s)", (cusno, cusname, address))
        
        conn.commit()
        conn.close()

        #回傳成功畫面
        return render_template('customer/create.html', success=True)
    except:
        #回傳失敗畫面
        return render_template('customer/create.html', success=False)

#------------------------------------------------------------------------------------

#客戶刪除表單
@app.route('/customer/delete/form')
def customer_delete_form():
    return render_template('customer/delete_form.html') 

#客戶刪除
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

#-----------------------
# 啟動Flask網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)
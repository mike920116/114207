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

#進貨表單
@app.route('/transaction/buy/form')
def transaction_buy_form():
    return render_template('/transaction/buy_form.html') 

#進貨
@app.route('/transaction/buy', methods=['POST'])
def transaction_buy(): 
    try:
        #取得使用者的輸入值
        ordno = request.form.get('ordno').strip()
        cusno = request.form.get('cusno').strip()
        empno = request.form.get('empno').strip()
        orddate = request.form.get('orddate')        
        transfee = request.form.get('transfee')
        prono1 = request.form.get('prono1').strip()
        amt1 = request.form.get('amt1')
        prono2 = request.form.get('prono2')
        amt2 = request.form.get('amt2')
        
        #取得資料庫連線 
        conn = db.get_connection()         
        
        #新增交易主檔
        cursor = conn.cursor()
        cursor.execute("INSERT INTO ordmaster (ordno, cusno, empno, orddate, transfee) VALUES (%s, %s, %s, %s, %s)", (ordno, cusno, empno, orddate, transfee))
        
        #新增交易明細(1)
        cursor.execute("INSERT INTO orddetails (ordno, prono, amt) VALUES (%s, %s, %s)", (ordno, prono1, amt1))    

        #新增交易明細(2)        
        if (prono2 and amt2):
            cursor.execute("INSERT INTO orddetails (ordno, prono, amt) VALUES (%s, %s, %s)", (ordno, prono2, amt2))   
        
        #確定資料有寫入DB
        conn.commit()

        #回傳成功畫面
        return render_template('transaction/buy.html', success=True)
    except Exception as e:        
        #將資料庫復原至未寫入狀態
        conn.rollback()
        
        #回傳失敗畫面
        return render_template('transaction/buy.html', success=False, error=e)
    finally:
        conn.close()

#-----------------------
# 啟動Flask網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)
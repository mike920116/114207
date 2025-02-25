from flask import Flask, render_template, request
import db

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

# 客戶清單 (含分頁)
@app.route('/customer/list')
def customer_list():
    # 頁碼 (從 URL 參數中取得，預設為第 1 頁)
    page = request.args.get('page', 1, type=int)
    per_page = 10  # 每頁顯示 10 筆資料
    
    # 取得資料庫連線
    connection = db.get_connection()
    cursor = connection.cursor()
    
    # 取得總筆數
    cursor.execute('SELECT COUNT(*) FROM customer')
    total = cursor.fetchone()[0]
    
    # 計算分頁的起始位置
    offset = (page - 1) * per_page 
    
    # 查詢分頁資料
    cursor.execute(
        'SELECT cusno, cusname, address, contactor FROM customer ORDER BY cusno LIMIT %s OFFSET %s',
        (per_page, offset)
    )
    data = cursor.fetchall()
    
    # 關閉資料庫連線
    connection.close()

    # 整理資料
    params = [{'cusno': d[0], 'cusname': d[1], 'address': d[2], 'contactor': d[3]} for d in data]

    # 計算總頁數
    total_pages = (total + per_page - 1) // per_page  # 無條件進位計算頁數

    return render_template(
        '/customer/list.html',
        data=params,
        page=page,
        total_pages=total_pages
    )

if __name__ == '__main__':
    app.run(debug=True)

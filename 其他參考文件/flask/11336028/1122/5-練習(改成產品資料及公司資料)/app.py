from flask import Flask, render_template, request
import db

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html') 

@app.route('/customer/list')
def customer_list(): 
    connection = db.get_connection() 
    cursor = connection.cursor() 
    
    # 取得當前頁數，預設為第 1 頁
    page = request.args.get('page', default=1, type=int)
    per_page = 10  # 每頁顯示 10 筆
    
    # 計算總筆數和頁數
    cursor.execute('SELECT COUNT(*) FROM customer;')
    total_count = cursor.fetchone()[0]
    total_pages = (total_count + per_page - 1) // per_page  # 無條件進位
    
    # 取得分頁資料
    offset = (page - 1) * per_page
    cursor.execute('SELECT cusno, cusname, address, contactor FROM customer ORDER BY cusno LIMIT %s OFFSET %s;', (per_page, offset))
    data = cursor.fetchall()
    
    params = [{'cusno': d[0], 'cusname': d[1], 'address': d[2], 'contactor': d[3]} for d in data] if data else None
    connection.close()
    
    return render_template('/customer/list.html', data=params, page=page, total_pages=total_pages)

@app.route('/product/list')
def product_list(): 
    connection = db.get_connection() 
    cursor = connection.cursor() 
    
    page = request.args.get('page', default=1, type=int)
    per_page = 10
    
    cursor.execute('SELECT COUNT(*) FROM product;')
    total_count = cursor.fetchone()[0]
    total_pages = (total_count + per_page - 1) // per_page
    
    offset = (page - 1) * per_page
    cursor.execute('SELECT prono, proname, price, stockAmt FROM product ORDER BY prono LIMIT %s OFFSET %s;', (per_page, offset))
    data = cursor.fetchall()
    
    params = [{'prono': d[0], 'proname': d[1], 'price': d[2], 'stockAmt': d[3]} for d in data] if data else None
    connection.close()
    
    return render_template('/product/list.html', data=params, page=page, total_pages=total_pages)

if __name__ == '__main__':
    app.run(debug=True)

#-----------------------
# 匯入Flask類別
#-----------------------
from flask import Flask, render_template #搜尋flask 以及使用網頁的渲染render

#-----------------------
# 產生Flask物件
#-----------------------
app = Flask(__name__)

#-----------------------
# 定義路由
#-----------------------
#主畫面
@app.route('/')
def index():
    return render_template('index.html') #因為有在templates/index才能搜尋到

#/hello服務
@app.route('/hello')
def hello():
    return '你好'

#-----------------------
# 執行Flask網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True) #debug模式 就不用再關閉主機重開
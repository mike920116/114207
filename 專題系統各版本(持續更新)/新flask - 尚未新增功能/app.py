from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

# 之後新增：diary_bp, ai_bp, user_bp…
# app.register_blueprint(diary_bp, url_prefix="/diary")

if __name__ == "__main__":
    app.run(debug=True)

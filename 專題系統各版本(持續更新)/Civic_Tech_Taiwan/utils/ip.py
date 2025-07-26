from flask import request, current_app

def get_client_ip():
    xff = request.headers.get("X-Forwarded-For")
    real_ip = request.remote_addr
    current_app.logger.info(f"[IP] XFF={xff} | remote_addr={real_ip}")

    if xff:
        return xff.split(",")[0].strip()
    return real_ip

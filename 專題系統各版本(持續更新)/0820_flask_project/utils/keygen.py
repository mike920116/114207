from hashlib import pbkdf2_hmac

def derive_key(password: str, salt: str) -> bytes:
    """
    使用 PBKDF2 從密碼與 salt 派生出 256-bit AES 金鑰
    """
    return pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000, dklen=32)

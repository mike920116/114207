from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

BLOCK_SIZE = 16  # AES block size (bytes)

# ----- 改 1：全部改成「對 bytes 做 padding」 -----------------
def pad(data: bytes) -> bytes:
    padding = BLOCK_SIZE - len(data) % BLOCK_SIZE
    return data + bytes([padding]) * padding     # PKCS7

def unpad(data: bytes) -> bytes:
    padding = data[-1]
    return data[:-padding]

# ------------------------------------------------------------

def encrypt(plain_text: str, key: bytes) -> str:
    if not isinstance(key, bytes):
        raise TypeError("金鑰必須為 bytes")

    data = plain_text.encode("utf-8")            # 先轉成 bytes
    data_padded = pad(data)

    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    encrypted = cipher.encrypt(data_padded)

    return base64.b64encode(iv + encrypted).decode("utf-8")

def decrypt(enc_text: str, key: bytes) -> str:
    if not isinstance(key, bytes):
        raise TypeError("金鑰必須為 bytes")
    
    if not enc_text or enc_text.strip() == '':
        raise ValueError("加密文本不能為空")

    try:
        raw = base64.b64decode(enc_text)
    except Exception as e:
        raise ValueError(f"Base64 解碼失敗: {str(e)}")
    
    if len(raw) < 16:
        raise ValueError("加密數據長度不足，無法提取 IV")
    
    iv, encrypted = raw[:16], raw[16:]

    if len(encrypted) == 0:
        raise ValueError("沒有可解密的數據")

    try:
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_padded = cipher.decrypt(encrypted)
        decrypted = unpad(decrypted_padded)
        
        # 嘗試將 bytes 轉換為 UTF-8 字符串
        result = decrypted.decode("utf-8")
        return result
        
    except UnicodeDecodeError as e:
        raise UnicodeDecodeError(e.encoding, e.object, e.start, e.end, 
                                f"UTF-8 解碼失敗，可能是金鑰錯誤: {e.reason}")
    except Exception as e:
        raise ValueError(f"解密過程發生錯誤: {str(e)}")

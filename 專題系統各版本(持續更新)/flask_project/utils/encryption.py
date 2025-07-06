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

    raw = base64.b64decode(enc_text)
    iv, encrypted = raw[:16], raw[16:]

    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted_padded = cipher.decrypt(encrypted)
    decrypted = unpad(decrypted_padded)

    return decrypted.decode("utf-8")

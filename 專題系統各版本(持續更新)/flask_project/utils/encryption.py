from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

BLOCK_SIZE = 16  # AES block size

def pad(data: str) -> str:
    padding = BLOCK_SIZE - len(data) % BLOCK_SIZE
    return data + chr(padding) * padding

def unpad(data: str) -> str:
    return data[:-ord(data[-1])]

def encrypt(plain_text: str, key: bytes) -> str:
    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    encrypted_data = cipher.encrypt(pad(plain_text).encode())
    return base64.b64encode(iv + encrypted_data).decode()

def decrypt(enc_text: str, key: bytes) -> str:
    raw = base64.b64decode(enc_text)
    iv = raw[:16]
    encrypted_data = raw[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(encrypted_data).decode()
    return unpad(decrypted)

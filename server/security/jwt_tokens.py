# security/jwt_tokens.py

import jwt
import datetime
from config import Config
from uuid import uuid4

ACCESS_EXPIRE_MINUTES = 15
REFRESH_EXPIRE_DAYS = 7


def create_access_token(user_id: str):
    payload = {
        "sub": user_id,
        "type": "access",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def create_refresh_token(user_id: str):
    token_id = str(uuid4())
    payload = {
        "sub": user_id,
        "jti": token_id,
        "type": "refresh",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_EXPIRE_DAYS)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256"), token_id


def decode_token(token: str):
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])

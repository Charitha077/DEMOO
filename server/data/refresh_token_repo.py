from extensions.mongo import db

refresh_tokens = db["refresh_tokens"]

def store_refresh_token(jti: str, user_id: str):
    refresh_tokens.insert_one({
        "jti": jti,
        "user_id": user_id,
        "active": True
    })

def revoke_refresh_token(jti: str):
    refresh_tokens.update_one(
        {"jti": jti},
        {"$set": {"active": False}}
    )

def is_refresh_token_valid(jti: str, user_id: str):
    return refresh_tokens.find_one({
        "jti": jti,
        "user_id": user_id,
        "active": True
    }) is not None

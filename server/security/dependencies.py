# security/dependencies.py

from fastapi import Depends, Header, HTTPException
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from security.jwt_tokens import decode_token
from data.user_roles_repo import get_user_role
from data.roles_repo import get_role_by_id
from data.refresh_token_repo import is_refresh_token_valid


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(HTTP_401_UNAUTHORIZED, "Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(HTTP_401_UNAUTHORIZED, "Invalid authorization format")

    token = authorization.split(" ")[1]

    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    if payload.get("type") != "access":
        raise HTTPException(HTTP_401_UNAUTHORIZED, "Invalid token type")

    return payload["sub"]


def require_roles(*allowed_roles):
    def wrapper(user_id=Depends(get_current_user)):
        mapping = get_user_role(user_id)
        if not mapping:
            raise HTTPException(HTTP_403_FORBIDDEN, "User has no role assigned")

        role_doc = get_role_by_id(mapping["role_id"])
        role_name = role_doc["name"]

        if role_name not in allowed_roles:
            raise HTTPException(HTTP_403_FORBIDDEN, "Access denied")

        return user_id

    return wrapper


def validate_refresh_token(refresh_token: str):
    if not refresh_token.startswith("Bearer "):
        raise HTTPException(HTTP_401_UNAUTHORIZED, "Invalid refresh token format")

    token = refresh_token.split(" ")[1]

    payload = decode_token(token)

    if payload.get("type") != "refresh":
        raise HTTPException(HTTP_401_UNAUTHORIZED, "Invalid token type")

    jti = payload.get("jti")
    user_id = payload.get("sub")

    if not is_refresh_token_valid(jti, user_id):
        raise HTTPException(HTTP_401_UNAUTHORIZED, "Refresh token revoked")

    return user_id, jti

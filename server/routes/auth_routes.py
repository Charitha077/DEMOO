from fastapi import APIRouter, HTTPException, status
from services.auth_service import login, rotate_refresh_token
from schemas.api_request_models import LoginRequest, LogoutRequest
from security.jwt_tokens import decode_token
from data.refresh_token_repo import is_refresh_token_valid,revoke_refresh_token
from core.global_response import success

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------------------------------------------------
# LOGIN
# ---------------------------------------------------
@router.post("/login")
def login_route(payload: LoginRequest):
    return login(payload.userId, payload.password)


# ---------------------------------------------------
# REFRESH TOKEN
# ---------------------------------------------------
@router.post("/refresh")
def refresh_route(payload: dict):
    refresh_token = payload.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token missing"
        )

    try:
        token_payload = decode_token(refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    if token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is not a refresh token"
        )

    jti = token_payload.get("jti")
    user_id = token_payload.get("sub")

    if not is_refresh_token_valid(jti, user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or invalid"
        )

    return rotate_refresh_token(jti, user_id)


# ---------------------------------------------------
# LOGOUT
# ---------------------------------------------------
@router.post("/logout")
def logout_route(payload: LogoutRequest):
    revoke_refresh_token(payload.jti)
    return success("Logged out successfully")


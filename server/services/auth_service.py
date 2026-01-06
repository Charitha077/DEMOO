from fastapi import HTTPException, status

from security.passwords import verify_password
from security.jwt_tokens import create_access_token, create_refresh_token
from data.refresh_token_repo import store_refresh_token, revoke_refresh_token

from data.superadmin_repo import get_superadmin_by_id
from data.admin_repo import get_admin_by_id
from data.hod_repo import get_hod_by_id
from data.guards_repo import get_guard_by_id
from data.student_repo import get_student_by_id
from data.mentor_repo import get_mentor_by_id

from data.user_roles_repo import get_user_role
from data.roles_repo import get_role_by_id

from core.global_response import success


USER_LOOKUP_ORDER = [
    get_superadmin_by_id,
    get_admin_by_id,
    get_hod_by_id,
    get_guard_by_id,
    get_mentor_by_id,
    get_student_by_id,
]


# ==========================================================
# LOGIN
# ==========================================================
def login(user_id: str, password: str):

    user = None
    for fn in USER_LOOKUP_ORDER:
        doc = fn(user_id)
        if doc:
            user = doc
            break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(user.get("password_hash", ""), password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    mapping = get_user_role(user_id)
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no role assigned"
        )

    role_doc = get_role_by_id(mapping["role_id"])
    role_name = role_doc["name"]

    access_token = create_access_token(user_id)
    refresh_token, jti = create_refresh_token(user_id)

    store_refresh_token(jti, user_id)

    response_data = {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "role": role_name,
    }   

    # 👇 ONLY STUDENT HAS FACE ID
    if role_name == "STUDENT":
        response_data["face_id"] = user.get("face_id")

    return success("Login successful", response_data)



# ==========================================================
# ROTATE REFRESH TOKEN
# ==========================================================
def rotate_refresh_token(old_jti: str, user_id: str):

    revoke_refresh_token(old_jti)

    new_access = create_access_token(user_id)
    new_refresh, new_jti = create_refresh_token(user_id)

    store_refresh_token(new_jti, user_id)

    return success(
        "Token refreshed",
        {
            "access_token": new_access,
            "refresh_token": new_refresh
        }
    )

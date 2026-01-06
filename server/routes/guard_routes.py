from fastapi import APIRouter, Depends, HTTPException # Added HTTPException
from services.guard_service import (
    register_guard,
    update_guard_service,
    delete_guard_service,
    service_get_guard_by_id,
    service_get_all_guards
)
from security.dependencies import require_roles
from schemas.api_request_models import GuardCreateRequest, GuardUpdateRequest
from core.global_response import success # Added success import

router = APIRouter(prefix="/guard", tags=["Guard"])

# ==========================================================
# CREATE GUARD
# ==========================================================
@router.post("/create")
def create_guard(payload: GuardCreateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return register_guard(
        guard_id=payload.id,
        name=payload.name,
        phone=payload.phone,
        password=payload.password,
        college=payload.college
    )

# ==========================================================
# GET GUARD BY ID
# ==========================================================
@router.get("/{guard_id}")
def get_guard_profile(guard_id: str, _=Depends(require_roles("SUPER_ADMIN", "ADMIN", "GUARD"))):
    """
    We use service_get_guard_by_id because it already handles:
    1. Database retrieval
    2. 404 Error handling
    3. Removing the password_hash
    4. Wrapping the result in the 'success' helper
    """
    return service_get_guard_by_id(guard_id)

# ==========================================================
# UPDATE GUARD
# ==========================================================
@router.put("/update/{guard_id}")
def update_guard(guard_id: str, payload: GuardUpdateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return update_guard_service(guard_id, payload.dict(exclude_unset=True))

# ==========================================================
# DELETE GUARD
# ==========================================================
@router.delete("/delete/{guard_id}")
def delete_guard(guard_id: str, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return delete_guard_service(guard_id)

# ==========================================================
# GET ALL GUARDS
# ==========================================================
@router.get("/")
def get_all_guards(_=Depends(require_roles("ADMIN", "SUPER_ADMIN"))):
    return service_get_all_guards()
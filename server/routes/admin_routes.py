from fastapi import APIRouter, Depends, HTTPException
from security.dependencies import require_roles
from schemas.api_request_models import AdminCreateRequest, AdminUpdateRequest
from services.admin_service import (
    register_admin,
    get_admin_service, 
    update_admin_service,
    delete_admin_service,
    get_all_admins_service
)

# Prefix is defined here once
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/list/all") # Put static routes ABOVE dynamic {admin_id}
def get_all_route(_=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return get_all_admins_service()

@router.get("/{admin_id}") # Dynamic route
def get_admin_profile(admin_id: str):
    return get_admin_service(admin_id)

@router.post("/create")
def create_admin_route(payload: AdminCreateRequest, _=Depends(require_roles("SUPER_ADMIN"))):
    return register_admin(payload.id, payload.name, payload.phone, payload.password, payload.college)

@router.put("/update/{admin_id}")
def update_admin_route(admin_id: str, payload: AdminUpdateRequest, _=Depends(require_roles("SUPER_ADMIN"))):
    return update_admin_service(admin_id, payload.dict(exclude_unset=True))

@router.delete("/delete/{admin_id}")
def delete_admin_route(admin_id: str, _=Depends(require_roles("SUPER_ADMIN"))):
    return delete_admin_service(admin_id)
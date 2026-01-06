from fastapi import APIRouter, Depends
from security.dependencies import require_roles
from services.hod_service import (
    register_hod, update_hod_service, delete_hod_service,
    service_get_all_hods, service_get_hod_by_id, 
    service_get_hods_for_student, filter_hods_service
)
from schemas.api_request_models import HODCreateRequest, HODUpdateRequest, HODFilterRequest

router = APIRouter(prefix="/hod", tags=["HOD"])

@router.post("/create")
def create_hod(payload: HODCreateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return register_hod(
        hod_id=payload.id, name=payload.name, phone=payload.phone,
        years=payload.years, college=payload.college,
        course=payload.course, password=payload.password
    )

@router.get("/{hod_id}")
def get_hod_profile(hod_id: str, _=Depends(require_roles("SUPER_ADMIN", "ADMIN", "HOD"))):
    return service_get_hod_by_id(hod_id)

@router.put("/update/{hod_id}")
def update_hod(hod_id: str, payload: HODUpdateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return update_hod_service(hod_id, payload.dict(exclude_unset=True))

@router.delete("/delete/{hod_id}")
def delete_hod(hod_id: str, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return delete_hod_service(hod_id)

@router.get("/")
def get_all_hods(_=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return service_get_all_hods()

@router.post("/filter")
def filter_hods(payload: HODFilterRequest, _=Depends(require_roles("ADMIN", "SUPER_ADMIN"))):
    return filter_hods_service(payload.dict(exclude_unset=True))
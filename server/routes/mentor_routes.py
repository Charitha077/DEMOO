from fastapi import APIRouter, Depends
from security.dependencies import require_roles
from services.mentor_service import (
    register_mentor,
    update_mentor_service,
    delete_mentor_service,
    list_mentors_service
)
from schemas.api_request_models import MentorCreateRequest, MentorUpdateRequest

router = APIRouter(prefix="/mentor", tags=["Mentor"])


@router.post("/create")
def create_mentor(payload: MentorCreateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return register_mentor(
        mentor_id=payload.id,
        name=payload.name,
        phone=payload.phone,
        department=payload.department,
        password=payload.password
    )


@router.put("/update/{mentor_id}")
def update_mentor(mentor_id: str, payload: MentorUpdateRequest, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return update_mentor_service(mentor_id, payload.dict(exclude_unset=True))


@router.delete("/delete/{mentor_id}")
def delete_mentor(mentor_id: str, _=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return delete_mentor_service(mentor_id)


@router.get("/")
def list_mentors(_=Depends(require_roles("SUPER_ADMIN", "ADMIN"))):
    return list_mentors_service()

@router.get("/by-course/{course}")
def list_mentors_by_course(course: str, _=Depends(require_roles("HOD"))):
    # HODs can only view mentors of their branch/department
    return list_mentors_service({"department": course})

@router.get("/by-college-course/{college}/{course}")
def list_mentors_by_college_course(college: str, course: str, _=Depends(require_roles("HOD"))):
    # Filter mentors by both college and department for HOD assignment
    # Note: mentors don't have college field, so we filter by department only and let HOD filter by college in context
    # In future, add college field to mentor schema for true college-level filtering
    return list_mentors_service({"department": course})

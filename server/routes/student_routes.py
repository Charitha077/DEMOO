from fastapi import APIRouter, Depends
from security.dependencies import require_roles
from services.student_service import (
    register_student,
    update_student_service,
    delete_student_service,
    promote_students_service,
    filter_students_service,
    get_student_service,
    register_student_face_service   # ✅ NEW
)
from schemas.api_request_models import (
    StudentCreateRequest,
    StudentUpdateRequest,
    PromoteStudentsRequest,
    StudentFilterRequest,
    StudentFaceRegisterRequest      # ✅ NEW
)

# ... rest of the route file

router = APIRouter(prefix="/student", tags=["Student"])


# ======================================================

# ADMIN / SUPER_ADMIN → CREATE STUDENT (NO FACE)

# ======================================================
@router.post("/create")
def create_student(payload: StudentCreateRequest,_=Depends(require_roles("ADMIN", "SUPER_ADMIN"))):

    return register_student(
        student_id=payload.id,
        name=payload.name,
        phone=payload.phone,
        admission_year=payload.admission_year,
        current_semester=payload.current_semester,
        course=payload.course,
        section=payload.section,
        college=payload.college,
        password=payload.password,
        created_by=payload.created_by
    )





# ======================================================

# STUDENT → REGISTER FACE (AFTER LOGIN)

# ======================================================
@router.post("/register-face")
def register_student_face(payload: StudentFaceRegisterRequest,_=Depends(require_roles("STUDENT"))):

    return register_student_face_service(
        student_id=payload.student_id,
        image_b64=payload.image_b64
    )





# ======================================================

# STUDENT → UPDATE PROFILE / FACE

# ======================================================

@router.put("/update/{student_id}")
def update_student(student_id: str,payload: StudentUpdateRequest,_=Depends(require_roles("STUDENT"))):

    return update_student_service(
        student_id,
        payload.dict(exclude_unset=True),
        payload.image_b64
    )





# ======================================================

# ADMIN → DELETE STUDENT

# ======================================================
@router.delete("/delete/{student_id}")
def delete_student(student_id: str,_=Depends(require_roles("ADMIN", "SUPER_ADMIN"))):

    return delete_student_service(student_id)





# ======================================================

# ADMIN → PROMOTE STUDENTS

# ======================================================
@router.post("/promote")
def promote_students(payload: PromoteStudentsRequest,_=Depends(require_roles("ADMIN"))):

    return promote_students_service(
        payload.admission_year,
        payload.college
    )



# ======================================================

# ADMIN / SUPER_ADMIN → FILTER STUDENTS

# ======================================================
@router.post("/filter")
def filter_students(payload: StudentFilterRequest,_=Depends(require_roles("ADMIN", "SUPER_ADMIN"))):

    return filter_students_service(payload.dict(exclude_unset=True))

@router.get("/{student_id}")
def get_student(student_id: str, _=Depends(require_roles("ADMIN", "SUPER_ADMIN", "STUDENT", "HOD"))):
    # This calls get_student_service which returns success("Student fetched", student)
    return get_student_service(student_id)

# ... (rest of your routes are correct as they point to service functions)
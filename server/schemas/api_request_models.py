from pydantic import BaseModel
from typing import Optional, List, Dict


# ================= AUTH =================
class LoginRequest(BaseModel):
    userId: str
    password: str


class LogoutRequest(BaseModel):
    user_id: str


# ================= ADMIN =================
class AdminCreateRequest(BaseModel):
    id: str
    name: str
    phone: str
    password: str
    college: str


class AdminUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    college: str | None = None

# ================= HOD =================
class HODCreateRequest(BaseModel):
    id: str
    name: str
    phone: str
    years: List[int]
    college: str
    course: str
    password: str


class HODUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    years: Optional[List[int]] = None
    course: Optional[str] = None
    college: Optional[str] = None
    password: Optional[str] = None


class HODFilterRequest(BaseModel):
    college: Optional[str] = None
    years: Optional[List[int]] = None
    course: Optional[str] = None


# ================= STUDENT =================
# 🔐 ADMIN / SUPER_ADMIN → CREATE STUDENT (NO FACE)
class StudentCreateRequest(BaseModel):
    id: str
    name: str
    phone: str
    admission_year: int
    current_semester: int
    course: str
    section: str
    college: str
    password: str
    created_by: str


# 👤 STUDENT → REGISTER FACE AFTER LOGIN
class StudentFaceRegisterRequest(BaseModel):
    student_id: str
    image_b64: str


class StudentUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    admission_year: Optional[int] = None
    current_semester: Optional[int] = None
    course: Optional[str] = None
    section: Optional[str] = None
    password: Optional[str] = None
    image_b64: Optional[str] = None


class StudentFilterRequest(BaseModel):
    college: Optional[str] = None
    admission_year: Optional[int] = None
    current_semester: Optional[int] = None
    course: Optional[str] = None
    section: Optional[str] = None


class PromoteStudentsRequest(BaseModel):
    admission_year: int
    college: str


# ================= GUARD =================
class GuardCreateRequest(BaseModel):
    id: str
    name: str
    phone: str
    password: str
    college: str


class GuardUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


# ================= MENTOR =================
class MentorCreateRequest(BaseModel):
    id: str
    name: str
    phone: str
    department: str
    password: str


class MentorUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None


class MentorAssignmentCreateRequest(BaseModel):
    mentor_id: str
    college: str
    course: str
    section: str
    batch_name: str  # B1 or B2
    semester: int
    academic_year: str
    active_status: Optional[bool] = True
    roll_start: Optional[int] = None
    roll_end: Optional[int] = None
    lateral_entry: Optional[bool] = None


class BatchRuleCreateRequest(BaseModel):
    college: str
    course: str
    section: str
    semester: int
    academic_year: str
    batch_name: str  # B1 or B2
    roll_start: Optional[int] = None
    roll_end: Optional[int] = None
    lateral_entry: Optional[bool] = None


# ================= FACE =================
class FaceReplaceRequest(BaseModel):
    user_id: str
    user_type: str
    image_b64: str


class FaceVerifyRequest(BaseModel):
    user_id: str
    image_b64: str


class FaceValidateRequest(BaseModel):
    image_b64: str


# ================= REQUESTS =================
class RequestCreate(BaseModel):
    student_id: str
    reason: str
    # semester and academic_year derived from student record


class ApproveRequestBody(BaseModel):
    hod_id: str
    hod_name: str


class RejectRequestBody(BaseModel):
    hod_id: str
    hod_name: str


class MentorApproveRequestBody(BaseModel):
    mentor_id: str
    mentor_name: str
    remark: str | None = None
    parent_contacted: bool | None = None


class MentorRejectRequestBody(BaseModel):
    mentor_id: str
    mentor_name: str
    remark: str

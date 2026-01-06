from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class Request(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    student_id: str
    student_name: str
    admission_year: int
    current_semester: int
    course: str
    section: str
    college: str

    
    # Request metadata
    request_time: datetime
    reason: str
    semester: int
    academic_year: str

    # Mentor stage
    mentor_id: Optional[str] = None
    mentor_name: Optional[str] = None
    mentor_status: Optional[Literal["PENDING", "APPROVED", "REJECTED"]] = None
    mentor_remark: Optional[str] = None
    mentor_parent_contacted: Optional[bool] = None
    mentor_action_time: Optional[datetime] = None

    # HOD stage
    hod_id: Optional[str] = None
    hod_name: Optional[str] = None
    hod_action_time: Optional[datetime] = None
    approval_time: Optional[datetime] = None
    rejection_time: Optional[datetime] = None

    # Guard stage
    exit_mark_time: Optional[datetime] = None

    status: Literal[
        "PENDING_MENTOR",
        "PENDING_HOD",
        "APPROVED",
        "REJECTED",
        "EXIT_ALLOWED",
        "UNCHECKED",
        "APPROVED_NOT_LEFT"
    ]

    class Config:
        populate_by_name = True

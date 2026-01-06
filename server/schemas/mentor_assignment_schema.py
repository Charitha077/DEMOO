from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MentorAssignment(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    mentor_id: str  # mentor_emp_id
    college: str
    course: str
    section: str
    batch_name: str  # B1 or B2
    semester: int
    academic_year: str
    active_status: bool = True
    # optional roll bounds if needed for finer-grain batching
    roll_start: Optional[int] = None
    roll_end: Optional[int] = None
    lateral_entry: Optional[bool] = None
    
    # ✅ Locking mechanism: HOD can't change mid-semester, only admin can unlock
    locked_at: Optional[datetime] = None  # Timestamp when assignment became locked
    locked_by: Optional[str] = None  # User ID of who locked it (usually system on creation)
    
    class Config:
        populate_by_name = True

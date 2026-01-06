from pydantic import BaseModel, Field
from typing import Optional

class BatchRule(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    college: str
    course: str
    section: str
    semester: int
    academic_year: str
    batch_name: str  # B1 or B2
    roll_start: Optional[int] = None
    roll_end: Optional[int] = None
    lateral_entry: Optional[bool] = None

    class Config:
        populate_by_name = True

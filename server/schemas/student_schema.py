from pydantic import BaseModel, Field
from typing import Optional, Literal

class Student(BaseModel):
    id: str = Field(alias="_id")
    name: str
    phone: str

    admission_year: int  # year student joined (e.g., 2022)
    current_semester: int  # updated on promotion
    course: str
    section: str
    college: Literal["KMIT", "KMEC", "NGIT"]

    created_by: str
    password_hash: str

    face_id: Optional[str] = None  # ✅ Face added later

    class Config:
        populate_by_name = True

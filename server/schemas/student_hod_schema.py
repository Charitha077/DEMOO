from pydantic import BaseModel

class StudentHod(BaseModel):
    student_id: str
    hod_id: str
    year: int
    course: str
    college: str

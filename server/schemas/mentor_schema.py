from pydantic import BaseModel, Field
from typing import Optional

class Mentor(BaseModel):
    id: str = Field(alias="_id")  # employee_id = login id (single ID)
    name: str
    phone: str
    department: str
    password_hash: str

    class Config:
        populate_by_name = True

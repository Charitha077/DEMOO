from pydantic import BaseModel, Field
from typing import Literal

class Guard(BaseModel):
    id: str = Field(alias="_id")
    name: str
    phone: str
    password_hash: str
    college: Literal["KMIT", "KMEC", "NGIT"]  # Added this line

    class Config:
        populate_by_name = True
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Face(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    user_type: str   # STUDENT 

    image_data: bytes
    vector_ref: str

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

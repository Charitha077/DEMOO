from pydantic import BaseModel, Field
from typing import List

class FaceVector(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    embedding: List[float]

    class Config:
        populate_by_name = True

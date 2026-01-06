from pydantic import BaseModel, Field

class SuperAdmin(BaseModel):
    id: str = Field(alias="_id")
    name: str
    phone: str
    password_hash: str

    class Config:
        populate_by_name = True

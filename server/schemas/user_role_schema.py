from pydantic import BaseModel

class UserRole(BaseModel):
    user_id: str
    role_id: str

from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    full_name: str
    role: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    region: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    role: str
    institution_id: Optional[str] = None
    region: Optional[str] = None
    is_active: bool

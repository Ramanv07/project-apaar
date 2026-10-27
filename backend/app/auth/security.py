from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import jwt
from passlib.context import CryptContext
from backend.app.config import settings

# Using pbkdf2_sha256 for robust cross-platform stability without external C compiler requirements
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str | Any, role: str, institution_id: Optional[str] = None, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "institution_id": institution_id,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded_token
    except Exception:
        return None

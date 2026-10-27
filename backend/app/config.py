import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "TrustSeat - AICTE Student Data & Quota Verification Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "trustseat-aicte-sih2026-secure-key-32chars")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # SQLite default, Postgres ready
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trustseat.db")
    
    POLICY_DIR: str = os.getenv("POLICY_DIR", "./backend/rules")

settings = Settings()

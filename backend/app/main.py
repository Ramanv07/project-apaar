from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
import backend.app.models # Load all models
from backend.app.routes import (
    auth,
    institutions,
    admissions,
    quota,
    two_key,
    review,
    verifier,
    audit
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Regulatory Portal for APAAR ID-Based Student Data Management and Quota Verification for AICTE-Approved Institutions (SIH 2026 Problem 26263).",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(institutions.router, prefix=settings.API_V1_STR)
app.include_router(admissions.router, prefix=settings.API_V1_STR)
app.include_router(quota.router, prefix=settings.API_V1_STR)
app.include_router(two_key.router, prefix=settings.API_V1_STR)
app.include_router(review.router, prefix=settings.API_V1_STR)
app.include_router(verifier.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": "TrustSeat AICTE Portal API",
        "regulatory_framework": "All India Council for Technical Education (AICTE)",
        "problem_statement": "SIH 2026 Problem Statement 26263",
        "documentation": "/api/docs",
        "disclaimer": "Synthetic dataset. Prototype built for Smart India Hackathon 2026."
    }

@app.get("/health")
def health():
    return {"status": "HEALTHY", "database": "CONNECTED"}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.institution import Institution
from backend.app.auth.security import verify_password, create_access_token
from backend.app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from backend.app.auth.dependencies import get_current_user, record_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Verify credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    inst_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            inst_name = inst.name

    token = create_access_token(
        subject=user.username,
        role=user.role,
        institution_id=user.institution_id
    )

    record_audit(
        db=db,
        user=user,
        action="USER_LOGIN_SUCCESS",
        entity_type="USER",
        entity_id=user.id,
        details={"username": user.username, "role": user.role}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        institution_name=inst_name,
        region=user.region
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        institution_id=current_user.institution_id,
        region=current_user.region,
        is_active=current_user.is_active
    )

@router.get("/quick-switch/{role}", response_model=TokenResponse)
def quick_switch_role(role: str, db: Session = Depends(get_db)):
    """
    Evaluator convenience endpoint for SIH 2026 juries to switch instantly between roles
    """
    role_upper = role.upper()
    user = db.query(User).filter(User.role == role_upper).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No demo user provisioned for role '{role}'")

    inst_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            inst_name = inst.name

    token = create_access_token(
        subject=user.username,
        role=user.role,
        institution_id=user.institution_id
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        institution_name=inst_name,
        region=user.region
    )

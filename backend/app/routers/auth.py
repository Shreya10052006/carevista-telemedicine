"""
Authentication Router
=====================
Handles Firebase token verification and user profile endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional

from app.services.firebase_admin import (
    verify_firebase_token,
    get_user_role,
)

router = APIRouter()


async def get_current_user(authorization: str = Header(...)):
    """
    Dependency to verify Firebase token and get current user.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        decoded = await verify_firebase_token(token)
        return decoded
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


async def require_doctor_role(user: dict = Depends(get_current_user)):
    """Dependency to require doctor role."""
    role = await get_user_role(user["uid"])
    if role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required")
    return user


async def require_patient_role(user: dict = Depends(get_current_user)):
    """Dependency to require patient or health_worker role."""
    role = await get_user_role(user["uid"])
    if role not in ["patient", "health_worker"]:
        raise HTTPException(status_code=403, detail="Patient access required")
    return user


async def require_lab_technician_role(user: dict = Depends(get_current_user)):
    """Dependency to require lab_technician role."""
    role = await get_user_role(user["uid"])
    if role != "lab_technician":
        raise HTTPException(status_code=403, detail="Lab technician access required")
    return user


class UserProfileResponse(BaseModel):
    uid: str
    role: Optional[str]
    email: Optional[str]
    phone_number: Optional[str]


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Get current user's profile and role."""
    role = await get_user_role(user["uid"])
    
    return UserProfileResponse(
        uid=user["uid"],
        role=role,
        email=user.get("email"),
        phone_number=user.get("phone_number"),
    )


@router.get("/verify")
async def verify_token(user: dict = Depends(get_current_user)):
    """Verify if the current token is valid."""
    return {"valid": True, "uid": user["uid"]}

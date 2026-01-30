"""
Teleconsultation Router
=======================
WebRTC token generation for Agora-based video/audio calls.

SECURITY:
- Tokens are appointment-bound
- Time-limited access
- Audio-first configuration
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
import time

from app.routers.auth import get_current_user
from app.config import get_settings

# Agora token builder (install separately if needed)
try:
    from agora_token_builder import RtcTokenBuilder, Role_Publisher
    AGORA_AVAILABLE = True
except ImportError:
    AGORA_AVAILABLE = False

router = APIRouter()
settings = get_settings()


class TelemedTokenResponse(BaseModel):
    token: str
    channel: str
    uid: int
    expiresAt: int


@router.get("/{appointment_id}/token", response_model=TelemedTokenResponse)
async def get_telemed_token(
    appointment_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Generate WebRTC token for teleconsultation.
    
    SECURITY:
    - Token is bound to specific appointment
    - Token expires in 1 hour
    - User UID encoded in token
    """
    if not AGORA_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Teleconsultation service not available"
        )
    
    if not settings.agora_app_id or not settings.agora_app_certificate:
        raise HTTPException(
            status_code=503,
            detail="Teleconsultation not configured"
        )
    
    # TODO: Verify appointment exists and user is a participant
    # For now, we'll generate token for any authenticated user
    
    # Generate unique UID for this user in this channel
    # Using hash of user UID to get consistent numeric ID
    user_uid = hash(user["uid"]) % 100000
    
    # Channel name is appointment ID
    channel = f"appointment-{appointment_id}"
    
    # Token expires in 1 hour
    expire_time = int(time.time()) + 3600
    
    try:
        token = RtcTokenBuilder.buildTokenWithUid(
            settings.agora_app_id,
            settings.agora_app_certificate,
            channel,
            user_uid,
            Role_Publisher,
            expire_time,
        )
        
        return TelemedTokenResponse(
            token=token,
            channel=channel,
            uid=user_uid,
            expiresAt=expire_time,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate token: {str(e)}"
        )


@router.post("/{appointment_id}/end")
async def end_teleconsultation(
    appointment_id: str,
    user: dict = Depends(get_current_user),
):
    """
    End a teleconsultation session.
    This is for cleanup and logging purposes.
    """
    # TODO: Log session end, update appointment status
    return {"status": "ended", "appointmentId": appointment_id}

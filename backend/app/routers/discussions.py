"""
Discussion Wall Router
======================
Doctor-only professional discussion space.

╔══════════════════════════════════════════════════════════════════╗
║                    STRICT DATA ISOLATION                          ║
╠══════════════════════════════════════════════════════════════════╣
║ DISCUSSIONS ARE STORED OUTSIDE PATIENT-LINKED TABLES              ║
║                                                                   ║
║ ABSOLUTELY FORBIDDEN:                                             ║
║ ✗ Patient names                                                   ║
║ ✗ Patient IDs                                                     ║
║ ✗ Images, reports, or scans                                       ║
║ ✗ Case details that could identify a patient                      ║
║ ✗ Live consultation discussion                                    ║
║ ✗ References to visit IDs or timestamps                           ║
║                                                                   ║
║ ALLOWED:                                                          ║
║ ✓ Hypothetical cases                                              ║
║ ✓ General symptoms                                                ║
║ ✓ Academic discussion                                             ║
║ ✓ "In my experience..." discussions                               ║
╚══════════════════════════════════════════════════════════════════╝
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import re

from app.services.firebase_admin import get_firestore_client
from app.routers.auth import require_doctor_role

router = APIRouter(prefix="/discussions", tags=["discussions"])


# Patterns that might indicate patient identification
# These are checked to prevent accidental re-identification
IDENTIFIER_PATTERNS = [
    r'\b[A-Z0-9]{8,}\b',  # IDs that look like patient/visit IDs
    r'\b\d{4}-\d{2}-\d{2}\b',  # Dates that might identify visits
    r'\b\d{10,}\b',  # Phone numbers or long IDs
    r'patient\s+(id|uid|number)',  # Explicit patient ID mentions
    r'consultation\s+(id|uid)',  # Consultation ID mentions
    r'visit\s+(id|uid)',  # Visit ID mentions
]


def check_for_identifiers(text: str) -> bool:
    """
    Check if text contains patterns that might identify patients.
    """
    text_lower = text.lower()
    for pattern in IDENTIFIER_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True
    return False


class DiscussionPost(BaseModel):
    """Discussion post model."""
    title: str
    content: str
    category: str = "general"  # general, academic, experience


class DiscussionReply(BaseModel):
    """Reply to a discussion."""
    content: str


class DiscussionResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    author_name: str  # Display name, not UID
    reply_count: int
    created_at: datetime


@router.post("/", response_model=DiscussionResponse)
async def create_discussion(
    post: DiscussionPost,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Create a new discussion post.
    
    SAFETY CHECK: Content is scanned for potential patient identifiers.
    """
    # Check for potential identifiers
    if check_for_identifiers(post.title) or check_for_identifiers(post.content):
        raise HTTPException(
            status_code=400,
            detail="Content appears to contain patient identifiers or dates. "
                   "Please use hypothetical examples without identifiable information."
        )
    
    db = get_firestore_client()
    
    now = datetime.utcnow()
    post_id = f"disc-{now.timestamp()}"
    
    # Get doctor's display name (not UID)
    doctor_doc = db.collection("users").document(doctor["uid"]).get()
    doctor_name = "Anonymous Doctor"
    if doctor_doc.exists:
        doctor_name = doctor_doc.to_dict().get("displayName", "Doctor")
    
    # Store in discussions collection (NOT linked to patients)
    post_data = {
        "id": post_id,
        "title": post.title,
        "content": post.content,
        "category": post.category,
        "author_uid": doctor["uid"],
        "author_name": doctor_name,
        "reply_count": 0,
        "created_at": now,
        "updated_at": now,
        # COMPLIANCE: Explicit data isolation markers
        "patient_linked": False,
        "contains_identifiers": False,
    }
    
    db.collection("discussions").document(post_id).set(post_data)
    
    return DiscussionResponse(
        id=post_id,
        title=post.title,
        content=post.content,
        category=post.category,
        author_name=doctor_name,
        reply_count=0,
        created_at=now,
    )


@router.get("/")
async def list_discussions(
    category: Optional[str] = None,
    limit: int = 20,
    doctor: dict = Depends(require_doctor_role)
):
    """
    List all discussions.
    """
    db = get_firestore_client()
    
    query = db.collection("discussions")
    if category:
        query = query.where("category", "==", category)
    
    docs = query.order_by("created_at", direction="DESCENDING").limit(limit).get()
    
    discussions = []
    for doc in docs:
        data = doc.to_dict()
        discussions.append({
            "id": data.get("id"),
            "title": data.get("title"),
            "content": data.get("content", "")[:200] + "...",  # Preview
            "category": data.get("category"),
            "author_name": data.get("author_name"),
            "reply_count": data.get("reply_count", 0),
            "created_at": data.get("created_at"),
        })
    
    return {
        "discussions": discussions,
        "disclaimer": "This is a professional discussion space. Do not share patient-identifiable information."
    }


@router.get("/{post_id}")
async def get_discussion(
    post_id: str,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Get a single discussion with replies.
    """
    db = get_firestore_client()
    
    doc = db.collection("discussions").document(post_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    data = doc.to_dict()
    
    # Get replies
    replies_docs = db.collection("discussions").document(post_id)\
        .collection("replies").order_by("created_at").get()
    
    replies = []
    for reply_doc in replies_docs:
        reply_data = reply_doc.to_dict()
        replies.append({
            "id": reply_doc.id,
            "content": reply_data.get("content"),
            "author_name": reply_data.get("author_name"),
            "created_at": reply_data.get("created_at"),
        })
    
    return {
        "post": {
            "id": data.get("id"),
            "title": data.get("title"),
            "content": data.get("content"),
            "category": data.get("category"),
            "author_name": data.get("author_name"),
            "created_at": data.get("created_at"),
        },
        "replies": replies,
        "disclaimer": "This is a professional discussion space. All information is hypothetical."
    }


@router.post("/{post_id}/reply")
async def add_reply(
    post_id: str,
    reply: DiscussionReply,
    doctor: dict = Depends(require_doctor_role)
):
    """
    Add a reply to a discussion.
    """
    # Check for identifiers
    if check_for_identifiers(reply.content):
        raise HTTPException(
            status_code=400,
            detail="Reply appears to contain patient identifiers. "
                   "Please use hypothetical examples."
        )
    
    db = get_firestore_client()
    
    # Verify post exists
    post_doc = db.collection("discussions").document(post_id).get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    # Get doctor's display name
    doctor_doc = db.collection("users").document(doctor["uid"]).get()
    doctor_name = "Doctor"
    if doctor_doc.exists:
        doctor_name = doctor_doc.to_dict().get("displayName", "Doctor")
    
    now = datetime.utcnow()
    reply_id = f"reply-{now.timestamp()}"
    
    # Add reply
    reply_data = {
        "id": reply_id,
        "content": reply.content,
        "author_uid": doctor["uid"],
        "author_name": doctor_name,
        "created_at": now,
        "contains_identifiers": False,
    }
    
    db.collection("discussions").document(post_id)\
        .collection("replies").document(reply_id).set(reply_data)
    
    # Increment reply count
    current_count = post_doc.to_dict().get("reply_count", 0)
    db.collection("discussions").document(post_id).update({
        "reply_count": current_count + 1,
        "updated_at": now,
    })
    
    return {"status": "replied", "reply_id": reply_id}

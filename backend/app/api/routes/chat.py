"""AI Assistant chat routes."""

import secrets
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import select

from app.core.deps import DbSession, CurrentUser
from app.models.operations import ChatMessage, KbEntry

router = APIRouter()


# ── Schemas ──

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


# ── Send message ──

@router.post("")
async def send_chat(body: ChatRequest, db: DbSession, user: CurrentUser):
    """Process a chat message and return an AI assistant response."""
    session_id = body.session_id or secrets.token_hex(16)

    # Store user message
    user_msg = ChatMessage(
        user_id=user["id"],
        session_id=session_id,
        direction="USER",
        text=body.message,
    )
    db.add(user_msg)

    # Simple keyword-based KB lookup (simulated AI)
    response_text, confidence, source_ids = await _generate_response(db, body.message, user["role"])

    # Store assistant response
    assistant_msg = ChatMessage(
        user_id=user["id"],
        session_id=session_id,
        direction="ASSISTANT",
        text=response_text,
        confidence=confidence,
        source_ids=str(source_ids) if source_ids else None,
    )
    db.add(assistant_msg)
    await db.commit()

    return {
        "session_id": session_id,
        "response": response_text,
        "confidence": confidence,
        "source_ids": source_ids,
        "related_questions": _get_related_questions(body.message),
    }


# ── Get chat history ──

@router.get("/history")
async def chat_history(
    db: DbSession,
    user: CurrentUser,
    session_id: Optional[str] = None,
):
    query = select(ChatMessage).where(ChatMessage.user_id == user["id"])
    if session_id:
        query = query.where(ChatMessage.session_id == session_id)
    query = query.order_by(ChatMessage.created_at.asc()).limit(100)

    result = await db.execute(query)
    messages = result.scalars().all()

    return [
        {
            "id": m.id,
            "session_id": m.session_id,
            "direction": m.direction,
            "text": m.text,
            "confidence": m.confidence,
            "feedback": m.feedback,
            "created_at": str(m.created_at),
        }
        for m in messages
    ]


# ── Submit feedback ──

@router.post("/{message_id}/feedback")
async def submit_feedback(message_id: str, feedback: str, db: DbSession, user: CurrentUser):
    result = await db.execute(select(ChatMessage).where(ChatMessage.id == message_id))
    msg = result.scalar_one_or_none()
    if msg:
        msg.feedback = feedback
        await db.commit()
    return {"message": "Feedback recorded"}


# ── KB search ──

@router.get("/kb")
async def search_kb(
    db: DbSession,
    user: CurrentUser,
    q: str = Query("", min_length=1),
):
    query = select(KbEntry).where(
        KbEntry.active == True,
        (KbEntry.title.contains(q)) | (KbEntry.content.contains(q)) | (KbEntry.keywords.contains(q))
    ).limit(10)

    result = await db.execute(query)
    entries = result.scalars().all()

    return [
        {
            "id": e.id,
            "category": e.category,
            "title": e.title,
            "content": e.content[:300] + "..." if len(e.content) > 300 else e.content,
        }
        for e in entries
    ]


# ── Helpers ──

async def _generate_response(db, message: str, role: str) -> tuple[str, float, list]:
    """Simulated AI response using KB lookup."""
    msg_lower = message.lower()

    # Search KB for relevant entries
    result = await db.execute(
        select(KbEntry).where(KbEntry.active == True).limit(50)
    )
    entries = result.scalars().all()

    best_match = None
    best_score = 0

    for entry in entries:
        keywords = (entry.keywords or "").lower().split(",")
        score = sum(1 for kw in keywords if kw.strip() in msg_lower)
        if entry.title.lower() in msg_lower:
            score += 3
        if score > best_score:
            best_score = score
            best_match = entry

    if best_match and best_score >= 1:
        return best_match.content, 0.85, [best_match.id]

    # Fallback responses
    fallback_map = {
        "deadline": "Application deadlines are set per AICTE academic calendar. The current cycle deadline can be viewed in your application dashboard. Contact your institution admin for specific dates.",
        "document": "Required documents vary by application category. Navigate to 'New Application' to see the category-specific checklist. Each document must be uploaded as PDF, max 15MB.",
        "status": "You can track your application status on the Applications page. Statuses flow: Draft → Submitted → AI Review → Officer Review → Approved/Rejected.",
        "risk": "Risk scores are calculated based on document authenticity, compliance gaps, cross-verification results, institutional history, and anomaly detection. Scores range from 0-100.",
        "finding": "Findings are AI-generated observations that require human review. Officers can Accept, Dismiss, Escalate, or Request Rectification for each finding.",
    }

    for keyword, resp in fallback_map.items():
        if keyword in msg_lower:
            return resp, 0.70, []

    return (
        "I can help you with questions about AICTE application processes, document requirements, "
        "compliance rules, and platform features. Could you please provide more details about what you need?\n\n"
        "*Note: This is an AI-generated decision-support response (Simulated).*",
        0.50,
        [],
    )


def _get_related_questions(message: str) -> list[str]:
    """Return contextually related questions."""
    msg_lower = message.lower()
    all_questions = [
        "What documents are required for a new institution application?",
        "How is the risk score calculated?",
        "What happens after my application is submitted?",
        "How do I respond to a deficiency notice?",
        "What are the SLA timelines for application processing?",
        "How does the duplicate document detection work?",
        "Can I update documents after submission?",
        "What does each finding severity level mean?",
    ]
    # Return 3 questions that don't overlap with the current message
    return [q for q in all_questions if not any(w in q.lower() for w in msg_lower.split())][:3]

from fastapi import APIRouter
from backend.app.models import ChatRequest, ChatResponse
from backend.app.pipeline.orchestrator import process_chat_turn, clear_session_profile

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
def chat_turn(payload: ChatRequest):
    """
    Main conversational endpoint for NagrikAI.
    Executes the grounded 8-step pipeline with session profile tracking.
    """
    return process_chat_turn(payload)


@router.delete("/session/{session_id}")
def reset_session(session_id: str):
    """
    Clears the active session profile.
    """
    clear_session_profile(session_id)
    return {"status": "cleared", "session_id": session_id}

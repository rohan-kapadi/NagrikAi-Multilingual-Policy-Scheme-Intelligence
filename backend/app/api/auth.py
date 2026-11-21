"""
Phase 9: Auth API — signup, login, logout, /me
Uses bcrypt for password hashing and PyJWT for session tokens.
Token sent as Authorization: Bearer <token> header.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone

from backend.app.db import create_user, get_user_by_email, get_user_by_id, init_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

# JWT config — use env var in production
JWT_SECRET = os.getenv("JWT_SECRET", "nagrik-ai-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72


# ── Pydantic Models ──────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    name: str
    password: str
    preferred_language: str = "en"

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Please enter a valid email address.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    preferred_language: str
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut


# ── Helpers ──────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Returns user_id or None if invalid/expired."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Optional[dict]:
    """Dependency: returns user dict if token is valid, None if no token."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    user_id = decode_token(token)
    if not user_id:
        return None
    return get_user_by_id(user_id)


def require_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    """Dependency: raises 401 if not authenticated."""
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    return user


# ── Routes ───────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    init_db()
    # Check duplicate email
    existing = get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    hashed = hash_password(req.password)
    user = create_user(
        email=req.email,
        name=req.name,
        hashed_password=hashed,
        preferred_language=req.preferred_language,
    )
    token = create_token(user["id"])
    return AuthResponse(
        token=token,
        user=UserOut(**{k: user[k] for k in UserOut.model_fields}),
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    init_db()
    user = get_user_by_email(req.email.strip().lower())
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token(user["id"])
    return AuthResponse(
        token=token,
        user=UserOut(**{k: user[k] for k in UserOut.model_fields}),
    )


@router.get("/me", response_model=UserOut)
def me(user: dict = Depends(require_current_user)):
    return UserOut(**{k: user[k] for k in UserOut.model_fields})


@router.post("/logout")
def logout():
    # Token-based auth — client just discards token
    return {"status": "logged out"}

"""
Phase 9: SQLite database layer for user auth and negotiated memory.
Uses Python's built-in sqlite3 — no extra dependencies.
"""
import sqlite3
import uuid
import os
from typing import Optional, List, Dict, Any
from datetime import datetime

# DB file location
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "nagrik.db")
DB_PATH = os.path.normpath(DB_PATH)


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create all tables if they don't exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = _get_conn()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        preferred_language TEXT DEFAULT 'en',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        source TEXT DEFAULT 'chat',
        approved INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, key)
    );
    """)
    conn.commit()
    conn.close()


# ── User CRUD ──────────────────────────────────────────────

def create_user(email: str, name: str, hashed_password: str, preferred_language: str = "en") -> Dict[str, Any]:
    conn = _get_conn()
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    try:
        conn.execute(
            "INSERT INTO users (id, email, name, hashed_password, preferred_language, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email.lower().strip(), name.strip(), hashed_password, preferred_language, now)
        )
        conn.commit()
    finally:
        conn.close()
    return {"id": user_id, "email": email, "name": name, "preferred_language": preferred_language, "created_at": now}


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


# ── Memory CRUD ────────────────────────────────────────────

def get_memory(user_id: str) -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM memory_entries WHERE user_id = ? AND approved = 1 ORDER BY updated_at DESC",
            (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_memory_as_profile(user_id: str) -> Dict[str, Any]:
    """Returns memory as a flat dict suitable for merging into CitizenProfile."""
    entries = get_memory(user_id)
    result: Dict[str, Any] = {}
    for entry in entries:
        key = entry["key"]
        raw_val = entry["value"]
        # Try to parse numeric values back
        try:
            val = int(raw_val)
        except (ValueError, TypeError):
            try:
                val = float(raw_val)
            except (ValueError, TypeError):
                val = raw_val
        result[key] = val
    return result


def upsert_memory_entry(user_id: str, key: str, value: Any, source: str = "chat") -> Dict[str, Any]:
    """Insert or update a memory entry. Value is stored as string."""
    conn = _get_conn()
    entry_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    str_value = str(value)
    try:
        # Try update first
        cur = conn.execute(
            "UPDATE memory_entries SET value = ?, source = ?, updated_at = ? WHERE user_id = ? AND key = ?",
            (str_value, source, now, user_id, key)
        )
        if cur.rowcount == 0:
            conn.execute(
                "INSERT INTO memory_entries (id, user_id, key, value, source, approved, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
                (entry_id, user_id, key, str_value, source, now, now)
            )
        conn.commit()
        row = conn.execute("SELECT * FROM memory_entries WHERE user_id = ? AND key = ?", (user_id, key)).fetchone()
        return dict(row)
    finally:
        conn.close()


def update_memory_entry(entry_id: str, user_id: str, value: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    now = datetime.utcnow().isoformat()
    try:
        conn.execute(
            "UPDATE memory_entries SET value = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            (value, now, entry_id, user_id)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM memory_entries WHERE id = ?", (entry_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def delete_memory_entry(entry_id: str, user_id: str) -> bool:
    conn = _get_conn()
    try:
        cur = conn.execute("DELETE FROM memory_entries WHERE id = ? AND user_id = ?", (entry_id, user_id))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def clear_all_memory(user_id: str):
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM memory_entries WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()

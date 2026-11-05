import hashlib
import hmac
import os
import secrets
from datetime import datetime, timezone
from functools import wraps
from typing import Any

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # Optional locally; production enables it through requirements.txt.
    psycopg = None
    dict_row = None


SCHEMA = """
CREATE TABLE IF NOT EXISTS site_visits (
    id BIGSERIAL PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT
);
CREATE INDEX IF NOT EXISTS site_visits_visited_at_idx ON site_visits (visited_at DESC);
CREATE INDEX IF NOT EXISTS site_visits_visitor_id_idx ON site_visits (visitor_id);

CREATE TABLE IF NOT EXISTS laddu_questions (
    id BIGSERIAL PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    asked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    question TEXT NOT NULL,
    reply TEXT,
    success BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS laddu_questions_asked_at_idx ON laddu_questions (asked_at DESC);
"""


def configured() -> bool:
    return bool(os.getenv("DATABASE_URL")) and psycopg is not None


def _connect():
    if not configured():
        return None
    return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)


def ensure_schema() -> None:
    if not configured():
        return
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(SCHEMA)
            connection.commit()
    except Exception:
        # Analytics must never make the public portfolio unavailable.
        return


def visitor_id(existing: str | None) -> str:
    if existing and len(existing) <= 64:
        return existing
    return secrets.token_urlsafe(24)


def record_visit(visitor: str, path: str, referrer: str | None, user_agent: str | None) -> None:
    if not configured():
        return
    try:
        with _connect() as connection:
            connection.execute(
                "INSERT INTO site_visits (visitor_id, path, referrer, user_agent) VALUES (%s, %s, %s, %s)",
                (visitor, path[:200], (referrer or "")[:500] or None, (user_agent or "")[:500] or None),
            )
            connection.commit()
    except Exception:
        return


def record_question(visitor: str, question: str, reply: str | None, success: bool) -> None:
    if not configured():
        return
    try:
        with _connect() as connection:
            connection.execute(
                "INSERT INTO laddu_questions (visitor_id, question, reply, success) VALUES (%s, %s, %s, %s)",
                (visitor, question[:500], (reply or "")[:4000] or None, success),
            )
            connection.commit()
    except Exception:
        return


def _query(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    if not configured():
        return []
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                return cursor.fetchall()
    except Exception:
        return []


def summary() -> dict[str, Any]:
    rows = _query(
        """
        SELECT
          (SELECT COUNT(*) FROM site_visits) AS visits,
          (SELECT COUNT(DISTINCT visitor_id) FROM site_visits) AS visitors,
          (SELECT COUNT(*) FROM laddu_questions) AS questions,
          (SELECT COUNT(*) FROM laddu_questions WHERE success) AS answered
        """
    )
    return rows[0] if rows else {"visits": 0, "visitors": 0, "questions": 0, "answered": 0}


def recent_questions(limit: int = 100) -> list[dict[str, Any]]:
    rows = _query(
        "SELECT asked_at, question, reply, success FROM laddu_questions ORDER BY asked_at DESC LIMIT %s",
        (limit,),
    )
    for row in rows:
        row["time_iso"] = row["asked_at"].isoformat() if row.get("asked_at") else ""
    return rows


def recent_visits(limit: int = 100) -> list[dict[str, Any]]:
    rows = _query(
        "SELECT visited_at, path, referrer, user_agent FROM site_visits ORDER BY visited_at DESC LIMIT %s",
        (limit,),
    )
    for row in rows:
        row["time_iso"] = row["visited_at"].isoformat() if row.get("visited_at") else ""
        row["browser_label"] = browser_label(row.get("user_agent"))
        row["referrer_label"] = referrer_label(row.get("referrer"))
    return rows


def clear_data() -> bool:
    """Delete analytics rows but keep the tables and schema intact."""
    if not configured():
        return False
    try:
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("TRUNCATE TABLE laddu_questions, site_visits RESTART IDENTITY")
            connection.commit()
        return True
    except Exception:
        return False


def browser_label(user_agent: str | None) -> str:
    value = (user_agent or "").lower()
    if "go-http-client" in value:
        return "Automated check"
    if "edg/" in value:
        return "Microsoft Edge"
    if "chrome" in value and "safari" in value:
        return "Google Chrome"
    if "firefox" in value:
        return "Firefox"
    if "safari" in value:
        return "Safari"
    if "werkzeug" in value:
        return "Local test request"
    return "Unknown browser"


def referrer_label(referrer: str | None) -> str:
    value = (referrer or "").strip()
    if not value:
        return "Direct visit"
    if "linkedin.com" in value.lower():
        return "LinkedIn"
    if "google." in value.lower():
        return "Google"
    if "github.com" in value.lower():
        return "GitHub"
    return value.replace("https://", "").replace("http://", "").rstrip("/")


def basic_auth_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        from flask import Response, request

        username = os.getenv("ANALYTICS_USERNAME")
        password = os.getenv("ANALYTICS_PASSWORD")
        credentials = request.authorization
        valid = bool(
            username
            and password
            and credentials
            and hmac.compare_digest(credentials.username, username)
            and hmac.compare_digest(credentials.password, password)
        )
        if not valid:
            return Response("Authentication required", 401, {"WWW-Authenticate": 'Basic realm="Portfolio analytics"'})
        return view(*args, **kwargs)

    return wrapped

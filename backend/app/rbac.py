# backend/app/rbac.py
import os
import asyncpg
import json
from functools import wraps
from fastapi import Depends, HTTPException, status, Request

DATABASE_URL = os.getenv("DATABASE_URL")

# ---------- DB helpers (tries to reuse an existing pool if available) ----------
async def _get_conn():
    """
    Try to reuse 'app.db.pool' if your project sets it.
    Otherwise open a short-lived connection.
    """
    # If you have a shared pool exported somewhere, use it:
    try:
        # Attempt to import a pool variable from app.db (optional)
        from app import db as _db  # type: ignore
        pool = getattr(_db, "pool", None)
        if pool:
            return await pool.acquire(), pool  # return (conn, pool) so caller can release
    except Exception:
        pass

    # fallback: create a one-off connection
    conn = await asyncpg.connect(DATABASE_URL)
    return conn, None  # pool is None (caller should close conn)

async def _release_conn(conn, pool):
    if pool:
        await pool.release(conn)
    else:
        await conn.close()

# ---------- RBAC lookup functions ----------
async def get_roles_for_user(user_id):
    conn, pool = await _get_conn()
    try:
        rows = await conn.fetch(
            "SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1",
            user_id
        )
        return [r["name"] for r in rows]
    finally:
        await _release_conn(conn, pool)

async def user_has_role(user_id, role_name):
    roles = await get_roles_for_user(user_id)
    return role_name in roles

async def user_has_permission(user_id, permission_name):
    """
    Permissions are granted to roles (role_permissions); users get permissions from roles.
    """
    conn, pool = await _get_conn()
    try:
        row = await conn.fetchrow("""
            SELECT 1 FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            JOIN user_roles ur ON ur.role_id = rp.role_id
            WHERE ur.user_id = $1 AND p.name = $2
            LIMIT 1
        """, user_id, permission_name)
        return bool(row)
    finally:
        await _release_conn(conn, pool)

# ---------- FastAPI dependency factory ----------
def require_permission(permission_name: str):
    """
    Use in endpoints as: Depends(require_permission("users.delete"))
    Expects that your project has a `get_current_user` dependency that returns an object
    with `.id` and `.email` attributes (or adapt accordingly).
    """
    async def _dependency(current_user=Depends(lambda: None)):  # placeholder, overwritten below
        # This gets replaced in `inject_get_current_user` call below when integrating.
        raise HTTPException(status_code=500, detail="RBAC dependency not initialized")
    _dependency.__rbac_permission__ = permission_name
    return _dependency

# ---------- Helper to inject a real get_current_user into the require_permission deps ----------
def inject_get_current_user(get_current_user_callable):
    """
    Call this in your main app startup: inject_get_current_user(get_current_user)
    where get_current_user is the dependency your app already uses.
    """
    def _wrap(require_permission_fn):
        def wrapper(permission_name):
            async def _dep(current_user = Depends(get_current_user_callable)):
                if current_user is None:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
                user_id = getattr(current_user, "id", None) or current_user.get("id")
                if not user_id:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user object")
                ok = await user_has_permission(user_id, permission_name)
                if not ok:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
                return True
            return _dep
        return wrapper
    return _wrap

# ---------- Convenience decorator (sync endpoints) ----------
def requires_permission(permission_name):
    """
    Optional decorator usable on async endpoints for quick protection.
    Example:
      @app.post("/admin/delete")
      @requires_permission("users.delete")
      async def delete_user(...):
          ...
    NOTE: decorator expects the request to have .state.current_user set earlier by your auth middleware.
    Adapt as needed.
    """
    def decorator(fn):
        @wraps(fn)
        async def wrapped(*args, **kwargs):
            # try to extract request and current_user
            req = None
            for a in args:
                if isinstance(a, Request):
                    req = a
                    break
            if req is None:
                # try in kwargs
                req = kwargs.get("request")
            if not req:
                raise HTTPException(status_code=500, detail="No Request found for RBAC check")
            current_user = getattr(req.state, "current_user", None)
            if not current_user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            user_id = getattr(current_user, "id", None) or (current_user.get("id") if isinstance(current_user, dict) else None)
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid user")
            if not await user_has_permission(user_id, permission_name):
                raise HTTPException(status_code=403, detail="Permission denied")
            return await fn(*args, **kwargs)
        return wrapped
    return decorator

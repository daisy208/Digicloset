# backend/app/health.py
from fastapi import APIRouter
import asyncpg
import os

router = APIRouter()

@router.get("/healthz")
async def healthz():
    """Basic health check"""
    return {"status": "ok"}

@router.get("/readyz")
async def readyz():
    """Readiness check: confirms DB connection works"""
    try:
        conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
        await conn.close()
        return {"ready": True}
    except Exception as e:
        return {"ready": False, "error": str(e)}

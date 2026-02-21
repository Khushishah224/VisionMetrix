# app/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import measure

app = FastAPI(title="VisionMetrix Phase 1", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────
app.include_router(measure.router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "VisionMetrix Phase 1 API running", "docs": "/docs"}
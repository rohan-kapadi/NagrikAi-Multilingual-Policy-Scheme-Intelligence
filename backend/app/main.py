from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.schemes import router as schemes_router
from backend.app.api.eligibility import router as eligibility_router
from backend.app.api.chat import router as chat_router
from backend.app.api.notice import router as notice_router
from backend.app.api.auth import router as auth_router
from backend.app.api.memory import router as memory_router
from backend.app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise SQLite DB. Shutdown: nothing to clean up."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual Policy, Rights & Scheme Explainer for Indian citizens",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schemes_router)
app.include_router(eligibility_router)
app.include_router(chat_router)
app.include_router(notice_router)
app.include_router(auth_router)
app.include_router(memory_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "0.2.0"
    }

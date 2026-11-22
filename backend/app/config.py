from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "NagrikAI API"
    APP_ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # LLM Settings
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "groq"
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Embedding Settings
    # Note: all-MiniLM-L6-v2 is ~90MB (fits Render 512MB free tier).
    # multilingual-e5-base (~450MB) can be set via env var on paid plans.
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHROMA_PERSIST_DIR: str = "backend/data/chroma"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

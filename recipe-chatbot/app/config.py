from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Small environment-backed configuration object."""

    def __init__(self) -> None:
        self.data_dir = Path(os.getenv("RECIPE_DATA_DIR", "data"))
        self.collection_name = os.getenv("CHROMA_COLLECTION", "recipes")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.embedding_model = os.getenv(
            "EMBEDDING_MODEL", "text-embedding-3-small"
        )
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "")
        self.top_k = int(os.getenv("RECIPE_TOP_K", "5"))

    @property
    def chroma_dir(self) -> Path:
        return self.data_dir / "chroma"

    @property
    def uploads_dir(self) -> Path:
        return self.data_dir / "uploads"

    def ensure_directories(self) -> None:
        self.chroma_dir.mkdir(parents=True, exist_ok=True)
        self.uploads_dir.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_directories()
    return settings
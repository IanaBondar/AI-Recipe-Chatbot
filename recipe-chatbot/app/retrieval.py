from __future__ import annotations

from pathlib import Path
from typing import Sequence
import hashlib
import math

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from .config import Settings
from .ingestion import recipe_to_documents
from .models import Recipe


class LocalHashEmbeddings(Embeddings):
    """Tiny dependency-free fallback for local demo mode.

    It is not intended to compete with a hosted embedding model, but it gives
    the app a stable semantic-ish index when no API key is configured.
    """

    dimensions = 256

    def _embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = text.lower().split()
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            vector[index] += 1.0
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)


def create_embeddings(settings: Settings) -> Embeddings:
    if settings.openai_api_key:
        kwargs = {
            "model": settings.embedding_model,
            "api_key": settings.openai_api_key,
        }
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        return OpenAIEmbeddings(**kwargs)
    return LocalHashEmbeddings()


def create_vector_store(settings: Settings) -> Chroma:
    """Open the local persistent Chroma collection."""
    try:
        return Chroma(
            collection_name=settings.collection_name,
            persist_directory=str(settings.chroma_dir),
            embedding_function=create_embeddings(settings),
        )
    except Exception as exc:
        raise RuntimeError("The local recipe index could not be initialized.") from exc


def index_recipes(store: Chroma, recipes: Sequence[Recipe]) -> int:
    documents = [doc for recipe in recipes for doc in recipe_to_documents(recipe)]
    if not documents:
        return 0
    store.add_documents(documents)
    return len({doc.metadata["recipe_name"] for doc in documents})


def retrieve_recipes(store: Chroma, query: str, top_k: int) -> list[Document]:
    try:
        return store.similarity_search(query, k=top_k)
    except Exception as exc:
        raise RuntimeError("Recipe search failed. Check the local index and try again.") from exc


def indexed_recipe_names(store: Chroma) -> list[str]:
    try:
        result = store.get(include=["metadatas"])
    except Exception as exc:
        raise RuntimeError("The local recipe index could not be read.") from exc
    names = {
        metadata.get("recipe_name")
        for metadata in result.get("metadatas", [])
        if metadata and metadata.get("recipe_name")
    }
    return sorted(names)


def clear_index(settings: Settings) -> None:
    try:
        store = create_vector_store(settings)
        store.delete_collection()
    except Exception as exc:
        raise RuntimeError("The recipe index could not be cleared.") from exc


def save_uploaded_recipe(settings: Settings, filename: str, content: bytes) -> Path:
    settings.ensure_directories()
    destination = settings.uploads_dir / Path(filename).name
    destination.write_bytes(content)
    return destination
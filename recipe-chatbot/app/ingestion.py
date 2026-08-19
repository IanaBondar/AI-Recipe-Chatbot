from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable

from langchain_core.documents import Document

from .models import Recipe

SUPPORTED_SUFFIXES = {".txt", ".md"}


def _title_from_content(content: str, fallback: str) -> str:
    for line in content.splitlines():
        cleaned = line.strip().lstrip("#").strip()
        if cleaned:
            return cleaned[:120]
    return Path(fallback).stem.replace("_", " ").replace("-", " ").title()


def parse_recipe(content: str, source: str) -> Recipe:
    """Parse flexible text/Markdown recipes without requiring a rigid schema."""
    normalized = content.strip()
    if not normalized:
        raise ValueError("The recipe file is empty.")
    title = _title_from_content(normalized, source)
    time_match = re.search(
        r"(?:cook(?:ing)?|prep(?:aration)?|total)\s*time\s*[:\-]\s*([^\n]+)",
        normalized,
        flags=re.IGNORECASE,
    )
    cuisine_match = re.search(
        r"cuisine\s*[:\-]\s*([^\n]+)", normalized, flags=re.IGNORECASE
    )
    return Recipe(
        name=title,
        source=source,
        content=normalized,
        cooking_time=time_match.group(1).strip() if time_match else None,
        cuisine=cuisine_match.group(1).strip() if cuisine_match else None,
    )


def read_recipe_file(path: Path) -> Recipe:
    if path.suffix.lower() not in SUPPORTED_SUFFIXES:
        raise ValueError(f"Unsupported file type: {path.suffix or 'unknown'}. Use .txt or .md.")
    try:
        return parse_recipe(path.read_text(encoding="utf-8"), path.name)
    except UnicodeDecodeError as exc:
        raise ValueError(f"Could not read {path.name} as UTF-8 text.") from exc


def recipe_to_documents(recipe: Recipe, chunk_size: int = 1200) -> list[Document]:
    words = recipe.content.split()
    chunks: list[Document] = []
    for start in range(0, len(words), chunk_size):
        chunk = " ".join(words[start : start + chunk_size])
        chunks.append(
            Document(
                page_content=chunk,
                metadata={
                    "recipe_name": recipe.name,
                    "source": recipe.source,
                    "cuisine": recipe.cuisine or "",
                    "cooking_time": recipe.cooking_time or "",
                },
            )
        )
    return chunks


def parse_uploaded_files(files: Iterable[tuple[str, bytes]]) -> list[Recipe]:
    recipes: list[Recipe] = []
    for filename, raw_content in files:
        suffix = Path(filename).suffix.lower()
        if suffix not in SUPPORTED_SUFFIXES:
            raise ValueError(f"{filename}: unsupported file type. Use .txt or .md.")
        if not raw_content.strip():
            raise ValueError(f"{filename}: the uploaded file is empty.")
        try:
            text = raw_content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError(f"{filename}: could not read it as UTF-8 text.") from exc
        recipes.append(parse_recipe(text, filename))
    return recipes
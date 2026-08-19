from pathlib import Path

import pytest

from app.ingestion import parse_recipe, parse_uploaded_files, recipe_to_documents


def test_parse_recipe_extracts_flexible_metadata():
    recipe = parse_recipe("# Lemon pasta\n\nCooking time: 20 minutes\n\nBoil pasta.", "pasta.md")
    assert recipe.name == "Lemon pasta"
    assert recipe.cooking_time == "20 minutes"
    assert recipe.source == "pasta.md"


def test_parse_uploaded_files_rejects_empty_and_unsupported_files():
    with pytest.raises(ValueError, match="empty"):
        parse_uploaded_files([("empty.txt", b" ")])
    with pytest.raises(ValueError, match="unsupported"):
        parse_uploaded_files([("photo.jpg", b"data")])


def test_recipe_documents_keep_source_metadata():
    recipe = parse_recipe("Soup\n\nSimmer lentils.", "soup.txt")
    documents = recipe_to_documents(recipe)
    assert documents
    assert documents[0].metadata["recipe_name"] == "Soup"
    assert documents[0].metadata["source"] == "soup.txt"
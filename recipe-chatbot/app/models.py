from typing import Any, TypedDict

from langchain_core.documents import Document
from pydantic import BaseModel, Field


class Recipe(BaseModel):
    name: str
    source: str
    content: str
    cuisine: str | None = None
    cooking_time: str | None = None


class ChatTurn(BaseModel):
    role: str
    content: str


class GraphState(TypedDict, total=False):
    messages: list[ChatTurn]
    user_request: str
    search_query: str
    retrieved: list[Document]
    final_answer: str
    sources: list[str]


class RequestUnderstanding(BaseModel):
    search_query: str = Field(description="A concise semantic search query for recipe retrieval")
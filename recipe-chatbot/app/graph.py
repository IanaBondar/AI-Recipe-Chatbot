from __future__ import annotations

from typing import Callable

from langchain_core.documents import Document
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from .models import ChatTurn, GraphState
from .prompts import REQUEST_PROMPT, RESPONSE_PROMPT
from .retrieval import retrieve_recipes


def _fallback_answer(request: str, documents: list[Document]) -> str:
    if not documents:
        return (
            "I couldn't find a suitable uploaded recipe for that request. "
            "Try uploading a few more recipes and ask again."
        )
    names: list[str] = []
    for document in documents:
        name = document.metadata.get("recipe_name", "Untitled recipe")
        if name not in names:
            names.append(name)
    suggestions = "\n".join(
        f"{index}. **{name}** — this looks like a good match for “{request}”."
        for index, name in enumerate(names[:3], 1)
    )
    return f"Based on your uploaded recipes, I’d start with:\n\n{suggestions}\n\n"


def build_graph(
    store: object,
    top_k: int,
    llm: BaseChatModel | None = None,
    retriever: Callable[[object, str, int], list[Document]] = retrieve_recipes,
):
    def understand_request(state: GraphState) -> GraphState:
        request = state["user_request"]
        if llm is None:
            query = request
        else:
            result = llm.invoke(
                [HumanMessage(content=REQUEST_PROMPT.format(request=request))]
            )
            query = str(result.content).strip() or request
        return {"search_query": query}

    def retrieve_node(state: GraphState) -> GraphState:
        documents = retriever(store, state["search_query"], top_k)
        sources: list[str] = []
        for document in documents:
            name = str(document.metadata.get("recipe_name", "Untitled recipe"))
            if name not in sources:
                sources.append(name)
        return {"retrieved": documents, "sources": sources}

    def generate_response(state: GraphState) -> GraphState:
        documents = state.get("retrieved", [])
        if llm is None:
            answer = _fallback_answer(state["user_request"], documents)
        else:
            context = "\n\n".join(
                f"[{doc.metadata.get('recipe_name', 'Recipe')}]\n{doc.page_content}"
                for doc in documents
            )
            result = llm.invoke(
                [SystemMessage(content=RESPONSE_PROMPT.format(
                    request=state["user_request"], context=context or "(none)"
                ))]
            )
            answer = str(result.content).strip()
        return {"final_answer": answer}

    workflow = StateGraph(GraphState)
    workflow.add_node("understand_request", understand_request)
    workflow.add_node("retrieve_recipes", retrieve_node)
    workflow.add_node("generate_response", generate_response)
    workflow.add_edge(START, "understand_request")
    workflow.add_edge("understand_request", "retrieve_recipes")
    workflow.add_edge("retrieve_recipes", "generate_response")
    workflow.add_edge("generate_response", END)
    return workflow.compile()


def run_chat(graph: object, request: str, history: list[ChatTurn] | None = None) -> GraphState:
    return graph.invoke(
        {"messages": history or [], "user_request": request}
    )
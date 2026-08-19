from langchain_core.documents import Document

from app.graph import build_graph, run_chat


class FakeStore:
    pass


def test_graph_retrieves_and_answers_with_sources():
    calls = []

    def fake_retriever(store, query, top_k):
        calls.append((query, top_k))
        return [Document(page_content="Chicken, coconut milk", metadata={"recipe_name": "Curry"})]

    graph = build_graph(FakeStore(), 5, llm=None, retriever=fake_retriever)
    state = run_chat(graph, "I want something filling with chicken")
    assert calls == [("I want something filling with chicken", 5)]
    assert "Curry" in state["final_answer"]
    assert state["sources"] == ["Curry"]


def test_graph_handles_empty_collection():
    graph = build_graph(FakeStore(), 5, retriever=lambda *_: [])
    state = run_chat(graph, "What can I make?")
    assert "couldn't find" in state["final_answer"]
    assert state["sources"] == []
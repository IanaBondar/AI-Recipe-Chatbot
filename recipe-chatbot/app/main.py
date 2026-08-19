from __future__ import annotations

import streamlit as st
from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.graph import build_graph, run_chat
from app.ingestion import parse_uploaded_files
from app.retrieval import (
    clear_index,
    create_vector_store,
    index_recipes,
    indexed_recipe_names,
    save_uploaded_recipe,
)

st.set_page_config(
    page_title="Kitchen Companion",
    page_icon="🍲",
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_resource
def get_store():
    return create_vector_store(get_settings())


def get_llm():
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    kwargs = {"model": settings.openai_model, "api_key": settings.openai_api_key, "temperature": 0.2}
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return ChatOpenAI(**kwargs)


def reset_chat() -> None:
    st.session_state.messages = []


settings = get_settings()
store = get_store()
if "messages" not in st.session_state:
    st.session_state.messages = []

with st.sidebar:
    st.markdown("## Your recipe shelf")
    st.caption("Upload a few recipes and ask what sounds good tonight.")
    uploads = st.file_uploader(
        "Add recipe files",
        type=["txt", "md"],
        accept_multiple_files=True,
        help="Plain text and Markdown files are supported.",
    )
    if st.button("Index selected recipes", type="primary", use_container_width=True):
        if not uploads:
            st.warning("Choose one or more .txt or .md files first.")
        else:
            try:
                recipes = parse_uploaded_files(
                    [(upload.name, upload.getvalue()) for upload in uploads]
                )
                count = index_recipes(store, recipes)
                for recipe in recipes:
                    save_uploaded_recipe(settings, recipe.source, recipe.content.encode("utf-8"))
                st.success(f"Indexed {count} recipe{'s' if count != 1 else ''}.")
                st.cache_resource.clear()
                st.rerun()
            except ValueError as exc:
                st.error(str(exc))
            except RuntimeError as exc:
                st.error(str(exc))

    try:
        names = indexed_recipe_names(store)
    except RuntimeError as exc:
        names = []
        st.error(str(exc))
    st.metric("Recipes indexed", len(names))
    if names:
        with st.expander("On the shelf", expanded=False):
            for name in names:
                st.write(f"• {name}")
    if st.button("Clear recipe shelf", use_container_width=True):
        try:
            clear_index(settings)
            st.cache_resource.clear()
            reset_chat()
            st.success("Recipe shelf cleared.")
            st.rerun()
        except RuntimeError as exc:
            st.error(str(exc))

st.markdown("# Kitchen Companion")
st.markdown(
    "A calm place to figure out dinner from the recipes you already love."
)

if not names:
    st.info(
        "Your shelf is empty. Add a few recipe files in the sidebar, then ask me "
        "what to cook."
    )

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if message.get("sources"):
            st.caption("Sources: " + " · ".join(message["sources"]))

prompt = st.chat_input("What are you in the mood for?")
if prompt:
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    with st.chat_message("assistant"):
        with st.spinner("Looking through your recipes..."):
            try:
                graph = build_graph(store, settings.top_k, get_llm())
                state = run_chat(graph, prompt)
                st.markdown(state["final_answer"])
                if state.get("sources"):
                    st.caption("Sources: " + " · ".join(state["sources"]))
                st.session_state.messages.append(
                    {
                        "role": "assistant",
                        "content": state["final_answer"],
                        "sources": state.get("sources", []),
                    }
                )
            except Exception:
                st.error(
                    "I couldn't complete that search. Check your API configuration "
                    "or try again with a recipe shelf that has indexed files."
                )
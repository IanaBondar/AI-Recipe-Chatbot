# Kitchen Companion

Kitchen Companion is a small local AI recipe chatbot. Upload plain-text or
Markdown recipes, then ask natural-language questions such as “What can I make
for dinner?”, “I want something light”, or “I have guests tonight”.

It uses semantic retrieval rather than hardcoded categories. With an
OpenAI-compatible API key it uses LangChain and LangGraph for request
understanding and grounded responses. Without a key it still runs in a
deterministic demo mode, so the upload and retrieval flow can be tried locally.

## Architecture

```text
Streamlit chat UI
        |
LangGraph: understand_request -> retrieve_recipes -> generate_response
        |                              |
semantic query                 persistent local Chroma
        |
grounded LLM response
```

Recipes are parsed as flexible text, lightly chunked, and stored in Chroma with
recipe name, source, cuisine, and cooking-time metadata. The response node is
instructed to use only retrieved excerpts and never invent an uploaded recipe.

## Prerequisites

- Python 3.12+
- An OpenAI API key, or another OpenAI-compatible endpoint (optional for demo mode)

## Install and run

```bash
cd recipe-chatbot
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
streamlit run app/main.py
```

Set `OPENAI_API_KEY` in `.env` for natural-language query transformation and
LLM-written recommendations. `OPENAI_BASE_URL` can point to a compatible
provider. The key is never displayed in the UI.

## Use it

1. Open the local Streamlit URL.
2. Upload one or more `.txt` or `.md` recipe files in the sidebar.
3. Select **Index selected recipes**.
4. Ask a question in the chat box.
5. The answer shows the recipe names used as sources.

The `data/example-recipes/` directory contains three recipes for a first run.
Upload those files directly, or copy them into your own recipe folder.

## Example questions

- What can I make for dinner?
- I want something filling but not too complicated.
- Suggest something light and healthy.
- I have guests tonight, what would you recommend?
- I want something with chicken.
- Surprise me.

## Tests

```bash
pytest
```

The tests cover flexible parsing, metadata, chunking, empty uploads, and the
LangGraph flow with mocked retrieval. They do not call an external LLM.

## Known limitations

- Only UTF-8 `.txt` and `.md` files are supported in this first version.
- The local Chroma directory is intentionally not a shared or multi-user database.
- Demo mode can retrieve recipes but gives simpler responses than a configured LLM.
- Retrieval quality depends on the variety and detail of the uploaded recipes.
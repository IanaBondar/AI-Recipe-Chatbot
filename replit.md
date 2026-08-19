# Kitchen Companion

Local Streamlit AI recipe chatbot that uses LangGraph and Chroma to recommend uploaded recipes.

## Run & Operate

- `cd recipe-chatbot && pip install -r requirements.txt && streamlit run app/main.py` — run the recipe chatbot locally
- `cd recipe-chatbot && pytest` — run the Python test suite

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `recipe-chatbot/app/` — Streamlit UI, ingestion, retrieval, prompts, and LangGraph workflow
- `recipe-chatbot/data/example-recipes/` — immediately usable sample recipes
- `recipe-chatbot/tests/` — parsing and graph tests
- `recipe-chatbot/README.md` — local setup and usage guide

## Architecture decisions

- Chroma is persistent and local; no SQL database or user accounts are needed.
- The graph is deliberately three nodes: understand request, retrieve recipes, generate response.
- Without an API key, a deterministic local hash embedding and concise fallback response keep the app usable for demos.

## Product

Users upload text or Markdown recipes, index them locally, ask natural-language dinner questions, and see grounded recommendations with source recipe names.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

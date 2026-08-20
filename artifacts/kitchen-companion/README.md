# Kitchen Companion

Kitchen Companion is a calm, minimal web interface for exploring a personal
recipe shelf and asking what to cook next.

## What it does

- Shows a searchable shelf of indexed recipes.
- Lets you add `.txt` and `.md` recipe files from the browser.
- Persists the recipe shelf in `localStorage`.
- Provides a grounded chat experience based on recipes currently on the shelf.
- Shows which recipes were used as sources for each answer.
- Supports prompt suggestions, source interactions, empty states, and clearing
  the shelf.
- Works responsively on desktop and mobile.

## Run locally

From the workspace root:

```bash
pnpm install
pnpm --filter @workspace/kitchen-companion run dev
```

The app requires the workflow-provided `PORT` and `BASE_PATH` variables when
started through Replit. For a direct Vite run, provide them explicitly:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/kitchen-companion run dev
```

## Build and typecheck

```bash
pnpm --filter @workspace/kitchen-companion run typecheck
pnpm --filter @workspace/kitchen-companion run build
```

## How recipe matching works

The web artifact is currently local-first. It stores recipe text in the
browser, then uses lightweight client-side matching to choose relevant recipes
for a question. It does not send recipe content to an external service.

The companion Python implementation in `recipe-chatbot/` contains the full
LangGraph + Chroma RAG workflow and can use an OpenAI-compatible LLM when
configured. See `recipe-chatbot/README.md` for that setup.

## Design notes

The interface uses a parchment-inspired surface, restrained paprika and sage
accents, an editorial serif display face, and a split shelf/chat layout. The
visual reference is preserved in the `artifacts/mockup-sandbox` component:

`src/components/mockups/recipe-chatbot/Minimal.tsx`

---
name: Chroma embedding configuration
description: Local Chroma versions require an explicit embedding function when documents are added.
---

Chroma should always receive an explicit embedding function. This project uses the configured OpenAI embedding model when a key is present and a deterministic local fallback otherwise.

**Why:** Newer Chroma releases no longer reliably provide a default embedding function, which otherwise fails at indexing time.

**How to apply:** Preserve the provider/fallback split when changing retrieval or upgrading Chroma.
REQUEST_PROMPT = """Turn the user's recipe request into one concise semantic search query.
Preserve preferences, constraints, occasion, ingredients, and tone. Do not invent
categories or recipes. Return only the query text.

User request: {request}
"""

RESPONSE_PROMPT = """You are a helpful recipe companion. Answer the user using only
the uploaded recipe excerpts below. Do not invent recipes, ingredients, timings, or
facts that are not supported by the excerpts. If none are relevant, say so clearly
and recommend uploading more recipes. Keep the answer concise and natural. Mention
recipe names when recommending options and briefly explain why they fit.

User request: {request}

Uploaded recipe excerpts:
{context}
"""
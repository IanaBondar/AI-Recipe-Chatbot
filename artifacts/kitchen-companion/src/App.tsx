import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleUserRound,
  FilePlus2,
  Info,
  Leaf,
  Paperclip,
  Search,
  Sparkles,
  Trash2,
  Utensils,
  X,
} from "lucide-react";

type RecipeTone = "clay" | "sage" | "berry";
type Recipe = {
  id: string;
  name: string;
  detail: string;
  tone: RecipeTone;
  text: string;
  fileName?: string;
};
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
};

const STORAGE_KEY = "kitchen-companion-recipes-v1";
const initialRecipes: Recipe[] = [
  {
    id: "chicken-coconut-curry",
    name: "Chicken Coconut Curry",
    detail: "40 min · main",
    tone: "clay",
    text: "Chicken Coconut Curry\nA cozy, bright curry for four. Sauté chicken with onion, garlic, ginger, and curry powder. Pour in coconut milk and simmer for 25 minutes. Finish with lime juice and fresh cilantro. Serve over rice. Total time: 40 minutes.",
  },
  {
    id: "roasted-vegetable-couscous",
    name: "Roasted Vegetable Couscous",
    detail: "35 min · main",
    tone: "sage",
    text: "Roasted Vegetable Couscous\nA warm, colorful side or light main. Roast zucchini, peppers, and red onion until caramelized, then fold through couscous with lemon, parsley, and toasted almonds. Best served warm or at room temperature. Total time: 35 minutes.",
  },
  {
    id: "strawberry-oat-crumble",
    name: "Strawberry Oat Crumble",
    detail: "50 min · sweet",
    tone: "berry",
    text: "Strawberry Oat Crumble\nA soft, jammy dessert for six. Toss strawberries with lemon and a little sugar. Cover with an oat, flour, brown sugar, and butter topping, then bake until deeply golden. Let it rest before serving with yogurt. Total time: 50 minutes.",
  },
];

const initialMessages: ChatMessage[] = [
  { id: "welcome-question", role: "user", text: "I want something comforting, but not too heavy. What should I make tonight?" },
  {
    id: "welcome-answer",
    role: "assistant",
    text: "The Chicken Coconut Curry feels right for tonight. It has the cozy, slow-simmered feeling you’re after, but the lime and herbs keep it bright. You can have it on the table in about 40 minutes.",
    sources: ["Chicken Coconut Curry"],
  },
  { id: "side-question", role: "user", text: "What would you serve alongside it?" },
  {
    id: "side-answer",
    role: "assistant",
    text: "I’d keep it simple: spoon the curry over rice and add a little of the Roasted Vegetable Couscous on the side for texture. The couscous notes also call for lemon, parsley, and toasted almonds.",
    sources: ["Chicken Coconut Curry", "Roasted Vegetable Couscous"],
  },
];

const starterMessage: ChatMessage = {
  id: "shelf-ready",
  role: "assistant",
  text: "Your shelf is ready. Ask me what to cook, what can be made ahead, or which recipe uses an ingredient you need to finish.",
};

const suggestions = ["Can I make it ahead?", "Something sweet for after?", "What needs using first?"];
const stopWords = new Set(["a", "an", "and", "are", "can", "for", "i", "in", "it", "me", "my", "of", "on", "the", "to", "what", "with", "you"]);

function readRecipes(): Recipe[] {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialRecipes;
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) throw new Error("The saved shelf is not a recipe list.");
  return parsed as Recipe[];
}

function getInitialMessages(recipes: Recipe[]) {
  return initialRecipes.every((recipe) => recipes.some((saved) => saved.id === recipe.id)) ? initialMessages : [starterMessage];
}

function tokens(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((token) => token.length > 2 && !stopWords.has(token));
}

function sentenceFromRecipe(recipe: Recipe, query: string) {
  const queryTokens = tokens(query);
  const sentences = recipe.text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const relevant = sentences.find((sentence) => queryTokens.some((token) => sentence.toLowerCase().includes(token)));
  return relevant?.replace(new RegExp(`^${recipe.name}\\s*`, "i"), "").trim() || sentences[1] || recipe.text;
}

function answerQuestion(question: string, recipes: Recipe[]): ChatMessage {
  if (recipes.length === 0) {
    return { id: `answer-${Date.now()}`, role: "assistant", text: "Your shelf is empty, so I can’t make a grounded recommendation yet. Add a .txt or .md recipe and I’ll use only that indexed text." };
  }
  const queryTokens = tokens(question);
  const scored = recipes
    .map((recipe) => {
      const haystack = `${recipe.name} ${recipe.detail} ${recipe.text}`.toLowerCase();
      const score = queryTokens.reduce((total, token) => total + (haystack.includes(token) ? (recipe.name.toLowerCase().includes(token) ? 3 : 1) : 0), 0);
      return { recipe, score };
    })
    .sort((a, b) => b.score - a.score);
  const matches = scored.filter((item) => item.score > 0);
  if (matches.length === 0) {
    return { id: `answer-${Date.now()}`, role: "assistant", text: "I couldn’t find a recipe on your current shelf that answers that. I’ll only recommend recipes whose indexed notes contain a relevant match." };
  }
  const best = matches[0].recipe;
  const secondMatch = matches[1];
  const second = secondMatch?.recipe;
  const lower = question.toLowerCase();
  let text = `${best.name} is the closest match in your indexed shelf. ${sentenceFromRecipe(best, question)}`;
  if (lower.includes("alongside") || lower.includes("side")) {
    text = `${best.name} is the best match for that question. ${sentenceFromRecipe(best, question)}${second ? ` ${second.name} is also indexed as a possible companion.` : ""}`;
  } else if (lower.includes("sweet") || lower.includes("dessert")) {
    text = `${best.name} is the sweet recipe I found on your shelf. ${sentenceFromRecipe(best, question)}`;
  } else if (lower.includes("ahead") || lower.includes("leftover")) {
    text = `The notes for ${best.name} are the closest match for making ahead. ${sentenceFromRecipe(best, question)}`;
  }
  return { id: `answer-${Date.now()}`, role: "assistant", text, sources: [best.name, ...(second && secondMatch.score > 0 ? [second.name] : [])] };
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [notice, setNotice] = useState("");
  const [hydrating, setHydrating] = useState(true);
  const [storageError, setStorageError] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2800);
  }

  function hydrate() {
    setHydrating(true);
    setStorageError("");
    window.setTimeout(() => {
      try {
        const loaded = readRecipes();
        setRecipes(loaded);
        setMessages(getInitialMessages(loaded));
      } catch {
        setStorageError("The saved shelf could not be read. You can try again or start with a fresh shelf.");
      } finally {
        setHydrating(false);
      }
    }, 240);
  }

  useEffect(() => {
    hydrate();
    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  function persist(nextRecipes: Recipe[]) {
    setRecipes(nextRecipes);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecipes));
      setStorageError("");
    } catch {
      setStorageError("Your shelf changed for this session, but the browser could not save it.");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError("");
    const isTextFile = /\.(txt|md)$/i.test(file.name);
    if (!isTextFile) {
      setUploadError("Please choose a .txt or .md file. Other file types are not indexed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "").trim();
      if (!text) {
        setUploadError("That file is empty. Add recipe text and try again.");
        return;
      }
      const firstLine = text.split(/\r?\n/).map((line) => line.replace(/^#+\s*/, "").trim()).find(Boolean) || file.name.replace(/\.(txt|md)$/i, "");
      const name = firstLine.length > 72 ? firstLine.slice(0, 69).trimEnd() + "…" : firstLine;
      const isSweet = /sweet|dessert|cake|crumble|bake/i.test(`${name} ${text}`);
      const isSide = /side|salad|couscous|vegetable/i.test(`${name} ${text}`);
      const tone: RecipeTone = isSweet ? "berry" : isSide ? "sage" : "clay";
      const minutes = text.match(/(\d{2,3})\s*(?:minutes|min)/i)?.[1];
      const category = isSweet ? "sweet" : isSide ? "side" : "main";
      const recipe: Recipe = { id: `uploaded-${Date.now()}`, name, detail: `${minutes ? `${minutes} min` : "indexed"} · ${category}`, tone, text, fileName: file.name };
      const next = [recipe, ...recipes];
      persist(next);
      setMessages((current) => current.length === 1 && current[0].id === starterMessage.id ? current : [...current, { id: `indexed-${Date.now()}`, role: "assistant", text: `${name} is indexed and ready to discuss from its saved text.`, sources: [name] }]);
      setIsAddOpen(false);
      showNotice(`${name} is indexed on your shelf.`);
    };
    reader.onerror = () => setUploadError("That file could not be read. Try saving it as plain text first.");
    reader.readAsText(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || isAnswering) return;
    setDraft("");
    setMessages((current) => [...current, { id: `question-${Date.now()}`, role: "user", text: question }]);
    setIsAnswering(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, answerQuestion(question, recipes)]);
      setIsAnswering(false);
    }, 420);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function clearShelf() {
    if (!window.confirm("Clear every recipe from your shelf? This cannot be undone.")) return;
    persist([]);
    setMessages([{
      id: `cleared-${Date.now()}`,
      role: "assistant",
      text: "Your shelf is empty. Add a .txt or .md recipe whenever you’re ready, and I’ll keep future answers grounded in it.",
    }]);
    showNotice("Your shelf is clear.");
  }

  const filteredRecipes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? recipes.filter((recipe) => `${recipe.name} ${recipe.text}`.toLowerCase().includes(needle)) : recipes;
  }, [recipes, search]);

  return (
    <main className="kitchen-app">
      <header className="kitchen-header">
        <div className="kitchen-header-inner">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"><Utensils size={17} strokeWidth={1.9} /></div>
            <div>
              <p className="brand-title">Kitchen Companion</p>
              <p className="eyebrow">Your recipes, remembered</p>
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="sync-button" onClick={() => showNotice(storageError ? "Shelf needs attention." : "Your shelf is up to date.")} data-testid="button-shelf-status">
              <span className="sync-dot" /> {storageError ? "Shelf issue" : "Shelf synced"}
            </button>
            <button type="button" className="profile-button" aria-label="Open profile" onClick={() => showNotice("Profile settings are not needed for this local shelf.")} data-testid="button-profile">
              <CircleUserRound size={18} strokeWidth={1.65} />
            </button>
          </div>
        </div>
      </header>

      <div className="kitchen-layout">
        <aside className="shelf" aria-label="Recipe shelf">
          <div className="shelf-heading">
            <div><p className="eyebrow">Your shelf</p><h1 className="shelf-title">Recipes</h1></div>
            <button type="button" className="icon-button" aria-label={isSearching ? "Close recipe search" : "Search your recipes"} onClick={() => { setIsSearching((value) => !value); if (isSearching) setSearch(""); }} data-testid="button-toggle-search">
              {isSearching ? <X size={17} strokeWidth={1.7} /> : <Search size={17} strokeWidth={1.7} />}
            </button>
          </div>
          {isSearching && (
            <div className="search-box">
              <Search size={14} aria-hidden="true" />
              <label className="visually-hidden" htmlFor="recipe-search">Search recipes</label>
              <input id="recipe-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your shelf" autoFocus data-testid="input-recipe-search" />
              {search && <button type="button" className="icon-button" aria-label="Clear recipe search" onClick={() => setSearch("")} data-testid="button-clear-search"><X size={14} /></button>}
            </div>
          )}
          {hydrating ? (
            <div className="loading-state" data-testid="status-shelf-loading"><strong>Warming the shelf</strong><div className="skeleton long" /><div className="skeleton short" /><p>Reading your recipes from this browser.</p></div>
          ) : storageError ? (
            <div className="error-state" role="alert" data-testid="status-shelf-error"><strong>Couldn’t open the shelf</strong><p>{storageError}</p><button type="button" className="retry-button" onClick={hydrate} data-testid="button-retry-shelf">Try again</button></div>
          ) : filteredRecipes.length > 0 ? (
            <div className="recipe-list" data-testid="list-recipes">
              {filteredRecipes.map((recipe, index) => (
                <button type="button" className="recipe-item" key={recipe.id} onClick={() => setSelectedRecipe(recipe)} style={{ animationDelay: `${index * 70 + 80}ms` }} data-testid={`button-recipe-${recipe.id}`}>
                  <span className={`recipe-number ${recipe.tone}`}>{(index + 1).toString().padStart(2, "0")}</span>
                  <span className="recipe-copy"><span className="recipe-name">{recipe.name}</span><span className="recipe-detail">{recipe.detail}</span></span>
                  <ChevronRight className="recipe-arrow" size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-testid="status-shelf-empty"><strong>{recipes.length ? "No recipes found" : "A quiet shelf"}</strong><p>{recipes.length ? "Try a different title or ingredient." : "Bring in a plain text recipe to give your companion something to remember."}</p></div>
          )}
          <button type="button" className="add-recipe" onClick={() => { setUploadError(""); setIsAddOpen(true); }} data-testid="button-add-recipe"><FilePlus2 size={15} strokeWidth={1.8} /> Add a recipe</button>
          <div className="shelf-summary">
            <div className="summary-top"><div className="summary-check"><Check size={16} strokeWidth={2} /></div><span className="indexed-badge">Indexed</span></div>
            <p className="summary-title" data-testid="text-recipe-count">{recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} on your shelf</p>
            <p className="summary-copy">Your companion knows what’s in the folder.</p>
            {recipes.length > 0 && <button type="button" className="clear-shelf" onClick={clearShelf} data-testid="button-clear-shelf"><Trash2 size={12} /> Clear shelf</button>}
          </div>
          <div className="shelf-foot"><Leaf size={13} strokeWidth={1.6} /><span>Made for the in-between meals</span></div>
        </aside>

        <section className="chat" aria-label="Recipe conversation">
          <div className="chat-inner">
            <div className="chat-heading">
              <div>
                <p className="eyebrow chat-kicker"><Sparkles size={13} strokeWidth={1.8} /> Dinner, considered</p>
                <h2 className="chat-title">What are you in the mood for?</h2>
                <p className="chat-intro">Ask anything about the recipes you’ve saved. I’ll help you find the right one.</p>
              </div>
            </div>
            {hydrating ? (
              <div className="loading-state" data-testid="status-chat-loading"><strong>Setting the table</strong><div className="skeleton long" /><div className="skeleton short" /><p>Loading your local conversation.</p></div>
            ) : (
              <>
                <div className="messages" aria-live="polite" data-testid="list-messages">
                  {messages.map((message) => (
                    <article className={`message ${message.role}`} key={message.id} data-testid={`message-${message.id}`}>
                      <div className="message-icon" aria-hidden="true">{message.role === "assistant" ? <Sparkles size={14} strokeWidth={1.7} /> : <CircleUserRound size={15} strokeWidth={1.7} />}</div>
                      <div className="message-body">
                        <div className="message-text">{message.text}</div>
                        {message.sources && <div className="source-list" aria-label="Recipe sources">{message.sources.map((source) => {
                          const recipe = recipes.find((item) => item.name === source);
                          return recipe ? <button type="button" className="source-pill" key={source} onClick={() => setSelectedRecipe(recipe)} title={`Open ${source}`} data-testid={`button-source-${recipe.id}`}><BookOpen size={12} aria-hidden="true" /><span>{source}</span><ChevronRight size={11} aria-hidden="true" /></button> : null;
                        })}</div>}
                        <p className="message-meta">{message.role === "user" ? "You · just now" : "Kitchen Companion · just now"}</p>
                      </div>
                    </article>
                  ))}
                  {isAnswering && <article className="message" data-testid="status-answer-loading"><div className="message-icon"><Sparkles size={14} strokeWidth={1.7} /></div><div className="message-body"><div className="message-text"><div className="skeleton long" /><div className="skeleton short" /></div></div></article>}
                </div>
                <div className="suggestions">
                  <p className="suggestion-label">You could ask</p>
                  <div className="suggestion-list">
                    {suggestions.map((prompt) => <button type="button" className="suggestion" key={prompt} onClick={() => { setDraft(prompt); showNotice("Question added to your message."); }} data-testid={`button-prompt-${prompt.toLowerCase().replaceAll(" ", "-").replaceAll("?", "")}`}>{prompt}</button>)}
                  </div>
                </div>
                <form className="composer" onSubmit={handleSubmit}>
                  <div className="composer-shell">
                    <label className="visually-hidden" htmlFor="recipe-question">Ask your recipe companion</label>
                    <textarea id="recipe-question" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your recipes..." rows={1} data-testid="input-recipe-question" />
                    <div className="composer-actions">
                      <button type="button" className="attach-button" aria-label="Attach a recipe" onClick={() => { setUploadError(""); setIsAddOpen(true); }} data-testid="button-attach-recipe"><Paperclip size={16} strokeWidth={1.7} /></button>
                      <div className="send-side"><span className="send-hint">Enter to send · Shift + Enter for a new line</span><button type="submit" className="send-button" aria-label="Send question" disabled={!draft.trim() || isAnswering} data-testid="button-send-question"><ArrowUp size={16} strokeWidth={2.2} /></button></div>
                    </div>
                  </div>
                </form>
                <p className="chat-footnote">Kitchen Companion answers from your indexed shelf.</p>
              </>
            )}
          </div>
        </section>
      </div>

      <input ref={fileInputRef} type="file" accept=".txt,.md,text/plain,text/markdown" className="visually-hidden" onChange={handleFileChange} data-testid="input-recipe-file" />

      {isAddOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsAddOpen(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-recipe-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-head"><div><p className="eyebrow">Grow your shelf</p><h3 className="dialog-title" id="add-recipe-title">Bring a recipe in</h3></div><button type="button" className="dialog-close" onClick={() => setIsAddOpen(false)} aria-label="Close add recipe dialog" data-testid="button-close-add-recipe"><X size={17} /></button></div>
            <p className="dialog-copy">Upload a plain text recipe or Markdown note. I’ll index the text and keep every answer grounded in it.</p>
            <button type="button" className="choose-file" onClick={() => fileInputRef.current?.click()} data-testid="button-choose-recipe-file"><FilePlus2 size={16} strokeWidth={1.9} /> Choose a recipe file</button>
            <p className="dialog-note"><Info size={12} /> .txt and .md files only</p>
            {uploadError && <p className="dialog-copy" role="alert" style={{ color: "#a9573d" }} data-testid="status-upload-error">{uploadError}</p>}
          </div>
        </div>
      )}

      {selectedRecipe && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedRecipe(null)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-head"><div><p className="eyebrow">Indexed recipe</p><h3 className="dialog-title" id="recipe-detail-title">{selectedRecipe.name}</h3></div><button type="button" className="dialog-close" onClick={() => setSelectedRecipe(null)} aria-label="Close recipe details" data-testid="button-close-recipe-details"><X size={17} /></button></div>
            <p className="dialog-copy" style={{ whiteSpace: "pre-wrap" }} data-testid={`text-recipe-details-${selectedRecipe.id}`}>{selectedRecipe.text}</p>
            {selectedRecipe.fileName && <p className="dialog-note"><Check size={12} /> Indexed from {selectedRecipe.fileName}</p>}
          </div>
        </div>
      )}

      {notice && <div className="notice" role="status" data-testid="status-notice"><Check size={14} strokeWidth={2.2} />{notice}</div>}
    </main>
  );
}

export default App;
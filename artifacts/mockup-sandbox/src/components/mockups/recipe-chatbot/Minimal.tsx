import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleUserRound,
  FilePlus2,
  Info,
  Leaf,
  MoreHorizontal,
  Paperclip,
  Search,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "user",
    text: "I want something comforting, but not too heavy. What should I make tonight?",
  },
  {
    id: 2,
    role: "assistant",
    text: "The Chicken Coconut Curry feels right for tonight. It has the cozy, slow-simmered feeling you’re after, but the lime and herbs keep it bright. You can have it on the table in about 40 minutes.",
    sources: ["Chicken Coconut Curry"],
  },
  {
    id: 3,
    role: "user",
    text: "What would you serve alongside it?",
  },
  {
    id: 4,
    role: "assistant",
    text: "I’d keep it simple: spoon the curry over rice and add a little of the Roasted Vegetable Couscous on the side for texture. If you want something fresh, the cucumber salad in your notes would be lovely too.",
    sources: ["Chicken Coconut Curry", "Roasted Vegetable Couscous"],
  },
];

const recipeShelf = [
  { name: "Chicken Coconut Curry", detail: "40 min · main", tone: "clay" },
  { name: "Roasted Vegetable Couscous", detail: "35 min · main", tone: "sage" },
  { name: "Strawberry Oat Crumble", detail: "50 min · sweet", tone: "berry" },
];

function RecipeMark() {
  return (
    <div
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[#c96647] text-[#fff7ed] shadow-[0_5px_12px_rgba(177,78,48,0.18)]"
    >
      <Utensils size={17} strokeWidth={1.9} />
    </div>
  );
}

function SourcePill({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#e5d7c5] bg-[#fbf6ed] px-2.5 py-1.5 text-left text-[11px] font-medium text-[#765f4d] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cf987b] hover:bg-[#fffaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/40"
      title={`Open ${name}`}
    >
      <BookOpen size={12} className="shrink-0 text-[#c96647]" strokeWidth={1.8} />
      <span className="truncate">{name}</span>
      <ChevronRight size={11} className="shrink-0 text-[#b79e88] transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export default function Minimal() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.[0]) {
      showNotice(`${event.target.files[0].name} is ready to index.`);
      setIsAddOpen(false);
      event.target.value = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;

    const userMessage: ChatMessage = { id: Date.now(), role: "user", text: question };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "I’d start with the Chicken Coconut Curry. It’s the most forgiving thing on your shelf tonight, and the leftovers will be even better tomorrow. Want me to help you make a short shopping list?",
          sources: ["Chicken Coconut Curry"],
        },
      ]);
    }, 500);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function usePrompt(prompt: string) {
    setDraft(prompt);
    showNotice("Question added to your message.");
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f6f2ea] text-[#30271f] selection:bg-[#e7b38e] selection:text-[#30271f]">
      <header className="border-b border-[#e6ddd0] bg-[#f8f5ef]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3.5">
            <RecipeMark />
            <div>
              <p className="font-serif text-[22px] leading-none tracking-[-0.02em] text-[#30271f]">Kitchen Companion</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.19em] text-[#a18a75]">Your recipes, remembered</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => showNotice("Your shelf is up to date.")}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium text-[#826d5a] transition-colors hover:bg-[#eee7dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35 sm:flex"
            >
              <span className="size-1.5 rounded-full bg-[#84916b]" />
              Shelf synced
            </button>
            <button
              type="button"
              onClick={() => showNotice("Profile settings are coming with your next shelf update.")}
              aria-label="Open profile"
              className="flex size-9 items-center justify-center rounded-full border border-[#dfd3c3] bg-[#efe8dc] text-[#725e4e] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8aa91] hover:bg-[#e8dece] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35"
            >
              <CircleUserRound size={18} strokeWidth={1.65} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-[1440px] grid-cols-1 lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="border-b border-[#e6ddd0] bg-[#f0ebe2] px-5 py-7 sm:px-8 lg:min-h-[calc(100dvh-72px)] lg:border-b-0 lg:border-r lg:px-7 lg:py-9">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#aa927b]">Your shelf</p>
              <h1 className="mt-2 font-serif text-[28px] leading-none tracking-[-0.02em] text-[#3a2d23]">Recipes</h1>
            </div>
            <button
              type="button"
              aria-label="Search your recipes"
              onClick={() => {
                setIsSearching((value) => !value);
                showNotice("Search is ready for your shelf.");
              }}
              className="mt-0.5 flex size-8 items-center justify-center rounded-lg text-[#866e5a] transition-colors hover:bg-[#e6ded2] hover:text-[#c96647] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35"
            >
              <Search size={17} strokeWidth={1.7} />
            </button>
          </div>

          {isSearching && (
            <div className="kitchen-fade mt-5 flex items-center gap-2 rounded-lg border border-[#d9cbb9] bg-[#f8f4ed] px-3 py-2.5">
              <Search size={14} className="text-[#ad927c]" />
              <input
                autoFocus
                aria-label="Search recipes"
                placeholder="Search your shelf"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#4b3c30] outline-none placeholder:text-[#b5a28e]"
              />
              <button type="button" aria-label="Close search" onClick={() => setIsSearching(false)} className="text-[#aa927b] hover:text-[#5f4a39]">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="mt-7 space-y-1">
            {recipeShelf.map((recipe, index) => (
              <button
                type="button"
                key={recipe.name}
                onClick={() => showNotice(`${recipe.name} is indexed and ready to talk about.`)}
                className="kitchen-rise group flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-all duration-200 hover:bg-[#e8e0d5]"
                style={{ animationDelay: `${index * 70 + 120}ms` }}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold ${recipe.tone === "clay" ? "bg-[#e7c5ae] text-[#8d4e38]" : recipe.tone === "sage" ? "bg-[#d8dfca] text-[#687453]" : "bg-[#ead0cc] text-[#a75e59]"}`}>
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-[#514235]">{recipe.name}</span>
                  <span className="mt-1 block text-[10px] text-[#a18c78]">{recipe.detail}</span>
                </span>
                <ChevronRight size={14} className="text-[#bdab98] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cdbba6] px-3 py-3 text-[12px] font-semibold text-[#8d705a] transition-all duration-200 hover:border-[#c96647] hover:bg-[#f7eee4] hover:text-[#b4573b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35"
          >
            <FilePlus2 size={15} strokeWidth={1.8} />
            Add a recipe
          </button>

          <div className="mt-10 rounded-xl border border-[#dfd2c1] bg-[#f6f0e7] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#dfe5d6] text-[#6c7c5a]">
                <Check size={16} strokeWidth={2} />
              </div>
              <span className="rounded-full bg-[#e5ebdd] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7c58]">Indexed</span>
            </div>
            <p className="mt-3 text-[12px] font-semibold text-[#514235]">3 recipes on your shelf</p>
            <p className="mt-1 text-[11px] leading-[1.5] text-[#998571]">Your companion knows what’s in the folder.</p>
          </div>

          <div className="mt-8 hidden items-center gap-2 text-[10px] text-[#aa937d] lg:flex">
            <Leaf size={13} strokeWidth={1.6} />
            <span>Made for the in-between meals</span>
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-col bg-[#f8f5ef]">
          <div className="mx-auto flex w-full max-w-[850px] flex-1 flex-col px-5 pb-7 pt-8 sm:px-10 sm:pt-10 lg:px-16 lg:pt-10">
            <div className="kitchen-rise flex items-end justify-between gap-5">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.19em] text-[#b0785d]">
                  <Sparkles size={13} strokeWidth={1.8} />
                  Dinner, considered
                </p>
                <h2 className="mt-3 font-serif text-[43px] leading-[0.98] tracking-[-0.035em] text-[#342920] sm:text-[53px]">What are you in the mood for?</h2>
                <p className="mt-4 max-w-[450px] text-[13px] leading-[1.65] text-[#947f6b]">Ask anything about the recipes you’ve saved. I’ll help you find the right one.</p>
              </div>
              <button
                type="button"
                onClick={() => showNotice("Conversation options opened.")}
                aria-label="Conversation options"
                className="mb-1 hidden size-9 items-center justify-center rounded-lg text-[#a58f7a] transition-colors hover:bg-[#eee7dc] hover:text-[#6f5946] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35 sm:flex"
              >
                <MoreHorizontal size={19} />
              </button>
            </div>

            <div className="mt-7 space-y-5 sm:mt-8 sm:space-y-5">
              {messages.map((message) => (
                <article key={message.id} className={`kitchen-rise kitchen-rise-delay-${message.role === "assistant" ? "2" : "1"} flex gap-3.5 sm:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e9ddd0] text-[#bd684b]">
                      <Sparkles size={14} strokeWidth={1.7} />
                    </div>
                  )}
                  <div className={message.role === "user" ? "max-w-[80%] sm:max-w-[63%]" : "max-w-[89%] sm:max-w-[75%]"}>
                    <div className={message.role === "user" ? "rounded-[15px] rounded-tr-[4px] bg-[#e8ded0] px-4 py-3 text-[13px] leading-[1.6] text-[#5b4939]" : "text-[14px] leading-[1.75] text-[#4a3a2e]"}>
                      {message.text}
                    </div>
                    {message.sources && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.sources.map((source) => (
                          <SourcePill key={source} name={source} onClick={() => showNotice(`Opening notes for ${source}.`)} />
                        ))}
                      </div>
                    )}
                    <p className={`mt-2 text-[10px] text-[#b1a08e] ${message.role === "user" ? "text-right" : ""}`}>
                      {message.role === "user" ? "You · just now" : "Kitchen Companion · just now"}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#d9dfd0] text-[#687650]">
                      <CircleUserRound size={15} strokeWidth={1.7} />
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="mt-6 border-t border-[#e9dfd2] pt-4 sm:mt-7">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#b29c86]">You could ask</p>
              <div className="flex flex-wrap gap-2">
                {["Can I make it ahead?", "Something sweet for after?", "What needs using first?"].map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => usePrompt(prompt)}
                    className="rounded-full border border-[#e3d7c8] bg-[#fbf8f2] px-3.5 py-2 text-[11px] font-medium text-[#806b57] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d5a48c] hover:bg-[#fffaf3] hover:text-[#a9573d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 sm:mt-5">
              <div className="rounded-2xl border border-[#d8cbbb] bg-[#fffdf9] p-2 shadow-[0_10px_24px_rgba(105,76,50,0.06)] transition-all duration-200 focus-within:border-[#c99b81] focus-within:shadow-[0_10px_28px_rgba(165,91,62,0.1)]">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Ask your recipe companion"
                  placeholder="Ask about your recipes..."
                  rows={1}
                  className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-[1.55] text-[#43342a] outline-none placeholder:text-[#b6a390]"
                />
                <div className="flex items-center justify-between px-1.5 pb-0.5">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    aria-label="Attach a recipe"
                    className="flex size-8 items-center justify-center rounded-lg text-[#a58c76] transition-colors hover:bg-[#f1e8dd] hover:text-[#bb6245] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35"
                  >
                    <Paperclip size={16} strokeWidth={1.7} />
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-[10px] text-[#b7a594] sm:inline">Enter to send · Shift + Enter for a new line</span>
                    <button
                      type="submit"
                      aria-label="Send question"
                      className="flex size-8 items-center justify-center rounded-lg bg-[#c96647] text-[#fff7ed] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#b95a3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/45 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!draft.trim()}
                    >
                      <ArrowUp size={16} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <p className="mt-3 text-center text-[10px] text-[#b5a18d]">Kitchen Companion answers from your indexed shelf.</p>
          </div>
        </section>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx,image/*" className="hidden" onChange={handleFileChange} />

      {isAddOpen && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-[#3d2d22]/20 p-4 backdrop-blur-[2px] sm:items-center" role="presentation" onMouseDown={() => setIsAddOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-recipe-title"
            className="kitchen-rise w-full max-w-[410px] rounded-2xl border border-[#decfbd] bg-[#fffaf3] p-6 shadow-[0_22px_65px_rgba(74,48,31,0.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b0785d]">Grow your shelf</p>
                <h3 id="add-recipe-title" className="mt-2 font-serif text-[28px] leading-none text-[#3b2e24]">Bring a recipe in</h3>
              </div>
              <button type="button" onClick={() => setIsAddOpen(false)} aria-label="Close add recipe dialog" className="flex size-8 items-center justify-center rounded-lg text-[#a8907a] hover:bg-[#f0e7dc] hover:text-[#6f5947] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/35">
                <X size={17} />
              </button>
            </div>
            <p className="mt-4 text-[12px] leading-[1.6] text-[#8e7863]">Upload a recipe file or a photo of the page. I’ll keep the useful bits close at hand.</p>
            <button
              type="button"
              onClick={handleUploadClick}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#c96647] px-4 py-3.5 text-[12px] font-bold text-[#fff8ef] transition-all hover:-translate-y-0.5 hover:bg-[#b95a3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96647]/45 focus-visible:ring-offset-2"
            >
              <FilePlus2 size={16} strokeWidth={1.9} />
              Choose a recipe file
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#ad9884]">
              <Info size={12} />
              PDF, document, or image
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div className="kitchen-fade fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#d6c1ad] bg-[#fffaf3] px-4 py-2.5 text-[11px] font-semibold text-[#684f3c] shadow-[0_10px_30px_rgba(74,48,31,0.14)]" role="status">
          <Check size={14} className="text-[#7e9363]" strokeWidth={2.2} />
          {notice}
        </div>
      )}
    </main>
  );
}
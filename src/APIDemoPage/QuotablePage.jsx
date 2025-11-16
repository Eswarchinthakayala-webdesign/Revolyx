// src/pages/QuotablePage.jsx
"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Quote,
  RefreshCw,
  Copy,
  Bookmark,
  BookmarkCheck,
  Menu,
  Trash2,
  Code,
  Download,
  Eye,
  X,
  Search,
  User as UserIcon,
} from "lucide-react";

/* shadcn/ui */
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

/* Syntax highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* Theme provider */
import { useTheme } from "@/components/theme-provider";

const ENDPOINT = "https://api.quotable.io/random";

export default function QuotablePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [quoteObj, setQuoteObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState([]);
  const [showCode, setShowCode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [authorFilter, setAuthorFilter] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // load saved quotes
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("revolyx_saved_quotes") || "[]");
      setSaved(s);
    } catch {
      setSaved([]);
    }
  }, []);

  // initial fetch
  useEffect(() => {
    fetchQuote();
  }, []);

  async function fetchQuote(author = "") {
    try {
      setLoading(true);
      // optionally filter by author
      const url = author ? `${ENDPOINT}?author=${encodeURIComponent(author)}` : ENDPOINT;
      const res = await fetch(url);
      if (!res.ok) throw new Error("API response not ok");
      const json = await res.json();
      // json structure: { _id, content, author, tags, ... }
      setQuoteObj(json);
      showToast("success", "Fetched a fresh quote");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }

  function saveQuote() {
    if (!quoteObj) return;
    const key = `${quoteObj._id}`;
    const exists = saved.some((q) => q._id === key);
    if (exists) {
      showToast("info", "Already saved");
      return;
    }
    const next = [{ ...quoteObj }, ...saved];
    setSaved(next);
    localStorage.setItem("revolyx_saved_quotes", JSON.stringify(next));
    showToast("success", "Quote saved");
  }

  function removeSaved(id) {
    const next = saved.filter((q) => q._id !== id);
    setSaved(next);
    localStorage.setItem("revolyx_saved_quotes", JSON.stringify(next));
    showToast("info", "Removed saved quote");
  }

  function copyQuoteText() {
    if (!quoteObj) return;
    navigator.clipboard.writeText(`"${quoteObj.content}" — ${quoteObj.author}`);
    showToast("success", "Quote copied");
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  function downloadJSON(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `quotable-${payload?._id || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "JSON downloaded");
  }

  // author suggestions by calling /search/authors?query= — Quotable supports authors search
  async function fetchAuthorSuggestions(q) {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      setLoadingSuggest(true);
      const res = await fetch(`https://api.quotable.io/search/authors?query=${encodeURIComponent(q)}&limit=6`);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const json = await res.json();
      // json.results array of authors
      setSuggestions(json.results || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black" : "bg-white")}>
      {/* header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold", isDark ? "text-zinc-50" : "text-zinc-900")}>
            Revolyx · Quotable (Random Quote)
          </h1>
          <p className={clsx("text-sm mt-1", isDark ? "text-zinc-300" : "text-zinc-600")}>
            Fetch a random quote — filter by author, save favorites, copy or download.
          </p>
        </div>

        {/* mobile sheet trigger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden cursor-pointer">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className={clsx(isDark ? "bg-black text-white" : "bg-white text-black")}>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3">Saved Quotes</h3>
              <ScrollArea className="h-[60vh] pr-3">
                <div className="space-y-3">
                  {saved.length === 0 && <div className="text-sm opacity-60">No saved quotes</div>}
                  {saved.map((q) => (
                    <div key={q._id} className={clsx("p-3 rounded-lg border", isDark ? "border-zinc-700" : "border-zinc-200")}>
                      <div className="text-sm mb-2">"{q.content}"</div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs opacity-70">— {q.author}</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`"${q.content}" — ${q.author}`); showToast("success", "Copied"); }} className="cursor-pointer">
                            <Copy />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { downloadJSON(q); }} className="cursor-pointer">
                            <Download />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeSaved(q._id)} className="cursor-pointer">
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* left sidebar */}
        <aside className={clsx("hidden lg:block p-4 rounded-xl border h-[80vh]", isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200")}>
          <h3 className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-800")}>Saved Quotes</h3>
          <p className={clsx("text-xs mb-3", isDark ? "text-zinc-300" : "text-zinc-600")}>Local favorites (stored in your browser)</p>

          <div className="space-y-3">
            {saved.length === 0 && <div className="text-sm opacity-60">No saved quotes yet.</div>}
            {saved.map((q) => (
              <div key={q._id} className={clsx("p-3 rounded-lg border", isDark ? "border-zinc-700" : "border-zinc-200")}>
                <div className="text-sm mb-2">"{q.content}"</div>
                <div className="flex items-center justify-between">
                  <div className="text-xs opacity-70">— {q.author}</div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(`"${q.content}" — ${q.author}`); showToast("success", "Copied"); }} className="cursor-pointer">
                      <Copy />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => downloadJSON(q)} className="cursor-pointer">
                      <Download />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeSaved(q._id)} className="cursor-pointer">
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* main content */}
        <section className="lg:col-span-3 space-y-6">
          {/* controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className={clsx("relative flex-1")}>
              <Input
                placeholder="Filter by author (optional) — type to get suggestions"
                value={authorFilter}
                onChange={(e) => {
                  setAuthorFilter(e.target.value);
                  setShowSuggest(true);
                  fetchAuthorSuggestionsDebounced(e.target.value, setSuggestions, setLoadingSuggest);
                }}
                onFocus={() => setShowSuggest(true)}
                className={clsx(isDark ? "bg-black/40 border-zinc-700 text-white" : "bg-white border-zinc-300 text-black")}
              />
              <Search className={clsx("absolute right-3 top-2.5", isDark ? "text-zinc-400" : "text-zinc-600")} size={18} />
              <AnimatePresence>
                {showSuggest && suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className={clsx("absolute left-0 right-0 mt-2 rounded-xl border p-2 z-30 shadow-xl", isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200")}>
                    {loadingSuggest && <div className="text-xs opacity-60 py-2 text-center">Searching authors…</div>}
                    {suggestions.map((a) => (
                      <div key={a._id} className={clsx("p-2 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50")} onClick={() => { setAuthorFilter(a.name); setShowSuggest(false); }}>
                        <UserIcon size={16} />
                        <div>
                          <div className="text-sm">{a.name}</div>
                          <div className="text-xs opacity-60">{a.bio || a.description || ""}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => fetchQuote(authorFilter)} className="cursor-pointer">
                <RefreshCw /> New Quote
              </Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(ENDPOINT); showToast("success", "Endpoint copied"); }} className="cursor-pointer">
                <Copy /> Copy Endpoint
              </Button>
            </div>
          </div>

          {/* quote card */}
          <Card className={clsx("rounded-2xl border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <CardHeader className={clsx("p-6 border-b", isDark ? "border-zinc-800" : "border-zinc-200")}>
              <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
                <span className="inline-flex items-center gap-2"><Quote /> Random Quote</span>
              </CardTitle>
              <div className="text-xs opacity-70 mt-1">Tip: filter by author or leave blank for random.</div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {loading ? (
                <div className="animate-pulse text-sm opacity-70">Loading quote…</div>
              ) : quoteObj ? (
                <motion.div key={quoteObj._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={clsx("rounded-xl p-6", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-100 text-zinc-800")}>
                  <div className="text-lg leading-relaxed">“{quoteObj.content}”</div>
                  <div className="mt-4 text-sm opacity-80">— {quoteObj.author}</div>

                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" onClick={copyQuoteText} className="cursor-pointer"><Copy /> Copy</Button>
                    <Button variant="outline" onClick={saveQuote} className="cursor-pointer"><Bookmark /> Save</Button>
                    <Button variant="outline" onClick={() => downloadJSON(quoteObj)} className="cursor-pointer"><Download /> Download JSON</Button>
                    <Button variant="outline" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><Eye /> {showRaw ? "Hide JSON" : "Show JSON"}</Button>
                    <Button variant="ghost" onClick={() => setShowCode((s) => !s)} className="cursor-pointer"><Code /> {showCode ? "Hide Code" : "Show Code"}</Button>
                  </div>

                  <AnimatePresence>
                    {showRaw && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 rounded-md p-3 border" style={{ background: isDark ? "rgba(255,255,255,0.02)" : undefined }}>
                        <SyntaxHighlighter language="json" style={isDark ? oneDark : oneLight} customStyle={{ background: "transparent" }}>
                          {JSON.stringify(quoteObj, null, 2)}
                        </SyntaxHighlighter>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showCode && (
                      <motion.pre initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={clsx("mt-4 p-3 rounded-md text-sm overflow-auto", isDark ? "bg-zinc-900" : "bg-zinc-100")}>
{`fetch("https://api.quotable.io/random")
  .then(r => r.json())
  .then(console.log);`}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-sm opacity-60">No quote yet — click New Quote.</div>
              )}
            </CardContent>
          </Card>

          {/* saved quotes grid */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Saved Quotes</h3>
            {saved.length === 0 ? (
              <div className="text-sm opacity-60">No saved quotes.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {saved.map((q) => (
                  <motion.div key={q._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={clsx("p-4 rounded-xl border", isDark ? "bg-zinc-900 border-zinc-700" : "bg-zinc-50 border-zinc-200")}>
                    <div className="text-sm mb-2">“{q.content}”</div>
                    <div className="text-xs opacity-70 mb-3">— {q.author}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`"${q.content}" — ${q.author}`); showToast("success", "Copied"); }} className="cursor-pointer"><Copy /></Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadJSON(q)} className="cursor-pointer"><Download /></Button>
                      <Button size="sm" variant="ghost" onClick={() => removeSaved(q._id)} className="cursor-pointer"><Trash2 /></Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ------------------------------
   Helper: Debounced author suggestions
   (small internal helper so code earlier stays tidy)
   ------------------------------ */

let _suggestTimer = null;
function fetchAuthorSuggestionsDebounced(q, setSuggestions, setLoadingSuggest) {
  if (_suggestTimer) clearTimeout(_suggestTimer);
  if (!q || q.length < 2) {
    setSuggestions([]);
    return;
  }
  _suggestTimer = setTimeout(async () => {
    try {
      setLoadingSuggest(true);
      const res = await fetch(`https://api.quotable.io/search/authors?query=${encodeURIComponent(q)}&limit=6`);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.results || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }, 380);
}

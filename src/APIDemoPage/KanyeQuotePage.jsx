// src/pages/KanyeQuotePage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  RefreshCw,
  Twitter,
  Copy,
  Download,
  Eye,
  X,
  Quote,
  Sun,
  Moon,
  Info,
  Menu,
  List,
  User,
  Hash,
  Clock,
  ExternalLink,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* ---------- Constants ---------- */
const ENDPOINT = "https://api.kanye.rest/";
const LIST_SIZE = 10;

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* ---------- Animated CopyButton (reusable) ---------- */
function CopyButton({ textToCopy = "", label = "Copy", size = 14, className = "" }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  async function handleCopy() {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(String(textToCopy));
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("copy failed", err);
      // fallback: still show copied false
    }
  }

  React.useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    []
  );

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.96 }}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-md border shadow-sm cursor-pointer select-none",
        className
      )}
      aria-pressed={copied}
      title={copied ? "Copied" : label}
    >
      <AnimatePresence mode="wait">
        {!copied && (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-2"
          >
            <Copy size={size} />
            <span className="text-sm">{label}</span>
          </motion.span>
        )}

        {copied && (
          <motion.span
            key="tick"
            initial={{ scale: 0.8, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.8, rotate: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 700, damping: 24 }}
            className="flex items-center gap-2 text-success"
          >
            <Check size={size} />
            <span className="text-sm">Copied</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ---------- Main component ---------- */
export default function KanyeQuotePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [quoteObj, setQuoteObj] = useState(null); // single selected quote { quote: "..." }
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [list, setList] = useState([]); // list of quotes for sidebar
  const [listLoading, setListLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const mountedRef = useRef(false);

  /* ---------- Fetch a single quote ---------- */
  async function fetchQuote() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (!res.ok) {
        setErrorMsg(`Network error (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json(); // { quote: "..." }
      setQuoteObj(json);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Fetch multiple quotes (for sidebar) ---------- */
  async function fetchList() {
    setListLoading(true);
    setErrorMsg(null);
    try {
      // run many fetches in parallel
      const jobs = Array.from({ length: LIST_SIZE }, () =>
        fetch(ENDPOINT, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { quote: "—" })).catch(() => ({ quote: "—" }))
      );
      const results = await Promise.all(jobs);
      // results: array of {quote}
      // add small ids so clicking is stable
      const withIds = results.map((r, i) => ({ id: `${Date.now()}_${i}`, ...r }));
      setList(withIds);
    } catch (err) {
      console.error("list fetch error", err);
      setErrorMsg("Failed to fetch list");
    } finally {
      setListLoading(false);
    }
  }

  /* ---------- Initial mount ---------- */
  useEffect(() => {
    mountedRef.current = true;
    // fetch main + list
    fetchQuote();
    fetchList();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Actions ---------- */
  function copyQuoteToClipboard() {
    if (!quoteObj?.quote) return;
    navigator.clipboard.writeText(quoteObj.quote).catch((e) => console.error(e));
  }

  function downloadJSON() {
    const payload = quoteObj || { quote: "" };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kanye_quote_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function tweetQuote() {
    if (!quoteObj?.quote) return;
    const text = encodeURIComponent(`"${quoteObj.quote}" — Kanye West`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function selectFromList(item) {
    if (!item) return;
    setQuoteObj({ quote: item.quote });
    // optionally close mobile sheet
    setSheetOpen(false);
  }

  /* ---------- Small UI helpers ---------- */
  function renderListItem(item, index) {
    return (
      <button
        key={item.id}
        onClick={() => selectFromList(item)}
        className="w-full text-left p-3 rounded-md hover:bg-zinc-100/40 transition-colors cursor-pointer flex items-start gap-3"
      >
        <div className="flex-shrink-0">
          <Hash size={18} className="opacity-60 mt-1" />
        </div>
        <div className="flex-1">
          <div className="text-sm line-clamp-2 font-medium">{item.quote}</div>
          <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
            <User size={12} /> Kanye West
            <span className="mx-2">·</span>
            <Clock size={12} /> {Math.max(5, item.quote?.length ?? 0)} chars
          </div>
        </div>
      </button>
    );
  }

  /* ---------- Render ---------- */
  const containerBg = isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900";
  const cardBg = isDark ? "bg-black/60 border-zinc-800" : "bg-white/90 border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-6 md:p-8 max-w-8xl pb-10 mx-auto transition-colors", containerBg)}>
      {/* Header */}
      <header className="flex items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu / sheet trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-md cursor-pointer" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-full sm:w-[340px]">
                <SheetHeader>
                  <SheetTitle>Quotes · List</SheetTitle>
                </SheetHeader>

                <div className="px-4 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm opacity-70">Recent random quotes</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={fetchList} className="cursor-pointer"><RefreshCw /></Button>
                    </div>
                  </div>

                  <ScrollArea style={{ height: "65vh" }} className="rounded-md border p-2">
                    <div className="space-y-2">
                      {listLoading && <div className="text-sm opacity-60 p-3">Loading list...</div>}
                      {!listLoading && list.length === 0 && <div className="text-sm opacity-60 p-3">No quotes — try refreshing.</div>}
                      {list.map((item, idx) => renderListItem(item, idx))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight flex items-center gap-3">
              <Quote /> Kanye Quotes
            </h1>
            <p className="mt-1 text-sm opacity-70 max-w-xl">
              Random Kanye West quotes — quick reading surface with developer tools. Tap the menu to browse recent quotes.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* desktop: show small sidebar toggle & refresh both */}
          <Button onClick={fetchQuote} className="flex items-center gap-2 cursor-pointer"><RefreshCw className={loading ? "animate-spin" : ""} /> New</Button>
          <Button onClick={fetchList} variant="outline" className="flex items-center gap-2 cursor-pointer"><List /> Refresh List</Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar (desktop only) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={clsx("p-4 rounded-2xl border h-full", cardBg)}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><List /> Recent Quotes</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-xs opacity-60 mb-3">Click a quote to load it into the main view.</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs opacity-60">List</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={fetchList}><RefreshCw /></Button>
                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => { setList([]); }}>{/* clear */} <X /></Button>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-auto space-y-2">
                  {listLoading && <div className="text-sm opacity-60 p-2">Loading...</div>}
                  {!listLoading && list.length === 0 && <div className="text-sm opacity-60 p-2">No quotes available — try refresh.</div>}
                  {list.map((item) => (
                    <div key={item.id} className="p-2 rounded-md border hover:shadow-sm transition-colors cursor-pointer" onClick={() => selectFromList(item)}>
                      <div className="text-sm line-clamp-2">{item.quote}</div>
                      <div className="text-xs opacity-50 mt-2 flex items-center gap-2">
                        <User size={12} /> Kanye West <span className="mx-2">·</span> <Clock size={12} /> {item.quote?.length ?? 0} chars
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main preview */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", cardBg)}>
            <div className={clsx("p-8 md:p-12 flex flex-col gap-6", isDark ? "bg-gradient-to-b from-black/60 to-black/50" : "bg-gradient-to-b from-white/95 to-white/80")}>
              <div className="flex items-start gap-6">
                <div className="text-6xl text-zinc-400 flex items-center">
                  <Quote />
                </div>

                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.blockquote
                      key={quoteObj?.quote ?? "empty-quote"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight max-w-3xl"
                    >
                      {quoteObj?.quote ?? (errorMsg ? "Unable to load quote." : "Loading inspirational chaos...")}
                    </motion.blockquote>
                  </AnimatePresence>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="text-sm opacity-70">— <span className="font-semibold">Kanye West</span></div>
                    <div className="text-xs opacity-50">· curated</div>
                  </div>

                  {/* actions */}
               
                </div>
              </div>

              {/* metadata / tags row */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-60">
                <div className="flex items-center gap-2 px-2 py-1 rounded-md border">
                  <User size={14} /> Kanye West
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-md border">
                  <Hash size={14} /> Quote
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-md border">
                  <Clock size={14} /> {quoteObj?.quote ? `${quoteObj.quote.length} chars` : "—"}
                </div>
                <div className="flex-1" />
                <div className="text-xs opacity-60">Source: <a className="underline ml-1" href={ENDPOINT} target="_blank" rel="noreferrer">api.kanye.rest</a></div>
              </div>
            </div>

            {/* raw JSON animated reveal */}
            <AnimatePresence>
              {showRaw && (
                <motion.div
                  key="raw"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={clsx("border-t p-4", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900")}
                >
                  <pre className="text-sm rounded-md p-3 overflow-auto" style={{ maxHeight: 260 }}>
                    {quoteObj ? prettyJSON(quoteObj) : "No JSON available."}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right panel */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("p-4 rounded-2xl border", cardBg)}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Info /> Quote Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-xs opacity-60 flex items-center gap-2"><Quote size={14} /> Text</div>
                  <div className="mt-1 text-sm font-medium break-words">{quoteObj?.quote ?? (loading ? "Loading..." : "—")}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60 flex items-center gap-2"><User size={14} /> Author</div>
                  <div className="mt-1 text-sm font-medium">Kanye West</div>
                </div>

                <div>
                  <div className="text-xs opacity-60 flex items-center gap-2"><Clock size={14} /> Length</div>
                  <div className="mt-1 text-sm font-medium">{quoteObj?.quote ? `${quoteObj.quote.length} characters` : "—"}</div>
                </div>

                <Separator />

                <div>
                  <div className="text-xs opacity-60">Actions</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <Button onClick={fetchQuote} className="flex items-center gap-2 cursor-pointer"><RefreshCw /> New quote</Button>
                    <Button onClick={() => setDialogOpen(true)} variant="outline" className="flex items-center gap-2 cursor-pointer"><ExternalLink /> Inspect</Button>
                    <CopyButton textToCopy={quoteObj?.quote || ""} label="Copy text" className="w-full justify-center" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* compact list for mobile / fallback */}
          <Card className={clsx("p-4 rounded-2xl border", cardBg)}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><List /> Quick List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs opacity-60 mb-2">Open menu on mobile to view full list.</div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {list.slice(0, 4).map((item) => (
                  <button key={item.id} onClick={() => selectFromList(item)} className="text-left w-full rounded-md p-2 hover:bg-zinc-100/40 cursor-pointer">
                    <div className="text-sm line-clamp-2">{item.quote}</div>
                  </button>
                ))}
                {list.length === 0 && <div className="text-sm opacity-60">No items yet</div>}
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Inspect dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Inspect Raw Response</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto" }}>
            <pre className={clsx("text-sm p-4", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900")}>
              {quoteObj ? prettyJSON(quoteObj) : "No response yet."}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">api.kanye.rest</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* error toast (simple inline) */}
      {errorMsg && (
        <div className="fixed right-6 bottom-6">
          <div className="rounded-lg p-3 bg-red-600 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="font-medium">Error</div>
              <div className="text-sm opacity-90">{errorMsg}</div>
              <button onClick={() => setErrorMsg(null)} className="ml-2 p-1 rounded bg-white/10 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

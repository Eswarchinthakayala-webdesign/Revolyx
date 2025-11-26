// src/pages/DeckOfCardsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCcw,
  Shuffle,
  Download,
  ExternalLink,
  Loader2,
  ImageIcon,
  List,
  Play,
  X,
  Info,
  Check,
  Copy,
  FileText,
  Image,
  CreditCard
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Deck API ---------- */
const BASE = "https://deckofcardsapi.com/api/deck";
const NEW_DECK_SHUFFLE = `${BASE}/new/shuffle/?deck_count=1`;

/* ---------- Helpers: full deck data (52 cards) ---------- */
const SUITS = [
  { code: "S", name: "Spades" },
  { code: "H", name: "Hearts" },
  { code: "D", name: "Diamonds" },
  { code: "C", name: "Clubs" }
];
const VALUES = [
  { code: "A", name: "Ace" },
  { code: "2", name: "2" },
  { code: "3", name: "3" },
  { code: "4", name: "4" },
  { code: "5", name: "5" },
  { code: "6", name: "6" },
  { code: "7", name: "7" },
  { code: "8", name: "8" },
  { code: "9", name: "9" },
  { code: "0", name: "10" }, // API uses '0' for 10
  { code: "J", name: "Jack" },
  { code: "Q", name: "Queen" },
  { code: "K", name: "King" }
];

function buildDeckList() {
  const list = [];
  for (const v of VALUES) {
    for (const s of SUITS) {
      const code = `${v.code}${s.code}`; // e.g. AS, 0H, KC
      const name = `${v.name} of ${s.name}`;
      const image = `https://deckofcardsapi.com/static/img/${code}.png`;
      list.push({ code, value: v.name, suit: s.name, name, image });
    }
  }
  return list;
}
const FULL_DECK = buildDeckList();

/* ---------- Utility ---------- */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

 function CopyButton({
  textToCopy,
  size = 16,
  className = "",
  label = "Copy",
  copiedLabel = "Copied",
  iconOnly = false,
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  async function handleCopy() {
    if (copied) return;

    try {
      await navigator.clipboard.writeText(String(textToCopy ?? ""));
      setCopied(true);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1600);

      showToast("success", "Copied to clipboard");
    } catch (err) {
      console.error("Copy failed:", err);
      showToast("error", "Copy failed");
    }
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.92 }}
      className={clsx(
        "inline-flex items-center cursor-pointer gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700",
        "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        "px-3 py-1.5 transition-colors shadow-sm select-none relative",
        "focus:outline-none focus:ring focus:ring-zinc-400/40 dark:focus:ring-zinc-600/40",
        "disabled:opacity-60",
        className
      )}
      aria-pressed={copied}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
    >
      <AnimatePresence mode="popLayout">
        {!copied ? (
          <motion.span
            key="copy-state"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200"
          >
            <Copy size={size} className="shrink-0" />
            {!iconOnly && <span className="text-sm">{label}</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copied-state"
            initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0, rotate: 15 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="flex items-center gap-2 text-green-600 dark:text-green-400"
          >
            <Check size={size} className="shrink-0" />
            {!iconOnly && <span className="text-sm">{copiedLabel}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}


/* ---------- Component ---------- */
export default function DeckOfCardsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* UI State */
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(FULL_DECK.slice(0, 8));
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  /* Deck/API State */
  const [deckId, setDeckId] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [shuffled, setShuffled] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);

  /* Selected card (from suggestions or search) */
  const [selectedCard, setSelectedCard] = useState(FULL_DECK.find(c => c.code === "AS"));
  const [drawResult, setDrawResult] = useState(null);

  /* Dialog for image */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* Mobile sheet */
  const [sheetOpen, setSheetOpen] = useState(false);

  /* Raw toggle */
  const [showRaw, setShowRaw] = useState(false);

  const suggestTimer = useRef(null);

  /* Initialize deck on mount (default deck) */
  useEffect(() => {
    async function createDeck() {
      try {
        setLoadingApi(true);
        const res = await fetch(NEW_DECK_SHUFFLE);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to create deck");
        setDeckId(json.deck_id);
        setRemaining(json.remaining);
        setShuffled(true);
        showToast("success", "New deck ready");
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to create deck");
      } finally {
        setLoadingApi(false);
      }
    }
    createDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Suggestion logic: filter the in-memory FULL_DECK */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions(FULL_DECK.slice(0, 12));
        setLoadingSuggest(false);
        return;
      }
      // match by name, code, value, suit
      const res = FULL_DECK.filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q) ||
          c.suit.toLowerCase().includes(q)
        );
      }).slice(0, 12);
      setSuggestions(res.length ? res : [{ code: "—", name: "No matches", value: "—", suit: "—", image: "" }]);
      setLoadingSuggest(false);
    }, 220);
  }

  /* Select suggestion */
  function chooseSuggestion(c) {
    if (!c || c.code === "—") return;
    setSelectedCard(c);
    setShowSuggest(false);
    setQuery("");
    setDrawResult(null);
    setSheetOpen(false); // close mobile sheet if open
  }

  /* API: draw N cards from current deck (creates deck if missing) */
  async function drawFromDeck(count = 1) {
    if (!Number.isInteger(count) || count < 1) return showToast("info", "Enter a positive integer");
    setLoadingApi(true);
    try {
      // ensure deck exists
      let id = deckId;
      if (!id) {
        const res = await fetch(NEW_DECK_SHUFFLE);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to create deck");
        id = json.deck_id;
        setDeckId(id);
        setRemaining(json.remaining);
      }

      // draw
      const res2 = await fetch(`${BASE}/${id}/draw/?count=${count}`);
      const json2 = await res2.json();
      if (!res2.ok) throw new Error(json2?.error || "Draw failed");
      setRemaining(json2.remaining);
      setShuffled(false);
      setDrawResult(json2);
      setShowRaw(true); // open raw by default when an API call occurs
      showToast("success", `Drew ${json2.cards?.length ?? 0} card(s)`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to draw cards");
    } finally {
      setLoadingApi(false);
    }
  }

  /* API: reshuffle deck */
  async function reshuffleDeck() {
    if (!deckId) {
      // create a new deck instead
      try {
        setLoadingApi(true);
        const res = await fetch(NEW_DECK_SHUFFLE);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to create deck");
        setDeckId(json.deck_id);
        setRemaining(json.remaining);
        setShuffled(true);
        showToast("success", "New shuffled deck created");
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to recreate deck");
      } finally {
        setLoadingApi(false);
      }
      return;
    }

    try {
      setLoadingApi(true);
      const res = await fetch(`${BASE}/${deckId}/shuffle/`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Shuffle failed");
      setRemaining(json.remaining ?? remaining);
      setShuffled(true);
      setDrawResult(null);
      showToast("success", "Deck reshuffled");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to reshuffle deck");
    } finally {
      setLoadingApi(false);
    }
  }

  /* Download the latest API payload (draw result or deck state) */
  function downloadJSON() {
    const payload = drawResult || { deckId, remaining, shuffled };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deck_payload_${deckId ?? "no-id"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* open JSON in new tab as raw */
  function openJSONInNewTab() {
    const payload = drawResult || { deckId, remaining, shuffled };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // revoke after some time (let browser open it)
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* Render small helper for card field display */
  function Field({ label, value }) {
    return (
      <div className="text-sm">
        <div className="text-xs opacity-60">{label}</div>
        <div className="font-medium break-words">{value ?? "—"}</div>
      </div>
    );
  }

  /* UI theme containers */
  const containerBg = isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200";
  const panelBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-4 sm:p-6 pb-10 overflow-hidden max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Deck — Card Explorer</h1>
          <p className="mt-1 text-sm opacity-70 flex items-center gap-2">
            <Info className="opacity-60" /> <span>Search cards, inspect images, draw from an online deck (Deck of Cards API).</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); /* keep search local */ }}
            className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search card by name (e.g. 'ace', 'spades', 'AS', 'queen')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button
              type="button"
              variant="outline"
              className="px-3 cursor-pointer"
              onClick={() => { setQuery(""); setSuggestions(FULL_DECK.slice(0, 12)); setShowSuggest(true); }}
            >
              <RefreshCcw />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="px-3 cursor-pointer"
              onClick={() => { setSelectedCard(FULL_DECK.find(c => c.code === "AS")); setDrawResult(null); showToast("info", "Reset to Ace of Spades (default)"); }}
            >
              <Loader2 />
            </Button>

            {/* Mobile sheet trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" className="ml-1 md:hidden cursor-pointer" title="Open sidebar">
                  <List />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="p-1">
                <SheetHeader>
                  <SheetTitle>Quick Menu</SheetTitle>
                </SheetHeader>

                <ScrollArea style={{ height: "70vh" }} className="px-4">
                  <div className="space-y-4 py-2">
                    <Card className="rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-semibold">Suggestions</div>
                          <div className="text-xs opacity-60">Quick pick from the deck</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {suggestions.slice(0, 8).map(s => (
                          <button key={s.code} onClick={() => chooseSuggestion(s)} className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:scale-[1.02] transition">
                            <img src={s.image} alt={s.name} className="w-10 h-10 object-contain" />
                            <div className="text-left">
                              <div className="font-medium text-sm">{s.name}</div>
                              <div className="text-xs opacity-60">{s.code}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </Card>

                    <Card className="rounded-lg p-3">
                      <div className="text-sm font-semibold mb-2">Deck Status</div>
                      <div className="text-xs opacity-60 mb-2">Current Deck ID & remaining cards</div>
                      <div className="space-y-2">
                        <Field label="Deck ID" value={deckId ?? "—"} />
                        <Field label="Remaining" value={remaining ?? "—"} />
                        <Field label="Shuffled" value={shuffled ? "Yes" : "No"} />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={() => reshuffleDeck()} className="cursor-pointer"><Shuffle /> Shuffle</Button>
                        <Button variant="outline" onClick={() => { setDeckId(null); setRemaining(null); reshuffleDeck(); }} className="cursor-pointer"><RefreshCcw /> New Deck</Button>
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.code + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-3">
                  {s.image ? <img src={s.image} alt={s.name} className="w-12 h-8 object-cover rounded-sm" /> : <div className="w-12 h-8 rounded-sm bg-zinc-200 dark:bg-zinc-800" />}
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.code} • {s.suit}</div>
                  </div>
                  <div className="text-xs opacity-60" />
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout - left | center | right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: suggestion quick list (hidden on small screens, visible on lg) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-4", panelBg)}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><List /> Suggestions</CardTitle>
                <div className="text-xs opacity-60">Quick pick from the deck</div>
              </div>
              {/* <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowSuggest(s => !s)} className="cursor-pointer"><List /> </Button>
              </div> */}
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {suggestions.slice(0, 8).map((s) => (
                  <button key={s.code} onClick={() => chooseSuggestion(s)} className={clsx("p-2 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition", isDark ? "bg-black/20 border border-zinc-800" : "bg-white/70 border border-zinc-200")}>
                    <img src={s.image} alt={s.name} className="w-12 h-12 object-contain" />
                    <div className="flex-1 text-sm text-left">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">{s.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", containerBg)}>
            <div className="text-sm font-semibold mb-2">Deck Status</div>
            <div className="text-xs opacity-60 mb-2">Current Deck ID & remaining cards</div>
            <div className="space-y-2">
              <Field label="Deck ID" value={deckId ?? "—"} />
              <Field label="Remaining" value={remaining ?? "—"} />
              <Field label="Shuffled" value={shuffled ? "Yes" : "No"} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => reshuffleDeck()} className="cursor-pointer"><Shuffle /> Shuffle</Button>
              <Button variant="outline" onClick={() => { setDeckId(null); setRemaining(null); reshuffleDeck(); }} className="cursor-pointer"><RefreshCcw /> New Deck</Button>
            </div>
          </Card>
        </aside>

        {/* CENTER: Large card details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", panelBg)}>
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <CreditCard className="opacity-70" /> Card Detail
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <ImageIcon className="opacity-70" />
                  <span>{selectedCard?.name ?? "Select a card to see details"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(true)} className="cursor-pointer"><ImageIcon /> View Image</Button>
                <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Export</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* left: visual image preview */}
                <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  {selectedCard?.image ? (
                    <img src={selectedCard.image} alt={selectedCard.name} className="w-full rounded-md object-contain mb-3" />
                  ) : (
                    <div className="w-full h-40 bg-zinc-100 dark:bg-zinc-900 rounded-md flex items-center justify-center">No image</div>
                  )}
                  <div className="text-lg font-semibold">{selectedCard?.name}</div>
                  <div className="text-xs opacity-60">{selectedCard?.code} • {selectedCard?.suit}</div>

                  <div className="mt-3 flex gap-2">
                    <CopyButton textToCopy={selectedCard?.image ?? ""} className="border-transparent bg-zinc-50 hover:bg-zinc-100" />
                    <Button variant="ghost" onClick={() => { if (selectedCard?.image) window.open(selectedCard.image, "_blank"); }} className="cursor-pointer"><ExternalLink /> Open</Button>
                  </div>
                </div>

                {/* center: content & metadata */}
                <div className={clsx("p-4 rounded-xl border col-span-2 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="text-sm font-semibold mb-2">About this card</div>
                  <div className="text-sm leading-relaxed mb-3">
                    The <strong>{selectedCard?.name}</strong> is represented by code <code>{selectedCard?.code}</code>. The Deck of Cards API provides an image for each card which is used in the preview. Use the quick actions on the right to draw this card from the active deck, open the raw API payload, or shuffle the deck.
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Value</div>
                      <div className="text-sm font-medium">{selectedCard?.value}</div>
                    </div>
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Suit</div>
                      <div className="text-sm font-medium">{selectedCard?.suit}</div>
                    </div>
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Code</div>
                      <div className="text-sm font-medium">{selectedCard?.code}</div>
                    </div>
                    <div className="p-2 rounded-md border">
                      <div className="text-xs opacity-60">Image</div>
                      <div className="text-sm font-medium break-words">{selectedCard?.image}</div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Latest API Response</div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer" title="Toggle raw view">
                        <FileText /> {showRaw ? "Pretty" : "Raw"}
                      </Button>

                      <CopyButton textToCopy={drawResult ? prettyJSON(drawResult) : ""} className="border-transparent bg-zinc-50 hover:bg-zinc-100" />

                      <Button variant="ghost" onClick={() => openJSONInNewTab()} className="cursor-pointer" title="Open raw JSON in new tab">
                        <ExternalLink />
                      </Button>
                    </div>
                  </div>

                  <div className={clsx("p-2 rounded-md border overflow-auto mt-2", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")} style={{ maxHeight: 260 }}>
                    <pre className={clsx("text-xs whitespace-pre-wrap", isDark ? "text-zinc-200" : "text-zinc-900")}>
                      {drawResult ? (showRaw ? prettyJSON(drawResult) : JSON.stringify(drawResult, null, 2)) : "No API calls yet. Use 'Draw from Deck' or 'Shuffle' on the right."}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", containerBg)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick Actions</div>
                <div className="text-xs opacity-60">Perform deck operations</div>
              </div>
              <div className="text-xs opacity-60">API</div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Button className="flex-1 cursor-pointer" onClick={() => drawFromDeck(1)} variant="outline"><Play /> Draw 1</Button>
                <Button className="flex-1 cursor-pointer" onClick={() => drawFromDeck(5)} variant="outline">Draw 5</Button>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 cursor-pointer" onClick={() => reshuffleDeck()} variant="outline"><Shuffle /> Shuffle</Button>
                <Button className="flex-1 cursor-pointer" onClick={() => { if (deckId) window.open(`https://deckofcardsapi.com/`, "_blank"); else showToast("info", "No deck to link"); }} variant="ghost"><ExternalLink /></Button>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 cursor-pointer" onClick={() => drawFromDeck(52)} variant="outline"><List /> Draw All</Button>
                <Button className="flex-1 cursor-pointer" onClick={() => downloadJSON()} variant="ghost"><Download /></Button>
              </div>

              <div className="pt-2 text-xs opacity-60">
                <div><strong>Deck ID:</strong> {deckId ?? "—"}</div>
                <div><strong>Remaining:</strong> {remaining ?? "—"}</div>
                <div className="mt-1">Tip: drawing from the deck updates the "Latest API Response" area above.</div>
              </div>

              <div>
                <Button className="w-full mt-2 cursor-pointer" onClick={() => {
                  // quick draw the currently selected card using local knowledge:
                  const fake = {
                    success: true,
                    cards: selectedCard ? [{
                      code: selectedCard.code,
                      image: selectedCard.image,
                      images: { svg: selectedCard.image, png: selectedCard.image },
                      value: selectedCard.value,
                      suit: selectedCard.suit
                    }] : []
                  };
                  setDrawResult(fake);
                  setShowRaw(true);
                  showToast("success", `Previewed ${selectedCard?.name}`);
                }} variant="outline"><Info /> Preview Card</Button>
              </div>

              {loadingApi && <div className="text-center py-3"><Loader2 className="animate-spin mx-auto" /></div>}
            </div>
          </Card>

          {/* large helpful card */}
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", containerBg)}>
            <div className="text-sm font-semibold">About Deck API</div>
            <div className="text-xs opacity-60 mt-1 break-words">Endpoint: <code className="break-words">https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1</code></div>
            <div className="mt-3 text-sm">This page analyzes the API response and shows images, codes and metadata. You can draw, shuffle and export the API payload directly.</div>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedCard?.name || "Card Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selectedCard?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedCard.image} alt={selectedCard?.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Deck of Cards API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (selectedCard?.image) window.open(selectedCard.image, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

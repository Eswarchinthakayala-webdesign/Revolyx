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
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Deck — Card Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Search cards, inspect images, draw from an online deck (Deck of Cards API).</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); /* keep search local */ }} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search card by name (e.g. 'ace', 'spades', 'AS', 'queen')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(""); setSuggestions(FULL_DECK.slice(0, 12)); setShowSuggest(true); }}>
              <RefreshCcw />
            </Button>
            <Button type="button" variant="outline" className="px-3" onClick={() => { setSelectedCard(FULL_DECK.find(c => c.code === "AS")); setDrawResult(null); showToast("info", "Reset to Ace of Spades (default)"); }}>
              <Loader2 />
            </Button>
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
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
            onMouseLeave={() => { /* keep open until explicit close */ }}
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
                  <div className="text-xs opacity-60">{/* placeholder for future meta */}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout - left | center | right */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: suggestion quick list */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-4", panelBg)}>
              <div>
                <CardTitle className="text-lg">Suggestions</CardTitle>
                <div className="text-xs opacity-60">Quick pick from the deck</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowSuggest(s => !s)}><List /> </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {suggestions.slice(0, 8).map((s) => (
                  <div key={s.code} className={clsx("p-2 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition", isDark ? "bg-black/20 border border-zinc-800" : "bg-white/70 border border-zinc-200")} onClick={() => chooseSuggestion(s)}>
                    <img src={s.image} alt={s.name} className="w-12 h-12 object-contain" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">{s.code}</div>
                    </div>
                  </div>
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
              <Button variant="outline" onClick={() => reshuffleDeck()}><Shuffle /> Shuffle</Button>
              <Button variant="outline" onClick={() => { setDeckId(null); setRemaining(null); reshuffleDeck(); }}><RefreshCcw /> New Deck</Button>
            </div>
          </Card>
        </aside>

        {/* CENTER: Large card details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", panelBg)}>
              <div>
                <CardTitle className="text-lg">Card Detail</CardTitle>
                <div className="text-xs opacity-60">{selectedCard?.name ?? "Select a card to see details"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /> Export</Button>
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

                  <div className="text-sm font-semibold mb-2">Latest API Response</div>
                  <div className={clsx("p-2 rounded-md border overflow-auto", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")} style={{ maxHeight: 200 }}>
                    <pre className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-900")}>
                      {drawResult ? prettyJSON(drawResult) : "No API calls yet. Use 'Draw from Deck' or 'Shuffle' on the right."}
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
                <Button className="flex-1" onClick={() => drawFromDeck(1)} variant="outline"><Play /> Draw 1</Button>
                <Button className="flex-1" onClick={() => drawFromDeck(5)} variant="outline">Draw 5</Button>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => reshuffleDeck()} variant="outline"><Shuffle /> Shuffle</Button>
                <Button className="flex-1" onClick={() => { if (deckId) window.open(`https://deckofcardsapi.com/`, "_blank"); else showToast("info", "No deck to link"); }} variant="ghost"><ExternalLink /></Button>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => drawFromDeck(52)} variant="outline"><List /> Draw All</Button>
                <Button className="flex-1" onClick={() => downloadJSON()} variant="ghost"><Download /></Button>
              </div>

              <div className="pt-2 text-xs opacity-60">
                <div><strong>Deck ID:</strong> {deckId ?? "—"}</div>
                <div><strong>Remaining:</strong> {remaining ?? "—"}</div>
                <div className="mt-1">Tip: drawing from the deck updates the "Latest API Response" area above.</div>
              </div>

              <div>
                <Button className="w-full mt-2" onClick={() => {
                  // quick draw the currently selected card using local knowledge:
                  // We simulate a draw by returning the selected card as a "fake" draw result.
                  // Real draw from deck should be done via drawFromDeck.
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
                  showToast("success", `Previewed ${selectedCard?.name}`);
                }} variant="outline"><Info /> Preview Card</Button>
              </div>

              {loadingApi && <div className="text-center py-3"><Loader2 className="animate-spin mx-auto" /></div>}
            </div>
          </Card>

          {/* large helpful card */}
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", containerBg)}>
            <div className="text-sm font-semibold">About Deck API</div>
            <div className="text-xs opacity-60 mt-1">Endpoint: <code className="break-words">https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1</code></div>
            <div className="mt-3 text-sm">This page analyzes the API response and shows images, codes and metadata. You can draw, shuffle and export the API payload directly.</div>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (selectedCard?.image) window.open(selectedCard.image, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

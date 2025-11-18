// EmojiHubPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ImageIcon,
  Copy,
  ExternalLink,
  List,
  Download,
  Loader2,
  Smile,
  Tag,
  Grid,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * EmojiHubPage
 * - Fetches the full emoji list from https://emojihub.yurace.pro/api/all
 * - Client-side filter/search with suggestion dropdown
 * - Large detail view for selected emoji (left & center)
 * - Right column: quick actions (copy emoji, copy JSON, download, open endpoint)
 *
 * Notes:
 * - No localStorage / save logic (per request)
 * - Default emoji = first item after fetch
 */

const ENDPOINT = "https://emojihub.yurace.pro/api/all";
const DEFAULT_HINT = "Try searching 'smile', 'animal', 'food', 'cat'...";

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export default function EmojiHubPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // data
  const [allEmojis, setAllEmojis] = useState(null); // full array from API
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState(null);

  // search / suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);
  const abortRef = useRef(null);

  // selected emoji
  const [selected, setSelected] = useState(null);
  const [rawVisible, setRawVisible] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // fetch all emojis once
  useEffect(() => {
    let alive = true;
    async function fetchAll() {
      setLoadingAll(true);
      setError(null);
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Unexpected response shape");
        if (!alive) return;
        setAllEmojis(json);
        setSelected(json[0] ?? null); // default = first item
      } catch (err) {
        console.error("EmojiHub fetch error:", err);
        setError(String(err.message || err));
      } finally {
        setLoadingAll(false);
      }
    }
    fetchAll();
    return () => { alive = false; if (abortRef.current) abortRef.current.abort(); };
  }, []);

  // helper: filter suggestions locally (fast)
  function filterSuggestions(q) {
    if (!allEmojis) return [];
    const normalized = q.trim().toLowerCase();
    if (!normalized) return [];
    const results = [];
    for (let i = 0; i < allEmojis.length && results.length < 12; i++) {
      const e = allEmojis[i];
      // common fields: name, category, group, keywords? (defensive)
      if (
        (e.name && e.name.toLowerCase().includes(normalized)) ||
        (e.category && e.category.toLowerCase().includes(normalized)) ||
        (e.group && e.group.toLowerCase().includes(normalized)) ||
        (e.htmlCode && JSON.stringify(e.htmlCode).toLowerCase().includes(normalized))
      ) {
        results.push(e);
      }
    }
    return results;
  }

  // debounce local suggest filter
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const s = filterSuggestions(v);
      setSuggestions(s);
      setLoadingSuggest(false);
    }, 220);
  }

  function onSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim() === "") {
      showToast("info", DEFAULT_HINT);
      return;
    }
    // if we have exact match, pick first suggestion
    const s = filterSuggestions(query);
    if (s.length > 0) {
      setSelected(s[0]);
      setShowSuggest(false);
      showToast("success", `Showing: ${s[0].name}`);
    } else {
      showToast("info", "No emoji matched your search");
    }
  }

  function pickSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    setQuery(item.name || "");
  }

  // render helpers: the API returns objects with common keys like:
  // name, category, group, htmlCode (array), unicode (string), unicodeName, codePoint
  // But be defensive and show any other fields under Raw.
  function renderEmojiVisual(item, large = false) {
    if (!item) return null;
    // prefer 'unicode' field which is the actual emoji character if present
    if (item.unicode && typeof item.unicode === "string" && item.unicode.trim()) {
      return <div style={{ fontSize: large ? 72 : 28, lineHeight: 1 }}>{item.unicode}</div>;
    }
    // fallback: some responses include htmlCode as ["&#128512;"] - safe to render as innerHTML
    if (Array.isArray(item.htmlCode) && item.htmlCode.length > 0) {
      // render first html code - sanitized assumption (trusted API). Keep minimal.
      return <div style={{ fontSize: large ? 72 : 28 }} dangerouslySetInnerHTML={{ __html: item.htmlCode[0] }} />;
    }
    // fallback: some items include 'css' or images - show ImageIcon
    return <div style={{ fontSize: large ? 52 : 24 }}><Smile /></div>;
  }

  // quick actions
  function copyEmoji() {
    if (!selected) return showToast("info", "No emoji selected");
    const char = selected.unicode || (selected.htmlCode && selected.htmlCode[0]) || selected.name;
    navigator.clipboard.writeText(char).then(() => showToast("success", "Copied emoji to clipboard"));
  }

  function copyJSON() {
    if (!selected) return showToast("info", "No emoji selected");
    navigator.clipboard.writeText(prettyJSON(selected)).then(() => showToast("success", "Copied JSON"));
  }

  function downloadSelectedJSON() {
    const payload = selected || allEmojis || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `emoji_${(selected?.name || "list").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  const detailKeys = useMemo(() => {
    if (!selected) return [];
    return Object.keys(selected);
  }, [selected]);

  // UI layout render
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>EmojiHub — Categories & Details</h1>
          <p className="mt-1 text-sm opacity-70">Browse emoji categories, search by name/group and inspect full metadata.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder={DEFAULT_HINT}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search emojis"
            />
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, i) => (
              <li key={s.name + i} onClick={() => pickSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md flex items-center justify-center">
                    {renderEmojiVisual(s)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.category} • {s.group}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.unicode || (Array.isArray(s.htmlCode) ? s.htmlCode[0] : "")}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout: left + center (details) and right quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left column: visual + quick metadata (uses 4/12) */}
        <section className="lg:col-span-4 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-center justify-between gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Emoji</CardTitle>
                <div className="text-xs opacity-60">{selected?.name || "Loading…"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setRawVisible(v => !v)}><List /></Button>
                <Button variant="ghost" onClick={() => setImageOpen(true)}><ImageIcon /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingAll ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No emoji loaded yet.</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl p-6 border flex items-center gap-6">
                    <div className="w-32 h-32 rounded-lg flex items-center justify-center border bg-transparent">
                      {renderEmojiVisual(selected, true)}
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold">{selected.name}</div>
                      <div className="text-xs opacity-60 mt-1">{selected.category} • {selected.group}</div>
                      <div className="mt-3 text-sm opacity-70">
                        <div><span className="font-medium">Unicode:</span> {selected.unicode || "—"}</div>
                        <div className="mt-1"><span className="font-medium">HTML code:</span> {Array.isArray(selected.htmlCode) ? selected.htmlCode.join(", ") : "—"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-3 border">
                    <div className="text-xs opacity-60">Quick tags</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.keywords && selected.keywords.length > 0
                        ? selected.keywords.map((k, idx) => <span key={idx} className="text-xs px-2 py-1 rounded-md bg-zinc-100/50">{k}</span>)
                        : <span className="text-xs opacity-50">No tags</span>
                      }
                    </div>
                  </div>

                  <AnimatePresence>
                    {rawVisible && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl p-3 border">
                        <div className="text-xs opacity-60">Raw object</div>
                        <pre className="text-xs overflow-auto mt-2" style={{ maxHeight: 260 }}>{prettyJSON(selected)}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Center column: large details & examples (8/12) */}
        <section className="lg:col-span-5 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-6">
              <CardTitle className="text-lg">Details & Usage</CardTitle>
              <div className="text-xs opacity-60 mt-1">Complete metadata returned from EmojiHub — helpful for devs and designers.</div>
            </CardHeader>

            <CardContent>
              {!selected ? (
                <div className="py-12 text-center text-sm opacity-60">Select an emoji to view details here.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs opacity-60">Preview</div>
                    <div className="mt-2 text-xl">{renderEmojiVisual(selected, false)} <span className="ml-3 text-lg font-medium">{selected.unicode ?? ""}</span></div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-xs opacity-60">Category & Group</div>
                    <div className="mt-2 flex gap-3 items-center">
                      <div className="px-2 py-1 rounded-md bg-zinc-100/50 text-sm">{selected.category}</div>
                      <div className="px-2 py-1 rounded-md bg-zinc-100/30 text-sm">{selected.group}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60">HTML Code (use in markup)</div>
                    <div className="mt-2 text-sm">
                      {Array.isArray(selected.htmlCode) ? (
                        selected.htmlCode.map((h, idx) => <div key={idx} className="font-mono text-sm">{h}</div>)
                      ) : (
                        <div className="opacity-60">—</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60">Example usages</div>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="bg-zinc-100/40 p-3 rounded">
                        <div className="font-medium text-xs opacity-60">HTML</div>
                        <div className="mt-1 font-mono text-sm">{Array.isArray(selected.htmlCode) ? selected.htmlCode[0] : "<!-- no html -->"}</div>
                      </div>

                      <div className="bg-zinc-100/40 p-3 rounded">
                        <div className="font-medium text-xs opacity-60">JS / React</div>
                        <div className="mt-1 font-mono text-sm">{"const emoji = "}{selected.unicode ? `"${selected.unicode}"` : `"${selected.name}"`}</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right column: Quick actions (3/12) */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="text-xs opacity-60">Developer</div>
            </div>

            <div className="mt-3 space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={copyEmoji}><Copy className="mr-2" /> Copy emoji</Button>
              <Button variant="outline" className="w-full justify-start" onClick={copyJSON}><Copy className="mr-2" /> Copy JSON</Button>
              <Button variant="outline" className="w-full justify-start" onClick={downloadSelectedJSON}><Download className="mr-2" /> Download JSON</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open(ENDPOINT, "_blank")}><ExternalLink className="mr-2" /> Open endpoint</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                // show a short guide toast
                showToast("info", "Use the HTML code in your markup or unicode in JS/React.");
              }}><Zap className="mr-2" /> Quick tip</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Dataset info</div>
            <div className="text-xs opacity-60">
              Source: EmojiHub (no API key). The endpoint returns an array of emoji objects including `name`, `category`, `group`, `htmlCode`, and `unicode`. This page fetches the full list once and filters client-side for instant results.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

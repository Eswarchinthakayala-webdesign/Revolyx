// src/pages/ThronesApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ExternalLink,
  Copy,
  Shuffle,
  Image,
  Info,
  Users,
  Loader2,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

const API_ENDPOINT = "https://thronesapi.com/api/v2/Characters";
const DEFAULT_MSG = "Search characters by name, title, family...";

// small helper to pretty-print JSON
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function ThronesApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [allChars, setAllChars] = useState([]); // full list from API
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  // fetch all characters once on mount (Thrones API returns an array)
  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) {
          showToast("error", `Failed to load characters (${res.status})`);
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        setAllChars(Array.isArray(json) ? json : []);
        setRawResp(json);
        if (Array.isArray(json) && json.length > 0) {
          setSelected(json[0]);
          showToast("success", `Loaded ${json.length} characters`);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to fetch characters");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // search logic (client-side filtering — API returns full dataset)
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        return;
      }
      // Search across common fields: fullName, firstName, lastName, title, family
      const results = allChars.filter((c) => {
        const combined = `${c.fullName ?? ""} ${c.firstName ?? ""} ${c.lastName ?? ""} ${c.title ?? ""} ${c.family ?? ""}`.toLowerCase();
        return combined.includes(q);
      }).slice(0, 20);
      setSuggestions(results);
    }, 240);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    // pick first matching item (if any)
    const q = query.trim().toLowerCase();
    const found = allChars.find((c) => {
      const combined = `${c.fullName ?? ""} ${c.firstName ?? ""} ${c.lastName ?? ""} ${c.title ?? ""} ${c.family ?? ""}`.toLowerCase();
      return combined.includes(q);
    });
    if (found) {
      setSelected(found);
      setShowSuggest(false);
      showToast("success", `Selected: ${found.fullName ?? (found.firstName + " " + found.lastName)}`);
    } else {
      showToast("info", "No characters found — try different keywords");
    }
  }

  function chooseSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    setQuery(item.fullName ?? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim());
  }

  function copyJSON() {
    if (!selected) return showToast("info", "No character selected");
    navigator.clipboard.writeText(prettyJSON(selected));
    showToast("success", "Character JSON copied");
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(API_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  function openImage() {
    if (!selected || !selected.imageUrl) return showToast("info", "No image available");
    setImgDialogOpen(true);
  }

  function openExternalImage() {
    if (!selected || !selected.imageUrl) return showToast("info", "No image available");
    window.open(selected.imageUrl, "_blank");
  }

  function randomCharacter() {
    if (!allChars || allChars.length === 0) return;
    const idx = Math.floor(Math.random() * allChars.length);
    const item = allChars[idx];
    setSelected(item);
    setQuery(item.fullName ?? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim());
    showToast("success", `Random: ${item.fullName ?? item.firstName}`);
  }

  const leftList = useMemo(() => {
    // shortlist for left list: either suggestions if visible, else first 12 characters
    if (showSuggest && suggestions.length > 0) return suggestions;
    return allChars;
  }, [allChars, suggestions, showSuggest]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Thrones — Characters</h1>
          <p className="mt-1 text-sm opacity-70">Browse Game of Thrones characters. Search, inspect details, and copy JSON.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1.5", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search characters, titles, family..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}>
              Clear
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions dropdown (shared across layout) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {suggestions.map((s) => (
              <li key={s.id ?? s.fullName} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <img src={s.imageUrl || s.imageUrl || ""} alt={s.fullName ?? s.firstName} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.fullName ?? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim()}</div>
                    <div className="text-xs opacity-60">{s.title || s.family || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.id}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: compact list / search results */}
        <aside className={clsx("lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-base">Characters</CardTitle>
                <div className="text-xs opacity-60">Quick list & search results</div>
              </div>
              <div className="text-xs opacity-60">{allChars.length ? `${allChars.length}` : "…"}</div>
            </CardHeader>

            <CardContent>
              <ScrollArea style={{ maxHeight: 420 }} className="overflow-auto">
                <div className="space-y-2">
                  {loading ? (
                    <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : leftList.length === 0 ? (
                    <div className="py-6 text-center text-sm opacity-60">No characters — try refreshing</div>
                  ) : (
                    leftList.map((c) => {
                      const name = c.fullName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
                      const key = c.id ?? name;
                      const active = selected && (selected.id === c.id);
                      return (
                        <div key={key} className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer", active ? "bg-zinc-100 dark:bg-zinc-800/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40")} onClick={() => { setSelected(c); setShowSuggest(false); setQuery(name); }}>
                          <img src={c.imageUrl || ""} alt={name} className="w-12 h-12 object-cover rounded-md" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            <div className="text-xs opacity-60 truncate">{c.title || c.family || "—"}</div>
                          </div>
                          <div className="text-xs opacity-60">{c.id}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Filters & Info</CardTitle>
              <div className="text-xs opacity-60">Client-side search, responsive layout</div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => { copyEndpoint(); }}>Copy Endpoint</Button>
                <Button variant="outline" onClick={() => randomCharacter()}><Shuffle /> Random</Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><Info /> Toggle Raw</Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: full details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Character Details</CardTitle>
                <div className="text-xs opacity-60">{selected?.fullName ?? (selected ? `${selected.firstName} ${selected.lastName}` : "Waiting for selection...")}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setSelected(null); setQuery(""); setShowSuggest(false); }}>Clear</Button>
                <Button variant="ghost" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
                <Button variant="ghost" onClick={() => openImage()}><Image /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">Select a character from the left or search to begin.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image + basic meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={selected.imageUrl || ""} alt={selected.fullName ?? selected.firstName} className="w-full rounded-md object-cover mb-3" />
                    <div className="text-lg font-semibold">{selected.fullName ?? `${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim()}</div>
                    <div className="text-xs opacity-60">{selected.title || "No title available"}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Family</div>
                        <div className="font-medium">{selected.family || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Id</div>
                        <div className="font-medium">{selected.id ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button variant="outline" onClick={() => { if (selected.imageUrl) openExternalImage(); else showToast("info", "No image URL"); }}><ExternalLink /> Open Image</Button>
                    </div>
                  </div>

                  {/* Right: structured fields / all keys */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed mb-3">
                      {/* Thrones API does not provide biography — show structured data and helpful text */}
                      This view shows structured fields returned by the Thrones API. Use the right panel for quick developer actions.
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(selected).map((k) => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium break-words">{typeof selected[k] === "object" ? JSON.stringify(selected[k]) : (selected[k] ?? "—")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Developer & utility actions</div>
            </div>
            <div className="text-xs opacity-60">v1</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button className="w-full" onClick={() => copyJSON()}><Copy /> Copy character JSON</Button>
            <Button className="w-full" variant="outline" onClick={() => openImage()}><Image /> View image</Button>
            <Button className="w-full" variant="outline" onClick={() => randomCharacter()}><Shuffle /> Random</Button>
            <Button className="w-full" variant="ghost" onClick={() => copyEndpoint()}><ExternalLink /> Copy endpoint</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer notes</div>
            <div className="text-xs opacity-60">This page fetches the full dataset from <code className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded">/api/v2/Characters</code> and performs client-side search for low-latency suggestions. Fields are displayed dynamically to cope with schema changes.</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.fullName ?? "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selected?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected?.fullName} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image (if available)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImgDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => openExternalImage()}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

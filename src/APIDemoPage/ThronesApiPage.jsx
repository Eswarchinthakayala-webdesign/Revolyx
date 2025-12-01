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
  Image as ImageIcon,
  Info,
  Users,
  Loader2,
  X,
  Menu,
  RefreshCw,
  Check,
  FileText,
  MapPin,
  Star,
  List,
  IdCard,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const API_ENDPOINT = "https://thronesapi.com/api/v2/Characters";
const DEFAULT_MSG = "Search characters by name, title, family...";

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

  // data
  const [allChars, setAllChars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rawResp, setRawResp] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  const [selected, setSelected] = useState(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [copied, setCopied] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [randomPicks, setRandomPicks] = useState([]);

  /* ---------- Fetch once ---------- */
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
        const arr = Array.isArray(json) ? json : [];
        setAllChars(arr);
        setRawResp(json);
        if (arr.length > 0) {
          setSelected(arr[0]);
          generateRandomPicks(arr);
          showToast("success", `Loaded ${arr.length} characters`);
        } else {
          showToast("info", "No characters returned by API");
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to fetch characters");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- Utilities ---------- */
  function generateRandomPicks(pool = allChars) {
    if (!pool || pool.length === 0) {
      setRandomPicks([]);
      return;
    }
    const picks = new Set();
    while (picks.size < Math.min(10, pool.length)) {
      picks.add(pool[Math.floor(Math.random() * pool.length)]);
    }
    setRandomPicks(Array.from(picks));
  }

  /* ---------- Search / suggestions (client side) ---------- */
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
      const results = allChars.filter((c) => {
        const combined = `${c.fullName ?? ""} ${c.firstName ?? ""} ${c.lastName ?? ""} ${c.title ?? ""} ${c.family ?? ""}`.toLowerCase();
        return combined.includes(q);
      }).slice(0, 20);
      setSuggestions(results);
    }, 220);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
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
      showToast("info", "No match found — try different keywords");
    }
  }

  function chooseSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    setQuery(item.fullName ?? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim());
  }

  /* ---------- Actions ---------- */
  async function handleCopy() {
    if (!selected) return showToast("info", "No character selected");
    try {
      await navigator.clipboard.writeText(prettyJSON(selected));
      setCopied(true);
      showToast("success", "Character JSON copied");
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
    }
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(API_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  function openImage() {
    if (!selected || !selected.imageUrl) return showToast("info", "No image available");
    setImgDialogOpen(true);
  }

  function openImageExternal() {
    if (!selected || !selected.imageUrl) return showToast("info", "No image available");
    window.open(selected.imageUrl, "_blank");
  }

  function handleRandomPick() {
    if (!allChars || allChars.length === 0) return;
    const idx = Math.floor(Math.random() * allChars.length);
    const item = allChars[idx];
    setSelected(item);
    setQuery(item.fullName ?? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim());
    showToast("success", `Random: ${item.fullName ?? item.firstName}`);
  }

  /* helper for list displayed on left (if suggestions shown, prefer that) */
  const leftList = useMemo(() => (showSuggest && suggestions.length > 0 ? suggestions : randomPicks.length > 0 ? randomPicks : allChars.slice(0, 12)), [allChars, suggestions, showSuggest, randomPicks]);

  /* ------------ Render ------------ */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* mobile sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" className="p-2 rounded-md cursor-pointer"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold flex items-center gap-2"><Users /> Characters</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => generateRandomPicks()} className="cursor-pointer"><RefreshCw /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setSheetOpen(false)} className="cursor-pointer"><X /></Button>
                  </div>
                </div>

                <ScrollArea style={{ height: 620 }}>
                  <div className="space-y-2">
                    {leftList.map((c) => {
                      const name = c.fullName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
                      const active = selected && (selected.id === c.id);
                      return (
                        <div key={c.id ?? name} onClick={() => { setSelected(c); setSheetOpen(false); }} className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer", active ? "bg-gradient-to-r from-white/30 to-white/10 border border-zinc-200 dark:border-zinc-700" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40")}>
                          <img src={c.imageUrl || ""} alt={name} className="w-12 h-12 object-cover rounded-md" />
                          <div className="min-w-0">
                            <div className="font-medium ">{name}</div>
                            <div className="text-xs opacity-60 ">{c.title || c.family || "—"}</div>
                          </div>
                          <Badge className="ml-auto glass">{c.id}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold flex items-center gap-3")}>
              <Star className="opacity-70" /> Thrones — Characters
            </h1>
            <p className="text-xs opacity-70">Browse characters, inspect metadata, export JSON.</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className={clsx("relative w-full md:w-[680px]")} role="search">
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search characters, titles, family..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="ghost" className="px-2 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}>
              Clear
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>

            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" onClick={() => { generateRandomPicks(); showToast("success", "Random picks refreshed"); }} className="cursor-pointer"><Shuffle /></Button>
            </div>
          </div>

          {/* suggestions dropdown */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("absolute left-0 right-0 mt-2 max-h-80 overflow-auto rounded-xl shadow-2xl z-50", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {suggestions.map((s) => (
                  <li key={s.id} onClick={() => chooseSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <img src={s.imageUrl || ""} alt={s.fullName ?? s.firstName} className="w-12 h-12 object-cover rounded-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.fullName ?? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim()}</div>
                        <div className="text-xs opacity-60 truncate">{s.title || s.family || "—"}</div>
                      </div>
                      <div className="text-xs opacity-60">#{s.id}</div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Page layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-2">
                <Users />
                <div>
                  <CardTitle className="text-sm">Picks</CardTitle>
                  <div className="text-xs opacity-60">Ten random characters</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => generateRandomPicks()} className="cursor-pointer"><RefreshCw /></Button>
                <Button variant="ghost" size="sm" onClick={() => { setRandomPicks(allChars.slice(0, 10)); }} className="cursor-pointer">Top</Button>
              </div>
            </CardHeader>

            <CardContent>
              <ScrollArea className="overflow-y-auto" style={{ maxHeight: 520 }}>
                <div className="space-y-2">
                  {loading ? (
                    <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : leftList.length === 0 ? (
                    <div className="py-6 text-center text-sm opacity-60">No characters available</div>
                  ) : (
                    leftList.map((c) => {
                      const name = c.fullName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
                      const active = selected && (selected.id === c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => { setSelected(c); setShowSuggest(false); }}
                          className={clsx("flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all", active ? "bg-gradient-to-r from-white/10 to-white/5 border border-zinc-300 dark:border-zinc-700 shadow-sm" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40")}
                        >
                          <img src={c.imageUrl || ""} alt={name} className="w-12 h-12 object-cover rounded-md" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium ">{name}</div>
                            <div className="text-xs opacity-60 ">{c.title || c.family || "—"}</div>
                          </div>
                          <Badge className="glass">{c.id}</Badge>
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
              <CardTitle className="text-sm">Actions</CardTitle>
              <div className="text-xs opacity-60">Utilities</div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button className="w-full cursor-pointer" variant="outline" onClick={() => { copyEndpoint(); }}>Copy Endpoint</Button>
                <Button className="w-full cursor-pointer" variant="outline" onClick={() => handleRandomPick()}><Shuffle /> Random</Button>
                <Button className="w-full cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><Info /> Toggle Raw</Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center preview */}
        <section className={clsx("lg:col-span-6 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-start justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg flex items-center gap-2"><List /> Character Preview</CardTitle>
                </div>
                <div className="mt-1 text-xs opacity-60 flex items-center gap-3">
                  <div className="flex items-center gap-1"><MapPin className="opacity-70" /> {selected?.title ?? "Title"}</div>
                  <div className="flex items-center gap-1"><Star className="opacity-70" /> {selected?.family ?? "Family"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setSelected(null); setQuery(""); setShowSuggest(false); }} className="cursor-pointer">Clear</Button>

           

                <Button variant="ghost" onClick={() => openImage()} className="cursor-pointer"><ImageIcon /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">Select a character from the left or search to begin.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* image & badges */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={selected.imageUrl || ""} alt={selected.fullName ?? selected.firstName} className="w-full rounded-md object-cover mb-3" />
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-semibold">{selected.fullName ?? `${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim()}</h2>
                      <Badge className="glass">{selected.id}</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <Badge className="glass">{selected.title || "No title"}</Badge>
                      <Badge className="glass">{selected.family || "No family"}</Badge>
                    </div>

                    <div className="text-sm opacity-80">
                      <div className="text-xs opacity-60">Basic</div>
                      <div className="font-medium">{selected.firstName ?? "—"} {selected.lastName ?? ""}</div>
                      <div className="mt-2 text-xs opacity-60">ID</div>
                      <div className="font-medium">#{selected.id}</div>
                    </div>

                    <div className="mt-4">
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => openImageExternal()}><ExternalLink /> Open image</Button>
                    </div>
                  </div>

                  {/* details grid */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2"><Users /> Overview</div>
                      <div className="text-xs opacity-60">Fields</div>
                    </div>

                    <div className="text-sm leading-relaxed mb-3">
                      This panel shows all returned fields for the selected character. Use the copy/download actions to export JSON.
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.keys(selected).map((k) => (
                        <div key={k} className="p-3 rounded-md border">
                          <div className="text-xs capitalize flex items-center gap-1 opacity-60"><IdCard/> {k}</div>
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

        {/* Right actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Developer & utility</div>
            </div>
            <div className="text-xs opacity-60">v1</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button className="w-full cursor-pointer" onClick={() => handleCopy()}><Copy /> Copy character JSON</Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => openImage()}><ImageIcon /> View image</Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => handleRandomPick()}><Shuffle /> Random</Button>
            <Button className="w-full cursor-pointer" variant="ghost" onClick={() => copyEndpoint()}><ExternalLink /> Copy endpoint</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer notes</div>
            <div className="text-xs opacity-60">
              This page fetches the full dataset from <code className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded">/api/v2/Characters</code> and performs client-side search for low-latency suggestions.
            </div>
          </div>
        </aside>
      </main>

      {/* Image Dialog */}
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.fullName ?? "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selected?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected?.fullName} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center"><Info /> No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image (if available)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImgDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => openImageExternal()} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

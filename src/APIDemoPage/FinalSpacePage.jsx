// src/pages/FinalSpacePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  List,
  ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  FileText,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* ---------- Final Space API base ---------- */
const BASE = "https://finalspaceapi.com/api/v0";

/* resource config */
const RESOURCES = [
  { key: "character", label: "Characters", endpoint: `${BASE}/character/` },
  { key: "episode", label: "Episodes", endpoint: `${BASE}/episode/` },
  { key: "quote", label: "Quotes", endpoint: `${BASE}/quote/` },
  { key: "location", label: "Locations", endpoint: `${BASE}/location/` }
];

/* ---------- Helpers ---------- */
const prettyJSON = (obj) => JSON.stringify(obj, null, 2);

function humanLabelForKey(k) {
  return k.replace(/_/g, " ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}

/* ---------- Component ---------- */
export default function FinalSpacePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [resource, setResource] = useState(RESOURCES[0]); // default: characters
  const [list, setList] = useState([]); // fetched items for current resource
  const [loadingList, setLoadingList] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [current, setCurrent] = useState(null); // selected item
  const [rawOpen, setRawOpen] = useState(false);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* fetch the full list for the currently selected resource */
  useEffect(() => {
    let cancelled = false;
    async function fetchList() {
      setLoadingList(true);
      try {
        const res = await fetch(resource.endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          // API returns an array directly
          setList(Array.isArray(json) ? json : []);
          // auto-select first item as "default" to show on the page
          if (Array.isArray(json) && json.length > 0) {
            setCurrent(json[0]);
          } else {
            setCurrent(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch", resource, err);
        setList([]);
        setCurrent(null);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }
    fetchList();
    return () => {
      cancelled = true;
    };
  }, [resource]);

  /* suggestions: client-side filter of the fetched list for stable behaviour */
  useEffect(() => {
    if (!query || query.trim() === "") {
      setSuggestions([]);
      return;
    }
    // small delay debounce
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = query.toLowerCase().trim();
      const filtered = list.filter((it) => {
        // check a few likely fields for match
        const name = (it.name || it.title || it.quote || "").toString().toLowerCase();
        const id = it.id?.toString?.() ?? "";
        const by = (it.by || it.character || "").toString().toLowerCase();
        return name.includes(q) || id.includes(q) || by.includes(q);
      });
      setSuggestions(filtered.slice(0, 12));
      setShowSuggest(true);
    }, 260);
  }, [query, list]);

  /* UI actions */
  function selectSuggestion(item) {
    setCurrent(item);
    setShowSuggest(false);
  }

  function copyJSON() {
    if (!current) return;
    navigator.clipboard.writeText(prettyJSON(current));
    // small visual hint: you may want to use a toast helper in your app
  }

  function downloadJSON() {
    const payload = current || list;
    if (!payload) return;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = (current?.name || current?.title || resource.key).toString().replace(/\s+/g, "_");
    a.download = `${resource.key}_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openOriginalLink() {
    if (!current) return;
    // many objects may not have direct external URLs.
    // Characters and episodes sometimes include 'img_url' or 'image' fields or a 'url' link.
    const possible = current.link || current.url || current.character || current.image || current.img_url;
    if (typeof possible === "string" && possible.startsWith("http")) {
      window.open(possible, "_blank");
    } else {
      // fallback: open API endpoint for that id if id exists
      if (current.id != null) {
        window.open(`${resource.endpoint}${current.id}`, "_blank");
      }
    }
  }

  function downloadListAsJSON() {
    const blob = new Blob([prettyJSON(list)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${resource.key}_list.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* Derived rendering helpers */
  const imageUrl = useMemo(() => {
    if (!current) return null;
    return current.img_url || current.image || current.img || current.image_url || null;
  }, [current]);

  /* small renderer for the "main title" shown in center */
  function mainTitleFor(obj) {
    if (!obj) return "No item selected";
    return obj.name || obj.title || obj.quote || `#${obj.id}` || "Item";
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Final Space — Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Browse characters, episodes, quotes & locations from Final Space API</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* resource switcher */}
          <div className={clsx("flex items-center gap-2 rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            {RESOURCES.map((r) => (
              <Button
                key={r.key}
                variant={r.key === resource.key ? "default" : "ghost"}
                onClick={() => setResource(r)}
                className="px-3 py-1"
                size="sm"
              >
                {r.label}
              </Button>
            ))}
          </div>

          {/* search form */}
          <form
            onSubmit={(e) => {
              e?.preventDefault?.();
              // focusing/search handled by suggestions already; if only one suggestion, select it
              if (suggestions.length > 0) selectSuggestion(suggestions[0]);
            }}
            className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              placeholder={`Search ${resource.label} (name, id, or text)...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => {
              setQuery("");
              setSuggestions([]);
              setShowSuggest(false);
            }}>
              Clear
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {suggestions.map((s, idx) => (
              <li key={s.id ?? idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <img src={s.img_url || s.image || s.image_url || ""} alt={s.name || s.title || "thumb"} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{mainTitleFor(s)}</div>
                    <div className="text-xs opacity-60">{(s.origin || s.air_date || s.by || s.character) ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.id != null ? `#${s.id}` : ""}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* main layout: left (list/search), center (details), right (actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* left: compact list (search + list) */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-sm">{resource.label}</CardTitle>
                <div className="text-xs opacity-60">Fetched {list.length} items</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setResource(resource); /* refresh */ setList([]); }}>
                  <RefreshCw className={loadingList ? "animate-spin" : ""} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea style={{ maxHeight: 520 }} className="overflow-auto">
                <div className="p-3 space-y-2">
                  {loadingList ? (
                    <div className="py-6 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : list.length === 0 ? (
                    <div className="py-6 text-center text-sm opacity-60">No items loaded</div>
                  ) : (
                    list.map((it) => (
                      <div key={it.id ?? it.name} className={clsx("flex items-center gap-3 w-80 truncate p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer", current?.id === it.id ? "ring-2 ring-indigo-500/30" : "")} onClick={() => selectSuggestion(it)}>
                        <img src={it.img_url || it.image || it.image_url || ""} alt={it.name || it.title || ""} className="w-12 h-10 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium w-full truncate">{mainTitleFor(it)}</div>
                          <div className="text-xs opacity-60 truncate">{it.origin || it.air_date || it.by || ""}</div>
                        </div>
                        <div className="text-xs opacity-50">#{it.id ?? ""}</div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* center: big detail viewer */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">{mainTitleFor(current)}</CardTitle>
                <div className="text-xs opacity-60">{current ? `${resource.label} • ${current.id != null ? `#${current.id}` : ""}` : "No item selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setRawOpen((s) => !s)}><List /> {rawOpen ? "Hide Raw" : "Raw"}</Button>
                {imageUrl && <Button variant="ghost" size="sm" onClick={() => setImgDialogOpen(true)}><ImageIcon /> Image</Button>}
                <Button variant="outline" size="sm" onClick={() => downloadJSON()}><Download /> Download</Button>
              </div>
            </CardHeader>

            <CardContent>
              {(!current) ? (
                <div className="py-12 text-center text-sm opacity-60">Select an item from the left or search above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* left: image & core meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full h-44 rounded-md overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      {imageUrl ? (
                        <img src={imageUrl} alt={mainTitleFor(current)} className="object-cover w-full h-full" />
                      ) : (
                        <div className="text-xs opacity-60">No image</div>
                      )}
                    </div>

                    <div className="text-lg font-semibold">{mainTitleFor(current)}</div>
                    <div className="text-xs opacity-60 mb-3">{current.origin || current.air_date || current.by || "—"}</div>

                    <div className="space-y-2 text-sm">
                      {/* show a few highlighted fields */}
                      {current.status && (
                        <div>
                          <div className="text-xs opacity-60">Status</div>
                          <div className="font-medium">{current.status}</div>
                        </div>
                      )}

                      {current.species && (
                        <div>
                          <div className="text-xs opacity-60">Species</div>
                          <div className="font-medium">{current.species}</div>
                        </div>
                      )}

                      {current.abilities && Array.isArray(current.abilities) && current.abilities.length > 0 && (
                        <div>
                          <div className="text-xs opacity-60">Abilities</div>
                          <div className="font-medium">{current.abilities.join(", ")}</div>
                        </div>
                      )}

                      {current.alias && Array.isArray(current.alias) && current.alias.length > 0 && (
                        <div>
                          <div className="text-xs opacity-60">Aliases</div>
                          <div className="font-medium">{current.alias.join(", ")}</div>
                        </div>
                      )}

                      <div className="mt-4">
                        <Button variant="outline" onClick={() => openOriginalLink()}><ExternalLink /> Open</Button>
                      </div>
                    </div>
                  </div>

                  {/* right: detailed fields */}
                  <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Details</div>
                    <div className="text-sm leading-relaxed mb-3">
                      {/* try to show a natural description if available */}
                      {current.description || current.summary || current.quote || current.name || "No extended description available."}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">All fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(current).map((k) => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">{humanLabelForKey(k)}</div>
                          <div className="text-sm font-medium break-words">
                            {typeof current[k] === "object" ? JSON.stringify(current[k]) : (current[k] ?? "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {rawOpen && current && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(current)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* right: quick actions / developer info */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Developer tools</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => downloadListAsJSON()}><Download /></Button>
              <Button variant="ghost" size="sm" onClick={() => copyJSON()}><Copy /></Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => downloadJSON()}><FileText className="mr-2" /> Download item JSON</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => { if (imageUrl) setImgDialogOpen(true); else window.alert("No image available"); }}><ImageIcon className="mr-2" /> View image</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => { navigator.clipboard.writeText(resource.endpoint); }}><Copy className="mr-2" /> Copy endpoint</Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => { setShowSuggest(false); setQuery(""); }}><SlidersHorizontal className="mr-2" /> Reset search</Button>
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            Endpoint: <div className="break-words">{resource.endpoint}</div>
          </div>
        </aside>
      </main>

      {/* image dialog */}
      <Dialog open={imgDialogOpen} onOpenChange={setImgDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{mainTitleFor(current)}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imageUrl ? (
              <img src={imageUrl} alt={mainTitleFor(current)} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImgDialogOpen(false)}><ChevronLeft /></Button>
              <Button variant="outline" onClick={() => openOriginalLink()}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

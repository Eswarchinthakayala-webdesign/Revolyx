// src/pages/RandomFoxPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Copy,
  List,
  Loader2,
  Star,
  X,
  Link as LinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const ENDPOINT = "https://randomfox.ca/floof/";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Safe extractor (RandomFox typically returns {image: "...", link: "..."}) */
function extractImageUrl(resp) {
  if (!resp) return "";
  if (typeof resp === "string") return resp;
  if (resp.image) return resp.image;
  if (resp.url) return resp.url;
  if (resp.link) return resp.link;
  return "";
}

export default function RandomFoxPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [current, setCurrent] = useState(null); // object: {image, link, raw}
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // session history (in-memory only)
  const [history, setHistory] = useState([]);

  // small "search-like" input (keeps header consistent with News page design)
  const [query, setQuery] = useState(""); // not used by API but preserves layout
  const suggestTimer = useRef(null);

  useEffect(() => {
    // load one default fox on mount
    fetchRandomFox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRandomFox() {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) {
        showToast("error", `Fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const imageUrl = extractImageUrl(json);
      const payload = { imageUrl, raw: json, fetchedAt: new Date().toISOString() };
      setCurrent(payload);
      setRawResp(json);
      // add to session history (keep last 50)
      setHistory((prev) => [payload, ...prev].slice(0, 50));
      showToast("success", "Loaded a fox!");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch fox image");
    } finally {
      setLoading(false);
    }
  }

  function copyImageLink() {
    if (!current?.imageUrl) return showToast("info", "No image to copy");
    navigator.clipboard.writeText(current.imageUrl);
    showToast("success", "Image link copied");
  }

  function downloadJSON() {
    const payload = rawResp || current?.raw;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `randomfox_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  // mimic suggestion UX: when typing, show tip items (not real suggestions; API doesn't support search)
  const [suggestTips, setSuggestTips] = useState([]);
  function onQueryChange(v) {
    setQuery(v);
    // simple debounced "faux suggestion" that suggests previous history by fuzzy match
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      if (!v) {
        setSuggestTips([]);
        return;
      }
      const lower = v.toLowerCase();
      const matches = history.filter((h) => (h.imageUrl || "").toLowerCase().includes(lower)).slice(0, 6);
      setSuggestTips(matches);
    }, 200);
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Floof — Random Fox</h1>
          <p className="mt-1 text-sm opacity-70">Random fox images, quick preview, and developer utilities.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e?.preventDefault?.(); fetchRandomFox(); }} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <ImageIcon className="opacity-60" />
            <Input
              placeholder="Type to filter history (not required) — press Enter to fetch new fox"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setSuggestTips(history.slice(0, 6))}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchRandomFox()}><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
            <Button type="submit" variant="outline" className="px-3"><ImageIcon /></Button>
          </form>
        </div>
      </header>

      {/* suggestions (faux suggestions from history) */}
      <AnimatePresence>
        {suggestTips.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {suggestTips.map((t, i) => (
              <li key={i} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrent(t); setRawResp(t.raw); setSuggestTips([]); setQuery(""); }}>
                <div className="flex items-center gap-3">
                  <img src={t.imageUrl} alt={`fox-${i}`} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">Fox image</div>
                    <div className="text-xs opacity-60">{new Date(t.fetchedAt).toLocaleString()}</div>
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Random Fox</CardTitle>
                <div className="text-xs opacity-60">{current?.imageUrl ? "A random fox image" : "Fetching a fox..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchRandomFox()}><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              </div>
            </CardHeader>

            <CardContent>
              {!current ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image + meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full h-64 bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-hidden flex items-center justify-center mb-3">
                      <img src={current.imageUrl} alt="random-fox" className="w-full h-full object-cover" />
                    </div>

                    <div className="text-lg font-semibold">Random Fox</div>
                    <div className="text-xs opacity-60">Source: randomfox.ca</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Fetched At</div>
                        <div className="font-medium">{current.fetchedAt ? new Date(current.fetchedAt).toLocaleString() : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Image URL</div>
                        <div className="font-medium overflow-auto no-scrollbar"><a href={current.imageUrl} target="_blank" rel="noreferrer" className="underline">{current.imageUrl}</a></div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button variant="outline" onClick={() => { if (current.imageUrl) window.open(current.imageUrl, "_blank"); else showToast("info", "No image link"); }}><ExternalLink /> Open image</Button>
                      <Button variant="outline" onClick={() => copyImageLink()}><Copy /> Copy link</Button>
                    </div>
                  </div>

                  {/* Right: content and fields */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Description</div>
                    <div className="text-sm leading-relaxed mb-3">The Random Fox API returns a randomly chosen fox image. Use refresh to fetch another adorable floof.</div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Response</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Image</div>
                        <div className="text-sm font-medium break-words">{current.imageUrl ? <a href={current.imageUrl} target="_blank" rel="noreferrer" className="underline">{current.imageUrl}</a> : "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Raw type</div>
                        <div className="text-sm font-medium">{rawResp ? typeof rawResp : "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">History count (session)</div>
                        <div className="text-sm font-medium">{history.length}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Endpoint</div>
                        <div className="text-sm font-medium break-words">{ENDPOINT}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Notes</div>
                    <ul className="list-disc pl-5 text-sm opacity-80">
                      <li>RandomFox is a lightweight public API that returns a JSON with an image URL.</li>
                      <li>Images are hosted by the source — check CORS rules if embedding in other domains.</li>
                      <li>Use the developer tools on the right to copy endpoint or download JSON.</li>
                    </ul>
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

        {/* Right: developer tools + session history */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & quick utilities</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Session History</div>
              <div className="text-xs opacity-60">recent</div>
            </div>

            <ScrollArea className="max-h-64 mt-2 rounded-md border p-2">
              <div className="space-y-2">
                {history.length === 0 && <div className="text-sm opacity-60">No images in this session yet.</div>}
                {history.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrent(h); setRawResp(h.raw); }}>
                    <img src={h.imageUrl} alt={`fox-${idx}`} className="w-12 h-12 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">Fox — {new Date(h.fetchedAt).toLocaleTimeString()}</div>
                      <div className="text-xs opacity-60 truncate">{h.imageUrl}</div>
                    </div>
                    <div className="text-xs opacity-60">{idx === 0 ? "latest" : `${idx+1}`}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Fox Image</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.imageUrl} alt="fox-full" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from randomfox.ca</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              {current?.imageUrl && <Button variant="outline" onClick={() => window.open(current.imageUrl, "_blank")}><ExternalLink /></Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// src/pages/ChanApiPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  List,
  Loader2,
  Hash,
  Grid,
  FileText,
  ArrowRightCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoints ---------- */
const BOARDS_ENDPOINT = "/chan/boards.json";
const THREADS_ENDPOINT = (board) => `/chan/${board}/threads.json`;

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function ChanApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Search & suggestions
  const [query, setQuery] = useState("");
  const [boards, setBoards] = useState([]); // all boards from boards.json
  const [suggestions, setSuggestions] = useState([]); // filtered boards
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // Selected and content
  const [selectedBoard, setSelectedBoard] = useState(null); // board object
  const [boardThreads, setBoardThreads] = useState(null); // raw threads response
  const [loadingBoard, setLoadingBoard] = useState(false);

  // UI
  const [rawOpen, setRawOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  // initial load: fetch boards.json
  useEffect(() => {
    async function loadBoards() {
      try {
        const res = await fetch(BOARDS_ENDPOINT);
        if (!res.ok) {
          showToast("error", `Failed to load boards (${res.status})`);
          return;
        }
        const json = await res.json();
        // 4chan boards.json commonly returns { boards: [ ... ] }
        const items = Array.isArray(json?.boards) ? json.boards : json?.boards || [];
        setBoards(items);
        setSuggestions(items);
        if (items && items.length > 0) {
          // pick a sensible default: the first board
          setSelectedBoard(items[0]);
          // fetch threads for that board
          fetchThreadsForBoard(items[0].board);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to fetch boards");
      }
    }
    loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* debounce search for suggestions */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      doFilterSuggestions(v);
    }, 300);
  }

  function doFilterSuggestions(q) {
    setLoadingSuggest(true);
    try {
      if (!q || q.trim().length === 0) {
        setSuggestions(boards);
        setLoadingSuggest(false);
        return;
      }
      const term = q.toLowerCase();
      const filtered = boards.filter(b => {
        const name = (b.board || "").toLowerCase();
        const title = (b.title || "").toLowerCase();
        const meta = (b.meta_description || "").toLowerCase();
        return name.includes(term) || title.includes(term) || meta.includes(term);
      });
      setSuggestions(filtered);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function fetchThreadsForBoard(boardName) {
    if (!boardName) return;
    setLoadingBoard(true);
    setBoardThreads(null);
    try {
      const url = THREADS_ENDPOINT(boardName);
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Threads fetch failed (${res.status})`);
        setLoadingBoard(false);
        return;
      }
      const json = await res.json();
      setBoardThreads(json);
      showToast("success", `Loaded threads for /${boardName}/`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch threads");
    } finally {
      setLoadingBoard(false);
    }
  }

  function chooseBoard(b) {
    setSelectedBoard(b);
    setShowSuggest(false);
    fetchThreadsForBoard(b.board);
  }

  function copyRawToClipboard() {
    if (!boardThreads && !selectedBoard) return showToast("info", "No data to copy");
    navigator.clipboard.writeText(prettyJSON(boardThreads || selectedBoard));
    showToast("success", "Copied JSON to clipboard");
  }

  function downloadRaw() {
    const payload = boardThreads || selectedBoard;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `4chan_${(selectedBoard?.board || "data")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openEndpointInNewTab(url) {
    if (!url) return;
    window.open(url, "_blank", "noopener");
  }

  // show thread image in dialog (threads contain posts; many posts have tim/fname fields)
  function openImageFromPost(post) {
    // 4chan direct image format: https://i.4cdn.org/{board}/{tim}{ext}
    // If API returned tim and ext fields, assemble; otherwise try file_url or similar fallback
    if (!post) return;
    const board = selectedBoard?.board;
    if (post.tim && post.ext && board) {
      const src = `https://i.4cdn.org/${board}/${post.tim}${post.ext}`;
      setImageSrc(src);
      setDialogOpen(true);
      return;
    }
    // fallback: try post.file?.url or post.filename
    // (We won't guess too widely — show fallback message if none)
    showToast("info", "No direct image found for this post");
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Chan Explorer — 4chan JSON</h1>
          <p className="mt-1 text-sm opacity-70">Browse boards, inspect threads, and view raw JSON from the public 4chan API.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")} onSubmit={(e) => { e.preventDefault(); doFilterSuggestions(query); }}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search boards by short name or title (e.g. 'g', 'technology')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { setQuery(""); setSuggestions(boards); setShowSuggest(true); }}>All</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown (left aligned under input on md+) */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.board || s.title || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseBoard(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-zinc-100 dark:bg-zinc-900 text-xs font-medium">{`/${s.board}/`}</div>
                  <div className="flex-1">
                    <div className="font-medium">{s.title || s.board}</div>
                    <div className="text-xs opacity-60">{s.ws_board ? "WebSocket enabled" : "Board"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.pages ? `${s.pages} pages` : "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left column: condensed list of boards (primary navigation / suggestions column on wide) */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800 rounded-2xl p-4" : "bg-white/90 border border-zinc-200 rounded-2xl p-4")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Boards</div>
              <div className="text-xs opacity-60">Select a board to view sample threads</div>
            </div>
            <div className="text-xs opacity-60">{boards.length ? `${boards.length}` : "—"}</div>
          </div>

          <div className="h-[60vh] overflow-auto no-scrollbar">
            <ScrollArea style={{ maxHeight: "60vh" }}>
              <div className="grid gap-2">
                {boards.slice(0, 200).map((b) => (
                  <button key={b.board} className={clsx("w-full text-left p-3 rounded-lg border flex items-center justify-between", selectedBoard?.board === b.board ? (isDark ? "bg-zinc-800/60 border-zinc-700" : "bg-zinc-100 border-zinc-200") : (isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"))} onClick={() => chooseBoard(b)}>
                    <div>
                      <div className="font-medium">{`/${b.board}/ — ${b.title || "No title"}`}</div>
                      <div className="text-xs opacity-60">{b.meta_description || b.board || ""}</div>
                    </div>
                    <div className="text-xs opacity-60">{b.pages ? `${b.pages}p` : "—"}</div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Center: board details and threads */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Board</CardTitle>
                <div className="text-xs opacity-60">{selectedBoard ? `/${selectedBoard.board}/ • ${selectedBoard.title || "No title"}` : "Select a board"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => selectedBoard && fetchThreadsForBoard(selectedBoard.board)}><Loader2 className={loadingBoard ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setRawOpen((s) => !s)}><List /> {rawOpen ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => { if (selectedBoard) openEndpointInNewTab(`${BOARDS_ENDPOINT}`); }}><ExternalLink /> API</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingBoard ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedBoard ? (
                <div className="py-12 text-center text-sm opacity-60">No board selected.</div>
              ) : (
                <div className="space-y-4">
                  {/* Board header */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start gap-4">
                      <div className="rounded-md p-2 bg-zinc-100 dark:bg-zinc-900 w-20 text-center text-sm font-medium">{`/${selectedBoard.board}/`}</div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold">{selectedBoard.title || `/${selectedBoard.board}/`}</div>
                        <div className="text-xs opacity-60 mt-1">{selectedBoard.meta_description || "No description available."}</div>
                        <div className="mt-3 flex gap-2 text-xs opacity-60">
                          <div>{selectedBoard.pages ? `${selectedBoard.pages} pages` : "— pages"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Threads preview */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-3">Threads (preview)</div>

                    {!boardThreads ? (
                      <div className="text-sm opacity-60">No thread data loaded.</div>
                    ) : (
                      <div className="grid gap-3">
                        {/* boardThreads is generally an array of pages, each with threads array.
                            We'll flatten first-level threads for preview. */}
                        {(() => {
                          // defensive extract: boardThreads can be array of pages: [{ page: 1, threads: [...] }, ...]
                          const pages = Array.isArray(boardThreads) ? boardThreads : [];
                          const threadsFlat = [];
                          pages.forEach(p => {
                            const tarr = Array.isArray(p.threads) ? p.threads : [];
                            tarr.forEach(t => threadsFlat.push(t));
                          });
                          const preview = threadsFlat.slice(0, 12);
                          if (preview.length === 0) {
                            return <div className="text-sm opacity-60">No threads available in preview.</div>;
                          }
                          return preview.map((t, i) => {
                            // threads have 'no' (thread number) and 'posts' arrays — show first post preview
                            const op = Array.isArray(t.posts) && t.posts.length > 0 ? t.posts[0] : t;
                            return (
                              <div key={t.no || i} className="p-3 rounded-md border flex gap-3 items-start">
                                <div className="w-12 text-xs font-medium text-center">{t.no || "—"}</div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{op.sub || op.semantic_url || `Thread ${t.no || ""}`}</div>
                                  <div className="text-xs opacity-60 mt-1">{op.com ? (typeof op.com === "string" ? op.com : String(op.com)) : (op.filename ? `${op.filename}` : "No comment")}</div>
                                  <div className="mt-2 flex gap-2">
                                    {op.tim && (
                                      <Button size="sm" variant="outline" className="px-2" onClick={() => openImageFromPost(op)}><ImageIcon /></Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => openEndpointInNewTab(`https://boards.4channel.org/${selectedBoard.board}/thread/${t.no}`)}><ExternalLink /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setSelectedBoard(selectedBoard); setBoardThreads({ sample: op }); setRawOpen(true); showToast("info", "Showing sample post in raw pane"); }}><FileText /></Button>
                                  </div>
                                </div>
                                <div className="text-xs opacity-60">{op.time ? new Date(op.time * 1000).toLocaleString() : ""}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Full keys */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Full board object</div>
                    <div className="p-3 rounded-md border text-sm break-words" style={{ whiteSpace: "pre-wrap" }}>
                      {prettyJSON(selectedBoard)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {rawOpen && boardThreads && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(boardThreads)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right column: quick actions & debug */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>
            <div className="text-xs opacity-60">Developer endpoints & utilities</div>

            <div className="mt-3 space-y-2">
              <Button className="w-full" variant="outline" onClick={() => { navigator.clipboard.writeText(BOARDS_ENDPOINT); showToast("success", "Boards endpoint copied"); }}><Copy /> Copy Boards Endpoint</Button>

              <Button className="w-full" variant="outline" onClick={() => { if (selectedBoard) navigator.clipboard.writeText(THREADS_ENDPOINT(selectedBoard.board)); showToast("success", "Threads endpoint copied"); }}><Copy /> Copy Threads Endpoint</Button>

              <Button className="w-full" variant="outline" onClick={() => { downloadRaw(); }}><Download /> Download JSON</Button>

              <Button className="w-full" variant="outline" onClick={() => copyRawToClipboard()}><FileText /> Copy JSON</Button>

              <Button className="w-full" variant="ghost" onClick={() => {
                if (!selectedBoard) return showToast("info", "Select a board first");
                openEndpointInNewTab(`https://boards.4channel.org/${selectedBoard.board}/`);
              }}><Grid /> Open board on web</Button>

              <Separator />

              <div className="text-xs opacity-60">Response inspector</div>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" onClick={() => setRawOpen((s) => !s)}><List /></Button>
                <Button variant="ghost" onClick={() => { if (boardThreads) openEndpointInNewTab(BOARDS_ENDPOINT); else showToast("info", "Load a board to inspect"); }}><ArrowRightCircle /></Button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Image</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt="post image" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">No image available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from thread post</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><List /></Button>
              <Button variant="outline" onClick={() => { if (imageSrc) openEndpointInNewTab(imageSrc); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

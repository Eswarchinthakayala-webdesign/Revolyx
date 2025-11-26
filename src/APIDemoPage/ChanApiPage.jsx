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
  ArrowRightCircle,
  Menu,
  X,
  MapPin,
  Clock,
  Archive,
  Layers,
  Eye,
  MessageSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* Sheet (shadcn style) */
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

/* ---------- Endpoints ---------- */
const BOARDS_ENDPOINT = "/chan/boards.json";
const THREADS_ENDPOINT = (board) => `/chan/${board}/threads.json`;

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
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

  // Sheet state (mobile menu)
  const [sheetOpen, setSheetOpen] = useState(false);

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
        const items = Array.isArray(json?.boards) ? json.boards : json?.boards || [];
        setBoards(items);
        setSuggestions(items);
        if (items && items.length > 0) {
          setSelectedBoard(items[0]);
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
    // Close the mobile sheet if open
    setSheetOpen(false);
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

  // show thread image in dialog
  function openImageFromPost(post) {
    if (!post) return;
    const board = selectedBoard?.board;
    if (post.tim && post.ext && board) {
      const src = `https://i.4cdn.org/${board}/${post.tim}${post.ext}`;
      setImageSrc(src);
      setDialogOpen(true);
      return;
    }
    showToast("info", "No direct image found for this post");
  }

  /* Helpers for layout */
  const sidebarClasses = clsx(
    "hidden lg:block lg:col-span-3 rounded-2xl p-4",
    isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200"
  );

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* HEADER */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <Hash className="w-6 h-6" /> Chan Explorer
          </h1>
          <p className="text-sm opacity-70 mt-1">Browse boards, preview threads, and inspect raw JSON.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile menu trigger (Sheet) */}
          <div className="lg:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="cursor-pointer p-2">
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-full max-w-sm">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle>Menu</SheetTitle>
                    <SheetClose asChild>
                     
                    </SheetClose>
                  </div>
                </SheetHeader>

                <div className="mt-2 p-3 space-y-4">
                  {/* Boards list (compact) */}
                  <div>
                    <div className="text-sm font-semibold mb-2  flex items-center gap-2"><Grid /> Boards</div>
                    <div className="space-y-2 max-h-[40vh] overflow-auto">
                      {boards.slice(0, 200).map(b => (
                        <button key={b.board} onClick={() => chooseBoard(b)} className="w-full text-left p-3 rounded-md border flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium">{`/${b.board}/ — ${b.title || ""}`}</div>
                            <div className="text-xs opacity-60">{b.meta_description || ""}</div>
                          </div>
                          <div className="text-xs opacity-60">{b.pages ? `${b.pages}p` : "—"}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Quick actions */}
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Layers /> Quick actions</div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(BOARDS_ENDPOINT); showToast("success", "Boards endpoint copied"); }}><Copy /> Copy boards endpoint</Button>
                      <Button variant="outline" className="cursor-pointer" onClick={() => { if (selectedBoard) navigator.clipboard.writeText(THREADS_ENDPOINT(selectedBoard.board)); showToast("success", "Threads endpoint copied"); }}><Copy /> Copy threads endpoint</Button>
                      <Button variant="outline" className="cursor-pointer" onClick={() => downloadRaw()}><Download /> Download JSON</Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop search form */}
          <form onSubmit={(e) => { e.preventDefault(); doFilterSuggestions(query); }} className={clsx("flex items-center gap-2 w-full max-w-xl rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search boards by short name or title (e.g. g, technology)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" className="px-3 cursor-pointer" variant="outline" onClick={() => { setQuery(""); setSuggestions(boards); setShowSuggest(true); }}>All</Button>
            <Button type="submit" className="px-3 cursor-pointer" variant="default">Search</Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.board || s.title || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseBoard(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-zinc-100 dark:bg-zinc-900 text-xs font-medium">{`/${s.board}/`}</div>
                  <div className="flex-1">
                    <div className="font-medium">{s.title || s.board}</div>
                    <div className="text-xs opacity-60">{s.meta_description || s.board}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.pages ? `${s.pages} pages` : "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT SIDEBAR (desktop only) */}
        <aside className={sidebarClasses}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Boards</div>
              <div className="text-xs opacity-60">Select a board</div>
            </div>
            <div className="text-xs opacity-60">{boards.length ? `${boards.length}` : "—"}</div>
          </div>

          <div className="h-[66vh] overflow-auto no-scrollbar">
            <ScrollArea style={{ maxHeight: "66vh" }}>
              <div className="grid gap-2">
                {boards.slice(0, 200).map((b) => (
                  <button
                    key={b.board}
                    className={clsx(
                      " text-left p-3 cursor-pointer rounded-lg border flex items-center justify-between",
                      selectedBoard?.board === b.board
                        ? (isDark ? "bg-zinc-800/60 border-zinc-700" : "bg-zinc-100 border-zinc-200")
                        : (isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")
                    )}
                    onClick={() => chooseBoard(b)}
                    aria-pressed={selectedBoard?.board === b.board}
                  >
                    <div>
                      <div className="font-medium">{`/${b.board}/ — ${b.title || "No title"}`}</div>
                      <div className="text-xs opacity-60 ">{b.meta_description || ""}</div>
                    </div>
                    <div className="text-xs opacity-60">{b.pages ? `${b.pages}p` : "—"}</div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* CENTER: board details & preview */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><MessageSquare /> Board</CardTitle>
                <div className="text-xs opacity-60">{selectedBoard ? `/${selectedBoard.board}/ • ${selectedBoard.title || "No title"}` : "Select a board"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => selectedBoard && fetchThreadsForBoard(selectedBoard.board)}><Loader2 className={loadingBoard ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => setRawOpen((s) => !s)}><List /> {rawOpen ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => { if (selectedBoard) openEndpointInNewTab(`${BOARDS_ENDPOINT}`); }}><ExternalLink /></Button>
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
                          <div className="flex items-center gap-2"><Archive className="w-4 h-4" /> {selectedBoard.pages ? `${selectedBoard.pages} pages` : "— pages"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Threads preview */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2"><Grid className="w-4 h-4" /> Threads (preview)</div>
                      <div className="text-xs opacity-60">Showing first 12</div>
                    </div>

                    {!boardThreads ? (
                      <div className="text-sm opacity-60">No thread data loaded.</div>
                    ) : (
                      <div className="grid gap-3">
                        {(() => {
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
                            const op = Array.isArray(t.posts) && t.posts.length > 0 ? t.posts[0] : t;
                            return (
                              <div key={t.no || i} className="p-3 rounded-md border flex gap-3 items-start">
                                <div className="w-12 text-xs font-medium text-center">{t.no || "—"}</div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{op.sub || op.semantic_url || `Thread ${t.no || ""}`}</div>
                                  <div className="text-xs opacity-60 mt-1 line-clamp-3">{op.com ? (typeof op.com === "string" ? op.com : String(op.com)) : (op.filename ? `${op.filename}` : "No comment")}</div>

                                  <div className="mt-2 flex gap-2">
                                    {op.tim && (
                                      <Button size="sm" variant="outline" className="cursor-pointer px-2" onClick={() => openImageFromPost(op)}><ImageIcon /></Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => openEndpointInNewTab(`https://boards.4channel.org/${selectedBoard.board}/thread/${t.no}`)}><ExternalLink /></Button>
                                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => { setSelectedBoard(selectedBoard); setBoardThreads({ sample: op }); setRawOpen(true); showToast("info", "Showing sample post in raw pane"); }}><FileText /></Button>
                                  </div>
                                </div>

                                <div className="text-xs opacity-60">
                                  {op.time ? <div className="flex flex-col items-end"><Clock className="w-3 h-3 mb-1" />{new Date(op.time * 1000).toLocaleString()}</div> : "—"}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Full board object */}
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Layers /> Full board object</div>
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

        {/* RIGHT column */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText /> Quick Actions</div>
            <div className="text-xs opacity-60 mb-3">Developer endpoints & utilities</div>

            <div className="mt-3 space-y-2">
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(BOARDS_ENDPOINT); showToast("success", "Boards endpoint copied"); }}><Copy /> Copy Boards Endpoint</Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { if (selectedBoard) navigator.clipboard.writeText(THREADS_ENDPOINT(selectedBoard.board)); showToast("success", "Threads endpoint copied"); } }><Copy /> Copy Threads Endpoint</Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { downloadRaw(); }}><Download /> Download JSON</Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => copyRawToClipboard()}><FileText /> Copy JSON</Button>

              <Button className="w-full cursor-pointer" variant="ghost" onClick={() => { if (!selectedBoard) return showToast("info", "Select a board first"); openEndpointInNewTab(`https://boards.4channel.org/${selectedBoard.board}/`); }}><Grid /> Open board on web</Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">
              Tip: On mobile tap the <span className="inline-flex items-center px-1"><Menu className="w-4 h-4 mr-1" /></span> menu to open boards & quick actions.
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ImageIcon /> Image</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "#000" : "#fff" }}>
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
              <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => { if (imageSrc) openEndpointInNewTab(imageSrc); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

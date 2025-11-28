"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Menu,
  Calendar,
  Search,
  ImageIcon,
  Video,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  X,
  RefreshCw,
  Check,
  Clock,
  User,
  FileText,
  ArrowUpRight,
  Image as ImageLucide,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ------------------------------------------
   NASA APOD ENDPOINT
--------------------------------------------- */
const BASE = "https://api.nasa.gov/planetary/apod";
const API_KEY = "XGM1tXvMlcK6QFd2NkoeGW4zRwWbUxN3Odez0YBJ"; // replace with env var or your key

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function randomDateWithinDays(days = 1000) {
  const today = Date.now();
  const past = today - Math.floor(Math.random() * days * 24 * 60 * 60 * 1000);
  return new Date(past).toISOString().slice(0, 10);
}

export default function NasaApodPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [date, setDate] = useState("");
  const [currentApod, setCurrentApod] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // list of 10 random APOD items (mini)
  const [randomList, setRandomList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // mobile sheet open
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy button animation state
  const [copied, setCopied] = useState(false);

  /* -----------------------------------
      Fetch APOD (single)
  ----------------------------------- */
  async function fetchApod(d = "") {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("api_key", API_KEY);
      if (d) params.set("date", d);

      const url = `${BASE}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `APOD fetch failed (${res.status})`);
        setLoading(false);
        return;
      }

      const json = await res.json();
      setCurrentApod(json);
      setRawResp(json);
      setShowRaw(false);

      showToast("success", json.title || "Loaded APOD");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch APOD");
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------------
      Build suggestions (date-based)
  ----------------------------------- */
  function onDateChange(v) {
    setDate(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    suggestTimer.current = setTimeout(() => {
      buildDateSuggestions(v);
    }, 200);
  }

  function buildDateSuggestions(v) {
    if (!v || v.length < 4) {
      setSuggestions([]);
      return;
    }

    const year = v.split("-")[0];
    const list = [];

    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const ds = d.toISOString().slice(0, 10);
      if (ds.startsWith(year)) list.push(ds);
    }

    setSuggestions(list);
  }

  /* -----------------------------------
      Fetch 10 random APOD items (mini)
  ----------------------------------- */
  async function fetchRandomList() {
    setListLoading(true);
    try {
      // create 10 distinct random dates
      const dates = new Set();
      while (dates.size < 10) dates.add(randomDateWithinDays(1200));
      const arr = Array.from(dates);

      // fetch in parallel but with reasonable concurrency
      const fetches = arr.map(async (d) => {
        const params = new URLSearchParams();
        params.set("api_key", API_KEY);
        params.set("date", d);
        const url = `${BASE}?${params.toString()}`;
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          const j = await r.json();
          return { date: d, title: j.title, media_type: j.media_type, url: j.url, raw: j };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(fetches);
      const filtered = results.filter(Boolean);
      setRandomList(filtered);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch random list");
    } finally {
      setListLoading(false);
    }
  }

  /* -----------------------------------
      Initial load: Today's APOD + list
  ----------------------------------- */
  useEffect(() => {
    fetchApod();
    fetchRandomList();
  }, []);

  /* -----------------------------------
      Download JSON
  ----------------------------------- */
  function downloadJSON() {
    if (!rawResp) return;
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `apod_${rawResp.date}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function copyEndpoint() {
    const url = `${BASE}?api_key=${API_KEY}${date ? `&date=${date}` : ""}`;
    navigator.clipboard.writeText(url);
    // animate copy button
    setCopied(true);
    showToast("success", "Endpoint copied");
    setTimeout(() => setCopied(false), 1800);
  }

  /* -----------------------------------
      Helpers
  ----------------------------------- */
  function openFromList(item) {
    if (!item?.date) return;
    setDate(item.date);
    fetchApod(item.date);
    setSheetOpen(false);
  }

  /* -----------------------------------
      UI
  ----------------------------------- */
  return (
    <div className="min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto">
      {/* -----------------------------------
            HEADER
      ----------------------------------- */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* mobile menu trigger */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              className="p-2 cursor-pointer"
              onClick={() => setSheetOpen(true)}
            >
              <Menu />
            </Button>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Cosmos — NASA APOD</h1>
            <p className="text-xs opacity-60">Astronomy Picture of the Day — explore space daily</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchApod(date);
          }}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-3 py-1",
            isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200"
          )}
        >
          <Calendar className="opacity-60" />
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            className="border-0 bg-transparent shadow-none cursor-pointer"
          />
          <Button type="submit" variant="outline" className="cursor-pointer px-3">
            <Search /> <span className="ml-2">Find</span>
          </Button>
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => {
              setDate("");
              fetchApod();
            }}
          >
            <RefreshCw /> Today
          </Button>
        </form>

        
      </header>

      {/* -----------------------------------
            SUGGESTIONS (desktop date suggestions)
      ----------------------------------- */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_260px)] md:right-auto max-w-xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {suggestions.map((s) => (
              <li
                key={s}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-sm"
                onClick={() => {
                  setDate(s);
                  fetchApod(s);
                  setShowSuggest(false);
                }}
              >
                <div className="font-medium">{s}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* -----------------------------------
            LAYOUT: Sidebar (desktop) + main
      ----------------------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar - desktop */}
        <aside
          className={clsx(
            "hidden lg:block lg:col-span-3 rounded-2xl p-4 h-fit",
            isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Random APOD</div>
              <div className="text-xs opacity-60">10 recent random picks</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="p-2 cursor-pointer"
                onClick={() => fetchRandomList()}
                title="Refresh"
              >
                <RefreshCw className={listLoading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          <ScrollArea style={{ height: 520 }} className="rounded-md border">
            <div className="p-2 space-y-2">
              {listLoading && (
                <div className="py-4 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              )}

              {!listLoading && randomList.length === 0 && (
                <div className="text-xs opacity-60 p-3">No items yet — try refresh</div>
              )}

              {randomList.map((it) => (
                <div
                  key={it.date}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  onClick={() => openFromList(it)}
                >
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-md flex items-center justify-center overflow-hidden">
                    {it.media_type === "image" ? (
                      <img src={it.url} alt={it.title} className="w-full h-full object-cover" />
                    ) : (
                      <Video />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium leading-tight">{it.title}</div>
                    <div className="text-xs opacity-60 flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3" /> {it.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* MAIN */}
        <section className="lg:col-span-9 space-y-4">
          {/* Main APOD card */}
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200"
            )}
          >
            <CardHeader
              className={clsx(
                "p-5 flex items-center flex-wrap gap-3 justify-between",
                isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200"
              )}
            >
              <div>
                <CardTitle className="text-lg flex items-center gap-3">
                  <ImageLucide className="opacity-60" /> <span>Astronomy Picture</span>
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {currentApod?.date || "Loading..."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => fetchApod(date)}
                >
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>

                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => setShowRaw((s) => !s)}
                >
                  <List /> {showRaw ? "Hide Raw" : "Raw"}
                </Button>

                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => setDialogOpen(true)}
                >
                  <ExternalLink /> View
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              ) : !currentApod ? (
                <div className="py-12 text-center text-sm opacity-60">Loading APOD...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* LEFT: big media + meta */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <div className="rounded-lg overflow-hidden mb-3 shadow-sm">
                      {currentApod.media_type === "image" ? (
                        <img
                          src={currentApod.url}
                          alt={currentApod.title}
                          className="w-full h-64 md:h-72 object-cover"
                        />
                      ) : (
                        <div className="aspect-video w-full h-64 md:h-72">
                          <iframe src={currentApod.url} className="w-full h-full" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold">{currentApod.title}</div>
                        <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                          {currentApod.media_type === "video" ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          <span className="uppercase text-[10px]">{currentApod.media_type}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {currentApod.hdurl && (
                          <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => window.open(currentApod.hdurl, "_blank")}
                          >
                            <ArrowUpRight /> HD
                          </Button>
                        )}

                        {currentApod.copyright && (
                          <div className="text-xs opacity-60 flex items-center gap-2">
                            <User className="w-3 h-3" /> {currentApod.copyright}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => {
                          window.open(currentApod.hdurl || currentApod.url, "_blank");
                        }}
                      >
                        <ExternalLink /> Open Source
                      </Button>

                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => {
                          // copy image url
                          navigator.clipboard.writeText(currentApod.hdurl || currentApod.url);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1800);
                          showToast("success", "Image URL copied");
                        }}
                      >
                        {!copied ? <Copy /> : <Check />} <span className="ml-2">{copied ? "Copied" : "Copy URL"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* RIGHT: explanation + fields */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border col-span-1 md:col-span-2",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <FileText /> Explanation
                        </div>
                        <div className="text-sm leading-relaxed mb-3 max-h-44">
                          <ScrollArea style={{ height: 180 }}>
                            <div className="text-sm leading-relaxed">{currentApod.explanation}</div>
                          </ScrollArea>
                        </div>
                      </div>

                      <div className="text-xs opacity-60">NASA APOD</div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <List /> Full Fields (API)
                      </div>

                      <div className="text-xs opacity-60">Fields</div>
                    </div>

                    <ScrollArea style={{ height: 220 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.keys(currentApod).map((k) => (
                          <div key={k} className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">{k}</div>
                            <div className="text-sm font-medium break-words">
                              {typeof currentApod[k] === "object"
                                ? JSON.stringify(currentApod[k])
                                : currentApod[k]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>

            {/* RAW JSON */}
            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={clsx(
                    "p-4 border-t",
                    isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">Raw JSON</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="cursor-pointer" onClick={downloadJSON}>
                        <Download /> Download
                      </Button>

                      <Button variant="ghost" className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(prettyJSON(rawResp)); showToast("success", "Raw JSON copied"); }}>
                        <Copy /> Copy
                      </Button>
                    </div>
                  </div>

                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* DEV PANEL (right side on mobile becomes below) */}
        <aside
          className={clsx(
            "lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit",
            isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200"
          )}
        >
          <div>
            <div className="text-sm font-semibold mb-2">Developer Tools</div>
            <div className="text-xs opacity-60">APOD endpoint helper</div>

            <div className="mt-3 space-y-2">
              <Button variant="outline" className="cursor-pointer" onClick={copyEndpoint}>
                {!copied ? <Copy /> : <Check />} <span className="ml-2">{copied ? "Copied" : "Copy Endpoint"}</span>
              </Button>

              <Button variant="outline" className="cursor-pointer" onClick={() => downloadJSON()}>
                <Download /> Download JSON
              </Button>

              <Button variant="outline" className="cursor-pointer" onClick={() => setShowRaw((s) => !s)}>
                <List /> Toggle Raw
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* IMAGE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full p-3 rounded-2xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader>
            <DialogTitle>{currentApod?.title}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentApod?.media_type === "image" ? (
              <img
                src={currentApod.url}
                alt={currentApod.title}
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              />
            ) : (
              <></>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">NASA APOD</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">
                <X />
              </Button>
              <Button variant="outline" onClick={() => window.open(currentApod?.url || "", "_blank")} className="cursor-pointer">
                <ExternalLink />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOBILE SHEET: list of random items */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className={clsx(isDark ? "bg-black/90" : "bg-white")}>
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Random APOD</div>
                <div className="text-xs opacity-60">Tap to load</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => fetchRandomList()} className="cursor-pointer">
                  <RefreshCw className={listLoading ? "animate-spin" : ""} />
                </Button>
                <Button variant="ghost" onClick={() => setSheetOpen(false)} className="cursor-pointer">
                  <X />
                </Button>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-3">
            <ScrollArea style={{ height: 520 }}>
              <div className="p-2 space-y-2">
                {listLoading && (
                  <div className="py-4 text-center">
                    <Loader2 className="animate-spin mx-auto" />
                  </div>
                )}

                {!listLoading && randomList.length === 0 && (
                  <div className="text-xs opacity-60 p-3">No items yet — try refresh</div>
                )}

                {randomList.map((it) => (
                  <div
                    key={it.date}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    onClick={() => openFromList(it)}
                  >
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-md flex items-center justify-center overflow-hidden">
                      {it.media_type === "image" ? (
                        <img src={it.url} alt={it.title} className="w-full h-full object-cover" />
                      ) : (
                        <Video />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium leading-tight">{it.title}</div>
                      <div className="text-xs opacity-60 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" /> {it.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

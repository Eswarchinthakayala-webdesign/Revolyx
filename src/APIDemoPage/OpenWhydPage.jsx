// src/pages/OpenWhydPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Play,
  List,
  ImageIcon,
  Loader2,
  Music,
  Cpu
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
import { showToast } from "../lib/ToastHelper";

// =====================================
// CONFIGURATION
// =====================================

// USING VITE PROXY: /openwhyd/** → https://openwhyd.org/**
const API_ENDPOINT = "/openwhyd/hot";

const DEFAULT_MSG = "Search playlists, e.g. 'chill', 'lofi', 'dance'...";

// =====================================
// UTILITY FUNCTIONS
// =====================================

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * FIXED VERSION — NEVER THROWS "Invalid base URL"
 * Always uses real OpenWhyd origin for URL resolution.
 */
function extractPlaylistsFromHTML(htmlText) {
  const base = "https://openwhyd.org";
  const results = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const anchors = Array.from(doc.querySelectorAll("a"));
    const seen = new Set();

    for (const a of anchors) {
      const rawHref = a.getAttribute("href") || "";
      if (!rawHref) continue;

      let finalUrl = null;

      // Prevent all crashes here
      try {
        finalUrl = rawHref.startsWith("http")
          ? rawHref
          : new URL(rawHref, base).toString();
      } catch {
        continue;
      }

      if (seen.has(finalUrl)) continue;
      seen.add(finalUrl);

      const title = (a.textContent || "").trim();
      const img = a.querySelector("img")?.getAttribute("src");

      results.push({
        id: finalUrl,
        title: title || finalUrl,
        link: finalUrl,
        thumb: img,
        raw: { fromHtmlAnchor: true }
      });

      if (results.length >= 50) break;
    }

    return results;
  } catch (err) {
    console.error("HTML parsing failed", err);
    return [];
  }
}

/**
 * Fetch playlist detail (best-effort)
 * - Try JSON
 * - Fallback to HTML
 */
async function fetchPlaylistDetail(link) {
  try {
    const res = await fetch(link);
    const text = await res.text();

    // JSON?
    try {
      const json = JSON.parse(text);
      return { type: "json", payload: json };
    } catch {
      // Proceed to HTML parse
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const title = doc.querySelector("title")?.textContent?.trim();
    const desc =
      doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
      "";
    const image =
      doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      undefined;

    // Extract potential track links
    const tracks = [];
    const externalAnchors = Array.from(doc.querySelectorAll("a")).filter(a => {
      const href = a.getAttribute("href") || "";
      return (
        href.includes("youtube.com") ||
        href.includes("youtu.be") ||
        href.includes("soundcloud.com")
      );
    });

    for (const a of externalAnchors) {
      tracks.push({
        title: (a.textContent || "").trim(),
        link: a.getAttribute("href")
      });
    }

    // If empty, fallback to LI parsing
    if (tracks.length === 0) {
      const liNodes = Array.from(doc.querySelectorAll("li")).slice(0, 50);
      for (const li of liNodes) {
        const t = (li.textContent || "").trim();
        if (t.length > 5 && t.length < 200) tracks.push({ title: t });
      }
    }

    return {
      type: "html",
      payload: {
        title,
        description: desc,
        image,
        tracks,
        rawHtmlPreview: text.slice(0, 1200)
      }
    };
  } catch (err) {
    console.error("Error fetching playlist detail", err);
    return { type: "error", error: String(err) };
  }
}

// =====================================
// MAIN PAGE COMPONENT
// =====================================

export default function OpenWhydPage() {
  // Theme
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  // =====================================
  // INITIAL LOAD
  // =====================================
  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const res = await fetch(API_ENDPOINT);
        const text = await res.text();

        // Try JSON
        try {
          const json = JSON.parse(text);
          const items = Array.isArray(json)
            ? json
            : json.results || json.items || [];

          const mapped = items.map((it, i) => ({
            id: it.id || it.link || `item-${i}`,
            title: it.title || it.name || `Playlist ${i + 1}`,
            link: it.link || it.url,
            thumb: it.image || it.thumbnail,
            raw: it
          }));

          if (mapped.length > 0) {
            setAllItems(mapped);
            setSelected(mapped[0]);
          }
        } catch {
          // HTML fallback
          const parsed = extractPlaylistsFromHTML(text);
          setAllItems(parsed);
          if (parsed.length > 0) setSelected(parsed[0]);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load OpenWhyd content");
      }

      setLoading(false);
    })();
  }, []);

  // =====================================
  // LOAD DETAIL WHEN SELECTED
  // =====================================
  useEffect(() => {
    if (!selected?.link) {
      setSelectedDetail(null);
      return;
    }

    let canceled = false;

    (async () => {
      setLoadingDetail(true);
      const detail = await fetchPlaylistDetail(selected.link);
      if (!canceled) setSelectedDetail(detail);
      setLoadingDetail(false);
    })();

    return () => (canceled = true);
  }, [selected]);

  // =====================================
  // SEARCH
  // =====================================
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    suggestTimer.current = setTimeout(() => {
      const q = v.toLowerCase();
      const list = allItems
        .filter(it => (it.title || "").toLowerCase().includes(q))
        .slice(0, 12);

      setSuggestions(list);
    }, 180);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();

    if (!query.trim()) {
      showToast("info", DEFAULT_MSG);
      return;
    }

    const q = query.toLowerCase();
    const match = allItems.find(it =>
      (it.title || "").toLowerCase().includes(q)
    );

    if (match) {
      setSelected(match);
      setShowSuggest(false);
      showToast("success", `Selected: ${match.title}`);
    } else {
      showToast("info", "No matching playlist in cached list");
    }
  }

  // =====================================
  // QUICK ACTIONS
  // =====================================
  function copyJSON() {
    if (!selected) return showToast("info", "Nothing selected");
    navigator.clipboard.writeText(prettyJSON(selected));
    showToast("success", "JSON copied");
  }

  function downloadJSON() {
    if (!selected) return showToast("info", "Nothing selected");
    const blob = new Blob([prettyJSON(selected)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(selected.title || "playlist").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openOriginal() {
    if (!selected?.link) return showToast("info", "No link available");
    window.open(selected.link, "_blank", "noopener noreferrer");
  }

  // =====================================
  // THEME CLASSES
  // =====================================
  const panelBg = isDark
    ? "bg-black/40 border-zinc-800"
    : "bg-white/90 border-zinc-200";

  const headerBg = isDark
    ? "bg-black/60 border-zinc-800"
    : "bg-white/90 border-zinc-200";

  const inputBg = isDark
    ? "bg-black/60 border-zinc-800"
    : "bg-white border-zinc-200";

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="min-h-screen p-6 max-w-8xl mx-auto">
      {/* ============================ HEADER ============================ */}
      <header className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Openwhyd — Playlists
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Explore curated music playlists from YouTube, SoundCloud & more.
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className={clsx(
            "relative flex items-center gap-2 w-full md:w-[600px] rounded-lg px-3 py-2",
            inputBg
          )}
        >
          <Search className="opacity-60" />
          <Input
            value={query}
            placeholder="Search playlists..."
            onChange={e => onQueryChange(e.target.value)}
            className="bg-transparent border-none shadow-none outline-none"
            onFocus={() => setShowSuggest(true)}
          />

          <Button type="button" variant="outline" onClick={() => setQuery("")}>
            Clear
          </Button>
          <Button type="submit" variant="outline">
            <Search />
          </Button>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={clsx(
                  "absolute left-0 right-0 top-[105%] rounded-xl overflow-hidden shadow-xl z-50",
                  isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
                )}
              >
                {suggestions.map((it, i) => (
                  <li
                    key={i}
                    className="px-4 py-3 flex gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    onClick={() => {
                      setSelected(it);
                      setQuery("");
                      setShowSuggest(false);
                    }}
                  >
                    <img
                      src={it.thumb || "/api_previews/openwhyd.png"}
                      className="w-14 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.title}</div>
                      <div className="text-xs opacity-60 truncate">
                        {it.link?.replace(/^https?:\/\/(www\.)?/, "")}
                      </div>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* ============================ LAYOUT ============================ */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ---------------- LEFT PANEL: RESULTS LIST ---------------- */}
        <aside className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border", panelBg)}>
            <CardHeader
              className={clsx("p-4 flex justify-between items-center", headerBg)}
            >
              <CardTitle className="text-base">Results</CardTitle>
              <div className="text-xs opacity-60">{allItems.length} items</div>
            </CardHeader>

            <CardContent className="p-2">
              <ScrollArea className="h-[70vh]">
                {loading && (
                  <div className="p-6 text-center">
                    <Loader2 className="animate-spin mx-auto" />
                  </div>
                )}

                {!loading && allItems.length === 0 && (
                  <div className="p-4 text-sm opacity-60">
                    No playlists found.
                  </div>
                )}

                <div className="space-y-2">
                  {allItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={clsx(
                        "flex gap-3 px-3 py-2 rounded-lg cursor-pointer transition",
                        selected?.id === item.id
                          ? "bg-indigo-100 dark:bg-black/40 ring-2 ring-indigo-400"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                      )}
                    >
                      <img
                        src={item.thumb || "/api_previews/openwhyd.png"}
                        className="w-14 h-12 object-cover rounded-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {item.title}
                        </div>
                        <div className="text-xs opacity-60 truncate">
                          {item.link?.replace(/^https?:\/\/(www\.)?/, "")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* ---------------- CENTER PANEL: DETAIL ---------------- */}
        <section className="lg:col-span-7 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", panelBg)}>
            <CardHeader
              className={clsx(
                "p-5 flex justify-between items-center",
                headerBg
              )}
            >
              <div>
                <CardTitle className="text-lg">Playlist Detail</CardTitle>
                <div className="text-xs opacity-60">
                  {selected?.title || "No playlist selected"}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <Cpu /> Refresh
              </Button>
            </CardHeader>

            <CardContent>
              {!selected ? (
                <div className="text-center py-12 opacity-60">
                  Select a playlist on the left.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* LEFT SUBPANEL */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border",
                      isDark
                        ? "bg-black/20 border-zinc-700"
                        : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <img
                      src={selected.thumb || "/api_previews/openwhyd.png"}
                      className="w-full h-44 object-cover rounded mb-3"
                    />
                    <div className="text-lg font-semibold">
                      {selected.title}
                    </div>

                    <div className="text-xs opacity-60">
                      {selected.link
                        ? new URL(selected.link).hostname
                        : "openwhyd"}
                    </div>

                    <div className="mt-3 text-sm space-y-2">
                      <div>
                        <div className="text-xs opacity-60">Source</div>
                        <div className="font-medium">
                          {selected.raw?.source || "Openwhyd"}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setDialogOpen(true)}
                    >
                      <ImageIcon /> View Image
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={openOriginal}
                    >
                      <ExternalLink /> Open original
                    </Button>
                  </div>

                  {/* RIGHT SUBPANEL */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border col-span-1 md:col-span-2",
                      isDark
                        ? "bg-black/20 border-zinc-700"
                        : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed">
                      {selectedDetail?.payload?.description ||
                        selectedDetail?.payload?.title ||
                        "No description available"}
                    </div>

                    <Separator className="my-4" />

                    {/* Tracks */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-semibold">Tracks</div>
                      <div className="text-xs opacity-60">
                        {selectedDetail?.payload?.tracks?.length || 0}
                      </div>
                    </div>

                    <div className="max-h-72 overflow-auto space-y-2">
                      {loadingDetail && (
                        <div className="py-8 text-center">
                          <Loader2 className="animate-spin mx-auto" />
                        </div>
                      )}

                      {!loadingDetail &&
                        selectedDetail?.payload?.tracks?.length > 0 &&
                        selectedDetail.payload.tracks.map((t, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-900">
                              <Music className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {t.title || `Track ${i + 1}`}
                              </div>
                              {t.link && (
                                <div className="text-xs opacity-60 truncate">
                                  {t.link.replace(/^https?:\/\//, "")}
                                </div>
                              )}
                            </div>

                            {t.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    t.link,
                                    "_blank",
                                    "noopener noreferrer"
                                  )
                                }
                              >
                                <Play />
                              </Button>
                            )}
                          </div>
                        ))}

                      {!loadingDetail &&
                        (!selectedDetail ||
                          selectedDetail?.payload?.tracks?.length === 0) && (
                          <div className="text-xs opacity-60 p-3">
                            No tracks detected.
                          </div>
                        )}
                    </div>

                    <Separator className="my-4" />

                    {/* Raw JSON */}
                    <div className="text-sm font-semibold mb-2">
                      Raw / JSON Preview
                    </div>
                    <pre
                      className={clsx(
                        "text-xs overflow-auto p-2 rounded-md border",
                        isDark
                          ? "bg-black/30 border-zinc-700 text-zinc-200"
                          : "bg-white/80 border-zinc-200 text-zinc-900"
                      )}
                      style={{ maxHeight: 220 }}
                    >
                      {prettyJSON(selected.raw ?? selected)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ---------------- RIGHT PANEL: QUICK ACTIONS ---------------- */}
        <aside className="lg:col-span-2">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", panelBg)}>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Tools</div>
            </div>

            <Separator className="my-2" />

            <div className="space-y-2">
              <Button className="w-full" variant="outline" onClick={openOriginal}>
                <ExternalLink /> Open original
              </Button>

              <Button className="w-full" variant="outline" onClick={copyJSON}>
                <Copy /> Copy JSON
              </Button>

              <Button className="w-full" variant="outline" onClick={downloadJSON}>
                <Download /> Download JSON
              </Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">
              Diagnostics:
              <div className="mt-1">
                <div>
                  Items: <span className="font-medium">{allItems.length}</span>
                </div>
                <div>
                  Selected:{" "}
                  <span className="font-medium">
                    {selected?.title || "—"}
                  </span>
                </div>
                <div>
                  Detail:{" "}
                  <span className="font-medium">
                    {selectedDetail?.type || "—"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </main>

      {/* ============================ IMAGE DIALOG ============================ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full p-0 rounded-2xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader>
            <DialogTitle>{selected?.title || "Image"}</DialogTitle>
          </DialogHeader>

          <div className="h-[60vh] flex items-center justify-center">
            {selected?.thumb ? (
              <img
                src={selected.thumb}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-xs opacity-60">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Preview from playlist</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={openOriginal}>
                <ExternalLink />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

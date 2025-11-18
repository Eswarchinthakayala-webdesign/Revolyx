// src/pages/FoodishPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper"; // keep your toast helper or replace with toast
import {
  Search,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  ArrowRightCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";

/**
 * FoodishPage.jsx
 *
 * - Fetches random food images from `https://foodish-api.com/api/` (no key required)
 * - Suggestions shown while typing (preset list filtered)
 * - Layout: left (presets & recent searches) | center (big image + full details) | right (quick actions)
 * - No localStorage favorites or saving
 * - Responsive and professional visual treatment inspired by NewsApiPage
 */

/* ---------- Config ---------- */
const ENDPOINT = "https://foodish-api.com/api/"; // as provided
const DEFAULT_HINT = "Get random food images — try presets like 'pizza', 'sushi', 'dessert'.";

const PRESET_SUGGESTIONS = [
  "pizza", "burger", "sushi", "pasta", "dessert", "salad", "noodles", "steak", "seafood", "sandwich"
];

/* ---------- Helpers ---------- */
function parseImageUrlInfo(url) {
  if (!url) return { filename: "—", dish: "—" };
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const filename = parts[parts.length - 1] || url;
    // attempt to infer dish from filename or query
    const dishCandidate = filename.split(".")[0].replace(/[_-]/g, " ");
    const dish = dishCandidate.length > 1 ? dishCandidate : "Random Dish";
    return { filename, dish, origin: u.origin };
  } catch {
    return { filename: url, dish: "Random Dish" };
  }
}

/* Attempt to measure image natural size - returns {w,h} or null */
function measureImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/* pretty JSON helper */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* ---------- Component ---------- */
export default function FoodishPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(PRESET_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const [imageResp, setImageResp] = useState(null); // original API response (string or object)
  const [currentImageUrl, setCurrentImageUrl] = useState(""); // actual image URL
  const [imageMeta, setImageMeta] = useState({ filename: "", dish: "", width: null, height: null, origin: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recent, setRecent] = useState([]); // ephemeral recent searches (no localStorage)
  const suggestTimer = useRef(null);

  /* ---------- Effects ---------- */
  useEffect(() => {
    // initial fetch: load one default image
    fetchRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // filter suggestions live
    const q = (query || "").trim().toLowerCase();
    if (!q) setFilteredSuggestions(PRESET_SUGGESTIONS);
    else setFilteredSuggestions(PRESET_SUGGESTIONS.filter(s => s.includes(q)));
  }, [query]);

  /* ---------- Fetching ---------- */
  async function fetchRandom(preset = "") {
    // The Foodish API returns either a JSON object or a direct redirect to an image,
    // so handle both possibilities gracefully.
    setLoading(true);
    try {
      // Build endpoint - note: foodish does not accept query param natively,
      // but some forks accept category like /api/images/pizza or similar.
      // We'll attempt to call suggested category endpoints first, then fallback to base endpoint.
      let url = ENDPOINT;
      if (preset) {
        // try category path variations commonly used in forks
        // e.g. https://foodish-api.herokuapp.com/images/pizza/1.jpg or /api/images/pizza
        // We'll call `${ENDPOINT}${preset}` first then fallback.
        const try1 = `${ENDPOINT}${preset}`;
        const try2 = `${ENDPOINT}images/${preset}/`;
        // Try the more likely URL variations sequentially.
        const attempts = [try1, try2, ENDPOINT];
        let finalUrl = null;
        let respText = null;

        for (const attempt of attempts) {
          try {
            const res = await fetch(attempt, { method: "GET", redirect: "follow" });
            // If response is an image (200 + content-type image/) or text/json link - handle
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("image/")) {
              // There's an image payload directly
              // create blob url
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              finalUrl = objectUrl;
              respText = { blob: true, source: attempt, contentType };
              break;
            } else {
              // Try parse as JSON or text
              const txt = await res.text();
              // some endpoints return a URL string, others JSON; try to parse JSON
              try {
                const js = JSON.parse(txt);
                // Foodish typically returns {"image":"..."} or similar
                const candidate = js?.image || js?.url || js?.img || js;
                if (typeof candidate === "string" && candidate.length > 10) {
                  finalUrl = candidate;
                  respText = js;
                  break;
                }
              } catch {
                // if txt is plain url
                if (txt && (txt.startsWith("http") || txt.includes(".jpg") || txt.includes(".png"))) {
                  finalUrl = txt.trim();
                  respText = { text: txt };
                  break;
                }
              }
            }
          } catch (err) {
            // ignore and try next
          }
        }

        if (!finalUrl) {
          // fallback to endpoint (no preset)
          const r = await fetch(ENDPOINT);
          const txt = await r.text();
          try {
            const js = JSON.parse(txt);
            const candidate = js?.image || js?.url || js;
            if (typeof candidate === "string") {
              finalUrl = candidate;
              respText = js;
            } else {
              finalUrl = txt;
              respText = { text: txt };
            }
          } catch {
            finalUrl = txt;
            respText = { text: txt };
          }
        }

        // set response and process
        await processImageResult(finalUrl, respText, preset);
        setLoading(false);
        return;
      } else {
        // no preset: call base endpoint and try to parse
        const res = await fetch(ENDPOINT);
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("image/")) {
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          await processImageResult(objectUrl, { blob: true, contentType }, "");
          setLoading(false);
          return;
        }
        const txt = await res.text();
        try {
          const js = JSON.parse(txt);
          const candidate = js?.image || js?.url || js;
          if (typeof candidate === "string") {
            await processImageResult(candidate, js, "");
            setLoading(false);
            return;
          }
        } catch {
          // txt might itself be a URL
          const s = txt.trim();
          await processImageResult(s, { text: txt }, "");
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error(err);
      showToast?.("error", "Failed to fetch image");
    } finally {
      setLoading(false);
    }
  }

  async function processImageResult(url, rawResp, preset) {
    // url might be a blob URL or an http URL
    const normalizedUrl = typeof url === "string" ? url.trim() : "";
    const info = parseImageUrlInfo(normalizedUrl);
    const dims = await measureImage(normalizedUrl);
    setImageResp(rawResp);
    setCurrentImageUrl(normalizedUrl);
    setImageMeta({
      filename: info.filename,
      dish: preset || info.dish || "Random Dish",
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      origin: info.origin ?? ""
    });

    // Add to ephemeral recent list (most recent first)
    setRecent(prev => {
      const entry = { url: normalizedUrl, dish: preset || info.dish || "Random Dish", ts: Date.now() };
      const next = [entry, ...prev.filter(r => r.url !== normalizedUrl)].slice(0, 12);
      return next;
    });
  }

  /* ---------- Handlers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      // suggestions filtered automatically via effect
      setFilteredSuggestions(PRESET_SUGGESTIONS.filter(s => s.includes((v || "").toLowerCase())));
    }, 200);
  }

  function handleSelectSuggestion(s) {
    setQuery(s);
    setShowSuggest(false);
    // fetch with preset (best-effort)
    fetchRandom(s);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    const q = (query || "").trim();
    if (!q) {
      showToast?.("info", DEFAULT_HINT);
      return;
    }
    // treat q as preset
    fetchRandom(q);
    setShowSuggest(false);
  }

  function openImageFull() {
    if (!currentImageUrl) return;
    setDialogOpen(true);
  }

  function downloadImage() {
    if (!currentImageUrl) return showToast?.("info", "No image to download");
    // create temporary link
    const a = document.createElement("a");
    a.href = currentImageUrl;
    a.download = imageMeta.filename || `food_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast?.("success", "Download started");
  }

  function openExternal() {
    if (!currentImageUrl) return showToast?.("info", "No external image");
    // if blob URL, cannot open original; show toast
    if (currentImageUrl.startsWith("blob:")) return showToast?.("info", "Image is loaded as blob (no external origin)");
    window.open(currentImageUrl, "_blank", "noopener");
  }

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Feast — Random Food</h1>
          <p className="mt-1 text-sm opacity-70">Beautifully browse random food images. Professionally designed, responsive, with smart suggestions.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
          <Search className="opacity-60" />
          <Input
            placeholder="Type a preset (pizza, sushi, dessert)..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent outline-none"
            onFocus={() => setShowSuggest(true)}
          />
          <Button type="submit" variant="outline" className="px-3"><ArrowRightCircle /></Button>
          <Button type="button" variant="outline" className="px-3" onClick={() => { setQuery(""); fetchRandom(); }} title="Random"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
        </form>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && filteredSuggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <li className="p-3 text-sm opacity-60">Suggestions</li>
            {filteredSuggestions.map((s) => (
              <li key={s} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => handleSelectSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 text-sm font-medium">{s}</div>
                  <div className="text-xs opacity-60">Try: {s}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout: left (presets/recent) | center (image + details) | right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: presets & recent */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800 rounded-2xl p-4" : "bg-white/90 border border-zinc-200 rounded-2xl p-4")}>
          <div>
            <div className="text-sm font-semibold mb-2">Presets</div>
            <div className="flex flex-wrap gap-2">
              {PRESET_SUGGESTIONS.map(s => (
                <Button key={s} variant="ghost" className="px-3 py-2 text-sm" onClick={() => handleSelectSuggestion(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Recent</div>
            <div className="space-y-2">
              {recent.length === 0 ? (
                <div className="text-xs opacity-60">No recent images (session only).</div>
              ) : recent.map((r, idx) => (
                <div key={r.url + idx} className="flex items-center gap-3">
                  <img src={r.url} alt={r.dish} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">{r.dish}</div>
                    <div className="text-xs opacity-60">{new Date(r.ts).toLocaleString()}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setCurrentImageUrl(r.url); setImageMeta(prev => ({ ...prev, dish: r.dish })); }}>
                    <ImageIcon />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: big viewer */}
        <section className={clsx("lg:col-span-6 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Image Viewer</CardTitle>
                <div className="text-xs opacity-60">{imageMeta.dish || "Random Dish"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchRandom()}><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => openImageFull()}><ImageIcon /> View</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentImageUrl ? (
                <div className="py-20 text-center text-sm opacity-60">No image yet — try a preset or press Refresh.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* left inside viewer: thumbnail + meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full rounded-md overflow-hidden mb-3" style={{ aspectRatio: "16/12" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentImageUrl} alt={imageMeta.dish} className="w-full h-full object-cover" />
                    </div>

                    <div className="text-lg font-semibold">{imageMeta.dish}</div>
                    <div className="text-xs opacity-60 mb-2">{imageMeta.filename}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Dimensions</div>
                        <div className="font-medium">{imageMeta.width ? `${imageMeta.width} × ${imageMeta.height}px` : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Origin</div>
                        <div className="font-medium">{imageMeta.origin || "Unknown"}</div>
                      </div>
                    </div>
                  </div>

                  {/* right inside viewer: description & raw response */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">About this image</div>
                    <div className="text-sm leading-relaxed mb-3">
                      This image was fetched from the Foodish API. We try to infer metadata such as a dish name
                      and the image filename. If a category was used when searching (e.g. <span className="font-medium">pizza</span>),
                      that category is shown as the dish name.
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">API Response</div>
                    <pre className={clsx("text-xs overflow-auto p-2 rounded-md", isDark ? "bg-black/30 text-zinc-200" : "bg-white text-zinc-900")} style={{ maxHeight: 260 }}>
                      {prettyJSON(imageResp ?? { url: currentImageUrl })}
                    </pre>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={downloadImage}><Download /> Download</Button>
                      <Button variant="outline" onClick={openExternal}><ExternalLink /> Open</Button>
                      <Button variant="ghost" onClick={() => {
                        // copy URL
                        if (!currentImageUrl) return showToast?.("info", "No image URL");
                        navigator.clipboard.writeText(currentImageUrl);
                        showToast?.("success", "Image URL copied");
                      }}><LinkIcon /> Copy URL</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>
            <div className="text-xs opacity-60 mb-2">One-click actions for the current image</div>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => fetchRandom()} variant="outline"><RefreshCw /> New Random</Button>
              <Button onClick={() => { if (currentImageUrl) openExternal(); else showToast?.("info", "No image"); }} variant="ghost"><ExternalLink /> Open in Tab</Button>
              <Button onClick={() => { if (currentImageUrl) downloadImage(); else showToast?.("info", "No image to download"); }} variant="outline"><Download /> Download</Button>
              <Button onClick={() => { setDialogOpen(true); }} variant="ghost"><ImageIcon /> Preview</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60 mb-2">Endpoint</div>
            <div className="text-sm break-words font-medium mb-2">{ENDPOINT}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(ENDPOINT); showToast?.("success", "Endpoint copied"); }}><Download /> Copy</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{imageMeta.dish || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentImageUrl} alt={imageMeta.dish} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image preview</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => openExternal()}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// src/pages/FoodishPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper"; // keep your toast helper or replace with toast

// lucide icons
import {
  Search,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  ArrowRightCircle,
  Menu,
  Check,
  Copy,
  Code,
  List,
  Clock,
  BookOpen,
  Tag,
  Layers,
  Heart
} from "lucide-react";

// shadcn-like ui components (adjust import paths if your project differs)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge"; // If you don't have Badge, swap with a styled span

const ENDPOINT = "https://foodish-api.com/api/";
const DEFAULT_HINT = "Try presets like 'pizza', 'sushi', 'dessert'.";

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
    const dishCandidate = filename.split(".")[0].replace(/[_-]/g, " ");
    const dish = dishCandidate.length > 1 ? dishCandidate : "Random Dish";
    return { filename, dish, origin: u.origin };
  } catch {
    return { filename: url, dish: "Random Dish" };
  }
}

function measureImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

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
  const [imageResp, setImageResp] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageMeta, setImageMeta] = useState({ filename: "", dish: "", width: null, height: null, origin: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [copyState, setCopyState] = useState("idle"); // idle | copied
  const [menuOpen, setMenuOpen] = useState(false);

  const suggestTimer = useRef(null);
  const blobUrlsRef = useRef(new Set());

  /* ---------- Effects ---------- */
  useEffect(() => {
    fetchRandom();
    fetchRandomRecipes();
    return () => {
      blobUrlsRef.current.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
      blobUrlsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) setFilteredSuggestions(PRESET_SUGGESTIONS);
    else setFilteredSuggestions(PRESET_SUGGESTIONS.filter(s => s.includes(q)));
  }, [query]);

  /* ---------- Fetching ---------- */
async function fetchRandom(preset = "") {
  setLoading(true);
  try {
    let finalUrl = null;
    let respMeta = null;

    async function tryFetch(attempt) {
      try {
        const res = await fetch(attempt, { method: "GET", redirect: "follow" });
        const contentType = (res.headers.get("content-type") || "").toLowerCase();

        // If the response is an image binary -> produce a blob URL and preserve minimal meta
        if (contentType.includes("image/")) {
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          blobUrlsRef.current.add(objectUrl);
          return { finalUrl: objectUrl, meta: { blob: true, source: attempt, contentType } };
        }

        // Otherwise read text and try to parse JSON (if any)
        const txt = await res.text();

        // try parse JSON
        let js = null;
        try { js = JSON.parse(txt); } catch (e) { js = null; }

        // If parsed JSON exists, try to extract image fields or recipe info
        if (js) {
          // Prefer explicit image fields
          const candidate = (typeof js === "string") ? js : (js.image || js.url || js.img || js.thumb || null);

          if (typeof candidate === "string" && candidate.length > 8 && (candidate.startsWith("http") || candidate.includes(".jpg") || candidate.includes(".png"))) {
            return { finalUrl: candidate.trim(), meta: js };
          }

          // If this is a ThemealDB-like response or contains a recipe object, try to pick a thumb
          if (js.meals || js.recipe) {
            const candidate2 = js.recipe?.thumb || (js.meals && js.meals[0]?.strMealThumb) || null;
            return { finalUrl: candidate2 || null, meta: js };
          }

          // No image field but we keep the parsed object as meta
          return { finalUrl: null, meta: js };
        }

        // If not JSON, text might itself be a url
        const s = (txt || "").trim();
        if (s && (s.startsWith("http") || s.includes(".jpg") || s.includes(".png"))) {
          return { finalUrl: s, meta: { text: s } };
        }

        // nothing useful
        return { finalUrl: null, meta: { text: txt } };
      } catch (err) {
        // network error for this attempt
        return { finalUrl: null, meta: null };
      }
    }

    // Build attempts list when preset given
    const attempts = preset
      ? [`${ENDPOINT}${preset}`, `${ENDPOINT}images/${preset}/`, ENDPOINT]
      : [ENDPOINT];

    for (const attempt of attempts) {
      const { finalUrl: urlFromAttempt, meta } = await tryFetch(attempt);
      // prefer the first attempt that gives us either an image URL or some meta
      if (meta) {
        respMeta = meta;
      }
      if (urlFromAttempt) {
        finalUrl = urlFromAttempt;
        break;
      }
      // if we got meta without url, keep it and continue trying other attempts (we might still find an image)
    }

    // If we still don't have a finalUrl but respMeta contains useful recipe info (e.g. meals or recipe),
    // call processImageResult with empty url so UI can surface recipe details (no image).
    if (!finalUrl && respMeta && (respMeta.meals || respMeta.recipe)) {
      await processImageResult("", respMeta, preset);
      setLoading(false);
      return;
    }

    // If we have no finalUrl and no meta that can be used, throw
    if (!finalUrl && !respMeta) {
      throw new Error("No image URL or response metadata returned");
    }

    // If finalUrl present (either blob URL or remote URL) call processImageResult
    await processImageResult(finalUrl || "", respMeta, preset);
  } catch (err) {
    console.error("fetchRandom error:", err);
    showToast?.("error", "Failed to fetch image");
  } finally {
    setLoading(false);
  }
}


  async function processImageResult(url, rawResp, preset) {
    const normalizedUrl = typeof url === "string" ? url.trim() : "";
    const info = parseImageUrlInfo(normalizedUrl);
    const dims = await measureImage(normalizedUrl);

    // Determine dish/title from raw response if present
    let dishTitle = preset || info.dish || "Random Dish";
    const meta = { ...rawResp };
    // themealdb response shape
    if (rawResp?.meals && rawResp.meals[0]) {
      const m = rawResp.meals[0];
      dishTitle = m.strMeal || dishTitle;
      meta.recipe = {
        id: m.idMeal,
        title: m.strMeal,
        category: m.strCategory,
        area: m.strArea,
        thumb: m.strMealThumb,
        instructions: m.strInstructions
      };
    } else if (rawResp?.recipe) {
      const r = rawResp.recipe;
      dishTitle = r.title || dishTitle;
      meta.recipe = r;
    }

    // set state
    setImageResp(meta);
    setCurrentImageUrl(normalizedUrl);
    setImageMeta({
      filename: info.filename,
      dish: dishTitle,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      origin: info.origin ?? ""
    });

    setRecent(prev => {
      const entry = { url: normalizedUrl, dish: dishTitle, ts: Date.now() };
      const next = [entry, ...prev.filter(r => r.url !== normalizedUrl)].slice(0, 12);
      return next;
    });
  }

  /* ---------- Recipes (10 random) ---------- */
  async function fetchRandomRecipes() {
    setRecipesLoading(true);
    try {
      const calls = Array.from({ length: 10 }, () =>
        fetch("https://www.themealdb.com/api/json/v1/1/random.php").then(r => r.json()).catch(() => null)
      );
      const results = await Promise.all(calls);
      const meals = results
        .map(res => res && res.meals && res.meals[0])
        .filter(Boolean)
        .map(m => ({
          id: m.idMeal,
          title: m.strMeal,
          category: m.strCategory,
          area: m.strArea,
          thumb: m.strMealThumb,
          instructions: m.strInstructions
        }));
      if (meals.length === 0) {
        const fallback = PRESET_SUGGESTIONS.map((s, i) => ({
          id: `preset-${i}`,
          title: s.charAt(0).toUpperCase() + s.slice(1),
          category: "Preset",
          thumb: null,
          instructions: ""
        }));
        setRecipes(fallback);
      } else {
        setRecipes(meals);
      }
    } catch (err) {
      console.error(err);
      showToast?.("error", "Failed to load recipes");
    } finally {
      setRecipesLoading(false);
    }
  }

  /* ---------- Handlers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setFilteredSuggestions(PRESET_SUGGESTIONS.filter(s => s.includes((v || "").toLowerCase())));
    }, 160);
  }

  function handleSelectSuggestion(s) {
    setQuery(s);
    setShowSuggest(false);
    fetchRandom(s);
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    const q = (query || "").trim();
    if (!q) {
      showToast?.("info", DEFAULT_HINT);
      return;
    }
    fetchRandom(q);
    setShowSuggest(false);
  }

  function openImageFull() {
    if (!currentImageUrl) return;
    setDialogOpen(true);
  }

  function downloadImage() {
    if (!currentImageUrl) return showToast?.("info", "No image to download");
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
    if (currentImageUrl.startsWith("blob:")) return showToast?.("info", "Image is loaded as blob (no external origin)");
    window.open(currentImageUrl, "_blank", "noopener,noreferrer");
  }

  async function handleCopyUrl() {
    if (!currentImageUrl) return showToast?.("info", "No image URL");
    try {
      await navigator.clipboard.writeText(currentImageUrl);
      setCopyState("copied");
      showToast?.("success", "Image URL copied");
      // reset after animation
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      showToast?.("error", "Failed to copy");
    }
  }

  /* ---------- small helpers for UI ---------- */
  const copyBtnVariants = {
    idle: { scale: 1 },
    tap: { scale: 0.95 },
    copied: { scale: 1.02 }
  };

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto", isDark ? "text-zinc-200" : "text-zinc-900")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            onClick={() => setSheetOpen(true)}
            aria-label="open menu"
            title="Open"
          >
            <Menu />
          </button>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold leading-tight flex items-center gap-3")}>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full p-1 bg-amber-400/20"><Heart size={18} /></span>
                Feast
              </span>
              <span className="text-base font-medium opacity-80">— Random Food</span>
            </h1>
            <p className="text-xs md:text-sm opacity-70">Browse curated random food images + quick recipes</p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[520px] lg:w-[640px] rounded-lg px-3 py-2 border", isDark ? "bg-black/60 border-zinc-800" : "bg-white border-zinc-200")}>
          <Search className="opacity-60" />
          <Input
            placeholder="Type a preset (pizza, sushi, dessert)..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent outline-none text-sm"
            onFocus={() => setShowSuggest(true)}
            aria-label="search preset"
          />
          <Button type="submit" variant="outline" className="px-3 cursor-pointer"><ArrowRightCircle /></Button>
          <Button type="button" variant="ghost" className="px-2 cursor-pointer" onClick={() => { setQuery(""); fetchRandom(); }} title="Random"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
        </form>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && filteredSuggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <li className="p-3 text-sm opacity-60 flex items-center gap-2"><List size={14} /> Suggestions</li>
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

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: recipes (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4 rounded-2xl p-4", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2"><List /> Random Recipes</div>
            <div className="text-xs opacity-60">{recipes.length}/10</div>
          </div>

          <ScrollArea className="h-[56vh]">
            <div className="space-y-3">
              {recipesLoading ? (
                <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : recipes.length === 0 ? (
                <div className="text-xs opacity-60">No recipes yet</div>
              ) : recipes.map(r => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => {
                    if (r.thumb) {
                      setCurrentImageUrl(r.thumb);
                      setImageMeta(prev => ({ ...prev, dish: r.title }));
                      setImageResp({ recipe: r });
                    } else {
                      fetchRandom(r.title.split(" ")[0] || "");
                    }
                  }}
                >
                  <div className="w-14 h-10 rounded-md overflow-hidden bg-zinc-100 flex items-center justify-center">
                    {r.thumb ? <img src={r.thumb} alt={r.title} className="w-full h-full object-cover" /> : <div className="text-xs opacity-60">No image</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium w-50 truncate">{r.title}</div>
                    <div className="text-xs opacity-60 flex items-center gap-2">
                      <Tag size={12} /> {r.category || r.area || "—"}
                    </div>
                  </div>
                  <div className="text-xs opacity-60">
                    <Clock size={14} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchRandomRecipes()} className="flex-1 cursor-pointer"><RefreshCw /> Refresh</Button>
            <Button variant="ghost" onClick={() => { navigator.clipboard.writeText("https://www.themealdb.com"); showToast?.("success", "Source copied"); }} className="cursor-pointer">Source</Button>
          </div>
        </aside>

        {/* Center: large viewer */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-start flex-wrap justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon /> Image Viewer
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-3 mt-1">
                  <Code size={14} /> {imageMeta.dish || "Random Dish"}
                  {imageResp?.recipe && (
                    <span className="inline-flex items-center gap-2">
                      <Badge className="ml-2">{imageResp.recipe.category || "Recipe"}</Badge>
                      <Badge>{imageResp.recipe.area || "—"}</Badge>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchRandom()} className="cursor-pointer"><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => openImageFull()} className="cursor-pointer"><ImageIcon /> View</Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loading ? (
                <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentImageUrl ? (
                <div className="py-20 text-center text-sm opacity-60">No image yet — try a preset or press Refresh.</div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  {/* hero / large view */}
                  <div className="flex-1 rounded-xl overflow-hidden relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    {/* action overlay */}
                    <div className="absolute top-3 right-3 z-20 flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openExternal()} className="cursor-pointer"><ExternalLink /></Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadImage()} className="cursor-pointer"><Download /></Button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyUrl}
                        initial="idle"
                        animate={copyState === "copied" ? "copied" : "idle"}
                        variants={copyBtnVariants}
                        className={clsx("rounded-md px-2 py-1 border flex items-center gap-2 cursor-pointer", isDark ? "bg-black/60 border-zinc-700" : "bg-white border-zinc-200")}
                      >
                        <AnimatePresence mode="popLayout">
                          {copyState === "idle" ? (
                            <motion.span key="copy" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                              <Copy size={14} />
                            </motion.span>
                          ) : (
                            <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Check size={14} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <motion.span
                          key={copyState}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.12 }}
                          className="text-xs opacity-80"
                        >
                          {copyState === "idle" ? "Copy" : "Copied"}
                        </motion.span>
                      </motion.button>
                    </div>

                    <div style={{ aspectRatio: "16/10" }} className="w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={currentImageUrl}
                        src={currentImageUrl}
                        alt={imageMeta.dish}
                        onError={() => {
                          showToast?.("error", "Failed to load image");
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>

                    {/* meta bar */}
                    <div className="p-3 border-t bg-white/60 dark:bg-black/60">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold">{imageMeta.dish}</div>
                          <div className="text-xs opacity-60">{imageMeta.filename}</div>
                        </div>

                        <div className="text-xs opacity-60 flex items-center gap-3">
                          <div>{imageMeta.width ? `${imageMeta.width} × ${imageMeta.height}px` : "—"}</div>
                          <div>•</div>
                          <div>{imageMeta.origin || "Unknown"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* details column */}
                  <div className="md:w-[360px] space-y-3">
                    <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold flex items-center gap-2"><BookOpen /> API Response</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer">{showRaw ? "Hide" : "Show"}</Button>
                        </div>
                      </div>

                      <div className="mt-2 text-xs">
                        {showRaw ? (
                          <pre className={clsx("text-xs overflow-auto p-2 rounded-md", isDark ? "bg-black/30 text-zinc-200" : "bg-white text-zinc-900")} style={{ maxHeight: 220 }}>
                            {prettyJSON(imageResp ?? { url: currentImageUrl })}
                          </pre>
                        ) : (
                          <>
                            {/* If recipe present show a concise card */}
                            {imageResp?.recipe ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-12 rounded-md overflow-hidden bg-zinc-100 flex items-center justify-center">
                                    {imageResp.recipe.thumb ? <img src={imageResp.recipe.thumb} alt={imageResp.recipe.title} className="w-full h-full object-cover" /> : <div className="text-xs opacity-60">No image</div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{imageResp.recipe.title}</div>
                                    <div className="text-xs opacity-60 flex items-center gap-2 mt-1">
                                      <Tag size={12} /> {imageResp.recipe.category || "—"} • {imageResp.recipe.area || "—"}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-xs opacity-70 line-clamp-4">
                                  {imageResp.recipe.instructions ? imageResp.recipe.instructions : "No instructions available."}
                                </div>

                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { if (imageResp.recipe.thumb) { setCurrentImageUrl(imageResp.recipe.thumb); openImageFull(); } else showToast?.("info", "No thumbnail"); }} className="cursor-pointer"><ImageIcon /> Preview</Button>
                                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(imageResp.recipe.title || ""); showToast?.("success", "Title copied"); }} className="cursor-pointer"><LinkIcon /> Copy Title</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm opacity-70">Raw response hidden. Toggle to view full payload or see quick summary if available.</div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={() => downloadImage()} className="cursor-pointer"><Download /> Download</Button>
                        <Button variant="outline" onClick={() => openExternal()} className="cursor-pointer"><ExternalLink /> Open</Button>
                        <Button variant="ghost" onClick={() => {
                          if (!currentImageUrl) return showToast?.("info", "No image URL");
                          navigator.clipboard.writeText(currentImageUrl);
                          showToast?.("success", "Image URL copied");
                        }} className="cursor-pointer"><LinkIcon /> Copy URL</Button>
                      </div>
                    </div>

                
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><List /> Quick Actions</div>
            <div className="text-xs opacity-60 mb-3">Actions for the current image</div>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => fetchRandom()} variant="outline" className="cursor-pointer"><RefreshCw /> New Random</Button>
              <Button onClick={() => { if (currentImageUrl) openExternal(); else showToast?.("info", "No image"); }} variant="ghost" className="cursor-pointer"><ExternalLink /> Open in Tab</Button>
              <Button onClick={() => { if (currentImageUrl) downloadImage(); else showToast?.("info", "No image to download"); }} variant="outline" className="cursor-pointer"><Download /> Download</Button>
              <Button onClick={() => { setDialogOpen(true); }} variant="ghost" className="cursor-pointer"><ImageIcon /> Preview</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60 mb-2">Endpoint</div>
            <div className="text-sm break-words font-medium mb-2">{ENDPOINT}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(ENDPOINT); showToast?.("success", "Endpoint copied"); }} className="cursor-pointer"><Download /> Copy</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-5xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{imageMeta.dish || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "rgba(0,0,0,0.9)" : "" }}>
            {currentImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImageUrl}
                alt={imageMeta.dish}
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", display: "block" }}
                onError={() => showToast?.("error", "Failed to load preview")}
              />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image preview</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Close</Button>
              <Button variant="outline" onClick={() => openExternal()} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Sheet: recipes + actions */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
    

        <SheetContent side="left" className="w-full max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Menu /> Recipes</div>
              <SheetClose asChild>
                <button className="rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <span>Close</span>
                </button>
              </SheetClose>
            </SheetTitle>
          </SheetHeader>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Random Recipes</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => fetchRandomRecipes()} className="cursor-pointer"><RefreshCw /></Button>
                <SheetClose asChild>
                  <button className="text-xs opacity-60">Done</button>
                </SheetClose>
              </div>
            </div>

            <ScrollArea className="h-[60vh]">
              <div className="space-y-3">
                {recipesLoading ? (
                  <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                ) : recipes.length === 0 ? (
                  <div className="text-xs opacity-60">No recipes yet</div>
                ) : recipes.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => {
                    if (r.thumb) {
                      setCurrentImageUrl(r.thumb);
                      setImageMeta(prev => ({ ...prev, dish: r.title }));
                      setImageResp({ recipe: r });
                      setSheetOpen(false);
                    } else {
                      fetchRandom(r.title.split(" ")[0] || "");
                      setSheetOpen(false);
                    }
                  }}>
                    <div className="w-14 h-10 rounded-md overflow-hidden bg-zinc-100 flex items-center justify-center">
                      {r.thumb ? <img src={r.thumb} alt={r.title} className="w-full h-full object-cover" /> : <div className="text-xs opacity-60">No image</div>}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium w-50 truncate">{r.title}</div>
                      <div className="text-xs opacity-60">{r.category || r.area || "—"}</div>
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

// src/pages/MealPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  Star,
  X,
  ExternalLink,
  Copy as CopyIcon,
  Download,
  Loader2,
  Heart,
  MapPin,
  BookOpen,
  ImageIcon,
  List,
  CheckCircle,
  Menu,
  Loader,
  RefreshCw,
  Clock,
  Layers,
  Tag,
  ChevronRight,
  Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoints (TheMealDB) ---------- */
const RANDOM_MEAL = "https://www.themealdb.com/api/json/v1/1/random.php";
const SEARCH_MEAL = "https://www.themealdb.com/api/json/v1/1/search.php"; // ?s=
const LOOKUP_MEAL = "https://www.themealdb.com/api/json/v1/1/lookup.php"; // ?i=

/* ---------- Defaults ---------- */
const DEFAULT_MSG = "Hungry for inspiration? Try 'chicken', 'pizza', 'curry'...";

/* small helper: pretty print */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* Convert TheMealDB's flat ingredient/measure pairs into an array */
function extractIngredients(meal) {
  if (!meal) return [];
  const res = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      res.push({ ingredient: ing.trim(), measure: (measure || "").trim() });
    }
  }
  return res;
}

/* helper: fetch N random meals (TheMealDB random returns single item) */
async function fetchNRandomMeals(n = 10) {
  const promises = Array.from({ length: n }).map(() =>
    fetch(RANDOM_MEAL).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  );
  const results = await Promise.all(promises);
  // flatten to meal objects, drop nulls, dedupe by id
  const meals = results
    .map((j) => (j?.meals && j.meals[0]) || null)
    .filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const m of meals) {
    if (!m || seen.has(m.idMeal)) continue;
    seen.add(m.idMeal);
    unique.push(m);
  }
  return unique;
}

/* ---------- Component ---------- */
export default function MealPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // search results as suggestions
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentMeal, setCurrentMeal] = useState(null); // meal object
  const [rawResp, setRawResp] = useState(null);
  const [loadingMeal, setLoadingMeal] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // sidebar / sheet list
  const [sideMeals, setSideMeals] = useState([]);
  const [loadingSide, setLoadingSide] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const [copyAnimating, setCopyAnimating] = useState(false);

  const suggestTimer = useRef(null);
  const favLoadedRef = useRef(false);

  /* Persist favorites */
  useEffect(() => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("revolyx-meal-favs") || "[]");
    } catch {
      saved = [];
    }
    setFavorites(Array.isArray(saved) ? saved : []);
    favLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!favLoadedRef.current) return;
    localStorage.setItem("revolyx-meal-favs", JSON.stringify(favorites));
  }, [favorites]);

  /* ---------- fetch helpers ---------- */
  async function fetchRandomMeal(setAsCurrent = true) {
    setLoadingMeal(true);
    try {
      const res = await fetch(RANDOM_MEAL);
      if (!res.ok) {
        showToast("error", `Random meal fetch failed (${res.status})`);
        setLoadingMeal(false);
        return;
      }
      const json = await res.json();
      const meal = (json?.meals && json.meals[0]) || null;
      if (setAsCurrent) {
        setCurrentMeal(meal);
        setRawResp(json);
        showToast("success", `Serving: ${meal?.strMeal || "mystery meal"} 🍽️`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch random meal");
    } finally {
      setLoadingMeal(false);
    }
  }

  async function searchMeals(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${SEARCH_MEAL}?s=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json?.meals || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function lookupMealById(id) {
    if (!id) return;
    setLoadingMeal(true);
    try {
      const res = await fetch(`${LOOKUP_MEAL}?i=${encodeURIComponent(id)}`);
      if (!res.ok) {
        showToast("error", `Lookup failed (${res.status})`);
        setLoadingMeal(false);
        return;
      }
      const json = await res.json();
      const meal = (json?.meals && json.meals[0]) || null;
      setCurrentMeal(meal);
      setRawResp(json);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load recipe");
    } finally {
      setLoadingMeal(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchMeals(v);
    }, 350);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${SEARCH_MEAL}?s=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const json = await res.json();
      setLoadingSuggest(false);
      if (json?.meals && json.meals.length > 0) {
        setCurrentMeal(json.meals[0]);
        setRawResp(json);
        setShowSuggest(false);
        showToast("success", `Found: ${json.meals[0].strMeal}`);
      } else {
        showToast("info", "No recipes found — try another keyword");
      }
    } catch (err) {
      setLoadingSuggest(false);
      showToast("error", "Failed to search meals");
    }
  }

  /* Favorites */
  function saveFavorite() {
    if (!currentMeal) {
      showToast("info", "No recipe loaded to save");
      return;
    }
    const id = currentMeal.idMeal;
    setFavorites((prev) => {
      if (prev.some((f) => f.id === id)) {
        showToast("info", "Already saved");
        return prev;
      }
      const next = [{ id, name: currentMeal.strMeal, thumb: currentMeal.strMealThumb }, ...prev].slice(0, 50);
      showToast("success", `Saved ${currentMeal.strMeal}`);
      return next;
    });
  }

  function removeFavorite(id) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    showToast("info", "Removed favorite");
  }

  function chooseFavorite(f) {
    lookupMealById(f.id);
  }

  /* Export / copy */
  async function copyRecipeToClipboard() {
    if (!currentMeal) return showToast("info", "No recipe to copy");
    try {
      await navigator.clipboard.writeText(prettyJSON(currentMeal));
      setCopied(true);
      setCopyAnimating(true);
      showToast("success", "Recipe JSON copied");
      // reset animation after 1.8s
      setTimeout(() => {
        setCopyAnimating(false);
      }, 300);
      // reset tick after a bit
      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
    }
  }

  function downloadJSON() {
    if (!rawResp) {
      showToast("info", "No recipe to download");
      return;
    }
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `recipe_${(currentMeal?.strMeal || "meal").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Derived data */
  const ingredients = useMemo(() => extractIngredients(currentMeal), [currentMeal]);

  /* Small UX: when page mounts, load a random meal for immediate content and populate sidebar */
  useEffect(() => {
    (async () => {
      await fetchRandomMeal(true);
      await refreshSidebarMeals();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshSidebarMeals() {
    setLoadingSide(true);
    try {
      const list = await fetchNRandomMeals(10);
      setSideMeals(list);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load sidebar meals");
    } finally {
      setLoadingSide(false);
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-start flex-wrap md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" aria-label="Open menu">
                <Menu />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx("w-[320px] p-0", isDark ? "bg-black/90" : "bg-white")}>
              <SheetHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-semibold">Random Meals</SheetTitle>
                  <div className="text-xs opacity-60">Tap to load</div>
                </div>
              </SheetHeader>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Button variant="ghost" onClick={() => refreshSidebarMeals()} className="cursor-pointer">
                    <RefreshCw className={loadingSide ? "animate-spin" : ""} />
                    <span className="ml-2 text-sm">Refresh</span>
                  </Button>
                  <Button variant="outline" onClick={() => { setSheetOpen(false); fetchRandomMeal(); }} className="cursor-pointer">
                    <Loader2 /> Surprise
                  </Button>
                </div>

                <ScrollArea style={{ height: "60vh" }}>
                  <div className="space-y-2">
                    {loadingSide && <div className="text-sm opacity-60 p-2">Loading…</div>}
                    {sideMeals.map((m) => (
                      <button
                        key={m.idMeal}
                        onClick={() => {
                          lookupMealById(m.idMeal);
                          setSheetOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <img src={m.strMealThumb} alt={m.strMeal} className="w-12 h-8 object-cover rounded-sm" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{m.strMeal}</div>
                          <div className="text-xs opacity-60">{m.strCategory || "—"} • {m.strArea || "—"}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <SheetFooter className="p-4 border-t flex justify-between items-center">
                <div className="text-xs opacity-60">Powered by TheMealDB</div>
                <div>
                  <Button variant="ghost" onClick={() => setSheetOpen(false)} className="cursor-pointer"><X /></Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold")}>Revolyx — Recipes</h1>
            <p className="mt-0.5 text-sm opacity-70">Random meals, curated recipes • fast preview</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[520px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search recipes, e.g. 'rice', 'tuna', 'Arrabiata'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchRandomMeal()}>
              Surprise
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>

      </header>

      {/* suggestions (desktop dropdown) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_260px)] md:right-auto max-w-3xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.idMeal || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrentMeal(s); setRawResp({ meals: [s] }); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <img src={s.strMealThumb} alt={s.strMeal} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.strMeal}</div>
                    <div className="text-xs opacity-60">{s.strCategory || "—"} • {s.strArea || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">ID {s.idMeal}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: favorites / quick actions (desktop only) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Random Meals</div>
            <div className="text-xs opacity-60">Tap to load</div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => refreshSidebarMeals()} className="cursor-pointer">
              <RefreshCw className={loadingSide ? "animate-spin" : ""} />
              <span className="ml-2 text-sm">Refresh</span>
            </Button>
            <Button variant="outline" onClick={() => fetchRandomMeal()} className="cursor-pointer"><Loader2 /> Surprise</Button>
          </div>

          <ScrollArea style={{ height: 560 }}>
            <div className="space-y-2 mt-3">
              {loadingSide && <div className="text-sm opacity-60 p-2">Loading…</div>}
              {sideMeals.map((m) => (
                <div key={m.idMeal} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" onClick={() => lookupMealById(m.idMeal)}>
                  <img src={m.strMealThumb} alt={m.strMeal} className="w-14 h-10 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.strMeal}</div>
                    <div className="text-xs opacity-60">{m.strCategory || "—"} • {m.strArea || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">#{m.idMeal}</div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => fetchRandomMeal()} className="cursor-pointer"><Loader2 /> Random Meal</Button>
              <Button variant="outline" onClick={() => { if (currentMeal) saveFavorite(); else showToast("info", "Load a recipe first"); }} className="cursor-pointer"><Star /> Save</Button>
              <Button variant="outline" onClick={() => { copyRecipeToClipboard(); }} className="cursor-pointer">
                {copied ? <Check className="text-green-500" /> : <CopyIcon />} Copy JSON
              </Button>
              <Button variant="outline" onClick={() => { downloadJSON(); }} className="cursor-pointer"><Download /> Download</Button>
            </div>
          </div>
        </aside>

        {/* Center: recipe viewer */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 opacity-80" />
                  Recipe
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <span>{currentMeal?.strMeal || "Waiting for a dish..."}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchRandomMeal()}><Loader className={loadingMeal ? "animate-spin" : ""} /> Random</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingMeal ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentMeal ? (
                <div className="py-12 text-center text-sm opacity-60">No recipe loaded — try search or random.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Image / meta */}
                  <div className={clsx("md:col-span-5 p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={currentMeal.strMealThumb} alt={currentMeal.strMeal} className="w-full rounded-md object-cover mb-3" />
                    <div className="text-lg font-semibold">{currentMeal.strMeal}</div>
                    <div className="text-xs opacity-60 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> <span>{currentMeal.strTags || "No tags"}</span>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs opacity-60">Category</div>
                          <div className="font-medium">{currentMeal.strCategory || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Origin</div>
                          <div className="font-medium">{currentMeal.strArea || "—"}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Source</div>
                        <div className="font-medium overflow-auto no-scrollbar">{currentMeal.strSource || "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button className="cursor-pointer" variant="outline" onClick={() => { if (currentMeal.strYoutube) window.open(currentMeal.strYoutube, "_blank"); else showToast("info", "No YouTube tutorial"); }}><ExternalLink /> Watch</Button>

                      <Button variant="ghost" onClick={() => downloadJSON()} className="cursor-pointer"><Download /></Button>
                    </div>
                  </div>

                  {/* Ingredients + instructions */}
                  <div className={clsx("md:col-span-7 p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                          <div className="text-sm font-semibold">Ingredients</div>
                          <div className="text-xs opacity-60">{ingredients.length} items</div>
                        </div>
                      </div>

                      <div className="text-xs opacity-60">Prep: {currentMeal?.strTags?.split(",")[0] || "—"}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {ingredients.map((it, idx) => (
                        <div key={idx} className="p-2 rounded-md border flex items-start gap-3">
                          <div className="mt-1 text-xs opacity-80">•</div>
                          <div>
                            <div className="font-medium">{it.ingredient}</div>
                            <div className="text-xs opacity-60">{it.measure}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4" />
                        <div className="text-sm font-semibold">Instructions</div>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-line">{currentMeal.strInstructions}</div>
                    </div>

                    {currentMeal.strTags && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <div className="text-xs opacity-60">{currentMeal.strTags}</div>
                        </div>
                      </>
                    )}
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

        {/* Right: meta / developer / quick list */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Meta</div>
              <div className="text-xs opacity-60">Recipe info</div>
            </div>

            {currentMeal ? (
              <div className="space-y-3">
                <div className="p-3 rounded-md border flex items-center gap-3 cursor-default">
                  <BookOpen className="w-4 h-4" />
                  <div>
                    <div className="text-xs opacity-60">Meal</div>
                    <div className="font-medium">{currentMeal.strMeal}</div>
                  </div>
                </div>

                <div className="p-3 rounded-md border flex items-center gap-3 cursor-default">
                  <MapPin className="w-4 h-4" />
                  <div>
                    <div className="text-xs opacity-60">Origin</div>
                    <div className="font-medium">{currentMeal.strArea || "—"}</div>
                  </div>
                </div>

                <div className="p-3 rounded-md border flex items-center gap-3 cursor-default">
                  <Menu className="w-4 h-4" />
                  <div>
                    <div className="text-xs opacity-60">Category</div>
                    <div className="font-medium">{currentMeal.strCategory || "—"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-60">No metadata</div>
            )}
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples & debugging</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(RANDOM_MEAL); showToast("success", "Endpoint copied"); }}><CopyIcon /> Copy Random Endpoint</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentMeal?.strMeal || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentMeal?.strMealThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentMeal.strMealThumb} alt={currentMeal.strMeal} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image provided by TheMealDB</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (currentMeal?.strMealThumb) window.open(currentMeal.strMealThumb, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

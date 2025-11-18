// src/pages/CocktailPage.jsx
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
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  GlassWater as Glass,
  Tag,
  Clock,
  Users,
  Sparkles,
  Heart,
  ArrowRightCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const RANDOM_ENDPOINT = "https://www.thecocktaildb.com/api/json/v1/1/random.php";
const SEARCH_ENDPOINT = "https://www.thecocktaildb.com/api/json/v1/1/search.php"; // ?s=<name>

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function parseIngredients(drink) {
  // CocktailDB returns strIngredient1..15 and strMeasure1..15
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`];
    const measure = drink[`strMeasure${i}`];
    if (ing && ing.trim() !== "") {
      ingredients.push({ ingredient: ing, measure: measure ? measure.trim() : "" });
    }
  }
  return ingredients;
}

/* ---------- Component ---------- */
export default function CocktailPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // search results
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);
  const favLoadedRef = useRef(false);

  /* Persist favorites */
  useEffect(() => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("cocktail-favs") || "[]");
    } catch {
      saved = [];
    }
    setFavorites(Array.isArray(saved) ? saved : []);
    favLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!favLoadedRef.current) return;
    localStorage.setItem("cocktail-favs", JSON.stringify(favorites));
  }, [favorites]);

  /* Fetch helpers */
  async function fetchRandomCocktail() {
    setLoading(true);
    try {
      const res = await fetch(RANDOM_ENDPOINT);
      if (!res.ok) {
        showToast("error", `Fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const d = json.drinks && json.drinks[0] ? json.drinks[0] : null;
      setCurrent(d);
      setRawResp(json);
      if (d) showToast("success", `Loaded: ${d.strDrink}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch cocktail");
    } finally {
      setLoading(false);
    }
  }

  async function searchCocktails(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("s", q);
      const url = `${SEARCH_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.drinks || [];
      setSuggestions(items || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchCocktails(v);
    }, 350);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Type a cocktail name (e.g. Margarita) or click Random");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("s", query);
      const url = `${SEARCH_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      const items = json.drinks || [];
      setLoading(false);
      if (items && items.length > 0) {
        setCurrent(items[0]);
        setRawResp(json);
        setShowSuggest(false);
        showToast("success", `Found: ${items[0].strDrink}`);
      } else {
        showToast("info", "No cocktails found — try another name");
      }
    } catch (err) {
      setLoading(false);
      showToast("error", "Failed to search cocktails");
    }
  }

  function saveFavorite() {
    if (!current) {
      showToast("info", "No cocktail loaded to save");
      return;
    }
    const id = current.idDrink || current.strDrink || Date.now().toString();
    setFavorites(prev => {
      if (prev.some(f => f.id === id)) {
        showToast("info", "Already saved");
        return prev;
      }
      const thumb = current.strDrinkThumb || "";
      const next = [{ id, title: current.strDrink, thumb }, ...prev].slice(0, 200);
      showToast("success", `Saved ${current.strDrink}`);
      return next;
    });
  }

  function removeFavorite(id) {
    setFavorites(prev => prev.filter(f => f.id !== id));
    showToast("info", "Removed favorite");
  }

  function chooseFavorite(f) {
    // set a minimal current from saved favorite; user can fetch or open original if available
    setCurrent({ strDrink: f.title, idDrink: f.id, strDrinkThumb: f.thumb });
    setRawResp(null);
  }

  function copyCocktailToClipboard() {
    if (!current) return showToast("info", "No cocktail to copy");
    navigator.clipboard.writeText(prettyJSON(current));
    showToast("success", "Cocktail JSON copied");
  }

  function downloadJSON() {
    if (!rawResp && !current) {
      showToast("info", "No cocktail to download");
      return;
    }
    const payload = rawResp || current;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cocktail_${(current?.strDrink || "cocktail").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  useEffect(() => {
    // initial load: one random cocktail to show content by default
    fetchRandomCocktail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Derived values */
  const ingredients = useMemo(() => (current ? parseIngredients(current) : []), [current]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Cocktail Lab — Recipes</h1>
          <p className="mt-1 text-sm opacity-70">Random cocktails, recipe details, ingredients, and professional recipe view.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search cocktails by name, e.g. 'Margarita', 'Old Fashioned'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchRandomCocktail()}>
              Random
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.idDrink || s.strDrink || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrent(s); setRawResp({ drinks: [s] }); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <img src={s.strDrinkThumb || ""} alt={s.strDrink || "thumb"} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.strDrink}</div>
                    <div className="text-xs opacity-60">{s.strAlcoholic ?? s.strCategory ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.idDrink}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Main viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Recipe</CardTitle>
                <div className="text-xs opacity-60">{current?.strDrink || "Waiting for a cocktail..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer " variant="outline" onClick={() => fetchRandomCocktail()}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => saveFavorite()}><Star /> Save</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No cocktail loaded — try Random or search.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: image + primary meta */}
                  <aside className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={current.strDrinkThumb || ""} alt={current.strDrink} className="w-full rounded-md object-cover mb-4" style={{ aspectRatio: "4/3", objectFit: "cover" }} />
                    <div className="text-2xl font-semibold mb-1">{current.strDrink}</div>
                    <div className="text-sm opacity-70 mb-3">{current.strCategory || "Cocktail"} • {current.strAlcoholic || "—"}</div>

                    <div className="grid grid-cols-2 gap-2 text-xs opacity-60">
                      <div className="flex items-center gap-2"><Glass className="w-4 h-4" /> Glass</div>
                      <div className="font-medium">{current.strGlass || "—"}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Prep</div>
                      <div className="font-medium">—</div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Serves</div>
                      <div className="font-medium">1</div>
                      <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> Category</div>
                      <div className="font-medium">{current.strCategory || "—"}</div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button variant="outline" onClick={() => { if (current.strDrinkThumb) window.open(current.strDrinkThumb, "_blank"); else showToast("info", "No image"); }}><ExternalLink /> Open image</Button>
                      <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${RANDOM_ENDPOINT}`); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
                    </div>
                  </aside>

                  {/* Middle + Right: recipe and details */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    {/* Summary/Highlights */}
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-2">Instructions</div>
                        <div className="text-sm leading-relaxed mb-4">{current.strInstructions || "No instructions available."}</div>

                        <div className="text-sm font-semibold mb-2">Ingredients</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          {ingredients.length === 0 ? (
                            <div className="text-sm opacity-60">No ingredients available.</div>
                          ) : (
                            ingredients.map((it, idx) => (
                              <div key={idx} className="p-2 rounded-md border flex items-center justify-between">
                                <div>
                                  <div className="text-xs opacity-60">Ingredient</div>
                                  <div className="text-sm font-medium">{it.ingredient}</div>
                                </div>
                                <div className="text-sm opacity-60">{it.measure || "—"}</div>
                              </div>
                            ))
                          )}
                        </div>

                        <Separator className="my-3" />

                        <div className="text-sm font-semibold mb-2">Notes & Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {current.strTags ? current.strTags.split(",").map((t) => <div key={t} className="text-xs px-2 py-1 rounded-md border">{t}</div>) : <div className="text-xs opacity-60">No tags</div>}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" onClick={() => copyCocktailToClipboard()}><Copy /> Copy</Button>
                          <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download</Button>
                          <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide JSON" : "Show JSON"}</Button>
                          <Button variant="ghost" onClick={() => saveFavorite()}><Heart /> Favorite</Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Full fields (more professional: key summary + collapsible raw) */}
                    <div>
                      <div className="text-sm font-semibold mb-2">Key Fields</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-3 rounded-md border">
                          <div className="text-xs opacity-60">Drink ID</div>
                          <div className="text-sm font-medium">{current.idDrink || "—"}</div>
                        </div>
                        <div className="p-3 rounded-md border">
                          <div className="text-xs opacity-60">Alcoholic</div>
                          <div className="text-sm font-medium">{current.strAlcoholic || "—"}</div>
                        </div>
                        <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                          <div className="text-xs opacity-60">Creative Notes</div>
                          <div className="text-sm font-medium">{current.strCreativeCommonsConfirmed ?? "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 360 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

        </section>

        {/* Right sidebar */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples & quick tools</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(`${RANDOM_ENDPOINT}`); showToast("success", "Endpoint copied"); }}><Copy /> Copy Random Endpoint</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Favorites</div>
                <div className="text-xs opacity-60">Saved cocktails</div>
              </div>
              <div className="text-xs opacity-60">{favorites.length}</div>
            </div>

            <div className="mt-3 space-y-2 max-h-[36vh] overflow-auto no-scrollbar">
              {favorites.length === 0 ? (
                <div className="text-xs opacity-60">No favorites yet — Save recipes you like.</div>
              ) : (
                favorites.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-2 rounded-md border">
                    <img src={f.thumb} alt={f.title} className="w-10 h-10 object-cover rounded-md" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{f.title}</div>
                      <div className="text-xs opacity-60">ID: {f.id}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" onClick={() => chooseFavorite(f)}><ArrowRightCircle /></Button>
                      <Button variant="ghost" size="sm" onClick={() => removeFavorite(f.id)}><X /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">Made with ♥ using TheCocktailDB API · No API key required</div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{current?.strDrink || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current?.strDrinkThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.strDrinkThumb} alt={current?.strDrink} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from TheCocktailDB</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (current?.strDrinkThumb) window.open(current.strDrinkThumb, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

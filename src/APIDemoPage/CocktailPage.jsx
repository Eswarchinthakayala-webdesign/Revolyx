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
  ArrowRightCircle,
  Menu,
  ChevronDown,
  Info,
  FileText,
  Beaker,
  Grid,
  Repeat
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const RANDOM_ENDPOINT = "https://www.thecocktaildb.com/api/json/v1/1/random.php";
const SEARCH_ENDPOINT = "https://www.thecocktaildb.com/api/json/v1/1/search.php"; // ?s=<name>

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function parseIngredients(drink) {
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

  // State (simplified: removed favorites/localStorage)
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sidebar / mobile sheet states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [sidebarResults, setSidebarResults] = useState([]);
  const [loadingSidebarSearch, setLoadingSidebarSearch] = useState(false);
  const [randomList, setRandomList] = useState([]);
  const [loadingRandomList, setLoadingRandomList] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- Fetch helpers ---------- */
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

  async function fetchTenRandomCocktails() {
    setLoadingRandomList(true);
    try {
      // Fire 10 random requests in parallel
      const promises = Array.from({ length: 10 }).map(() => fetch(RANDOM_ENDPOINT).then((r) => r.json()).catch(() => null));
      const results = await Promise.all(promises);
      // each result is {drinks: [ ... ]}
      const drinks = results
        .map((r) => (r && r.drinks && r.drinks[0] ? r.drinks[0] : null))
        .filter(Boolean)
        // dedupe by idDrink if duplicate randoms show up
        .reduce((acc, d) => {
          if (!acc.some((ex) => ex.idDrink === d.idDrink)) acc.push(d);
          return acc;
        }, []);
      setRandomList(drinks);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load random list");
    } finally {
      setLoadingRandomList(false);
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

  async function sidebarSearch(q) {
    if (!q || q.trim().length === 0) {
      setSidebarResults([]);
      return;
    }
    setLoadingSidebarSearch(true);
    try {
      const params = new URLSearchParams();
      params.set("s", q);
      const url = `${SEARCH_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      setSidebarResults(json.drinks || []);
    } catch (err) {
      console.error(err);
      setSidebarResults([]);
    } finally {
      setLoadingSidebarSearch(false);
    }
  }

  /* ---------- UI handlers ---------- */
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

  function chooseFromList(drink) {
    setCurrent(drink);
    setRawResp({ drinks: [drink] });
    setSheetOpen(false);
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

  /* ---------- Effects ---------- */
  useEffect(() => {
    // load a primary random cocktail and the sidebar random list
    fetchRandomCocktail();
    fetchTenRandomCocktails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ingredients = useMemo(() => (current ? parseIngredients(current) : []), [current]);

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl overflow-hidden mx-auto")}>
      {/* Header */}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className={clsx("text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight flex items-center gap-3")}>
         
            <span>Cocktail Lab</span>
          </h1>
          <p className="mt-1 text-sm opacity-70">Recipes, ingredients and developer tools · Powered by TheCocktailDB</p>
        </div>

        <div className="flex items-center gap-2">
          {/* mobile sheet trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button className="h-10 w-10 p-0 rounded-md cursor-pointer" variant="ghost" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-3 overflow-y-auto no-scrollbar">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Grid /> Tools & Browse
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-4 mt-2">
                  <div className="p-2 rounded-md border">
                    <div className="text-xs opacity-60">Developer</div>
                    <div className="mt-2 flex flex-col gap-2">
                      <Button variant="outline" className="w-full cursor-pointer" onClick={() => { navigator.clipboard.writeText(`${RANDOM_ENDPOINT}`); showToast("success", "Endpoint copied"); }}>
                        <Copy className="mr-2" /> Copy Random Endpoint
                      </Button>
                      <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadJSON()}>
                        <Download className="mr-2" /> Download JSON
                      </Button>
                      <Button variant="outline" className="w-full cursor-pointer" onClick={() => setShowRaw((s) => !s)}>
                        <List className="mr-2" /> Toggle Raw
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold">Browse Random</div>
                        <div className="text-xs opacity-60">10 recent random picks</div>
                      </div>
                      <div>
                        <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => fetchTenRandomCocktails()}>
                          <Repeat />
                        </Button>
                      </div>
                    </div>

                    <div className="h-[40vh] overflow-y-auto">
                      <ScrollArea className="h-full rounded-md border p-2">
                        {loadingRandomList ? (
                          <div className="p-4 text-center text-xs opacity-60"><Loader2 className="animate-spin inline-block mr-2" /> Loading…</div>
                        ) : randomList.length === 0 ? (
                          <div className="text-xs opacity-60 p-2">No random items — try refreshing.</div>
                        ) : (
                          <div className="space-y-2">
                            {randomList.map((d) => (
                              <div key={d.idDrink} className="flex items-center gap-3 p-2 rounded-md border hover:shadow-sm transition cursor-pointer" onClick={() => chooseFromList(d)}>
                                <img src={d.strDrinkThumb} alt={d.strDrink} className="w-12 h-12 object-cover rounded-md" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{d.strDrink}</div>
                                  <div className="text-xs opacity-60">{d.strCategory} • {d.strAlcoholic}</div>
                                </div>
                                <div className="text-xs opacity-60">{d.idDrink}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Search</div>
                    <form onSubmit={(e) => { e.preventDefault(); sidebarSearch(sidebarQuery); }}>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search cocktails..."
                          value={sidebarQuery}
                          onChange={(e) => setSidebarQuery(e.target.value)}
                          className="flex-1"
                          aria-label="Sidebar search"
                        />
                        <Button type="button" variant="outline" className="cursor-pointer" onClick={() => sidebarSearch(sidebarQuery)} aria-label="Search sidebar"><Search /></Button>
                      </div>
                    </form>

                    <div className="mt-3 h-[30vh]">
                      <ScrollArea className="h-full rounded-md border p-2">
                        {loadingSidebarSearch ? (
                          <div className="p-4 text-center text-xs opacity-60"><Loader2 className="animate-spin inline-block mr-2" /> Searching…</div>
                        ) : sidebarResults.length === 0 ? (
                          <div className="text-xs opacity-60 p-2">No results — try a different term.</div>
                        ) : (
                          <div className="space-y-2">
                            {sidebarResults.map((s) => (
                              <div key={s.idDrink} className="flex items-center gap-3 p-2 rounded-md border hover:shadow-sm transition cursor-pointer" onClick={() => chooseFromList(s)}>
                                <img src={s.strDrinkThumb} alt={s.strDrink} className="w-10 h-10 object-cover rounded-md" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{s.strDrink}</div>
                                  <div className="text-xs opacity-60">{s.strCategory} • {s.strAlcoholic}</div>
                                </div>
                                <div className="text-xs opacity-60">{s.idDrink}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </div>

                <SheetFooter>
                  <div className="text-xs opacity-60">Made with ♥ using TheCocktailDB</div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* search & random (desktop) */}
          <form onSubmit={handleSearchSubmit} className={clsx("hidden md:flex items-center gap-2 w-[520px] rounded-lg px-3 py-2 transition", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search cocktails e.g. Margarita, Old Fashioned..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search cocktails"
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchRandomCocktail()}>
              <Loader2 className={loading ? "animate-spin mr-2" : "mr-2"} /> Random
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer" aria-label="Search"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions (desktop & mobile but positioned) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute left-4 right-4 md:left-[calc(50%_-_260px)] md:right-auto z-50 max-w-3xl rounded-xl overflow-hidden shadow-lg", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={s.idDrink || s.strDrink || idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onMouseDown={() => { setCurrent(s); setRawResp({ drinks: [s] }); setShowSuggest(false); }}
              >
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
          <Card className={clsx("rounded-2xl overflow-hidden border shadow-sm", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 md:p-5 flex items-center flex-wrap justify-between gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg md:text-xl flex items-center gap-1">
                  <Beaker className="w-5 h-5 text-zinc-400" />
                  <span>Recipe</span>
                </CardTitle>
                <div className="text-xs opacity-60">{current?.strDrink || "Waiting for a cocktail..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchRandomCocktail()}><Loader2 className={loading ? "animate-spin mr-2" : "mr-2"} />Random</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => copyCocktailToClipboard()}><Copy /> Copy</Button>
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
                    <div className="w-full rounded-md overflow-hidden mb-4 bg-zinc-100 dark:bg-zinc-900" style={{ aspectRatio: "4/3" }}>
                      {current?.strDrinkThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.strDrinkThumb} alt={current.strDrink} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs opacity-60">No image</div>
                      )}
                    </div>

                    <div className="text-2xl font-semibold mb-1 truncate">{current.strDrink}</div>
                    <div className="text-sm opacity-70 mb-3">{current.strCategory || "Cocktail"} • {current.strAlcoholic || "—"}</div>

                    <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                      <div className="flex items-center gap-2"><Glass className="w-4 h-4" /> <div className="font-medium">{current.strGlass || "—"}</div></div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> <div className="font-medium">—</div></div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4" /> <div className="font-medium">1</div></div>
                      <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> <div className="font-medium">{current.strCategory || "—"}</div></div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button variant="outline" className="cursor-pointer" onClick={() => { if (current?.strDrinkThumb) window.open(current.strDrinkThumb, "_blank"); else showToast("info", "No image"); }}>
                        <ExternalLink className="mr-2" /> Open image
                      </Button>
                      <Button variant="outline" className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(`${RANDOM_ENDPOINT}`); showToast("success", "Endpoint copied"); }}>
                        <Copy className="mr-2" /> Copy Endpoint
                      </Button>
                    </div>
                  </aside>

                  {/* Middle + Right: recipe and details */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText /> Instructions</div>
                        <div className="text-sm leading-relaxed mb-4">{current.strInstructions || "No instructions available."}</div>

                        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Tag /> Ingredients</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          {ingredients.length === 0 ? (
                            <div className="text-sm opacity-60">No ingredients available.</div>
                          ) : (
                            ingredients.map((it, idx) => (
                              <div key={idx} className="p-2 rounded-md border flex items-center justify-between hover:shadow-sm transition">
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

                        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Info /> Notes & Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {current.strTags ? current.strTags.split(",").map((t) => <div key={t} className="text-xs px-2 py-1 rounded-md border">{t}</div>) : <div className="text-xs opacity-60">No tags</div>}
                        </div>

                        <div className="mt-4 flex gap-2 flex-wrap">
                          <Button variant="outline" className="cursor-pointer" onClick={() => copyCocktailToClipboard()}><Copy /> Copy</Button>
                          <Button variant="outline" className="cursor-pointer" onClick={() => downloadJSON()}><Download /> Download</Button>
                          <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide JSON" : "Show JSON"}</Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

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

        {/* Right sidebar (desktop only) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit shadow-sm", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Grid className="w-4 h-4" /> Browse Random</div>
            <div className="text-xs opacity-60 mb-2">Ten random cocktails — click to load</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => fetchTenRandomCocktails()}><Repeat className="mr-2" /> Refresh Ten</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => fetchRandomCocktail()}><Loader2 className="mr-2" /> Random One</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download className="mr-2" /> Download JSON</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Random Recipes</div>
            <div className="text-xs opacity-60">Random Recipes across the database</div>
           

            <div className="mt-3 space-y-2 max-h-[36vh]">
              <ScrollArea className="h-[36vh] rounded-md border p-2">
                {loadingRandomList ? (
                  <div className="p-4 text-center text-xs opacity-60"><Loader2 className="animate-spin inline-block mr-2" /> Loading…</div>
                ) : randomList.length === 0 ? (
                  <div className="text-xs opacity-60 p-2">No random items — try refreshing.</div>
                ) : (
                  randomList.map((d) => (
                    <div key={d.idDrink} className="flex items-center gap-3 mb-1 p-2 rounded-md border hover:shadow-sm transition cursor-pointer" onClick={() => chooseFromList(d)}>
                      <img src={d.strDrinkThumb} alt={d.strDrink} className="w-10 h-10 object-cover rounded-md" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{d.strDrink}</div>
                        <div className="text-xs opacity-60">{d.strCategory} • {d.strAlcoholic}</div>
                      </div>
                      <div className="text-xs opacity-60">{d.idDrink}</div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">Made with ♥ using TheCocktailDB API · No API key required</div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => { if (current?.strDrinkThumb) window.open(current.strDrinkThumb, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

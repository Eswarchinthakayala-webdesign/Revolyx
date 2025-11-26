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
  Heart,
  MapPin,
  Globe,
  ImageIcon,
  List,
  CheckCircle,
  Menu,
  Loader,
  Info,
  BookOpen,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// sheet from shadcn/ui — adjust path if needed
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoints ---------- */
const SEARCH_BY_NAME = "https://restcountries.com/v3.1/name/";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* Safely pick deeply nested fields */
function safeGet(o, path, fallback = "—") {
  try {
    const parts = path.split(".");
    let cur = o;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    if (cur == null) return fallback;
    return cur;
  } catch {
    return fallback;
  }
}

export default function CountriesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* UI state */
  const [query, setQuery] = useState("india");
  const [suggestions, setSuggestions] = useState([]); // country suggestion list
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null); // country object (first selected)
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImageSrc, setDialogImageSrc] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const suggestTimer = useRef(null);
  const favLoadedRef = useRef(false);

  /* Persist favorites */
  useEffect(() => {
    async function loadDefault() {
      setQuery("India");
      setLoading(true);
      try {
        const res = await fetch("https://restcountries.com/v3.1/name/india");
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          setCurrent(json[0]);
          setRawResp(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    // load favorites from localStorage once
    if (!favLoadedRef.current && typeof window !== "undefined") {
      const raw = localStorage.getItem("revolyx-country-favs");
      if (raw) {
        try {
          setFavorites(JSON.parse(raw));
        } catch {}
      }
      favLoadedRef.current = true;
    }

    loadDefault();
  }, []);

  useEffect(() => {
    if (!favLoadedRef.current) return;
    try {
      localStorage.setItem("revolyx-country-favs", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  /* ---------- fetch helpers ---------- */
  async function fetchCountriesByName(name, fullText = false) {
    if (!name || name.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${SEARCH_BY_NAME}${encodeURIComponent(name)}${fullText ? "?fullText=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const json = await res.json();
      setSuggestions(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function lookupByCCA3(code) {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}`);
      if (!res.ok) {
        showToast("error", `Lookup failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const country = Array.isArray(json) ? json[0] : json;
      setCurrent(country);
      setRawResp(json);
      setShowSuggest(false);
      setSheetOpen(false);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load country");
    } finally {
      setLoading(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      fetchCountriesByName(v);
    }, 350);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Try: India, United States, France, Japan...");
      return;
    }
    setLoading(true);
    try {
      const url = `${SEARCH_BY_NAME}${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `No results (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setLoading(false);
      if (Array.isArray(json) && json.length > 0) {
        setCurrent(json[0]);
        setRawResp(json);
        setShowSuggest(false);
        showToast("success", `Loaded: ${safeGet(json[0], "name.common", "Country")}`);
      } else {
        showToast("info", "No countries found — try another keyword");
      }
    } catch (err) {
      setLoading(false);
      showToast("error", "Failed to search countries");
    }
  }

  /* Favorites */
  function saveFavorite() {
    if (!current) {
      showToast("info", "No country loaded to save");
      return;
    }
    const code = safeGet(current, "cca3", null);
    if (!code) return showToast("info", "Country has no unique code");
    setFavorites(prev => {
      if (prev.some(f => f.code === code)) {
        showToast("info", "Already saved");
        return prev;
      }
      const next = [{ code, name: safeGet(current, "name.common"), flag: safeGet(current, "flags.png") }, ...prev].slice(0, 50);
      showToast("success", `Saved ${safeGet(current, "name.common")}`);
      return next;
    });
  }

  function removeFavorite(code) {
    setFavorites(prev => prev.filter(f => f.code !== code));
    showToast("info", "Removed favorite");
  }

  function chooseFavorite(f) {
    lookupByCCA3(f.code);
  }

  /* Export / copy */
  async function copyToClipboardAnimated() {
    if (!current) return showToast("info", "No country to copy");
    try {
      await navigator.clipboard.writeText(prettyJSON(current));
      setCopied(true);
      showToast("success", "Country JSON copied");
      // reset after 1.6s
      setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  function downloadJSON() {
    if (!rawResp) {
      showToast("info", "No data to download");
      return;
    }
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    const name = safeGet(current, "name.common", "country").replace(/\s+/g, "_");
    a.href = URL.createObjectURL(blob);
    a.download = `country_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Derived fields */
  const languages = useMemo(() => {
    const langs = current?.languages || {};
    return Object.keys(langs).map(k => langs[k]);
  }, [current]);

  const currencies = useMemo(() => {
    const c = current?.currencies || {};
    return Object.keys(c).map(k => {
      const cur = c[k];
      return { code: k, name: cur?.name, symbol: cur?.symbol };
    });
  }, [current]);

  /* ---------- UI ---------- */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl pb-10 overflow-hidden mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className={clsx("text-2xl md:text-3xl font-extrabold flex items-center gap-3")}>
            <Globe className="w-6 h-6 opacity-80" />
            <span>World — Countries</span>
          </h1>
          <p className="mt-1 text-sm opacity-70 flex items-center gap-2">
            <Info className="w-4 h-4 opacity-60" />
            <span>Search countries, view flags, demographics and raw REST Countries data</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[520px] rounded-lg px-3 py-1.5 border", isDark ? "bg-black/60 border-zinc-800" : "bg-white shadow-sm border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search country — e.g. India, United States, France..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="ghost" className="px-2 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setCurrent(null); }}>
              Clear
            </Button>
            <Button type="submit" variant="default" className="px-3 cursor-pointer"><Search /></Button>

            {/* Mobile sheet trigger */}
            <div className="md:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="ml-2 cursor-pointer"><Menu /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-3">
                  <SheetHeader>
                    <SheetTitle>Quick Actions</SheetTitle>
                  </SheetHeader>

                  <ScrollArea className="h-[60vh]">
                    <div className="p-2 space-y-2">
                      <div className="text-xs opacity-60">Saved favorites</div>
                      <div className="space-y-2 mt-1">
                        {favorites.length === 0 ? (
                          <div className="text-sm opacity-60">No favorites yet</div>
                        ) : favorites.map(f => (
                          <div key={f.code} className="flex items-center gap-2 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                            <img src={f.flag} alt={f.name} className="w-8 h-5 object-cover rounded-sm" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{f.name}</div>
                              <div className="text-xs opacity-60">CCA3 {f.code}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => chooseFavorite(f)}><BookOpen/> </Button>
                              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => removeFavorite(f.code)}><Trash2/></Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-2" />

                      <div className="text-xs opacity-60">Utilities</div>
                      <div className="mt-2 space-y-2">
                        <Button className="w-full cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(SEARCH_BY_NAME); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
                        <Button className="w-full cursor-pointer" variant="outline" onClick={() => { downloadJSON(); }}><Download /> Download JSON</Button>
                        <Button className="w-full cursor-pointer" variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
                      </div>
                    </div>
                  </ScrollArea>

                  <SheetFooter>
                    <div className="w-full text-right">
                      <Button variant="ghost" className="cursor-pointer" onClick={() => setSheetOpen(false)}>Close</Button>
                    </div>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_260px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60 flex items-center gap-2"><Loader2 className="animate-spin" /> Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.cca3 || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrent(s); setRawResp([s]); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <img src={safeGet(s, "flags.png", "")} alt={safeGet(s, "name.common", "")} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{safeGet(s, "name.common")}</div>
                    <div className="text-xs opacity-60 truncate">{safeGet(s, "region", "—")} • {safeGet(s, "subregion", "—")}</div>
                  </div>
                  <div className="text-xs opacity-60">CCA3 {safeGet(s, "cca3", "—")}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Center: country viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 opacity-80" />
                  <span>Country</span>
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <span className="truncate">{current ? safeGet(current, "name.common") : "Search a country to start"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => { if (current?.flags?.png) { setDialogImageSrc(current.flags.png); setDialogOpen(true); } else showToast("info", "No flag image"); }}>
                  <ImageIcon /> View Flag
                </Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => saveFavorite()}><Heart /> Save</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No country loaded — try search or choose a saved one.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left column: flag + overview */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={safeGet(current, "flags.png")} alt={safeGet(current, "name.common")} className="w-full rounded-md object-cover mb-3" />
                    <div className="text-lg font-semibold flex items-center gap-2">
                      <span>{safeGet(current, "name.common")}</span>
                      <span className="text-xs opacity-60">({safeGet(current, "cca3")})</span>
                    </div>
                    <div className="text-xs opacity-60 mb-2">{safeGet(current, "region")} • {safeGet(current, "subregion")}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Info className="w-4 h-4" /> Official name</div>
                        <div className="font-medium">{safeGet(current, "name.official")}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Capital</div>
                        <div className="font-medium">{Array.isArray(current.capital) ? current.capital.join(", ") : safeGet(current, "capital", "—")}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Star className="w-4 h-4" /> Population</div>
                        <div className="font-medium">{current.population ? current.population.toLocaleString() : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Info className="w-4 h-4" /> Area</div>
                        <div className="font-medium">{current.area ? `${current.area.toLocaleString()} km²` : "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button className="cursor-pointer" variant="outline" onClick={() => { if (current.maps?.googleMaps) window.open(current.maps.googleMaps, "_blank"); else showToast("info", "No map link"); }}><ExternalLink /> Open in Maps</Button>

                      <div className="flex gap-2">
                        <Button className="flex-1 cursor-pointer" variant="ghost" onClick={() => copyToClipboardAnimated()}>
                          {/* animated copy button */}
                          <div className="flex items-center gap-2">
                            {!copied ? (
                              <>
                                <Copy />
                                <span>Copy</span>
                              </>
                            ) : (
                              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                                <CheckCircle />
                                <span>Copied</span>
                              </motion.div>
                            )}
                          </div>
                        </Button>

                        <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download</Button>
                      </div>
                    </div>
                  </div>

                  {/* center/right: details */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Region</div>
                        <div className="font-medium">{safeGet(current, "region")}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Subregion</div>
                        <div className="font-medium">{safeGet(current, "subregion")}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Star className="w-4 h-4" /> Currencies</div>
                        <div className="font-medium">
                          {currencies.length > 0
                            ? currencies.map(c => `${c.code} (${c.name || "—"}${c.symbol ? " — " + c.symbol : ""})`).join(", ")
                            : "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Globe className="w-4 h-4" /> Languages</div>
                        <div className="font-medium">{languages.length > 0 ? languages.join(", ") : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><ClockIconFallback /></div>
                        <div className="text-xs opacity-60">Timezones</div>
                        <div className="font-medium">{Array.isArray(current.timezones) ? current.timezones.join(", ") : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Info className="w-4 h-4" /> Top-level domain</div>
                        <div className="font-medium">{Array.isArray(current.tld) ? current.tld.join(", ") : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Borders</div>
                        <div className="font-medium">{Array.isArray(current.borders) ? current.borders.join(", ") : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><PhoneIconFallback /></div>
                        <div className="text-xs opacity-60">Calling codes</div>
                        <div className="font-medium">{current.idd?.root ? (current.idd.suffixes ? current.idd.suffixes.map(s => `${current.idd.root}${s}`).join(", ") : current.idd.root) : "—"}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Extra raw fields</div>
                      <div className="text-xs opacity-60">All available fields from the REST Countries response are accessible below.</div>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Coordinates (lat, lng)</div>
                        <div className="font-medium">{Array.isArray(current.latlng) ? current.latlng.join(", ") : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">CCA2 / CCA3</div>
                        <div className="font-medium">{`${safeGet(current, "cca2")} / ${safeGet(current, "cca3")}`}</div>
                      </div>

                      {current.coatOfArms?.png && (
                        <div className="mt-3">
                          <div className="text-xs opacity-60">Coat of arms</div>
                          <img src={current.coatOfArms.png} alt="Coat of arms" className="w-32 mt-2 bg-white rounded" />
                        </div>
                      )}
                    </div>
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

          {/* developer / debug panel could sit here */}
        </section>

        {/* Right: meta / favorites (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2"><Heart className="w-4 h-4" /> Favorites</div>
              <div className="text-xs opacity-60">Quick access to saved countries</div>
            </div>
            <Button variant="ghost" className="cursor-pointer" onClick={() => setFavorites([])}>Clear</Button>
          </div>

          <Separator />

          <ScrollArea className="max-h-[46vh]">
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <div className="text-sm opacity-60">No favorites yet — save a country to access quickly.</div>
              ) : favorites.map(f => (
                <div key={f.code} className="flex items-center gap-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                  <img src={f.flag} alt={f.name} className="w-10 h-6 object-cover rounded-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{f.name}</div>
                    <div className="text-xs opacity-60">CCA3 {f.code}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => chooseFavorite(f)}>Open</Button>
                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => removeFavorite(f.code)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Actions</div>
            <div className="text-xs opacity-60">Quick developer / utility actions</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(SEARCH_BY_NAME); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
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
            <DialogTitle>{current?.name?.common || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dialogImageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dialogImageSrc} alt="image" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image provided by REST Countries</div>
            <div className="flex gap-2">
              <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => { if (dialogImageSrc) window.open(dialogImageSrc, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --- Small local fallback icons for things not in lucide-react import above (time/phone) --- */
/* If you already have lucide icons for Clock / Phone, replace these with imports. */
function ClockIconFallback({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>
  );
}
function PhoneIconFallback({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.2.38 2.38.77 3.5a2 2 0 0 1-.45 2.11L8.7 11.7a16 16 0 0 0 6 6l1.36-1.36a2 2 0 0 1 2.11-.45c1.12.39 2.3.65 3.5.77A2 2 0 0 1 22 16.92z"></path></svg>
)}

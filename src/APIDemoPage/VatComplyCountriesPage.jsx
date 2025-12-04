// src/pages/VatComplyCountriesPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

import {
  Search,
  Globe,
  MapPin,
  ExternalLink,
  Copy,
  Download,
  FileText,
  Info,
  RefreshCcw,
  List,
  Users,
  Check,
  ChevronRight,
  Calendar as CalIcon,
  DollarSign,
  Menu,
  X,
  Pin,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = "https://api.vatcomply.com";
const API_COUNTRIES = `${API_BASE}/countries`;
const API_CURRENCIES = `${API_BASE}/currencies`;
const API_RATES = `${API_BASE}/rates`;

function prettyJSON(o) {
  try {
    return JSON.stringify(o, null, 2);
  } catch {
    return String(o);
  }
}

function glassyBadge(variant = "blue") {
  return clsx(
    "px-2 py-1 rounded-md text-xs font-medium shadow-sm",
    variant === "blue" && "backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300",
    variant === "green" && "backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    variant === "neutral" && "backdrop-blur-md bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300"
  );
}

export default function VatComplyCountriesPage() {
  // data
  const [countriesRaw, setCountriesRaw] = useState(null);
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ui state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // rates UI state
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState("");
  const [ratesResponse, setRatesResponse] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [rateDate, setRateDate] = useState(null);
  const [symbolsQuery, setSymbolsQuery] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [symbolsOpen, setSymbolsOpen] = useState(false);

  // helpers
  const suggestTimer = useRef(null);
  const inputRef = useRef(null);

  // ---------- fetch countries & currencies on mount ----------
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const [cRes, curRes] = await Promise.all([fetch(API_COUNTRIES), fetch(API_CURRENCIES)]);
        if (!cRes.ok) throw new Error(`Countries fetch failed (${cRes.status})`);
        if (!curRes.ok) throw new Error(`Currencies fetch failed (${curRes.status})`);
        const countriesJson = await cRes.json();
        const currenciesJson = await curRes.json();

        if (!mounted) return;

        setCountriesRaw(countriesJson);
        setCurrencies(currenciesJson || {});

        const normalized = normalizeVatComply(countriesJson);
        const enriched = normalized.map((c) => {
          const code = (c.currency || "").toUpperCase();
          const curInfo = (currenciesJson && currenciesJson[code]) ? currenciesJson[code] : null;
          return {
            ...c,
            currency_full: curInfo ? curInfo.name : null,
            currency_symbol: curInfo ? curInfo.symbol : null,
          };
        });

        setCountries(enriched);

        const defaultCountry = enriched.find((c) => c.code === "US") || enriched[0] || null;
        setSelected(defaultCountry);
        if (defaultCountry && defaultCountry.currency) setBaseCurrency(defaultCountry.currency);
      } catch (err) {
        console.error(err);
        setError(String(err?.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  // Normalizer
  function normalizeVatComply(raw) {
    if (!raw) return [];
    if (!Array.isArray(raw) && typeof raw === "object") {
      const arr = Object.keys(raw).map((k) => {
        const item = raw[k] || {};
        return {
          code: (item.iso3 || k || "").toUpperCase(),
          name: item.name || item.country || item.title || k,
          currency: (item.currency || item.currency_code || (item.currencies && item.currencies[0]) || "").toUpperCase() || null,
          vat: item.vat_rates || item.vat || item.vat_rate || null,
          region: item.region || item.region_name || null,
          latitude: item.latitude ?? item.lat ?? null,
          longitude: item.longitude ?? item.lon ?? item.lng ?? null,
          raw: item,
        };
      });
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (Array.isArray(raw)) {
      return raw.map((item) => ({
        code: (item.iso3 || item.country_code || item.alpha2 || "").toUpperCase(),
        name: item.name || item.country || item.title || "",
        currency: (item.currency || item.currency_code || (item.currencies && item.currencies[0]) || "").toUpperCase() || null,
        vat: item.vat_rates || item.vat || item.vat_rate || null,
        region: item.region || item.region_name || null,
        latitude: item.latitude ?? item.lat ?? null,
        longitude: item.longitude ?? item.lon ?? item.lng ?? null,
        raw: item,
      })).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }

  // ---------- search suggestions (debounced) ----------
  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = (query || "").trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setShowSuggestions(true);
      // match by name, code, currency or id-like input
      const list = countries.filter((c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q) ||
        (c.currency || "").toLowerCase().includes(q)
      ).slice(0, 12);
      setSuggestions(list);
    }, 200);
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, [query, countries]);

  function chooseCountry(c) {
    setSelected({
      ...c,
      currency_full: currencies[c.currency] ? currencies[c.currency].name : c.currency_full,
      currency_symbol: currencies[c.currency] ? currencies[c.currency].symbol : c.currency_symbol,
    });
    setShowSuggestions(false);
    setQuery("");
    if (c.currency) setBaseCurrency(c.currency);
  }

  // random picks
  const randomPicks = useMemo(() => {
    if (!countries || countries.length === 0) return [];
    const picks = new Set();
    while (picks.size < Math.min(10, countries.length)) picks.add(Math.floor(Math.random() * countries.length));
    return Array.from(picks).map((i) => countries[i]).filter(Boolean);
  }, [countries]);

  console.log(randomPicks)

  // copy JSON
  async function copyJSON() {
    const payload = selected?.raw || selected || countriesRaw || {};
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function downloadJSON() {
    const payload = selected?.raw || selected || countriesRaw || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const name = (selected?.code || "vatcomply_countries").replace(/\s+/g, "_");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openEndpoint() {
    window.open(API_COUNTRIES, "_blank");
  }

  function renderVatBadge(vat) {
    if (!vat) return <Badge className={glassyBadge("neutral")}>No VAT data</Badge>;

    const standard =
      (vat && (vat.standard ?? vat.standard_rate ?? vat.standard)) ??
      (typeof vat === "number" ? vat : null);

    const reduced = vat.reduced ?? vat?.reduced_rates ?? vat?.reduced;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {standard != null && <Badge className={glassyBadge("blue")}>Standard: {standard}%</Badge>}
        {Array.isArray(reduced) && reduced.map((r, idx) => (
          <Badge key={idx} className={glassyBadge("green")}>Reduced: {r}%</Badge>
        ))}
        {reduced && !Array.isArray(reduced) && typeof reduced === "object" && Object.entries(reduced).map(([k, v]) => (
          <Badge key={k} className={glassyBadge("green")}>{k}: {v}%</Badge>
        ))}
      </div>
    );
  }

  // Map iframe src
  const mapSrc = (selected && selected.latitude != null && selected.longitude != null)
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${selected.latitude},${selected.longitude}`)}&output=embed`
    : selected?.name
      ? `https://www.google.com/maps?q=${encodeURIComponent(selected.name)}&output=embed`
      : null;

  // ---------- RATES ----------
  const currencyList = useMemo(() => {
    return Object.keys(currencies || {}).sort().map((k) => ({ code: k, ...currencies[k] }));
  }, [currencies]);

  const availableSymbols = useMemo(() => {
    return currencyList.filter((c) => c.code !== (baseCurrency || "").toUpperCase());
  }, [currencyList, baseCurrency]);

  function toggleSymbol(code) {
    setSelectedSymbols((s) => {
      if (s.includes(code)) return s.filter((x) => x !== code);
      return [...s, code];
    });
  }

  async function fetchRates() {
    setRatesLoading(true);
    setRatesError("");
    setRatesResponse(null);
    try {
      const params = new URLSearchParams();
      if (baseCurrency) params.set("base", baseCurrency);
      if (selectedSymbols.length) params.set("symbols", selectedSymbols.join(","));
      if (rateDate) {
        const y = rateDate.getFullYear();
        const m = String(rateDate.getMonth() + 1).padStart(2, "0");
        const d = String(rateDate.getDate()).padStart(2, "0");
        params.set("date", `${y}-${m}-${d}`);
      }
      const url = `${API_RATES}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Rates fetch failed (${res.status})`);
      const json = await res.json();
      setRatesResponse(json);
    } catch (err) {
      console.error(err);
      setRatesError(String(err?.message || err));
    } finally {
      setRatesLoading(false);
    }
  }

  function renderRatesHuman(resp) {
    if (!resp) return null;
    const base = resp.base || baseCurrency;
    const date = resp.date || (rateDate ? rateDate.toISOString().slice(0, 10) : "latest");
    const rates = resp.rates || {};
    return (
      <div className="space-y-3">
        <div className="text-xs opacity-60">Base: <span className="font-medium">{base}</span> • Date: <span className="font-medium">{date}</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(rates).map(([k, v]) => (
            <div key={k} className="p-3 rounded-md border bg-white/50 dark:bg-zinc-900">
              <div className="text-xs opacity-60">{k}</div>
              <div className="text-lg font-semibold">{v}</div>
              <div className="text-xs opacity-60 mt-1">{currencies[k]?.name || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Small UX helpers
  function highlightClass(c) {
    return selected?.code === c?.code ? "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-zinc-900";
  }

  return (
    <div className="min-h-screen py-8 px-4 ">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-white/90 dark:bg-zinc-800 shadow-sm">
              <Globe className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                VATComply — Countries & Rates
                <Badge className={glassyBadge("neutral")}>Explorer</Badge>
              </h1>
              <p className="mt-1 text-sm opacity-70 max-w-2xl">Explore countries, currency names, VAT rates and exchange rates (VATComply public API).</p>
            </div>
          </div>

          {/* Search + actions */}
          <div className="w-full md:w-[640px] relative">
            <div className={clsx("flex items-center gap-2 p-3 rounded-xl shadow-sm",
              "bg-white border border-zinc-200 dark:bg-black/40 dark:border-zinc-800")}>
              <Search className="opacity-60" />
              <Input
                ref={inputRef}
                placeholder="Search by country name, code or currency (e.g. India, US, CNY)..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
                onFocus={() => { if ((query || "").trim().length > 0) setShowSuggestions(true); }}
                className="border-0 bg-transparent"
                aria-label="Search countries"
              />
              <Button variant="outline" onClick={() => { if (suggestions.length) chooseCountry(suggestions[0]); }} className="cursor-pointer"><Search /></Button>

              {/* mobile sheet trigger */}
              <div className="md:hidden ml-2">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="p-2 cursor-pointer"><Menu /></Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full max-w-xs">
                    <SheetHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Quick picks</h3>
                        <div className="flex items-center gap-2">

                          
                        </div>
                      </div>
                    </SheetHeader>
                    <div className="p-4">
                      <ScrollArea style={{ height: "65vh" }}>
                        <div className="space-y-2 p-2">
                          {randomPicks.map((c) => (
                            <div key={c.code}
                              className={clsx("p-3 rounded-lg flex items-center justify-between cursor-pointer transition", highlightClass(c))}
                              onClick={() => { chooseCountry(c); setSheetOpen(false); }}>
                              <div>
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs opacity-60">{c.region || "—"}</div>
                              </div>
                              <Badge className={glassyBadge("blue")}>{c?.raw?.iso3}</Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-2 max-w-[640px]">
                <div className="rounded-xl shadow-2xl overflow-hidden border bg-white dark:bg-zinc-900">
                  <ScrollArea className="overflow-y-auto" style={{ maxHeight: 300 }}>
                    {suggestions.map((s) => (
                      <div
                        key={s.code}
                        onClick={() => chooseCountry(s)}
                        className={clsx("px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer border-b")}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.name}</div>
                          <div className="text-xs opacity-60 truncate">{s.region || "—"} • {s.code} {s.currency ? `• ${s.currency}` : ""}</div>
                        </div>
                        <Badge className={glassyBadge("blue")}>{s?.raw?.iso3}</Badge>
                        <ChevronRight className="opacity-60 ml-2" />
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left picks (desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="rounded-2xl dark:bg-zinc-950 bg-white overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-zinc-500" /> Quick Picks</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xs opacity-60 mb-3">10 random countries — click to preview</div>
                <ScrollArea style={{ height: "60vh" }}>
                  <div className="space-y-2">
                    {randomPicks.map((c) => (
                      <motion.div  key={c.code}
                        onClick={() => chooseCountry(c)}
                        className={clsx("p-3 rounded-lg flex items-center justify-between cursor-pointer transition", highlightClass(c))}>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{c.name}</div>
                          <div className="text-xs opacity-60 truncate">{c.region || "—"}</div>
                        </div>
                        <Badge className={glassyBadge("blue")}>{c?.raw?.iso3}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <div className="flex items-center justify-between w-full text-xs opacity-60">
                  <div>Source: VATComply</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="cursor-pointer" onClick={() => { /* refresh picks */ }}>
                      <RefreshCcw />
                    </Button>
                    <Button variant="ghost" className="cursor-pointer" onClick={() => { /* shuffle quick picks */ }}>
                      Shuffle
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </aside>

          {/* Center: Details */}
          <section className="lg:col-span-6">
            <Card className="rounded-2xl dark:bg-zinc-950 bg-white overflow-hidden">
              <CardHeader className="px-4 flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selected?.name || "Country details"}</CardTitle>
                  <div className="text-xs opacity-60">{selected ? `${selected.region || "—"} • ${selected.code}` : "Select a country to inspect its VAT & metadata."}</div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><FileText /> {showRaw ? "Hide" : "Raw"}</Button>
                  <Button variant="outline" onClick={copyJSON} className="cursor-pointer">
                    {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy JSON"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="px-4">
                {loading ? (
                  <div className="py-12 text-center"><RefreshCcw className="animate-spin mx-auto" /></div>
                ) : !selected ? (
                  <div className="py-12 text-center text-sm opacity-60">No country selected — choose one from the picks or search above.</div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-4 rounded-xl border shadow-sm bg-white/50 dark:bg-zinc-900/30">
                     <div className="
  flex flex-col md:flex-row 
  md:items-center md:justify-between
  gap-6 p-4 rounded-xl
  bg-zinc-50/40 dark:bg-zinc-900/40
  border border-zinc-200 dark:border-zinc-800
  backdrop-blur-md
  transition-all
">

  {/* Left Section */}
  <div className="flex-1 min-w-0">
    <div className="flex flex-wrap items-center gap-3">

      {/* Title */}
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Pin className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        <span className="truncate">{selected.name}</span>
      </h2>

      {/* ISO Badge */}
      <Badge className={glassyBadge("neutral")}>
        {selected?.raw?.iso3}
      </Badge>

      {/* Currency Badges */}
      {selected.currency && (
        <Badge className={glassyBadge("blue")}>
          {selected.currency}
        </Badge>
      )}

      {selected.currency_full && (
        <span className="text-sm opacity-70 truncate">
          {selected.currency_full}
        </span>
      )}
    </div>

    {/* Region */}
    <div className="text-sm opacity-70 mt-2">
      Region: <span className="font-medium">{selected.region || "—"}</span>
    </div>
  </div>

  {/* Right Section */}
  <div className="
    md:text-right text-left 
    flex-shrink-0
  ">
    <div className="text-xs opacity-60">Sub Region</div>

    <div className="text-2xl font-bold  ">
      {selected?.raw?.subregion}
    </div>

    <div className="text-xs opacity-60 mt-1">
      Currency: {selected.currency || "—"}
    </div>
  </div>
</div>

<div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">

  {/* MAP CARD */}
  <div className="
    p-4 rounded-xl 
    border border-zinc-200 dark:border-zinc-800 
    bg-white/50 dark:bg-zinc-900/50 
    backdrop-blur-md 
    shadow-sm
  ">
    <div className="text-xs opacity-70 flex items-center gap-2 font-medium mb-2">
      <Info className="w-4 h-4" /> Map
    </div>

    <div className="aspect-[4/3] w-full rounded-lg overflow-hidden border dark:border-zinc-800">
      <iframe
        title="country-map"
        src={mapSrc}
        className="w-full h-full"
        style={{ border: 0 }}
      />
    </div>
  </div>

  {/* GEOGRAPHY CARD */}
  <div className="
    p-4 rounded-xl 
    border border-zinc-200 dark:border-zinc-800 
    bg-white/50 dark:bg-zinc-900/50 
    backdrop-blur-md 
    shadow-sm
  ">
    <div className="text-xs opacity-70 flex items-center gap-2 font-medium mb-2">
      <Globe className="w-4 h-4" /> Geography
    </div>

    <div className="space-y-4 text-sm">

      {/* Lat / Lon */}
      <div>
        <div className="text-xs opacity-60">Latitude</div>
        <div className="font-medium mt-1 truncate">
          {selected.latitude ?? "—"}
        </div>
      </div>
         <div>
        <div className="text-xs opacity-60"> Longitude</div>
        <div className="font-medium mt-1 truncate">
          {selected.longitude ?? "—"}
        </div>
      </div>

      {/* View Map Button */}
      <div>
        <div className="text-xs opacity-60 mb-1">Map</div>
        <Button
          variant="outline"
          onClick={() => setMapOpen(true)}
          className="cursor-pointer flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" /> View map
        </Button>
      </div>

    </div>
  </div>

</div>

                    </div>

                    {/* More fields */}
                    <div className="p-4 rounded-xl border bg-white/50 dark:bg-black">
                      <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Tag /> More fields</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs opacity-60">ISO / Code</div>
                          <div className="font-medium">{selected.code || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Currency</div>
                          <div className="font-medium">{selected.currency || "—"} {selected.currency_symbol ? `• ${selected.currency_symbol}` : ""}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Region</div>
                          <div className="font-medium">{selected.region || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">Raw object</div>
                          <div className="font-medium">{selected.raw ? Object.keys(selected.raw).length : "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* raw JSON */}
                    {showRaw && (
                      <div>
                        <pre className="text-xs p-3 rounded-md border bg-white/50 dark:bg-zinc-900 overflow-auto" style={{ maxHeight: 280 }}>
                          {prettyJSON(selected.raw || selected)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              </Card>
        
<Card className="
  rounded-2xl mt-3
  overflow-hidden 
  border border-zinc-200 dark:border-zinc-800 
  bg-white/40 dark:bg-zinc-900/30 
  backdrop-blur-xl shadow-lg
">
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
      <DollarSign className="w-5 h-5 opacity-70" /> Exchange Rates
    </CardTitle>
  </CardHeader>

  <CardContent className="space-y-6">

    {/* Base Currency */}
    <div className="space-y-1">
      <div className="text-xs opacity-60">Base currency</div>
      <Select value={baseCurrency} onValueChange={(v) => setBaseCurrency(v)}>
        <SelectTrigger className="w-full cursor-pointer rounded-lg glass-input">
          <SelectValue placeholder="Select base" />
        </SelectTrigger>
        <SelectContent>
          {currencyList.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <div className="flex items-center justify-between gap-3">
                <span>{c.code} — {c.name}</span>
                <span className={glassyBadge("blue")}>{c.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Date */}
    <div className="space-y-1">
      <div className="text-xs opacity-60">Date (optional)</div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start rounded-lg glass-input cursor-pointer"
          >
            <CalIcon className="w-4 h-4 mr-2 opacity-70" />
            {rateDate ? rateDate.toISOString().slice(0, 10) : "Latest"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto rounded-xl shadow-xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl">
          <Calendar
            mode="single"
            selected={rateDate}
            onSelect={(d) => setRateDate(d || null)}
          />
          <div className="p-2 flex justify-end">
            <Button className='cursor-pointer' variant="outline" size="sm" onClick={() => setRateDate(null)}>
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>

    {/* Symbols Multi-Select */}
    <div className="space-y-1">
      <div className="text-xs opacity-60">Symbols (optional)</div>
      <Popover open={symbolsOpen} onOpenChange={setSymbolsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between rounded-lg glass-input cursor-pointer"
          >
            <span className="text-left">
              {selectedSymbols.length ? `${selectedSymbols.length} selected` : "Select symbols"}
            </span>
            <span className="text-xs opacity-60">{selectedSymbols.join(", ")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="
          w-[330px] p-3 rounded-xl 
          bg-white/60 dark:bg-zinc-900/60 
          backdrop-blur-xl shadow-xl
        ">
          <Input
            placeholder="Filter currencies..."
            className="mb-3 rounded-lg glass-input"
            value={symbolsQuery}
            onChange={(e) => setSymbolsQuery(e.target.value)}
          />

          <ScrollArea className="max-h-[240px] overflow-y-auto pr-2">
            <div className="space-y-2">
              {availableSymbols
                .filter((c) => {
                  const q = symbolsQuery.toLowerCase();
                  return (
                    !q ||
                    c.code.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q)
                  );
                })
                .map((c) => (
                  <div
                    key={c.code}
                    className="
                      flex items-center justify-between p-2 rounded-lg 
                      hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition
                    "
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        className="cursor-pointer"
                        checked={selectedSymbols.includes(c.code)}
                        onCheckedChange={() => toggleSymbol(c.code)}
                      />
                      <div>
                        <div className="font-medium">{c.code}</div>
                        <div className="text-xs opacity-60">{c.name}</div>
                      </div>
                    </div>

                    <div className="text-xs opacity-60">
                      {c.symbol}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-3">
            <Button className='cursor-pointer' variant="ghost" onClick={() => setSelectedSymbols([])}>
              Clear
            </Button>
            <Button className="ml-auto cursor-pointer" onClick={() => setSymbolsOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      <Button
        onClick={fetchRates}
        disabled={ratesLoading}
        className=" cursor-pointer rounded-lg"
      >
        {ratesLoading ? "Loading..." : "Fetch Rates"}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setRatesResponse(null);
          setSelectedSymbols([]);
          setRateDate(null);
        }}
        className="rounded-lg cursor-pointer"
      >
        Reset
      </Button>
    </div>

    {/* Response */}
    {ratesError && (
      <div className="text-sm text-red-500">
        {ratesError}
      </div>
    )}

    {ratesResponse && (
      <div className="mt-3 space-y-2">

        {/* Human readable parsed response */}
        <div className="text-sm">
          {renderRatesHuman(ratesResponse)}
        </div>

        {/* Raw JSON */}
        <details className="rounded-lg">
          <summary className="cursor-pointer text-xs opacity-60">Raw response</summary>
          <pre className="
            text-xs mt-2 p-3 rounded-xl border 
            bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md overflow-auto
            max-h-[260px]
          ">
            {prettyJSON(ratesResponse)}
          </pre>
        </details>

      </div>
    )}

  </CardContent>
</Card>

            
          </section>

          {/* Right: actions + rates */}
          <aside className="lg:col-span-3">
            <div className="space-y-4">
                
              <Card className="rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info /> Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button variant="outline" className="w-full cursor-pointer" onClick={copyJSON}><Copy /> Copy JSON</Button>
                  <Button variant="outline" className="w-full cursor-pointer" onClick={downloadJSON}><Download /> Download JSON</Button>
                  <Button variant="ghost" className="w-full cursor-pointer" onClick={() => openEndpoint()}><ExternalLink /> Open API</Button>
                </CardContent>
              </Card>


              <Card className="rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info /> About</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm opacity-70">
                    <div>Endpoints used: <span className="font-medium">{API_COUNTRIES} • {API_CURRENCIES} • {API_RATES}</span></div>
                    <div className="mt-2">This explorer maps country currency codes to names & symbols, displays VAT info, and fetches exchange rates.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </main>
      </div>

      {/* Map Dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-6xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selected ? `Map — ${selected.name}` : "Map"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", width: "100%" }}>
            {mapSrc ? (
              <iframe title="country-map" src={mapSrc} style={{ border: 0, width: "100%", height: "100%" }} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">No location available</div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between p-4 border-t">
            <div className="text-xs opacity-60">Map provided by Google Maps (embedded)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapOpen(false)} className="cursor-pointer">Close</Button>
              {selected?.latitude != null && selected?.longitude != null && (
                <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.latitude},${selected.longitude}`)}`, "_blank")} className="cursor-pointer"><ExternalLink /></Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

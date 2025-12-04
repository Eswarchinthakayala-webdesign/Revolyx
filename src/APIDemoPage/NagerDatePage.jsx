// src/pages/NagerDatePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

import {
  Menu,
  Search,
  Globe,
  CalendarDays,
  Download,
  ExternalLink,
  Copy,
  RefreshCw,
  Flag,
  Info,
  CalendarRange,
  ListChecks,
  MapPin,
  X,
  Check,
  FileText,
  ChevronRight,
  Users
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function NagerDatePage() {
  const API_BASE = "/nager";
  const DEFAULT_YEAR = new Date().getFullYear();

  // UI / data state
  const [countries, setCountries] = useState([]);
  const [countryQuery, setCountryQuery] = useState("");
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [year, setYear] = useState(DEFAULT_YEAR);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [randomList, setRandomList] = useState([]);

  // Cache for REST Countries responses (avoid repeat fetches)
  const countryDetailsCache = useRef(new Map());

  // --------------------------------------
  // Fetch available countries once
  // --------------------------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/AvailableCountries`);
        const json = await response.json();
        if (!mounted) return;
        setCountries(json || []);

        // default to US or first
        const def = (json || []).find((c) => c.countryCode === "US") || (json || [])[0] || null;
        setSelectedCountry(def);

        if (def) loadHolidays({ country: def, year: DEFAULT_YEAR });

        // create an initial random list (10)
        if (json && json.length) {
          const ids = new Set();
          while (ids.size < Math.min(10, json.length)) {
            ids.add(Math.floor(Math.random() * json.length));
          }
          setRandomList(Array.from(ids).map((i) => json[i]).filter(Boolean));
        }
      } catch (err) {
        console.error("Failed to load countries", err);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------
  // Search suggestions for country input
  // match name or countryCode (id)
  // --------------------------------------
  useEffect(() => {
    const q = (countryQuery || "").trim().toLowerCase();
    if (!q) {
      setCountrySuggestions([]);
      return;
    }
    const filter = (countries || [])
      .filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.countryCode || "").toLowerCase().includes(q) ||
          (c.countryCode || "").toLowerCase().startsWith(q) ||
          (c.name || "").toLowerCase().startsWith(q)
      )
      .slice(0, 12);
    setCountrySuggestions(filter);
  }, [countryQuery, countries]);

  // --------------------------------------
  // Load holidays for country + year
  // --------------------------------------
  const loadHolidays = async ({ country, year: y }) => {
    if (!country?.countryCode) return;
    setLoading(true);
    setHolidays([]);
    setShowRaw(false);
    try {
      const url = `${API_BASE}/PublicHolidays/${y}/${country.countryCode}`;
      const response = await fetch(url);
      const json = await response.json();
      // json expected to be array of holidays
      setHolidays(json || []);
    } catch (err) {
      console.error("Failed to load holidays", err);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------
  // REST Countries: fetch authoritative region/capital/latlng/languages
  // caches results in countryDetailsCache
  // --------------------------------------
  async function fetchAndMergeCountryDetails(alpha2) {
    if (!alpha2) return null;
    const code = alpha2.toLowerCase();
    if (countryDetailsCache.current.has(code)) {
      return countryDetailsCache.current.get(code);
    }

    try {
      // REST Countries v3.1 endpoint for alpha (accepts alpha-2)
      const url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(alpha2)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`REST Countries fetch failed (${res.status})`);
      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const info = arr[0];

      // extract region, capital, latlng, languages (safe)
      const region = info.region || null;
      const capital = Array.isArray(info.capital) && info.capital.length ? info.capital[0] : (info.capital || null);
      const latlng = Array.isArray(info.latlng) && info.latlng.length === 2 ? info.latlng : null;
      const languages = info.languages ? Object.values(info.languages).map((v) => String(v)) : [];

      const details = { region, capitalCity: capital, latlng, languages };
      countryDetailsCache.current.set(code, details);
      return details;
    } catch (err) {
      console.error("Failed to fetch REST Countries data for", alpha2, err);
      return null;
    }
  }

  // --------------------------------------
  // When selectedCountry changes, enrich it with REST Countries data (if missing)
  // --------------------------------------
  useEffect(() => {
    let mounted = true;
    async function enrich() {
      if (!selectedCountry?.countryCode) return;
      const alpha2 = selectedCountry.countryCode;
      // only fetch if region or capitalCity are missing (or languages/latlng)
      const needsRegion = !selectedCountry.region;
      const needsCapital = !selectedCountry.capitalCity;
      const needsLang = !selectedCountry.languages;
      const needsLatlng = !selectedCountry.latlng;

      if (!needsRegion && !needsCapital && !needsLang && !needsLatlng) return;

      const details = await fetchAndMergeCountryDetails(alpha2);
      if (!details || !mounted) return;

      // merge (but preserve existing values when available)
      setSelectedCountry((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          region: prev.region || details.region || prev.region,
          capitalCity: prev.capitalCity || details.capitalCity || prev.capitalCity,
          latlng: prev.latlng || details.latlng || prev.latlng,
          languages: prev.languages || (details.languages && details.languages.length ? details.languages.map((n) => ({ name: n })) : prev.languages),
        };
      });
    }

    enrich();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry?.countryCode]);

  // --------------------------------------
  // utility: copy text -> animated feedback
  // --------------------------------------
  const copyToClipboardAnimated = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  // --------------------------------------
  // suggestion select
  // --------------------------------------
  function chooseSuggestion(c) {
    setSelectedCountry(c);
    setCountryQuery("");
    setShowCountrySuggestions(false);
    loadHolidays({ country: c, year });
    // close mobile sheet if open
    setMobileSheetOpen(false);
  }

  // --------------------------------------
  // helper: when user selects from random sidebar
  // --------------------------------------
  function chooseRandom(c) {
    setSelectedCountry(c);
    loadHolidays({ country: c, year });
  }

  // --------------------------------------
  // UI derived values
  // --------------------------------------
  const holidayCount = holidays.length;
  const nextHoliday = useMemo(() => {
    if (!holidays || holidays.length === 0) return null;
    const future = holidays.filter((h) => new Date(h.date) >= new Date());
    return future.length ? future[0] : holidays[0];
  }, [holidays]);

  const endpointUrl = `${API_BASE}/PublicHolidays/${year}/${selectedCountry?.countryCode || ""}`;

  // --------------------------------------
  // small helpers: make badge variant colors (glassy look)
  // --------------------------------------
  const badgeClass = (variant = "blue") =>
    clsx(
      "px-2 py-1 rounded-md text-xs font-medium shadow-sm",
      variant === "blue" && "bg-gradient-to-br from-zinc-600/20 to-zinc-400/10 text-zinc-600 border border-zinc-600/10",
      variant === "green" && "bg-gradient-to-br from-emerald-600/20 to-emerald-400/10 text-emerald-600 border border-emerald-600/10",
      variant === "neutral" && "bg-gradient-to-br from-zinc-200/30 to-white/30 text-zinc-900 border border-zinc-200/10"
    );

  // --------------------------------------
  // render
  // --------------------------------------
  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-8xl mx-auto">

        {/* HEADER */}
        <header className="flex items-center flex-wrap justify-between gap-4 mb-8">
          <div className="flex  items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                <CalendarDays className="w-6 h-6 text-zinc-500" />
                Nager.Date — Global Holidays
              </h1>
              <p className="text-sm opacity-70 mt-1">Worldwide public holidays</p>
            </div>
          </div>

          {/* Search + mobile menu */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white/70 dark:bg-white/5 border border-slate-200/10 rounded-xl px-3 py-2 shadow-sm">
              <Search className="opacity-60" />
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Search by name or code (e.g. US, IND)..."
                  value={countryQuery}
                  onChange={(e) => { setCountryQuery(e.target.value); setShowCountrySuggestions(true); }}
                  onFocus={() => setShowCountrySuggestions(true)}
                />
              </div>
              <div>
                <Input value={year} type="number" onChange={(e) => setYear(Number(e.target.value || DEFAULT_YEAR))} className="mt-1" />
              </div>
              <Button onClick={() => { if (selectedCountry) loadHolidays({ country: selectedCountry, year }); }} className="cursor-pointer">
                <Search className="w-4 h-4 mr-2" /> Run
              </Button>
            </div>

            {/* Mobile sheet trigger */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden p-2 rounded-md cursor-pointer">
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-full max-w-xs">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ListChecks /> Countries
                  </SheetTitle>
                </SheetHeader>

                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium">Quick Picks</div>
                    <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => {
                      // refresh random list for mobile
                      if (countries.length) {
                        const ids = new Set();
                        while (ids.size < Math.min(10, countries.length)) ids.add(Math.floor(Math.random() * countries.length));
                        setRandomList(Array.from(ids).map((i) => countries[i]).filter(Boolean));
                      }
                    }}>
                      <RefreshCw />
                    </Button>
                  </div>

                  <ScrollArea style={{ height: "65vh" }}>
                    <div className="space-y-2">
                      {randomList.map((c) => (
                        <div
                          key={c.countryCode}
                          onClick={() => { chooseRandom(c); setMobileSheetOpen(false); }}
                          className={clsx(
                            "p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer",
                            selectedCountry?.countryCode === c.countryCode ? "bg-zinc-50 border dark:bg-zinc-900 dark:border-zinc-800 border-zinc-200" : "hover:bg-slate-50 dark:hover:bg-zinc-900"
                          )}
                        >
                          <div className="flex gap-1 items-center">
                            <Flag className="w-4 h-4" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{c.name}</div>
                              <div className="text-xs opacity-60">{c.countryCode}</div>
                            </div>
                          </div>
                          <Badge className={badgeClass("green")}>{c.countryCode}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Suggestion overlay for desktop (appears below header input) */}
        {showCountrySuggestions && countrySuggestions.length > 0 && (
          <div ref={suggestionRef} className="absolute left-4 right-4 md:left-[calc(50%_-_420px)] md:right-auto z-50 mt-2 max-w-[840px]">
            <div className="rounded-xl shadow-2xl overflow-hidden border dark:bg-black bg-white">
              <ScrollArea className="overflow-y-auto" style={{ maxHeight: 300 }}>
                {countrySuggestions.map((c) => (
                  <div
                    key={c.countryCode}
                    onClick={() => chooseSuggestion(c)}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer border-b"
                  >
                    <div className="flex items-center w-full gap-2 justify-between">
                      <div className="flex gap-1 items-center">
                        <Flag className="w-4 h-4 opacity-80" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{c.name}</div>
                          <div className="text-xs opacity-60">{c.region || "—"} • {c.countryCode}</div>
                        </div>
                      </div>
                      <Badge className={badgeClass("blue")}>{c.countryCode}</Badge>
                    </div>
                    <ChevronRight className="ml-auto opacity-60" />
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

          {/* LEFT SIDEBAR (desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="p-0 h-full dark:bg-zinc-950 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-zinc-500" /> Countries
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Random Picks</div>
                    <div className="text-xs opacity-60">10 quick selects</div>
                  </div>
                  <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => {
                    if (countries.length) {
                      const ids = new Set();
                      while (ids.size < Math.min(10, countries.length)) ids.add(Math.floor(Math.random() * countries.length));
                      setRandomList(Array.from(ids).map((i) => countries[i]).filter(Boolean));
                    }
                  }}><RefreshCw /></Button>
                </div>

                <Separator />

                <ScrollArea style={{ height: "60vh" }}>
                  <div className="p-2 space-y-2">
                    {randomList.map((c) => (
                      <div
                        key={c.countryCode}
                        onClick={() => chooseRandom(c)}
                        className={clsx(
                          "p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-shadow",
                          selectedCountry?.countryCode === c.countryCode
                            ? "bg-zinc-50 border dark:bg-black dark:border-zinc-800 border-zinc-200 shadow-sm"
                            : "hover:bg-slate-50 dark:hover:bg-zinc-900"
                        )}
                      >
                        <div className="flex gap-1 items-center">
                          <Flag className="w-4 h-4 opacity-80" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{c.name}</div>
                            <div className="text-xs opacity-60">{c.region}</div>
                          </div>
                        </div>
                        <Badge className={badgeClass("blue")}>{c.countryCode}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />
                <div className="p-3">
                  <div className="text-sm font-semibold">About</div>
                  <div className="text-xs opacity-70 mt-1">Nager.Date public holidays · Free · No API key required. Select a country to view yearly holidays.</div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* CENTER — Holiday preview */}
          <section className="lg:col-span-6 space-y-4">
            <Card className="bg-white dark:bg-black">
              <CardContent>
                {/* Body: preview / list */}
                {loading ? (
                  <div className="py-16 text-center opacity-60">Loading holidays…</div>
                ) : !selectedCountry ? (
                  <div className="py-12 text-center text-sm opacity-60">Select a country to view holidays.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                              <Users className="w-5 h-5 text-zinc-500" />
                              {selectedCountry.name}
                            </h2>
                            <Badge className={badgeClass("neutral")}>{selectedCountry.countryCode}</Badge>
                            <Badge className={badgeClass("green")}>{selectedCountry.region || "—"}</Badge>
                          </div>
                          <div className="text-sm opacity-70 mt-1">Capital: <span className="font-medium">{selectedCountry.capitalCity || "—"}</span></div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs opacity-60">Holidays (count)</div>
                          <div className="text-2xl font-bold">{holidayCount}</div>
                          <div className="text-xs opacity-60 mt-1">{year}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-md border bg-white/50 dark:bg-zinc-900">
                          <div className="text-xs opacity-60 flex items-center gap-2"><CalendarRange /> Next holiday</div>
                          <div className="mt-2 font-medium">{nextHoliday ? nextHoliday.name : "—"}</div>
                          <div className="text-xs opacity-60">{nextHoliday ? nextHoliday.date : "—"}</div>
                        </div>

                        <div className="p-3 rounded-md border bg-white/50 dark:bg-zinc-900">
                          <div className="text-xs opacity-60 flex items-center gap-2"><Info /> API endpoint</div>
                          <div className="mt-2 text-sm break-all">{endpointUrl}</div>
                          <div className="mt-3 flex gap-2">
                            <Button asChild className="cursor-pointer">
                              <a href={endpointUrl} target="_blank" rel="noreferrer">
                                <ExternalLink /> Raw
                              </a>
                            </Button>

                            <Button variant="outline" onClick={() => setMapDialogOpen(true)} className="ml-auto cursor-pointer">
                              <MapPin /> View map
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* holidays list */}
                    <div className="rounded-xl border p-0 overflow-hidden">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold flex items-center gap-2"><CalendarDays /> Holidays — {year}</div>
                          <div className="text-xs opacity-60">{holidayCount} items</div>
                        </div>
                      </div>

                      <ScrollArea className="overflow-y-auto" style={{ maxHeight: "46vh" }}>
                        <div className="divide-y">
                          {holidays.map((h, idx) => (
                            <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <CalendarRange className="w-5 h-5 text-zinc-500" />
                                  <div>
                                    <div className="font-medium">{h.name}</div>
                                    <div className="text-xs opacity-60">{h.date} • {h.localName ? `Local: ${h.localName}` : ""}</div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-xs mr-1">Types</div>
                                  <Badge className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">{h.types?.join(", ")}</Badge>
                                  {h.launchYear && <div className="text-xs opacity-60 mt-1">Launched: {h.launchYear}</div>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* raw response */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">
                        <FileText /> {showRaw ? "Hide raw" : "Show raw"}
                      </Button>
                      {showRaw && (
                        <div className="w-full mt-2">
                          <pre className="text-xs p-3 rounded-md border bg-white/50 dark:bg-black/90 overflow-auto" style={{ maxHeight: 220 }}>
                            {JSON.stringify(holidays || [], null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <div className="w-full flex justify-between text-xs opacity-60">
                  <div>Data source: Nager.Date API</div>
                  <div>Built for responsive layouts</div>
                </div>
              </CardFooter>
            </Card>
          </section>

          {/* RIGHT — Quick actions & details */}
          <aside className="lg:col-span-3">
            <div className=" space-y-4">
              <Card className="dark:bg-black/90 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info /> Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button variant="outline" className="w-full cursor-pointer" onClick={() => copyToClipboardAnimated(endpointUrl)}>
                    <Copy /> Copy Endpoint
                  </Button>

                  <Button  variant="outline" className="w-full cursor-pointer" onClick={() => {
                    const code = `fetch("${endpointUrl}").then(r => r.json()).then(console.log)`;
                    copyToClipboardAnimated(code);
                  }}>
                    <CalendarDays /> Copy sample fetch
                  </Button>

                  <Button  variant="outline" className="w-full cursor-pointer" onClick={() => {
                    const json = JSON.stringify(holidays, null, 2);
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `holidays_${selectedCountry?.countryCode}_${year}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download /> Export JSON
                  </Button>

                  <Button  variant="outline" className="w-full">
                    <a href={`${API_BASE}/PublicHolidays/${year}/${selectedCountry?.countryCode}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                      <ExternalLink /> Open Raw
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="dark:bg-black/90 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin /> Country details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs opacity-60">ISO</div>
                  <div className="font-medium">{selectedCountry?.countryCode ?? "—"}</div>

                  <div className="text-xs opacity-60 mt-3">Region</div>
                  <div className="font-medium">{selectedCountry?.region ?? "—"}</div>

                  <div className="text-xs opacity-60 mt-3">Capital</div>
                  <div className="font-medium">{selectedCountry?.capitalCity ?? "—"}</div>

                  <div className="text-xs opacity-60 mt-3">Languages</div>
                  <div className="font-medium">{selectedCountry?.languages?.map?.(l => l.name || l).join(", ") || "—"}</div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </main>
      </div>

      {/* Map dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedCountry ? `Map — ${selectedCountry.name}` : "Map"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", width: "100%" }}>
            {selectedCountry ? (
              // If latlng available, use it in google maps query to be more precise; otherwise fallback to country name
              <iframe
                title={`map-${selectedCountry.countryCode}`}
                src={selectedCountry.latlng && selectedCountry.latlng.length === 2
                  ? `https://www.google.com/maps?q=${selectedCountry.latlng[0]},${selectedCountry.latlng[1]}&z=6&output=embed`
                  : `https://www.google.com/maps?q=${encodeURIComponent(selectedCountry.name)}&output=embed`}
                style={{ border: 0, width: "100%", height: "100%" }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">Select a country to view its map</div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between p-4 border-t">
            <div className="text-xs opacity-60">Map provided by Google Maps (embedded)</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => {
                if (selectedCountry) {
                  if (selectedCountry.latlng && selectedCountry.latlng.length === 2) {
                    window.open(`https://www.google.com/maps/@${selectedCountry.latlng[0]},${selectedCountry.latlng[1]},6z`, "_blank");
                  } else {
                    window.open(`https://www.google.com/maps/search/${encodeURIComponent(selectedCountry.name)}`, "_blank");
                  }
                }
              }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

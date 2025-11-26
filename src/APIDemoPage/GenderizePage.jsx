// src/pages/GenderizePage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  User,
  Check,
  Menu,
  Copy as CopyIcon,
  Download,
  List,
  Loader2,
  Zap,
  Info,
  X,
  ExternalLink,
  ChevronDown,
  Clipboard,
  CheckCircle,
  Globe,
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

// shadcn sheet (mobile sidebar)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* Endpoint */
const BASE_ENDPOINT = "https://api.genderize.io/"; // e.g. ?name=emma

/* Small suggestion list for snappy UX */
const COMMON_NAMES = [
  "Emma","Liam","Olivia","Noah","Ava","William","Isabella","James","Sophia","Oliver",
  "Mia","Benjamin","Charlotte","Elijah","Amelia","Lucas","Harper","Mason","Evelyn","Logan"
];

/* Helpers */
function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

/* Choose icon by gender (React-friendly SVG props) */
function GenderIcon({ gender, className }) {
  if (gender === "male")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#000" className={className} viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M9.5 2a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V2.707L9.871 6.836a5 5 0 1 1-.707-.707L13.293 2zM6 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/>
      </svg>
    );
  if (gender === "female")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#000" className={className} viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 5a5 5 0 1 1 5.5 4.975V12h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0V13h-2a.5.5 0 0 1 0-1h2V9.975A5 5 0 0 1 3 5"/>
      </svg>
    );
  return <User className={className} />;
}

/* Map probability (0..1) to label and color class */
function probabilityLabel(p) {
  if (p == null) return { label: "Unknown", tone: "text-zinc-500" };
  const v = Number(p);
  if (v >= 0.9) return { label: `${Math.round(v*100)}% (Very confident)`, tone: "text-green-600" };
  if (v >= 0.75) return { label: `${Math.round(v*100)}% (Confident)`, tone: "text-emerald-600" };
  if (v >= 0.5) return { label: `${Math.round(v*100)}% (Moderate)`, tone: "text-yellow-600" };
  return { label: `${Math.round(v*100)}% (Low)`, tone: "text-red-500" };
}

export default function GenderizePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState("Emma"); // default
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [copied, setCopied] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const suggestTimer = useRef(null);
  const copyTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchGender(query); // load default on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  async function fetchGender(name) {
    if (!name || String(name).trim().length === 0) {
      showToast("info", "Enter a name to predict gender.");
      return;
    }
    setLoading(true);
    try {
      const url = `${BASE_ENDPOINT}?name=${encodeURIComponent(name)}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `API request failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setResp(json);
      setShowRaw(false);
      showToast("success", `Loaded prediction for "${json.name || name}"`);
    } catch (err) {
      console.error(err);
      showToast("error", "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      if (!v || v.trim() === "") {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      setLoadingSuggest(true);
      const lower = v.toLowerCase();
      const matches = COMMON_NAMES.filter(n => n.toLowerCase().includes(lower)).slice(0, 8);
      setSuggestions(matches);
      setLoadingSuggest(false);
    }, 180);
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    await fetchGender(query);
    setShowSuggest(false);
  }

  function chooseSuggestion(name) {
    setQuery(name);
    setShowSuggest(false);
    fetchGender(name);
    inputRef.current?.focus();
  }

  function downloadJSON() {
    if (!resp) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(resp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gender_${(resp.name || query).replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function copyEndpoint() {
    const url = `${BASE_ENDPOINT}?name=${encodeURIComponent(query || "")}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      showToast("success", "Endpoint copied");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast("error", "Copy failed");
    });
  }

  // computed UI pieces
  const displayName = (resp?.name || query || "").toString();
  const avatarLetter = displayName ? displayName.trim().charAt(0).toUpperCase() : "?";
  const prob = resp?.probability ?? null;
  const probMeta = probabilityLabel(prob);

  return (
    <div className={clsx("min-h-screen overflow-hidden p-4 pb-10 sm:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-4">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Zap /> Tools
                </SheetTitle>
              </SheetHeader>

              <div className="mt-2 space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-1">Endpoint & actions</div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full cursor-pointer" onClick={() => copyEndpoint()}><CopyIcon /> Copy Endpoint</Button>
                    <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                    <Button variant="outline" className="w-full cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-semibold mb-1">Examples</div>
                  <ScrollArea className="max-h-52 overflow-auto rounded-md border p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {COMMON_NAMES.map(n => (
                        <button key={n} onClick={() => chooseSuggestion(n)} className="text-left p-2 cursor-pointer rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40">
                          <div className="font-medium">{n}</div>
                          <div className="text-xs opacity-60">Try</div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                <div className="text-xs opacity-60">
                  genderize.io has no auth for basic use. For production or large volumes check their limits & terms.
                  <div className="mt-2">
                    <a href="https://genderize.io" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-2"><ExternalLink className="w-4 h-4" /> genderize.io</a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Predict — Name Gender</h1>
            <p className="text-sm opacity-70">Fast, lightweight gender predictions using Genderize.io</p>
          </div>
        </div>

        {/* Desktop search */}
        <div className="flex w-full sm:w-auto items-center flex-wrap gap-3">
          <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full sm:w-[520px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-70" />
            <Input
              ref={inputRef}
              placeholder="Enter first name (e.g. Emma)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="secondary" className="px-3 cursor-pointer">
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Search
            </Button>
          </form>
        </div>

      
      </header>

      {/* Suggestions - absolute under input for mobile/desktop */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_260px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s + idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-8 flex items-center justify-center rounded-sm bg-zinc-100 dark:bg-zinc-900">
                    <User />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s}</div>
                    <div className="text-xs opacity-60">Common</div>
                  </div>
                  <div className="text-xs opacity-60">—</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: main viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-start gap-4">
                <div>
                  <CardTitle className="text-lg">Prediction</CardTitle>
                  <div className="text-xs opacity-60">{resp?.name ? `Result for "${resp.name}"` : "Enter a name to predict gender"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => fetchGender(query)}><Loader2 className={loading ? "animate-spin" : ""} /> Refresh</Button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (resp) { setShowRaw(s => !s); }
                  }}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1 border cursor-pointer bg-transparent"
                  aria-pressed={showRaw}
                >
                  <List /> {showRaw ? "Hide Raw" : "Raw"}
                </motion.button>

             

                <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Download JSON</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !resp ? (
                <div className="py-12 text-center text-sm opacity-60">No result yet — try search above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: big gender card — strong avatar */}
                  <div className={clsx("p-5 rounded-2xl border flex flex-col items-center text-center", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <motion.div
                      initial={{ scale: 0.98 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 18 }}
                      className={clsx("w-32 h-32 rounded-full flex items-center justify-center mb-4 shadow-xl")}
                      style={{ background: resp.gender === "male" ? "linear-gradient(135deg,#dbeafe,#bfdbfe)" : resp.gender === "female" ? "linear-gradient(135deg,#ffe4e6,#ffcccb)" : "linear-gradient(135deg,#eef2ff,#e9d5ff)" }}
                    >
                      {/* first-letter avatar */}
                      <div className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 select-none">{avatarLetter}</div>
                    </motion.div>

                    <div className="text-2xl font-semibold">{displayName}</div>
                    <div className="text-sm opacity-60">{resp.gender ? resp.gender.toUpperCase() : "Unknown"}</div>

                    <div className="mt-4 text-center">
                      <div className="text-xs opacity-60 mb-1">Probability</div>
                      <div className={clsx("font-medium", probMeta.tone)}>{probMeta.label}</div>
                    </div>

                    <div className="mt-4 text-sm opacity-70 text-center">
                      <div>Count (samples): <span className="font-medium">{resp.count ?? "—"}</span></div>
                    </div>
                  </div>

                  {/* Middle + Right: details */}
                  <div className={clsx("p-4 rounded-2xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5" />
                        <div>
                          <div className="text-sm font-semibold">Details</div>
                          <div className="text-xs opacity-60">What the prediction means</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /> Raw</Button>
                        <Button variant="ghost" className="cursor-pointer" onClick={() => downloadJSON()}><Download /></Button>
                      </div>
                    </div>

                    <div className="text-sm leading-relaxed mb-4">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 mt-[2px]" />
                        <div>
                          This prediction is a probabilistic association derived from Genderize.io's dataset. Interpret results as statistical likelihoods — not authoritative identity.
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border flex items-start gap-3 cursor-default">
                        <Globe className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-60">Name</div>
                          <div className="text-sm font-medium">{resp.name || "—"}</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-md border flex items-start gap-3 cursor-default">
                        <User className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-60">Gender</div>
                          <div className="text-sm font-medium">{resp.gender || "—"}</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-md border flex items-start gap-3 cursor-default">
                        <Clipboard className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-60">Probability</div>
                          <div className="text-sm font-medium">{resp.probability != null ? resp.probability : "—"}</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-md border flex items-start gap-3 cursor-default">
                        <List className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-60">Count</div>
                          <div className="text-sm font-medium">{resp.count ?? "—"}</div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Interpretation</div>
                    <div className="text-sm mb-3">
                      <ul className="list-disc ml-4 space-y-2">
                        <li>High probability means the name is commonly associated with the predicted gender in Genderize's dataset.</li>
                        <li>Low probability or null gender means the name is ambiguous or rare in the dataset.</li>
                        <li>Counts indicate the number of samples behind the association — higher counts usually increase reliability.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && resp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(resp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: developer tools (desktop only) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit hidden lg:block", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <Separator />
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & utilities</div>
            <div className="mt-2 space-y-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => copyEndpoint()}><CopyIcon /> Copy Endpoint</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Examples</div>
            <div className="text-xs opacity-60 mb-2">Quick sample names to try</div>
            <ScrollArea className="max-h-44 overflow-auto rounded-md border p-2">
              <div className="grid grid-cols-1 gap-2">
                {COMMON_NAMES.map((n) => (
                  <button key={n} onClick={() => chooseSuggestion(n)} className="text-left p-2 cursor-pointer rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40">
                    <div className="font-medium">{n}</div>
                    <div className="text-xs opacity-60">{/* placeholder */}</div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Notes</div>
            <div className="text-xs opacity-60">
              genderize.io has no auth for basic use. For production or large volumes, check their limits & terms.
            </div>
            <div className="mt-2 text-xs">
              <a href="https://genderize.io" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-2"><ExternalLink className="w-4 h-4" /> genderize.io</a>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

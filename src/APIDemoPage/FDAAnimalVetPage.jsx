// src/pages/FDAAnimalVetPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  FileText,
  BarChart2,
  Calendar,
  X,
  Info,
  AlertTriangle,
  MousePointer,
  ChevronRight,
  ChevronDown,
  Layers
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

/* ---------- Constants ---------- */
const BASE_ENDPOINT = "https://api.fda.gov/animalandveterinary/event.json";

/* ---------- Utilities ---------- */
// Pretty-print JSON safely
const prettyJSON = (obj) => JSON.stringify(obj, null, 2);

// convert YYYYMMDD or YYYYMM to readable string
function parseFDA_Date(d) {
  if (!d) return null;
  const s = String(d);
  if (/^\d{8}$/.test(s)) {
    // YYYYMMDD
    const yyyy = s.slice(0, 4);
    const mm = s.slice(4, 6);
    const dd = s.slice(6, 8);
    const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if (!isNaN(dt)) return dt.toLocaleDateString();
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{6}$/.test(s)) {
    const yyyy = s.slice(0, 4);
    const mm = s.slice(4, 6);
    return `${yyyy}-${mm}`;
  }
  return s;
}

// friendly fallback for any data
function safeText(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  return "—";
}

/* ---------- Safe renderers for Option A (grouped cards) ---------- */

function ReactionList({ reactions }) {
  if (!reactions || reactions.length === 0) return <div className="text-sm opacity-60">No reactions listed</div>;
  return (
    <div className="space-y-2">
      {reactions.map((r, i) => (
        <div key={i} className="p-3 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{r.veddra_term_name || r.term || "Unknown reaction"}</div>
              <div className="text-xs opacity-60 mt-1">Code: {r.veddra_term_code || "—"} · Version: {r.veddra_version || "—"}</div>
            </div>
            <div className="text-sm opacity-70 text-right">
              <div>{r.number_of_animals_affected ? `${r.number_of_animals_affected} affected` : ""}</div>
              <div className="text-xs opacity-60">{r.accuracy || ""}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveIngredient({ ai }) {
  return (
    <div className="p-2 rounded-md border bg-zinc-50 dark:bg-black/20">
      <div className="text-sm font-medium">{ai.name || "Ingredient"}</div>
      {ai.dose && (
        <div className="text-xs opacity-70 mt-1">
          {ai.dose.numerator && `${ai.dose.numerator}${ai.dose.numerator_unit ? ` ${ai.dose.numerator_unit}` : ""}`}
          {ai.dose.denominator ? ` / ${ai.dose.denominator}${ai.dose.denominator_unit ? ` ${ai.dose.denominator_unit}` : ""}` : ""}
        </div>
      )}
    </div>
  );
}

function DrugCard({ drug, index }) {
  if (!drug) return null;
  return (
    <div className="p-3 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{drug.brand_name || drug.dosage_form || `Drug ${index + 1}`}</div>
          <div className="text-xs opacity-60 mt-1">{drug.route ? `Route: ${drug.route}` : ""} {drug.administered_by ? ` · Administered by: ${drug.administered_by}` : ""}</div>
          {drug.off_label_use && <div className="text-xs opacity-70 mt-1">Off-label: {Array.isArray(drug.off_label_use) ? drug.off_label_use.join(", ") : drug.off_label_use}</div>}
          {drug.used_according_to_label && <div className="text-xs opacity-60 mt-1">Used according to label: {String(drug.used_according_to_label)}</div>}
        </div>

        <div className="text-xs opacity-60 text-right">
          <div>{drug.first_exposure_date ? parseFDA_Date(drug.first_exposure_date) : ""}</div>
          <div>{drug.last_exposure_date ? parseFDA_Date(drug.last_exposure_date) : ""}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-60">Manufacturer</div>
          <div className="text-sm">{drug.manufacturer?.name || "—"}</div>
          {drug.manufacturer?.registration_number && <div className="text-xs opacity-70">Reg: {drug.manufacturer.registration_number}</div>}
        </div>

        <div>
          <div className="text-xs opacity-60">Dose</div>
          <div className="text-sm">
            {drug.dose ? `${drug.dose.numerator || ""}${drug.dose.numerator_unit ? ` ${drug.dose.numerator_unit}` : ""}` : "—"}
          </div>
        </div>
      </div>

      {drug.active_ingredients && drug.active_ingredients.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="text-xs opacity-60 mb-2">Active ingredients</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {drug.active_ingredients.map((ai, j) => (
              <ActiveIngredient ai={ai} key={j} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AnimalCard({ animal }) {
  if (!animal) return <div className="text-sm opacity-60">No animal data</div>;
  return (
    <div className="p-3 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
      <div className="text-sm font-semibold">{animal.species || "Animal"}</div>
      <div className="text-xs opacity-60 mt-1">{animal.breed?.breed_component ? animal.breed.breed_component : ""}</div>

      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-60">Gender</div>
          <div className="text-sm">{animal.gender || "—"}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Reproductive</div>
          <div className="text-sm">{animal.reproductive_status || animal.female_animal_physiological_status || "—"}</div>
        </div>

        <div>
          <div className="text-xs opacity-60">Age</div>
          <div className="text-sm">{animal.age ? `${animal.age.min || ""} ${animal.age.unit || ""}` : "—"}</div>
        </div>

        <div>
          <div className="text-xs opacity-60">Weight</div>
          <div className="text-sm">{animal.weight ? `${animal.weight.min || ""} ${animal.weight.unit || ""}` : "—"}</div>
        </div>
      </div>
    </div>
  );
}

function ReceiverCard({ receiver }) {
  if (!receiver) return null;
  return (
    <div className="p-3 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
      <div className="text-sm font-semibold">{receiver.organization || "Receiver"}</div>
      <div className="text-xs opacity-60 mt-1">{receiver.city ? `${receiver.city}, ${receiver.state || ""}` : ""}</div>
      {receiver.street_address && <div className="text-xs mt-2">{receiver.street_address}</div>}
      <div className="text-xs opacity-60 mt-2">{receiver.country || ""} {receiver.postal_code ? `· ${receiver.postal_code}` : ""}</div>
    </div>
  );
}

function OutcomeList({ outcome }) {
  if (!outcome || outcome.length === 0) return <div className="text-sm opacity-60">No outcome information</div>;
  return (
    <div className="space-y-2">
      {outcome.map((o, i) => (
        <div key={i} className="p-2 rounded-md border bg-zinc-50 dark:bg-black/20">
          <div className="text-sm font-medium">{o.medical_status || "Outcome"}</div>
          {o.number_of_animals_affected && <div className="text-xs opacity-70 mt-1">{o.number_of_animals_affected} affected</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Chart tooltip ---------- */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0].value;
  return (
    <div className="p-2 rounded border bg-white dark:bg-black/90 border-zinc-200 dark:border-zinc-700 text-sm shadow">
      <div className="font-medium">{label}</div>
      <div className="text-xs opacity-70">{v} event{v !== 1 ? "s" : ""}</div>
    </div>
  );
};

/* ---------- Build timeseries from results ---------- */
function buildSeries(results) {
  if (!results || results.length === 0) return [];
  const counts = {};
  results.forEach((r) => {
    const d = r.original_receive_date || r.onset_date || r.original_date || null;
    const label = d ? (String(d).length >= 6 ? String(d).slice(0, 6) : String(d)) : "unknown";
    counts[label] = (counts[label] || 0) + 1;
  });
  return Object.keys(counts)
    .sort()
    .map((k) => ({ label: parseFDA_Date(k), value: counts[k] }));
}

/* ---------- Main Component ---------- */
export default function FDAAnimalVetPage() {
  const themeHook = useTheme?.() ?? { theme: "system" };
  const isDark =
    themeHook.theme === "dark" ||
    (themeHook.theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("primary_reporter:Veterinarian");
  const [events, setEvents] = useState([]);
  const [rawResponse, setRawResponse] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents(query, { limit: 5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEvents(q = "primary_reporter:Veterinarian", opts = { limit: 5 }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      params.set("limit", String(opts.limit || 5));
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        toast?.error?.(`API error: ${res.status} ${txt}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setRawResponse(json);
      const arr = json.results || [];
      setEvents(arr);
      setSelected(arr && arr.length > 0 ? arr[0] : null);
      toast?.success?.(`Loaded ${arr.length} event${arr.length !== 1 ? "s" : ""}`);
    } catch (err) {
      console.error(err);
      toast?.error?.("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  // suggestions (preview items)
  async function getSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setShowSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("search", q);
      params.set("limit", "6");
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const json = await res.json();
      setSuggestions(json.results || []);
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => getSuggestions(v), 350);
  }

  function onSelectSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    setRawResponse({ results: [item] });
  }

  function copyEvent() {
    if (!selected) return toast?.info?.("No event selected");
    navigator.clipboard.writeText(prettyJSON(selected));
    toast?.success?.("JSON copied");
  }
  function downloadJSON() {
    const payload = rawResponse || selected;
    if (!payload) return toast?.info?.("No data to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fda_animal_events_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast?.success?.("Downloaded");
  }

  // chart data
  const chartData = useMemo(() => buildSeries(events), [events]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-zinc-50 text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">FDA Animal & Veterinary — Events Explorer</h1>
          <p className="mt-1 text-sm opacity-70 max-w-xl">
            Explore adverse event reports. UI shows grouped cards for reactions, drugs, animal info, and outcomes. Use
            Lucene-style queries: e.g. <code className="bg-zinc-100 dark:bg-zinc-900 px-1 rounded">primary_reporter:Veterinarian</code>.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchEvents(query, { limit: 20 });
            setShowSuggest(false);
          }}
          className="w-full md:w-[560px]"
        >
          <div className={clsx("flex items-center gap-2 rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder='Search (e.g. "species:Dog" or "primary_reporter:Veterinarian")'
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => { setQuery("primary_reporter:Veterinarian"); fetchEvents("primary_reporter:Veterinarian", { limit: 20 }); }}>Default</Button>
            <Button type="submit" variant="outline"><Search /></Button>
          </div>

          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={clsx("mt-2 rounded-xl absolute right-6 shadow-lg  max-h-72 overflow-auto", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {suggestions.map((s, i) => {
                  const label = s.report_id || s.unique_aer_id_number || `event-${i}`;
                  return (
                    <li
                      key={label + i}
                      className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 cursor-pointer"
                      onClick={() => onSelectSuggestion(s)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{s.animal?.species ? `${s.animal.species} — ${s.report_id || s.unique_aer_id_number}` : (s.report_id || label)}</div>
                          <div className="text-xs opacity-60 mt-1">{parseFDA_Date(s.original_receive_date || s.onset_date)}</div>
                        </div>
                        <div className="text-xs opacity-60">{s.primary_reporter || "—"}</div>
                      </div>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">


        {/* Center: full detail */}
        <section className="lg:col-span-9">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between border-b", isDark ? "border-zinc-800" : "border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Selected Event</CardTitle>
                <div className="text-xs opacity-60">{selected ? (selected.unique_aer_id_number || selected.report_id || "Event selected") : "No event selected. Select a suggestion or search."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchEvents(query, { limit: 20 })} className="flex items-center gap-2">
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><List /> Raw</Button>
              </div>
            </CardHeader>

            <CardContent>
              {!selected ? (
                <div className="py-12 text-center opacity-60">No event loaded</div>
              ) : (
                <div className="space-y-4">
                  {/* Top summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs opacity-70">Report</div>
                      <div className="font-semibold">{selected.report_id || selected.unique_aer_id_number || "—"}</div>
                      <div className="text-xs opacity-60 mt-2">{parseFDA_Date(selected.original_receive_date)}</div>
                      <div className="text-xs opacity-70 mt-3">Primary reporter</div>
                      <div className="font-medium">{selected.primary_reporter || "—"}</div>
                      <div className="text-xs opacity-70 mt-2">Type</div>
                      <div className="font-medium">{selected.type_of_information || "—"}</div>
                    </div>

                    <div className="p-4 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs opacity-70">Animal</div>
                      <div className="font-semibold">{selected.animal?.species || "—"}</div>
                      <div className="text-xs opacity-60 mt-1">{selected.animal?.breed?.breed_component || ""}</div>

                      <div className="mt-3">
                        <div className="text-xs opacity-70">Affected</div>
                        <div className="font-medium">{selected.number_of_animals_affected || "—"}</div>
                      </div>

                      <div className="mt-2">
                        <div className="text-xs opacity-70">Serious AE</div>
                        <div className="font-medium">{String(selected.serious_ae || "false")}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs opacity-70">Health assessment</div>
                      <div className="font-semibold">{selected.health_assessment_prior_to_exposure?.condition || "—"}</div>
                      <div className="text-xs opacity-70 mt-2">Assessed by</div>
                      <div className="font-medium">{selected.health_assessment_prior_to_exposure?.assessed_by || "—"}</div>
                      <div className="mt-3">
                        <div className="text-xs opacity-70">Onset</div>
                        <div className="font-medium">{parseFDA_Date(selected.onset_date)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Narrative */}
                  <div className="p-4 rounded-lg border bg-white/80 dark:bg-black/30 border-zinc-200 dark:border-zinc-700">
                    <div className="text-sm font-semibold mb-2">Narrative / Description</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{selected.description || selected.reaction?.map?.(r => r.veddra_term_name).join?.(", ") || "No narrative available."}</div>
                  </div>

                  {/* Grouped cards: reactions, drugs, animal, receiver, outcome */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Reactions</div>
                        <div className="text-xs opacity-60">{selected.reaction?.length || 0}</div>
                      </div>
                      <ReactionList reactions={selected.reaction} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Outcome</div>
                        <div className="text-xs opacity-60">{selected.outcome?.length || 0}</div>
                      </div>
                      <OutcomeList outcome={selected.outcome} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Drugs</div>
                        <div className="text-xs opacity-60">{selected.drug?.length || 0}</div>
                      </div>
                      <div className="space-y-2">
                        {selected.drug?.map((d, i) => <DrugCard drug={d} key={i} index={i} />)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-2">Animal</div>
                      <AnimalCard animal={selected.animal} />

                      <Separator className="my-3" />

                      <div className="text-sm font-semibold mb-2">Receiver</div>
                      <ReceiverCard receiver={selected.receiver} />
                    </div>
                  </div>

                  {/* Quick metadata row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs opacity-60">Unique AER ID: <span className="font-medium">{selected.unique_aer_id_number || "—"}</span></div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { window.open(`${BASE_ENDPOINT}?search=${encodeURIComponent(query)}&limit=20`, "_blank"); }}><ExternalLink /> Open endpoint</Button>
                      <Button variant="ghost" onClick={copyEvent}><Copy /> Copy</Button>
                      <Button variant="outline" onClick={downloadJSON}><Download /> Download</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions + chart */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl p-4 border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Tools</div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}?search=${encodeURIComponent(query)}&limit=20`); toast?.success?.("Endpoint copied"); }}>
                <FileText /> Copy Endpoint
              </Button>

              <Button variant="ghost" onClick={() => setDialogOpen(true)}><List /> View raw response</Button>

              <Button variant="outline" onClick={downloadJSON}><Download /> Download JSON</Button>

              <Button variant="ghost" onClick={() => { setSelected(events && events.length ? events[0] : null); toast?.success?.("Selected first event"); }}><Info /> Select first</Button>
            </div>
          </Card>

          <Card className={clsx("rounded-2xl p-4 border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Events Over Time</div>
              <div className="text-xs opacity-60"><Calendar /></div>
            </div>

            <div style={{ height: 220 }}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 6 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopOpacity={0.4} />
                        <stop offset="100%" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#222" : "#f0f0f0"} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="value" strokeWidth={2} stroke={isDark ? "#6ee7b7" : "#0ea5a4"} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-8 text-center text-sm opacity-60">No timeseries</div>
              )}
            </div>
          </Card>
        </aside>
      </main>

      {/* Raw dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Raw API Response</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto", padding: 16 }}>
            <pre className={clsx("text-xs whitespace-pre-wrap", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {prettyJSON(rawResponse || selected || {})}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Data from <code className="bg-zinc-100 dark:bg-zinc-900 px-1 rounded">animalandveterinary/event.json</code></div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={downloadJSON}><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

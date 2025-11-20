// FDAShortagesPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import debounce from "just-debounce-it"; // small debounce helper, or create your own
import {
  Search,
  Phone,
  ExternalLink,
  FileText,
  Copy,
  Download,
  Loader2,
  List,
  Database,
  Calendar,
  Box,
  Archive,
  AlertTriangle,
  ShieldCheck,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner"; // optional toast lib used in NewsApiPage earlier

/* ---------- Config ---------- */
const API_ENDPOINT = "https://api.fda.gov/drug/shortages.json";
const DEFAULT_LIMIT = 10;

/* ---------- Helpers ---------- */
const prettyJson = (o) => JSON.stringify(o, null, 2);

function safeDate(s) {
  if (!s) return "—";
  // source sometimes uses MM/DD/YYYY
  try {
    // Try parse as MM/DD/YYYY first
    const parts = s.split("/");
    if (parts.length === 3) {
      const [m, d, y] = parts;
      const dt = new Date(`${y}-${m}-${d}`);
      if (!Number.isNaN(dt.getTime())) return dt.toLocaleDateString();
    }
    const dt = new Date(s);
    if (!Number.isNaN(dt.getTime())) return dt.toLocaleDateString();
  } catch {}
  return s;
}

/* ---------- Component ---------- */
export default function FDAShortagesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]); // last fetch results
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [meta, setMeta] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);

  // fetch function - can search by generic_name, company_name, dosage_form, therapeutic_category etc.
  async function fetchShortages({ q = "", limit = DEFAULT_LIMIT } = {}) {
    // cancel previous
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // build `search` param if q provided; use generic_name and manufacturer_name fields for search
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (q && q.trim().length > 0) {
        // use Lucene-style search used by openFDA
        // search multiple fields to be helpful
        const escaped = q.replace(/"/g, '\\"');
        const search = `generic_name:"${escaped}"+OR+company_name:"${escaped}"+OR+therapeutic_category:"${escaped}"`;
        params.set("search", search);
      }

      const url = `${API_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url, { signal: controllerRef.current.signal });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API error ${res.status} — ${txt}`);
      }
      const json = await res.json();

      setMeta(json.meta ?? null);

      // API returns `results` array
      const arr = Array.isArray(json.results) ? json.results : [];
      setItems(arr);
      // choose default first if nothing selected
      if (arr.length > 0) {
        setSelected(arr[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("fetchShortages:", err);
      setError(err.message || "Failed to fetch");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Initial load - default (no query)
  useEffect(() => {
    fetchShortages({ q: "", limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced search
  // using just-debounce-it; if not available you can create a debounce wrapper inline
  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        fetchShortages({ q: val, limit: 25 });
      }, 350),
    []
  );

  useEffect(() => {
    // search only when user typed something, otherwise fetch defaults already run
    if (query && query.trim().length > 0) {
      debouncedSearch(query.trim());
    } else {
      // If cleared, fetch default small set again
      fetchShortages({ q: "", limit: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function onSelectItem(item) {
    setSelected(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function actionCopyJSON() {
    if (!selected) return;
    navigator.clipboard.writeText(prettyJson(selected));
    toast?.success?.("Copied item JSON");
  }

  function actionDownloadJSON() {
    if (!selected) return;
    const blob = new Blob([prettyJson(selected)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = (selected.generic_name || "fda_shortage").replace(/\s+/g, "_");
    a.download = `fda_shortage_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast?.success?.("Downloaded JSON");
  }

  function actionOpenFDA() {
    // The API itself is the source. We can open meta.terms or license if available.
    if (meta && meta.disclaimer) {
      // no direct URL to open; open the docs page
      window.open("https://open.fda.gov/apis/drug/shortages/", "_blank");
    } else {
      window.open("https://open.fda.gov/apis/drug/shortages/", "_blank");
    }
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">FDA — Drug Shortages</h1>
          <p className="mt-1 text-sm opacity-70 max-w-xl">
            Real-time public FDA data about current drug shortages. Data is unvalidated — do not rely on this for clinical decisions.
          </p>
        </div>

        <div className="w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // immediate search on submit
              fetchShortages({ q: query.trim(), limit: 50 });
            }}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-3 py-2",
              isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            <Search className="opacity-60" />
            <Input
              placeholder='Search by drug, manufacturer, category — e.g. "Lisdexamfetamine", "Viatris", "Urology"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none min-w-[320px]"
            />
            <Button type="button" variant="outline" onClick={() => fetchShortages({ q: "", limit: 10 })} className="px-3">
              Reset
            </Button>
            <Button type="submit" variant="default" className="px-3" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Search"}
            </Button>
          </form>
        </div>
      </header>

      {/* meta row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 text-sm opacity-75">
          <Database className="w-4 h-4" />
          <div>
            <div className="text-xs opacity-60">Results</div>
            <div className="font-medium">{(meta && meta.results && typeof meta.results.total === "number") ? `${meta.results.total} total` : `${items.length} shown`}</div>
          </div>

          <Separator orientation="vertical" className="mx-3 h-6" />

          <Calendar className="w-4 h-4" />
          <div>
            <div className="text-xs opacity-60">Last updated</div>
            <div className="font-medium">{meta?.last_updated ?? "—"}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => { setShowRaw(s => !s); }}><List /> Raw</Button>
          <Button variant="outline" onClick={() => actionOpenFDA()}><ExternalLink /> Docs</Button>
        </div>
      </div>

      {/* main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT - list */}
        <aside className="lg:col-span-4 space-y-3">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <CardTitle className="text-base">Shortage List</CardTitle>
              <div className="text-xs opacity-60">{items.length} shown</div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea style={{ maxHeight: 640 }}>
                <ul>
                  {loading && (
                    <li className="p-4 text-sm text-center opacity-70">
                      <Loader2 className="animate-spin mx-auto" />
                      <div>Loading results…</div>
                    </li>
                  )}

                  {!loading && items.length === 0 && (
                    <li className="p-6 text-sm opacity-60">No shortages found for the current query. Try clearing the search or change keywords.</li>
                  )}

                  {items.map((it, idx) => {
                    const title = it.generic_name || it.presentation || "Untitled";
                    const status = it.status || "Unknown";
                    const short = it.presentation || it.dosage_form || it.therapeutic_category?.[0] || "";
                    return (
                      <li
                        key={(it.package_ndc ?? it.presentation ?? idx) + idx}
                        className={clsx(
                          "p-3 border-b last:border-b-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40",
                          selected === it ? "bg-zinc-50 dark:bg-black/40" : "bg-transparent"
                        )}
                        onClick={() => onSelectItem(it)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{title}</div>
                            <div className="text-xs opacity-60 truncate">{short}</div>
                          </div>
                          <div className="text-right">
                            <div className={clsx("text-sm font-medium", status && status.toLowerCase().includes("current") ? "text-emerald-500" : status && status.toLowerCase().includes("discontinue") ? "text-rose-500" : "text-amber-500")}>
                              {status}
                            </div>
                            <div className="text-xs opacity-60">{safeDate(it.update_date || it.initial_posting_date || it.discontinued_date)}</div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER - details */}
        <section className="lg:col-span-5">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">{selected?.generic_name ?? "Select a shortage item"}</CardTitle>
                <div className="text-xs opacity-60">{selected?.presentation ?? selected?.package_ndc ?? "—"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(true)} disabled={!selected}><FileText /> View JSON</Button>
                <Button variant="outline" onClick={() => actionCopyJSON()} disabled={!selected}><Copy /> Copy</Button>
                <Button variant="outline" onClick={() => actionDownloadJSON()} disabled={!selected}><Download /> Download</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!selected ? (
                <div className="py-20 text-center text-sm opacity-70">No item selected — click one from the left, or run a search.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={clsx("p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="text-xs opacity-60">Status</div>
                      <div className="font-semibold text-lg">{selected.status ?? "—"}</div>

                      <div className="mt-3 text-xs opacity-60">Update</div>
                      <div className="text-sm">{safeDate(selected.update_date ?? selected.initial_posting_date)}</div>

                      <div className="mt-3 text-xs opacity-60">Availability</div>
                      <div className="text-sm">{selected.availability ?? (selected.status ? selected.status : "—")}</div>
                    </div>

                    <div className={clsx("p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="text-xs opacity-60">Company / Manufacturer</div>
                      <div className="font-medium">{selected.company_name ?? selected.openfda?.manufacturer_name?.[0] ?? "—"}</div>

                      <div className="mt-3 text-xs opacity-60">Therapeutic Category</div>
                      <div className="text-sm">{(selected.therapeutic_category || []).join(", ") || "—"}</div>

                      <div className="mt-3 text-xs opacity-60">Dosage Form</div>
                      <div className="text-sm">{selected.dosage_form ?? "—"}</div>
                    </div>
                  </div>

                  <div className={clsx("p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-60">Presentation</div>
                    <div className="font-medium mb-2">{selected.presentation ?? "—"}</div>

                    <div className="text-xs opacity-60">Package NDC</div>
                    <div className="text-sm mb-2">{(selected.package_ndc || selected.openfda?.package_ndc || []).join ? (selected.package_ndc ?? selected.openfda?.package_ndc ?? []).join(", ") : selected.package_ndc ?? "—"}</div>

                    <div className="text-xs opacity-60">Shortage Reason</div>
                    <div className="text-sm">{selected.shortage_reason ?? "—"}</div>
                  </div>

                  <div className={clsx("p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between">
                      <div className="text-xs opacity-60">OpenFDA fields</div>
                      <div className="text-xs opacity-60">Quick glance</div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="text-xs opacity-60">Application #</div>
                      <div className="text-sm">{(selected.openfda?.application_number || []).slice(0, 3).join(", ") || "—"}</div>

                      <div className="text-xs opacity-60">Brand</div>
                      <div className="text-sm">{(selected.openfda?.brand_name || []).slice(0, 2).join(", ") || "—"}</div>

                      <div className="text-xs opacity-60">Route</div>
                      <div className="text-sm">{(selected.openfda?.route || []).join(", ") || "—"}</div>

                      <div className="text-xs opacity-60">Substance</div>
                      <div className="text-sm">{(selected.openfda?.substance_name || []).slice(0, 3).join(", ") || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => { if (selected.contact_info) { window.open(`tel:${selected.contact_info}`); } else toast?.info?.("No contact available"); }} variant="outline" className="flex-1"><Phone /> Contact</Button>
                    <Button onClick={() => { if (selected.presentation) window.open(`https://www.google.com/search?q=${encodeURIComponent(selected.presentation)}`, "_blank"); }} variant="default" className="flex-1"><ExternalLink /> More</Button>
                  </div>

                  <Separator />

                  <div className="text-sm">
                    <div className="text-xs opacity-60">Full Notes</div>
                    <div className="mt-2 leading-relaxed text-sm">
                      {selected.company_name && <div><span className="font-medium">{selected.company_name}</span></div>}
                      <div className="mt-1">{selected.presentation ? selected.presentation : (selected.generic_name ?? "—")}</div>
                      <div className="mt-2 text-xs opacity-60">Contact</div>
                      <div>{selected.contact_info ?? "—"}</div>
                    </div>
                  </div>

                  {/* raw toggle */}
                  {showRaw && (
                    <div className={clsx("mt-2 p-3 rounded-md border overflow-auto", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")} style={{ maxHeight: 260 }}>
                      <pre className="text-xs whitespace-pre-wrap">{prettyJson(selected)}</pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT - quick actions / summary */}
        <aside className="lg:col-span-3 space-y-3">
          <Card className={clsx("rounded-2xl overflow-hidden p-4 border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-60">Quick Actions</div>
                <div className="font-medium">Inspect • Contact • Export</div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button onClick={() => { setShowRaw(s => !s); }} variant="ghost" className="w-full"><List /> Toggle Inline JSON</Button>
              <Button onClick={() => actionDownloadJSON()} variant="outline" className="w-full" disabled={!selected}><Download /> Download Selected</Button>
              <Button onClick={() => actionCopyJSON()} variant="outline" className="w-full" disabled={!selected}><Copy /> Copy Selected</Button>
              <Button onClick={() => actionOpenFDA()} variant="default" className="w-full"><ExternalLink /> OpenFDA Docs</Button>
            </div>

            <Separator className="my-3" />

            <div className="text-sm opacity-70">
              <div className="text-xs opacity-60">API Disclaimer</div>
              <div className="mt-1 text-xs">Do not rely on openFDA to make clinical decisions. Data may be incomplete or unvalidated.</div>
            </div>
          </Card>

          {/* lightweight metadata */}
          <Card className={clsx("rounded-2xl p-4 border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-xs opacity-60">Source</div>
            <div className="font-medium">openFDA — Drug Shortages</div>

            <div className="mt-3 text-xs opacity-60">Total known (meta)</div>
            <div className="font-medium">{meta?.results?.total ?? "—"}</div>

            {meta?.disclaimer && (
              <>
                <Separator className="my-3" />
                <div className="text-xs opacity-60">Disclaimer</div>
                <div className="text-xs mt-1">{meta.disclaimer.slice(0, 160)}{meta.disclaimer.length > 160 ? "…" : ""}</div>
              </>
            )}
          </Card>
        </aside>
      </main>

      {/* JSON dialog (full JSON of selected) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.generic_name ?? "Selected Item JSON"}</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "70vh", overflow: "auto", padding: 20 }}>
            {selected ? (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{prettyJson(selected)}</pre>
            ) : (
              <div className="p-6 text-sm opacity-60">No selection</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Raw object</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => actionDownloadJSON()} disabled={!selected}><Download /> Download</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* global error */}
      {error && (
        <div className="fixed left-6 bottom-6 p-3 rounded-md bg-rose-600/10 border border-rose-500/30 text-sm">
          <div className="font-medium text-rose-600">Error</div>
          <div className="text-xs opacity-80">{error}</div>
        </div>
      )}
    </div>
  );
}

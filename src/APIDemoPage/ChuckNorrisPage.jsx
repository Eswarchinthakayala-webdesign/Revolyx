// src/pages/ChuckNorrisPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Info,
  FileText,
  Calendar,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Endpoint ---------- */
const ENDPOINT = "https://api.chucknorris.io/jokes/random";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function formatDate(raw) {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw || "—";
    return d.toLocaleString();
  } catch {
    return raw || "—";
  }
}

/* ---------- Component ---------- */
export default function ChuckNorrisPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [joke, setJoke] = useState(null); // full response object
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);

  async function fetchJoke() {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (!res.ok) {
        showToast("error", `Failed to fetch (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setJoke(json);
      setShowRaw(false);
      showToast("success", "Fresh joke loaded");
    } catch (err) {
      console.error(err);
      showToast("error", "Network error while fetching joke");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJoke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyJoke() {
    if (!joke) {
      showToast("info", "No joke to copy");
      return;
    }
    navigator.clipboard.writeText(joke.value || "");
    showToast("success", "Joke copied to clipboard");
  }

  function downloadJSON() {
    if (!joke) {
      showToast("info", "Nothing to download");
      return;
    }
    const blob = new Blob([prettyJSON(joke)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeTitle = (joke.id || "chuck_joke").replace(/\s+/g, "_");
    a.download = `chucknorris_${safeTitle}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Chuck Norris — Daily Smile</h1>
          <p className="mt-1 text-sm opacity-70">Random Chuck Norris jokes — quick, clean, and ready to share.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={fetchJoke} variant="outline" className="flex items-center gap-2">
            <RefreshCw className={loading ? "animate-spin" : ""} />
            New joke
          </Button>
          <Button onClick={() => { setShowRaw(s => !s); }} variant="ghost" className="flex items-center gap-2">
            <FileText /> {showRaw ? "Hide JSON" : "Show JSON"}
          </Button>
        </div>
      </header>

      <main className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main card */}
        <section className="lg:col-span-8">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="flex items-start justify-between p-5 border-b">
              <div>
                <CardTitle className="text-lg">Random Joke</CardTitle>
                <div className="text-sm opacity-70 mt-1">
                  Crisp one-liners pulled from the official Chuck Norris API.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={copyJoke} title="Copy joke to clipboard"><Copy /></Button>
                <Button variant="ghost" onClick={downloadJSON} title="Download JSON"><Download /></Button>
                <Button variant="ghost" onClick={() => setImgOpen(true)} title="View avatar"><ImageIcon /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center"><div className="inline-flex items-center gap-2"><RefreshCw className="animate-spin" /> Loading…</div></div>
              ) : !joke ? (
                <div className="py-12 text-center text-sm opacity-70">No joke available. Click "New joke" to fetch one.</div>
              ) : (
                <div className="space-y-6">
                  {/* Joke area */}
                  <div className="flex items-start gap-4">
                    <img src={joke.icon_url} alt="Chuck Norris" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                    <div>
                      <h2 className="text-2xl font-semibold leading-snug">{joke.value}</h2>
                      <div className="mt-2 text-sm opacity-60 flex items-center gap-3">
                        {Array.isArray(joke.categories) && joke.categories.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Tag className="opacity-60" /> {joke.categories.map((c) => (
                              <span key={c} className="inline-block text-xs px-2 py-0.5 rounded-full border">{c}</span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 opacity-60"><Info /> uncategorized</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60 flex items-center gap-2"><Calendar /> Created</div>
                      <div className="mt-1 font-medium">{formatDate(joke.created_at)}</div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Updated</div>
                      <div className="mt-1 font-medium">{formatDate(joke.updated_at)}</div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">ID</div>
                      <div className="mt-1 font-medium break-all">{joke.id}</div>
                    </div>
                  </div>

                  {/* Links & developer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm opacity-70">Source: <a href={joke.url} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-2"><ExternalLink className="w-4 h-4" /> open original</a></div>
                    <div className="flex gap-2">
                      <Button onClick={copyJoke} variant="outline" className="flex items-center gap-2"><Copy /> Copy</Button>
                      <Button onClick={downloadJSON} variant="outline" className="flex items-center gap-2"><Download /> JSON</Button>
                      <Button onClick={() => { window.open(joke.url, "_blank"); }} variant="ghost"><ExternalLink /></Button>
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <AnimatePresence>
                    {showRaw && (
                      <motion.pre initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-xs p-4 rounded-md border overflow-auto" style={{ maxHeight: 320 }}>
                        {prettyJSON(joke)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Sidebar with full field mapping (developer-focused) */}
        <aside className="lg:col-span-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">API Response mapping</div>
            <div className="text-xs opacity-70 mb-3">
              The page maps the API response into friendly UI blocks. Every field returned by the API is available in the JSON panel.
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">value</div>
                <div className="mt-1 font-medium">{joke?.value ?? "—"}</div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">icon_url</div>
                <div className="mt-1 font-medium break-all">{joke?.icon_url ?? "—"}</div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">categories</div>
                <div className="mt-1 font-medium">{Array.isArray(joke?.categories) ? (joke.categories.length ? joke.categories.join(", ") : "[]") : "—"}</div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">created_at / updated_at</div>
                <div className="mt-1 font-medium">{formatDate(joke?.created_at)} / {formatDate(joke?.updated_at)}</div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">id</div>
                <div className="mt-1 font-medium break-all">{joke?.id ?? "—"}</div>
              </div>

              <div className="p-3 rounded-md border">
                <div className="text-xs opacity-60">url</div>
                <div className="mt-1 font-medium break-all">{joke?.url ?? "—"}</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="text-xs opacity-60">Developer tools</div>
            <div className="mt-2 flex gap-2">
              <Button onClick={fetchJoke} variant="outline" className="flex-1"><RefreshCw /> Refresh</Button>
              <Button onClick={() => setShowRaw(s => !s)} variant="ghost" className="flex-1">{showRaw ? "Hide" : "Raw"}</Button>
            </div>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="max-w-lg w-full p-0 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Avatar</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6" style={{ height: "52vh" }}>
            {joke?.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={joke.icon_url} alt="Chuck Norris avatar" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-sm opacity-60">No image available</div>
            )}
          </div>
          <DialogFooter className="flex justify-end p-4">
            <Button variant="outline" onClick={() => setImgOpen(false)}>Close</Button>
            {joke?.url && <Button onClick={() => window.open(joke.url, "_blank")}><ExternalLink /></Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

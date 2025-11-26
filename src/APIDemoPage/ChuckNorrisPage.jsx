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
  GitBranch,
  Hash,
  Zap,
  LayoutGrid,
  ChevronLeft,
  X,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn components (sheet + scroll area)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [sheetOpen, setSheetOpen] = useState(false);

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
    <div className={clsx("min-h-screen p-4 overflow-hidden md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1
            className={clsx(
              "text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Chuck Norris — Daily Smile
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Random Chuck Norris jokes — quick, clean, and ready to share.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile sheet trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-md cursor-pointer"
                  aria-label="Open developer panel"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px]">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                      <LayoutGrid /> Dev tools
                    </SheetTitle>
                    <SheetClose asChild>
                     
                    </SheetClose>
                  </div>
                </SheetHeader>

                <div className="mt-4 p-3">
                  <ScrollArea className="no-scrollbar" style={{ height: "60vh" }}>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Zap /> value</div>
                        <div className="mt-1 font-medium">{joke?.value ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><ImageIcon /> icon_url</div>
                        <div className="mt-1 font-medium break-all">{joke?.icon_url ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Tag /> categories</div>
                        <div className="mt-1 font-medium">{Array.isArray(joke?.categories) ? (joke.categories.length ? joke.categories.join(", ") : "[]") : "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Calendar /> created / updated</div>
                        <div className="mt-1 font-medium">{formatDate(joke?.created_at)} / {formatDate(joke?.updated_at)}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Hash /> id</div>
                        <div className="mt-1 font-medium break-all">{joke?.id ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><ExternalLink /> url</div>
                        <div className="mt-1 font-medium break-all">{joke?.url ?? "—"}</div>
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="mt-4 flex gap-2">
                    <Button onClick={fetchJoke} variant="outline" className="flex-1 cursor-pointer"><RefreshCw /> Refresh</Button>
                    <Button onClick={() => setShowRaw(s => !s)} variant="ghost" className="flex-1 cursor-pointer">{showRaw ? "Hide" : "Raw"}</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              onClick={fetchJoke}
              variant="outline"
              className="flex items-center gap-2 cursor-pointer"
              title="Fetch new joke"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
              New joke
            </Button>

            <Button
              onClick={() => setShowRaw(s => !s)}
              variant="ghost"
              className="flex items-center gap-2 cursor-pointer"
            >
              <FileText /> {showRaw ? "Hide JSON" : "Show JSON"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main card */}
        <section className="lg:col-span-8">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border shadow-sm transition-shadow",
              isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white/90 border-slate-200"
            )}
          >
            <CardHeader className="flex items-start justify-between p-5 border-b">
              <div>
                <CardTitle className="text-lg">Random Joke</CardTitle>
                <div className="text-sm opacity-70 mt-1">
                  Crisp one-liners pulled from the official Chuck Norris API.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={copyJoke}
                  title="Copy joke to clipboard"
                  className="p-2 cursor-pointer"
                >
                  <Copy />
                </Button>
                <Button
                  variant="ghost"
                  onClick={downloadJSON}
                  title="Download JSON"
                  className="p-2 cursor-pointer"
                >
                  <Download />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setImgOpen(true)}
                  title="View avatar"
                  className="p-2 cursor-pointer"
                >
                  <ImageIcon />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center gap-2"><RefreshCw className="animate-spin" /> Loading…</div>
                </div>
              ) : !joke ? (
                <div className="py-12 text-center text-sm opacity-70">No joke available. Click "New joke" to fetch one.</div>
              ) : (
                <div className="space-y-6">
                  {/* Joke area */}
                  <div className="flex items-start gap-4">
                    <img
                      src={joke.icon_url}
                      alt="Chuck Norris"
                      className="w-16 h-16 rounded-full object-cover shadow-sm border"
                      style={{ cursor: "pointer" }}
                      onClick={() => setImgOpen(true)}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-semibold leading-snug break-words">{joke.value}</h2>
                      <div className="mt-2 text-sm opacity-60 flex items-center gap-3 flex-wrap">
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
                    <div className="p-3 rounded-md border hover:shadow-sm transition-shadow cursor-default">
                      <div className="text-xs opacity-60 flex items-center gap-2"><Calendar /> Created</div>
                      <div className="mt-1 font-medium">{formatDate(joke.created_at)}</div>
                    </div>

                    <div className="p-3 rounded-md border hover:shadow-sm transition-shadow cursor-default">
                      <div className="text-xs opacity-60 flex items-center gap-2"><RefreshCw /> Updated</div>
                      <div className="mt-1 font-medium">{formatDate(joke.updated_at)}</div>
                    </div>

                    <div className="p-3 rounded-md border hover:shadow-sm transition-shadow cursor-default">
                      <div className="text-xs opacity-60 flex items-center gap-2"><Hash /> ID</div>
                      <div className="mt-1 font-medium break-all">{joke.id}</div>
                    </div>
                  </div>

                  {/* Links & developer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm opacity-70">
                      Source:{" "}
                      <a
                        href={joke.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline inline-flex items-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" /> open original
                      </a>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={copyJoke} variant="outline" className="flex items-center gap-2 cursor-pointer"><Copy /> Copy</Button>
                      <Button onClick={downloadJSON} variant="outline" className="flex items-center gap-2 cursor-pointer"><Download /> JSON</Button>
                      <Button onClick={() => { window.open(joke.url, "_blank"); }} variant="ghost" className="cursor-pointer"><ExternalLink /></Button>
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <AnimatePresence>
                    {showRaw && (
                      <motion.pre
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-xs p-4 rounded-md border overflow-auto"
                        style={{ maxHeight: 320 }}
                      >
                        {prettyJSON(joke)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Sidebar with full field mapping (developer-focused) — desktop */}
        <aside className="lg:col-span-4 hidden lg:block">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white/90 border-slate-200")}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">API Response mapping</div>
              <div className="text-xs opacity-60">Developer view</div>
            </div>

            <p className="text-xs opacity-70 mt-2 mb-3">
              The page maps the API response into friendly UI blocks. Every field returned by the API is available in the JSON panel.
            </p>

            <ScrollArea style={{ height: "52vh" }}>
              <div className="space-y-2">
                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-2"><Zap /> value</div>
                  <div className="mt-1 font-medium">{joke?.value ?? "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-2"><ImageIcon /> icon_url</div>
                  <div className="mt-1 font-medium break-all">{joke?.icon_url ?? "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-2"><Tag /> categories</div>
                  <div className="mt-1 font-medium">{Array.isArray(joke?.categories) ? (joke.categories.length ? joke.categories.join(", ") : "[]") : "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-2"><Calendar /> created_at / updated_at</div>
                  <div className="mt-1 font-medium">{formatDate(joke?.created_at)} / {formatDate(joke?.updated_at)}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-2"><Hash /> id</div>
                  <div className="mt-1 font-medium break-all">{joke?.id ?? "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-2"><ExternalLink /> url</div>
                  <div className="mt-1 font-medium break-all">{joke?.url ?? "—"}</div>
                </div>
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <div className="text-xs opacity-60">Developer tools</div>
            <div className="mt-2 flex gap-2">
              <Button onClick={fetchJoke} variant="outline" className="flex-1 cursor-pointer"><RefreshCw /> Refresh</Button>
              <Button onClick={() => setShowRaw(s => !s)} variant="ghost" className="flex-1 cursor-pointer">{showRaw ? "Hide" : "Raw"}</Button>
            </div>
          </Card>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="max-w-lg w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Avatar</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6" style={{ height: "52vh" }}>
            {joke?.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={joke.icon_url} alt="Chuck Norris avatar" className="h-full full object-contain" />
            ) : (
              <div className="text-sm opacity-60">No image available</div>
            )}
          </div>
          <DialogFooter className="flex flex-row gap-2 justify-end p-4">
            <Button variant="outline" onClick={() => setImgOpen(false)} className="cursor-pointer">Close</Button>
            {joke?.url && (
              <Button onClick={() => window.open(joke.url, "_blank")} className=" cursor-pointer"><ExternalLink /></Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// src/pages/GhContribPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Download,
  ExternalLink,
  Copy,
  ImageIcon,
  Loader2,
  User,
  GitBranch,
  Star,
  Link as LinkIcon,
  Menu,
  RefreshCw,
  Check,
  FileText,
  MapPin,
  Building,
  Calendar,
  Eye,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn-like components (sheet + scroll area) — ensure these exist in your project
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_USERNAME = "sindresorhus";
const GH_CHART_BASE = "/ghchart";

// small helper: preset list of profiles to show as "random"
const SAMPLE_PROFILES = [
  "sindresorhus","gaearon","yyx990803","torvalds","tj","rauchg","getify","kentcdodds","rauch","addyosmani",
  "samanthaming","sebmarkbage","mxstbr","paulirish","sindresorhus","mojombo","defunkt","pjhyett","wycats","dhh"
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GhContribPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const [userMeta, setUserMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [chartBlobUrl, setChartBlobUrl] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rawUserOpen, setRawUserOpen] = useState(false);
  const [rawUserData, setRawUserData] = useState(null);
  const [showInlineRaw, setShowInlineRaw] = useState(false);

  const [profiles, setProfiles] = useState(() => shuffleArray(SAMPLE_PROFILES).slice(0, 10));
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy button status
  const [copyChartStatus, setCopyChartStatus] = useState("idle"); // idle | copied
  const [copyProfileStatus, setCopyProfileStatus] = useState("idle");

  const suggestTimer = useRef(null);
  const lastFetchRef = useRef({ user: null, blobUrl: null });
  const copyTimerRef = useRef(null);

  // build chart URL
  const chartUrl = (u) => `${GH_CHART_BASE}/${encodeURIComponent(u)}`;

  // fetch user metadata
  async function fetchUserMeta(u) {
    if (!u) return;
    setLoadingMeta(true);
    setUserMeta(null);
    setRawUserData(null);
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`);
      if (!res.ok) {
        if (res.status === 404) showToast("info", "GitHub user not found");
        else showToast("error", `Failed to fetch user (${res.status})`);
        setLoadingMeta(false);
        return;
      }
      const json = await res.json();
      setUserMeta(json);
      setRawUserData(json);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch user data");
    } finally {
      setLoadingMeta(false);
    }
  }

  // fetch contribution chart (image blob)
  async function fetchChartImage(u) {
    if (!u) return;
    setLoadingChart(true);
    // reuse blob url if we already fetched same user
    if (lastFetchRef.current.user === u && lastFetchRef.current.blobUrl) {
      setChartBlobUrl(lastFetchRef.current.blobUrl);
      setLoadingChart(false);
      return;
    }
    try {
      const res = await fetch(chartUrl(u));
      if (!res.ok) {
        showToast("error", `Failed to load chart (${res.status})`);
        setLoadingChart(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // cleanup previous
      if (lastFetchRef.current.blobUrl && lastFetchRef.current.blobUrl !== url) {
        try { URL.revokeObjectURL(lastFetchRef.current.blobUrl); } catch {}
      }
      lastFetchRef.current = { user: u, blobUrl: url };
      setChartBlobUrl(url);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load chart image");
      setChartBlobUrl(null);
    } finally {
      setLoadingChart(false);
    }
  }

  // suggestions: query GitHub search API (unauthenticated, rate-limited)
  async function searchUsers(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(q)}+in:login&per_page=6`);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.items || [];
      setSuggestions(items.map(i => ({ login: i.login, avatar_url: i.avatar_url, html_url: i.html_url })));
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  // debounce query input
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchUsers(v);
    }, 300);
  }

  // when username changes, fetch meta and chart
  useEffect(() => {
    if (!username) return;
    fetchUserMeta(username);
    fetchChartImage(username);
  }, [username]);

  // initial load
  useEffect(() => {
    setQuery(DEFAULT_USERNAME);
    setShowSuggest(false);
    fetchUserMeta(DEFAULT_USERNAME);
    fetchChartImage(DEFAULT_USERNAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cleanup timers and blob urls on unmount
  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (lastFetchRef.current.blobUrl) {
        try { URL.revokeObjectURL(lastFetchRef.current.blobUrl); } catch {}
      }
    };
  }, []);

  // actions
  async function downloadChart() {
    if (!chartBlobUrl) return showToast("info", "No chart loaded");
    try {
      const a = document.createElement("a");
      a.href = chartBlobUrl;
      a.download = `gh-contributions_${username}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("success", "Downloaded chart PNG");
    } catch (err) {
      console.error(err);
      showToast("error", "Download failed");
    }
  }

  function openChartInNewTab() {
    window.open(chartUrl(username), "_blank", "noopener");
  }

  async function copyChartUrl() {
    try {
      await navigator.clipboard.writeText(chartUrl(username));
      setCopyChartStatus("copied");
      showToast("success", "Chart URL copied");
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyChartStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
    }
  }

  async function copyProfileUrl() {
    try {
      await navigator.clipboard.writeText(userMeta?.html_url || "");
      setCopyProfileStatus("copied");
      showToast("success", "Profile URL copied");
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyProfileStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      showToast("error", "Copy failed");
    }
  }

  function viewRawUser() {
    setRawUserOpen(true);
  }

  // Download raw user JSON
  function downloadUserJSON() {
    if (!rawUserData) return showToast("info", "No user data to download");
    const blob = new Blob([JSON.stringify(rawUserData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `github_user_${username}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded user JSON");
  }

  // UI helpers
  function handleSuggestionSelect(s) {
    setUsername(s.login);
    setQuery(s.login);
    setShowSuggest(false);
  }

  function handleProfileClick(login) {
    setUsername(login);
    setQuery(login);
    setSheetOpen(false);
  }

  function refreshProfiles() {
    setProfiles(shuffleArray(SAMPLE_PROFILES).slice(0, 10));
    showToast("success", "Profiles refreshed");
  }

  // small UI utilities for initials avatar
  function initialsBadge(name) {
    const letter = (name && name[0]) ? name[0].toUpperCase() : "?";
    return (
      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold", isDark ? "bg-zinc-800 text-zinc-100" : "bg-zinc-100 text-zinc-900")}>
        {letter}
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile: menu opens sheet */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer"><Menu /></Button>
              </SheetTrigger>

              <SheetContent side="left" className={clsx("w-[320px] p-2")}>
                <div className={clsx("p-4 flex items-center justify-between border-b", isDark ? "bg-black/80 border-zinc-800" : "bg-white/90 border-zinc-200")}>
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold">Profiles</div>
                    <div className="text-xs opacity-60">Quick picks</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={refreshProfiles}><RefreshCw /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setSheetOpen(false)}><ExternalLink /></Button>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-72px)] pb-10">
                  <div className="p-4 space-y-2">
                    {profiles.map(p => (
                      <div key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer" onClick={() => handleProfileClick(p)}>
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {/* placeholder initials unless avatar fetched */}
                          <div className="w-full h-full flex items-center justify-center font-semibold text-sm bg-zinc-100 dark:bg-zinc-800">{p[0].toUpperCase()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{p}</div>
                          <div className="text-xs opacity-60 truncate">github.com/{p}</div>
                        </div>
                        <div className="text-xs opacity-60">View</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold")}>GitHub Contributions</h1>
            <p className="text-sm opacity-70">Inspect, export and share GitHub contribution charts.</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-[560px]">
          <form
            onSubmit={(e) => { e?.preventDefault?.(); if (query?.trim()) setUsername(query.trim()); }}
            className={clsx(
              "flex items-center gap-2 w-full rounded-xl px-3 py-2",
              isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search GitHub username..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search GitHub username"
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer" title="Search"><Search /></Button>
            <Button type="button" variant="ghost" className="px-3 cursor-pointer" onClick={() => { setQuery(DEFAULT_USERNAME); setUsername(DEFAULT_USERNAME); }} title="Reset to example">Reset</Button>
          </form>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl mt-1", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                <ul>
                  {loadingSuggest && <li className="p-3 text-sm opacity-60 flex items-center gap-2"><Loader2 className="animate-spin" /> Searching…</li>}
                  {suggestions.map(s => (
                    <li key={s.login} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => handleSuggestionSelect(s)}>
                      <div className="flex items-center gap-3">
                        <img src={s.avatar_url} alt={s.login} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.login}</div>
                          <div className="text-xs opacity-60 truncate">{s.html_url}</div>
                        </div>
                        <div className="text-xs opacity-60">View</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>



      </header>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-start">
        {/* Left: user summary (in mobile the sheet handles quick profiles) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {loadingMeta ? <Loader2 className="animate-spin" /> : (userMeta?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userMeta.avatar_url} alt={userMeta.login} className="w-full h-full object-cover"/>
              ) : initialsBadge(userMeta?.login || username))}
            </div>
            <div>
              <div className="text-lg font-semibold">{userMeta?.name || userMeta?.login || username}</div>
              <div className="text-xs opacity-60">
                {userMeta?.login ? <a className="underline cursor-pointer" href={userMeta.html_url} target="_blank" rel="noreferrer">{userMeta.html_url}</a> : "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm space-y-3">
            <div>
              <div className="text-xs opacity-60">Bio</div>
              <div className="text-sm">{userMeta?.bio || "No bio available."}</div>
            </div>

            <Separator className="my-1" />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs opacity-60 flex items-center justify-center gap-2"><GitBranch className="w-3 h-3" /> Repos</div>
                <div className="font-medium">{userMeta?.public_repos ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60 flex items-center justify-center gap-2"><Users className="w-3 h-3" /> Followers</div>
                <div className="font-medium">{userMeta?.followers ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60 flex items-center justify-center gap-2"><GitBranch className="w-3 h-3" /> Following</div>
                <div className="font-medium">{userMeta?.following ?? "—"}</div>
              </div>
            </div>

            <div>
              <div className="text-xs opacity-60 flex items-center gap-2"><MapPin className="w-3 h-3" /> Location</div>
              <div className="font-medium">{userMeta?.location || "—"}</div>
            </div>

            <div>
              <div className="text-xs opacity-60 flex items-center gap-2"><Building className="w-3 h-3" /> Company</div>
              <div className="font-medium">{userMeta?.company || "—"}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => { if (userMeta?.html_url) window.open(userMeta.html_url, "_blank"); else showToast("info", "No profile link"); }}>
              <ExternalLink /> View on GitHub
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => { viewRawUser(); }}>
                <FileText /> Inspect JSON
              </Button>

              <Button variant="outline" className="cursor-pointer" onClick={copyProfileUrl} title="Copy profile URL">
                {copyProfileStatus === "copied" ? <Check className="animate-[pop_200ms_ease]" /> : <LinkIcon />}
              </Button>
            </div>
          </div>
        </aside>

        {/* Center: big chart + details */}
        <section className={clsx("lg:col-span-6 rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
          <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
            <div>
              <CardTitle className="text-lg flex items-center gap-3"><ImageIcon /> <span>Contribution Chart — {username}</span></CardTitle>
              <div className="text-xs opacity-60">{userMeta?.login ? `${userMeta.login} • ${userMeta.name || ""}` : (loadingMeta ? "Loading user…" : "No user")}</div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => fetchChartImage(username)} className="cursor-pointer">
                <RefreshCw className={clsx(loadingChart ? "animate-spin" : "")} /> Refresh
              </Button>

              <Button variant="ghost" onClick={() => setDialogOpen(true)} className="cursor-pointer">
                <Eye /> View Image
              </Button>

              <Button variant="ghost" onClick={downloadChart} className="cursor-pointer">
                <Download /> Download
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Chart area */}
            <div className="py-6 px-4 flex flex-col gap-4 items-center justify-center">
              {loadingChart ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : chartBlobUrl ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="w-full max-w-[900px] border rounded-lg overflow-hidden shadow-sm" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "white" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={chartBlobUrl} alt={`GitHub contributions for ${username}`} className="w-full h-auto object-contain" />
                  </div>

                  <div className="w-full max-w-[900px] text-sm text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold mb-1 flex items-center gap-2"><Star /> About this chart</div>
                        <div className="text-sm opacity-70 leading-relaxed">
                          This is a generated image of <strong>{username}</strong>'s GitHub contribution calendar visualization. Source: <code className="rounded px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800">{GH_CHART_BASE}/&lt;username&gt;</code>.
                        </div>
                      </div>

                   
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-md border flex flex-col gap-1">
                        <div className="text-xs opacity-60 flex items-center gap-2"><User /> Profile</div>
                        <div className="font-medium truncate">{userMeta?.html_url ?? "—"}</div>
                      </div>

                      <div className="p-3 rounded-md border flex flex-col gap-1">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Calendar /> Generated at</div>
                        <div className="font-medium">{new Date().toLocaleString()}</div>
                      </div>

                      <div className="p-3 rounded-md border flex flex-col gap-1">
                        <div className="text-xs opacity-60 flex items-center gap-2"><GitBranch /> Source</div>
                        <div className="font-medium">Remote generation service</div>
                      </div>
                    </div>

                    {/* optional inline raw JSON toggle */}
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowInlineRaw(s => !s)}>
                        <FileText /> {showInlineRaw ? "Hide Raw" : "Show Raw"}
                      </Button>

                      <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => fetchChartImage(username)}><RefreshCw /> Refresh Image</Button>
                    </div>

                    {showInlineRaw && (
                      <div className={clsx("mt-3 p-3 rounded-md border overflow-auto", isDark ? "bg-black/30" : "bg-white/60")} style={{ maxHeight: 260 }}>
                        <pre className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-900")}>{rawUserData ? JSON.stringify(rawUserData, null, 2) : "No data"}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm opacity-60">No chart available — try another username or refresh.</div>
              )}
            </div>
          </CardContent>
        </section>

        {/* Right: Quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 h-fit", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="text-sm font-semibold mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2"><Download /> Quick Actions</div>
            <div className="text-xs opacity-60">Tools</div>
          </div>

          <div className="space-y-2">
            <Button className="w-full cursor-pointer" onClick={downloadChart} variant="outline"><Download /> Download PNG</Button>
            <Button className="w-full cursor-pointer" onClick={openChartInNewTab} variant="outline"><ExternalLink /> Open in new tab</Button>
            <Button className="w-full cursor-pointer" onClick={copyChartUrl} variant="outline"><Copy /> Copy Chart URL</Button>
            <Button className="w-full cursor-pointer" onClick={copyProfileUrl} variant="outline"><LinkIcon /> Copy Profile URL</Button>
            <Button className="w-full cursor-pointer" onClick={downloadUserJSON} variant="outline"><Download /> Download User JSON</Button>
          </div>

          <Separator className="my-4"/>

          <div className="text-xs opacity-60">Notes</div>
          <ul className="mt-2 text-sm space-y-1">
            <li>• Suggestions use GitHub Search API (rate-limited, unauthenticated).</li>
            <li>• Charts are generated remotely — opening in a new tab fetches the source PNG.</li>
            <li>• Mobile view uses a sheet for quick profiles; desktop shows sidebar.</li>
          </ul>
        </aside>
      </main>

      {/* Image modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{`Contribution chart — ${username}`}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            {chartBlobUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chartBlobUrl} alt={`GitHub contributions for ${username}`} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image source: {GH_CHART_BASE}/&lt;username&gt;</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => openChartInNewTab()}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raw user JSON dialog */}
      <Dialog open={rawUserOpen} onOpenChange={setRawUserOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{userMeta?.login ? `${userMeta.login} — Raw JSON` : "User JSON"}</DialogTitle>
          </DialogHeader>

          <div className={clsx("p-4", isDark ? "bg-black/30" : "bg-white/60")}>
            <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 400 }}>
              {rawUserData ? JSON.stringify(rawUserData, null, 2) : "No data"}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Fetched from GitHub API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setRawUserOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => downloadUserJSON()}><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

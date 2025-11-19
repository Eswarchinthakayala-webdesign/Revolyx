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
  Link as LinkIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * Professional GitHub Contribution Chart page
 * - Shows suggestions while typing (GitHub users search)
 * - Fetches user metadata from GitHub and displays a large contribution chart (image)
 * - Right column: quick actions (download PNG, open in new tab, copy URL, view raw user JSON)
 *
 * NOTE: this component assumes the same UI primitives (Button/Input/Card/Dialog/Separator) exist in your codebase.
 */

const DEFAULT_USERNAME = "sindresorhus"; // default example username
const GH_CHART_BASE = "/ghchart";

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

  const suggestTimer = useRef(null);
  const lastFetchRef = useRef({ user: null, blobUrl: null });

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
      // search by login
      const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(q)}+in:login&per_page=6`);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.items || [];
      // map to simple suggestion shape
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
    // fetch initial
    fetchUserMeta(DEFAULT_USERNAME);
    fetchChartImage(DEFAULT_USERNAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // actions
  async function downloadChart() {
    if (!chartBlobUrl) return showToast("info", "No chart loaded");
    try {
      // fetch blob again to ensure a fresh download name (or use existing object)
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

  function copyChartUrl() {
    navigator.clipboard.writeText(chartUrl(username));
    showToast("success", "Chart URL copied");
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

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>GitHub Contributions — Viewer</h1>
          <p className="mt-1 text-sm opacity-70">Preview a user’s contribution chart image and inspect GitHub metadata.</p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-auto">
          <form
            onSubmit={(e) => { e?.preventDefault?.(); if (query?.trim()) setUsername(query.trim()); }}
            className={clsx(
              "flex items-center gap-2 w-full md:w-[560px] rounded-xl px-3 py-2",
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
            />
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
            <Button type="button" variant="ghost" className="px-3" onClick={() => { setQuery(DEFAULT_USERNAME); setUsername(DEFAULT_USERNAME); }} title="Reset to example">Reset</Button>
          </form>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
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

      {/* Main layout: left (user), center (big chart), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Left: user summary */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {loadingMeta ? <Loader2 className="animate-spin" /> : (userMeta?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userMeta.avatar_url} alt={userMeta.login} className="w-full h-full object-cover"/>
              ) : <User />)}
            </div>
            <div>
              <div className="text-lg font-semibold">{userMeta?.name || userMeta?.login || username}</div>
              <div className="text-xs opacity-60">{userMeta?.login ? <a className="underline" href={userMeta.html_url} target="_blank" rel="noreferrer">{userMeta.html_url}</a> : "—"}</div>
            </div>
          </div>

          <div className="mt-4 text-sm space-y-2">
            <div className="text-xs opacity-60">Bio</div>
            <div className="text-sm">{userMeta?.bio || "No bio available."}</div>

            <Separator className="my-3" />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs opacity-60">Repos</div>
                <div className="font-medium">{userMeta?.public_repos ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Followers</div>
                <div className="font-medium">{userMeta?.followers ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Following</div>
                <div className="font-medium">{userMeta?.following ?? "—"}</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs opacity-60">Location</div>
              <div className="font-medium">{userMeta?.location || "—"}</div>
            </div>

            <div className="mt-3">
              <div className="text-xs opacity-60">Company</div>
              <div className="font-medium">{userMeta?.company || "—"}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" onClick={() => { if (userMeta?.html_url) window.open(userMeta.html_url, "_blank"); else showToast("info", "No profile link"); }}><ExternalLink /> View on GitHub</Button>
            <Button variant="outline" onClick={() => viewRawUser()}><Star /> Inspect JSON</Button>
          </div>
        </aside>

        {/* Center: big chart + details */}
        <section className={clsx("lg:col-span-6 rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
          <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
            <div>
              <CardTitle className="text-lg">Contribution Chart — {username}</CardTitle>
              <div className="text-xs opacity-60">{userMeta?.login ? `${userMeta.login} • ${userMeta.name || ""}` : "Loading..."}</div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => fetchChartImage(username)}><Loader2 className={loadingChart ? "animate-spin" : ""} /> Refresh</Button>
              <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
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
                    <div className="font-semibold mb-1">About this chart</div>
                    <div className="text-sm opacity-70 leading-relaxed">
                      This is a generated image of {username}&apos;s GitHub contribution calendar (yearly-like visualization). It is fetched from <code className="rounded px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800">{GH_CHART_BASE}/&lt;username&gt;</code>.
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs opacity-60">Profile</div>
                        <div className="font-medium">{userMeta?.html_url ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Generated at</div>
                        <div className="font-medium">{new Date().toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm opacity-60">No chart available — try another username.</div>
              )}
            </div>
          </CardContent>
        </section>

        {/* Right: Quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 h-fit", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="text-sm font-semibold mb-2">Quick Actions</div>

          <div className="space-y-2">
            <Button className="w-full" onClick={downloadChart} variant="outline"><Download /> Download PNG</Button>
            <Button className="w-full" onClick={openChartInNewTab} variant="outline"><ExternalLink /> Open in new tab</Button>
            <Button className="w-full" onClick={copyChartUrl} variant="outline"><Copy /> Copy Chart URL</Button>
            <Button className="w-full" onClick={() => { navigator.clipboard.writeText(userMeta?.html_url || ""); showToast("success", "Profile URL copied"); }} variant="outline"><LinkIcon /> Copy Profile URL</Button>
            <Button className="w-full" onClick={downloadUserJSON} variant="outline"><Download /> Download User JSON</Button>
          </div>

          <Separator className="my-4"/>

          <div className="text-xs opacity-60">Notes</div>
          <ul className="mt-2 text-sm space-y-1">
            <li>• Suggestions use GitHub Search API (rate-limited, unauthenticated).</li>
            <li>• Charts are generated remotely — opening in a new tab gets the source PNG directly.</li>
            <li>• No local storage or favorites; this page focuses on professional inspection and export.</li>
          </ul>
        </aside>
      </main>

      {/* Image modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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

// GithubReadmeStatsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  ImageIcon,
  List,
  User,
  Star,
  Link as LinkIcon,
  Cloud,
  Calendar,
  MapPin
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * GithubReadmeStatsPage
 *
 * Features:
 * - Default user: octocat
 * - Suggestion dropdown while typing (GitHub Search Users API)
 * - Big SVG stats card from https://github-readme-stats.vercel.app/api?username={username}
 * - Fetches GitHub user details via https://api.github.com/users/{username}
 * - Right-side quick actions: copy markdown, download SVG, open in new tab, toggle raw SVG
 * - No localStorage / no saving
 *
 * NOTE: This component uses public GitHub endpoints (rate-limited when unauthenticated).
 *
 * Developer note: path to uploaded file (from conversation) included below as UPLOADED_FILE_PATH:
 * "/mnt/data/NewsApiPage.jsx"
 *
 * Paste this file into your project as a client component.
 */

const DEFAULT_USER = "octocat";
const README_STATS_BASE = "https://github-readme-stats.vercel.app/api";
const GITHUB_USER_API = "https://api.github.com/users";
const DEBOUNCE_MS = 350;

// Developer-provided uploaded file path (will be transformed by your environment if needed)
const UPLOADED_FILE_PATH = "/mnt/data/NewsApiPage.jsx";

function buildStatsUrl(username, options = {}) {
  // options can include theme, show_icons, hide_border, etc.
  const params = new URLSearchParams();
  params.set("username", username);
  if (options.hide_border) params.set("hide_border", "true");
  if (options.show_icons) params.set("show_icons", "true");
  if (options.theme) params.set("theme", options.theme);
  return `${README_STATS_BASE}?${params.toString()}`;
}

export default function GithubReadmeStatsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState(DEFAULT_USER);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentUser, setCurrentUser] = useState(null); // GitHub user object
  const [rawSvg, setRawSvg] = useState(null); // raw SVG text if toggled
  const [loadingUser, setLoadingUser] = useState(false);
  const [svgOpen, setSvgOpen] = useState(false);
  const [showRawSvg, setShowRawSvg] = useState(false);

  const searchTimer = useRef(null);
  const searchAbort = useRef(null);

  // build current stats url (light/dark theme param to stats service)
  const statsUrl = useMemo(() => {
    const themeName = isDark ? "dark" : "default";
    return buildStatsUrl(currentUser?.login ?? query, { show_icons: true, theme: themeName, hide_border: true });
  }, [currentUser, query, isDark]);

  // --- Helpers
  function prettyJSON(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  // fetch GitHub user details by username
  async function fetchUser(username) {
    if (!username) return;
    setLoadingUser(true);
    try {
      const res = await fetch(`${GITHUB_USER_API}/${encodeURIComponent(username)}`);
      if (!res.ok) {
        setCurrentUser(null);
        showToast("error", `GitHub user fetch failed (${res.status})`);
        setLoadingUser(false);
        return;
      }
      const json = await res.json();
      setCurrentUser(json);
      setShowSuggest(false);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch GitHub user");
    } finally {
      setLoadingUser(false);
    }
  }

  // fetch raw SVG if user wants to download or inspect
  async function fetchRawSvg(username) {
    try {
      const url = buildStatsUrl(username, { show_icons: true, hide_border: true, theme: isDark ? "dark" : "default" });
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `SVG fetch failed (${res.status})`);
        return null;
      }
      const text = await res.text();
      setRawSvg(text);
      return text;
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch SVG");
      return null;
    }
  }

  // Debounced suggestion search using GitHub Search Users API
  async function searchUsers(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    // Abort previous
    if (searchAbort.current) {
      searchAbort.current.abort();
    }
    const ctl = new AbortController();
    searchAbort.current = ctl;

    setLoadingSuggest(true);
    try {
      // GitHub search users endpoint - unauthenticated rate-limited
      const params = new URLSearchParams({ q: q + " in:login", per_page: "6" });
      const res = await fetch(`https://api.github.com/search/users?${params.toString()}`, { signal: ctl.signal });
      if (!res.ok) {
        // handle rate limit gracefully
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.items || []);
    } catch (err) {
      if (err.name === "AbortError") {
        // ignore
      } else {
        console.error(err);
        setSuggestions([]);
      }
    } finally {
      setLoadingSuggest(false);
      searchAbort.current = null;
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchUsers(v.trim()), DEBOUNCE_MS);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) return showToast("info", "Try a GitHub username");
    await fetchUser(query.trim());
  }

  function pickSuggestion(item) {
    if (!item) return;
    // item.login is the username
    setQuery(item.login);
    fetchUser(item.login);
    setShowSuggest(false);
  }

  // copy markdown snippet to clipboard
  function copyMarkdown() {
    if (!currentUser) return showToast("info", "No user loaded");
    const md = `![${currentUser.login}'s GitHub stats](${buildStatsUrl(currentUser.login)})`;
    navigator.clipboard.writeText(md);
    showToast("success", "Markdown snippet copied");
  }

  // download SVG
  async function downloadSvg() {
    const username = currentUser?.login || query;
    if (!username) return showToast("info", "No username");
    try {
      const svgText = await fetchRawSvg(username);
      if (!svgText) return;
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `github_stats_${username}.svg`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("success", "SVG downloaded");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to download SVG");
    }
  }

  // open stats in new tab
  function openStatsNewTab() {
    const username = currentUser?.login || query;
    if (!username) return showToast("info", "No username");
    window.open(buildStatsUrl(username), "_blank", "noopener");
  }

  // show raw SVG modal
  async function toggleRawSvg() {
    if (!currentUser && !query) return showToast("info", "No username");
    const username = currentUser?.login || query;
    if (!rawSvg || (currentUser && rawSvg && rawSvg.indexOf(`>${currentUser.login}<`) === -1)) {
      await fetchRawSvg(username);
    }
    setShowRawSvg((s) => !s);
  }

  // initial load: default user
  useEffect(() => {
    fetchUser(DEFAULT_USER);
    // cleanup debounce and aborts on unmount
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (searchAbort.current) searchAbort.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived data: friendly created date
  const createdAt = useMemo(() => {
    if (!currentUser?.created_at) return null;
    try {
      return new Date(currentUser.created_at).toLocaleDateString();
    } catch {
      return null;
    }
  }, [currentUser]);

  // img fallback handler
  const [avatarErr, setAvatarErr] = useState(false);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>ReadMe — GitHub Stats</h1>
          <p className="mt-1 text-sm opacity-70">Generate attractive, dynamic GitHub stats cards for READMEs. Search users, preview SVG and copy markdown quickly.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search GitHub username"
              placeholder="Search GitHub username (e.g. octocat)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="outline" onClick={() => fetchUser(DEFAULT_USER)}>Default</Button>
            <Button type="submit" variant="outline"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => pickSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <img src={s.avatar_url} alt={s.login} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{s.login}</div>
                    <div className="text-xs opacity-60">{s.type}</div>
                  </div>
                  <div className="text-xs opacity-60">Score: {Math.round((s.score || 0) * 100) / 100}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left (big card) + center (details) + right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Big SVG & basic profile */}
        <section className="lg:col-span-4 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border bg-zinc-100 dark:bg-zinc-900">
                  {!currentUser || avatarErr ? (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500"><User /></div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUser.avatar_url} alt={currentUser.login} className="w-full h-full object-cover" onError={() => setAvatarErr(true)} />
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-extrabold">{currentUser?.name || currentUser?.login || "—"}</h2>
                  <div className="text-sm opacity-60">{currentUser?.bio || currentUser?.company || "—"}</div>
                  <div className="mt-2 text-xs opacity-60">{currentUser?.location || "-"}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <Button variant="ghost" onClick={() => { if (currentUser?.html_url) window.open(currentUser.html_url, "_blank"); }}><ExternalLink /></Button>
                <div className="text-xs opacity-60">Repos: <span className="font-medium">{currentUser?.public_repos ?? "—"}</span></div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* SVG preview */}
              <div className="w-full rounded-lg border overflow-hidden">
                {/* Use <img> tag pointing to the stats service — this avoids needing to fetch raw SVG for quick preview */}
                <img
                  src={statsUrl}
                  alt={`${currentUser?.login || query}-github-stats`}
                  className="w-full block"
                  onError={() => showToast("error", "Failed to load stats image")}
                />
              </div>

              <div className="mt-4 text-sm opacity-70">
                <div>Username: <span className="font-medium">{currentUser?.login ?? "—"}</span></div>
                <div>Followers: <span className="font-medium">{currentUser?.followers ?? "—"}</span></div>
                <div>Following: <span className="font-medium">{currentUser?.following ?? "—"}</span></div>
                <div>Created: <span className="font-medium">{createdAt ?? "—"}</span></div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Center: Full details / fields */}
        <section className="lg:col-span-5 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 border-b", isDark ? "border-zinc-800" : "border-zinc-200")}>
              <CardTitle className="text-lg">Profile & Details</CardTitle>
            </CardHeader>

            <CardContent className="p-4">
              {loadingUser ? (
                <div className="py-12 text-center"><ImageIcon className="animate-spin mx-auto" /></div>
              ) : !currentUser ? (
                <div className="py-12 text-center text-sm opacity-60">No user loaded — search above.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs opacity-60">Bio</div>
                    <div className="text-sm font-medium mt-1">{currentUser.bio || "—"}</div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Repositories</div>
                      <div className="text-sm font-medium">{currentUser.public_repos}</div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Followers</div>
                      <div className="text-sm font-medium">{currentUser.followers}</div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Following</div>
                      <div className="text-sm font-medium">{currentUser.following}</div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Public Gists</div>
                      <div className="text-sm font-medium">{currentUser.public_gists}</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-xs opacity-60">Profile fields</div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Company</div>
                        <div className="font-medium">{currentUser.company || "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Blog</div>
                        <div className="font-medium">{currentUser.blog ? <a href={currentUser.blog.startsWith("http") ? currentUser.blog : `https://${currentUser.blog}`} target="_blank" rel="noreferrer">{currentUser.blog}</a> : "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Location</div>
                        <div className="font-medium">{currentUser.location || "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Email</div>
                        <div className="font-medium">{currentUser.email || "—"}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-xs opacity-60">Full JSON</div>
                    <pre className="mt-2 text-xs overflow-auto p-3 rounded-md border" style={{ maxHeight: 320 }}>
                      {prettyJSON(currentUser)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions */}
        <aside className={clsx("lg:col-span-3 space-y-4 p-4 rounded-2xl", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="text-xs opacity-60">Actions for the current user</div>
            </div>
            <div className="text-xs opacity-60">#{currentUser?.id ?? "—"}</div>
          </div>

          <div className="space-y-2">
            <Button className="w-full justify-start" onClick={copyMarkdown}><Copy className="mr-2" /> Copy Markdown</Button>
            <Button className="w-full justify-start" onClick={openStatsNewTab}><ExternalLink className="mr-2" /> Open Stats</Button>
            <Button className="w-full justify-start" onClick={downloadSvg}><Download className="mr-2" /> Download SVG</Button>
            <Button className="w-full justify-start" onClick={() => setSvgOpen(true)}><ImageIcon className="mr-2" /> View Large</Button>
            <Button className="w-full justify-start" onClick={toggleRawSvg}><List className="mr-2" /> Toggle Raw SVG</Button>
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span>Created</span> <strong className="ml-auto">{createdAt ?? "—"}</strong></div>
            <div className="flex items-center gap-2 mt-2"><MapPin className="w-4 h-4" /> <span>Location</span> <strong className="ml-auto">{currentUser?.location ?? "—"}</strong></div>
            <div className="flex items-center gap-2 mt-2"><Cloud className="w-4 h-4" /> <span>Blog</span> <strong className="ml-auto">{currentUser?.blog ? "External" : "—"}</strong></div>
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            <div>Uploaded file path (for your environment):</div>
            <div className="mt-1 text-sm break-all">{UPLOADED_FILE_PATH}</div>
          </div>
        </aside>
      </main>

      {/* Large SVG dialog */}
      <Dialog open={svgOpen} onOpenChange={setSvgOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{(currentUser?.login || query) + " — GitHub stats"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={statsUrl} alt="GitHub stats large" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">SVG by github-readme-stats</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSvgOpen(false)}><Star /></Button>
              <Button variant="outline" onClick={() => openStatsNewTab()}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raw SVG drawer/modal */}
      <Dialog open={showRawSvg} onOpenChange={setShowRawSvg}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Raw SVG — {(currentUser?.login || query)}</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "70vh", overflow: "auto" }} className="p-4">
            <pre className="text-xs whitespace-pre-wrap">
              {rawSvg || "No SVG loaded — click Toggle Raw SVG to fetch it."}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Preview SVG source</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(rawSvg || ""); showToast("success", "SVG copied"); }}><Copy /></Button>
              <Button variant="ghost" onClick={() => setShowRawSvg(false)}><List /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

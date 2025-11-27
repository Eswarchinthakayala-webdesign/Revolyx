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
  MapPin,
  Menu,
  Check,
  Github,
  FileText,
  Zap,
  ArrowUpRight,
  Clock,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

const DEFAULT_USER = "octocat";
const README_STATS_BASE = "https://github-readme-stats.vercel.app/api";
const GITHUB_USER_API = "https://api.github.com/users";
const GITHUB_SEARCH_API = "https://api.github.com/search/users";
const DEBOUNCE_MS = 350;
const RANDOM_PROFILES_COUNT = 10;
const UPLOADED_FILE_PATH = "/mnt/data/NewsApiPage.jsx";

function buildStatsUrl(username, options = {}) {
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
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState(DEFAULT_USER);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentUser, setCurrentUser] = useState(null); // GitHub user object
  const [userRawJson, setUserRawJson] = useState(null);
  const [rawSvg, setRawSvg] = useState(null); // raw SVG text if toggled
  const [loadingUser, setLoadingUser] = useState(false);
  const [svgOpen, setSvgOpen] = useState(false);
  const [showRawSvg, setShowRawSvg] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [topRepos, setTopRepos] = useState([]);
  const [randomProfiles, setRandomProfiles] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

  const [copyState, setCopyState] = useState({ copying: false, success: false });

  const searchTimer = useRef(null);
  const searchAbort = useRef(null);

  const statsUrl = useMemo(() => {
    const themeName = isDark ? "dark" : "default";
    return buildStatsUrl(currentUser?.login ?? query, { show_icons: true, theme: themeName, hide_border: true });
  }, [currentUser, query, isDark]);

  // pretty JSON
  function prettyJSON(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  // fetch GitHub user details by username (and top repos)
  async function fetchUser(username, opts = { fetchRepos: true }) {
    if (!username) return;
    setLoadingUser(true);
    setTopRepos([]);
    setUserRawJson(null);
    try {
      const res = await fetch(`${GITHUB_USER_API}/${encodeURIComponent(username)}`);
      if (!res.ok) {
        setCurrentUser(null);
        setUserRawJson(null);
        showToast("error", `GitHub user fetch failed (${res.status})`);
        setLoadingUser(false);
        return;
      }
      const json = await res.json();
      setCurrentUser(json);
      setUserRawJson(json);
      setShowSuggest(false);

      if (opts.fetchRepos) {
        // fetch top repos (by stars)
        try {
          const repoRes = await fetch(`${GITHUB_USER_API}/${encodeURIComponent(username)}/repos?per_page=6&sort=stars`);
          if (repoRes.ok) {
            const repoJson = await repoRes.json();
            setTopRepos(repoJson || []);
          }
        } catch (err) {
          // ignore repo errors
          console.error("repo fetch err", err);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch GitHub user");
      setCurrentUser(null);
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

    if (searchAbort.current) {
      searchAbort.current.abort();
    }
    const ctl = new AbortController();
    searchAbort.current = ctl;

    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams({ q: q + " in:login", per_page: "6" });
      const res = await fetch(`${GITHUB_SEARCH_API}?${params.toString()}`, { signal: ctl.signal });
      if (!res.ok) {
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
    setQuery(item.login);
    fetchUser(item.login);
    setShowSuggest(false);
  }

  // copy markdown snippet to clipboard with animated feedback
  async function copyMarkdown() {
    if (!currentUser) return showToast("info", "No user loaded");
    const md = `![${currentUser.login}'s GitHub stats](${buildStatsUrl(currentUser.login)})`;
    try {
      setCopyState({ copying: true, success: false });
      await navigator.clipboard.writeText(md);
      setCopyState({ copying: false, success: true });
      showToast("success", "Markdown snippet copied");
      // reset after short delay
      setTimeout(() => setCopyState({ copying: false, success: false }), 1800);
    } catch (err) {
      console.error(err);
      setCopyState({ copying: false, success: false });
      showToast("error", "Copy failed");
    }
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

  // fetch random-ish profiles (uses search with a random page)
  async function fetchRandomProfiles() {
    setLoadingRandom(true);
    try {
      // choose a random page between 1..20 to get variety (unauthenticated limited)
      const page = Math.floor(Math.random() * 20) + 1;
      // query: users with at least 10 followers to avoid bots
      const params = new URLSearchParams({ q: "followers:>10", per_page: String(RANDOM_PROFILES_COUNT), page: String(page) });
      const res = await fetch(`${GITHUB_SEARCH_API}?${params.toString()}`);
      if (!res.ok) {
        setRandomProfiles([]);
        setLoadingRandom(false);
        return;
      }
      const json = await res.json();
      setRandomProfiles(json.items || []);
    } catch (err) {
      console.error(err);
      setRandomProfiles([]);
    } finally {
      setLoadingRandom(false);
    }
  }

  // copy raw response JSON
  async function copyRawResponse() {
    if (!userRawJson) return showToast("info", "No raw response");
    try {
      await navigator.clipboard.writeText(prettyJSON(userRawJson));
      showToast("success", "Raw user JSON copied");
    } catch {
      showToast("error", "Copy failed");
    }
  }

  // initial load
  useEffect(() => {
    fetchUser(DEFAULT_USER);
    fetchRandomProfiles();

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (searchAbort.current) searchAbort.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createdAt = useMemo(() => {
    if (!currentUser?.created_at) return null;
    try {
      return new Date(currentUser.created_at).toLocaleDateString();
    } catch {
      return null;
    }
  }, [currentUser]);

  const [avatarErr, setAvatarErr] = useState(false);

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg flex items-center gap-2", isDark ? "bg-black/40" : "bg-white/95")}>
            <Github className="w-6 h-6" />
            <div className="block">
              <h1 className="text-xl font-extrabold leading-none">ReadMe — GitHub Stats</h1>
              <div className="text-xs opacity-70">Beautiful, shareable GitHub stats & quick profile explorer</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">Quick actions</h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start cursor-pointer" onClick={copyMarkdown}><Copy className="mr-2" /> Copy Markdown</Button>
                  <Button className="w-full justify-start cursor-pointer" onClick={openStatsNewTab}><ExternalLink className="mr-2" /> Open Stats</Button>
                  <Button className="w-full justify-start cursor-pointer" onClick={downloadSvg}><Download className="mr-2" /> Download SVG</Button>
                  <Button className="w-full justify-start cursor-pointer" onClick={() => setSvgOpen(true)}><ImageIcon className="mr-2" /> View Large</Button>
                  <Button className="w-full justify-start cursor-pointer" onClick={toggleRawSvg}><List className="mr-2" /> Toggle Raw SVG</Button>
                </div>

                <Separator className="my-4" />

                <div className="text-sm">
                  <div className="text-xs opacity-60">Uploaded file</div>
                  <div className="break-all text-sm mt-1">{UPLOADED_FILE_PATH}</div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop search */}
          <form onSubmit={handleSearchSubmit} className={clsx("hidden md:flex items-center gap-2 w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/50 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search GitHub username"
              placeholder="Search GitHub username (e.g. octocat)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="outline" onClick={() => fetchUser(DEFAULT_USER)} className="cursor-pointer">Default</Button>
            <Button type="submit" variant="outline" className="cursor-pointer"><Search /></Button>
          </form>

          {/* Small quick buttons (desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={fetchRandomProfiles} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer">
              <Zap /> Refresh suggestions
            </motion.button>
          </div>
        </div>
      </header>

      {/* Suggestions (mobile & desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
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

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
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
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    {currentUser?.name || currentUser?.login || "—"}
                    {currentUser?.site_admin && <span className="text-xs px-2 py-1 rounded bg-yellow-600 text-black">STAFF</span>}
                  </h2>
                  <div className="text-sm opacity-60 flex items-center gap-2"><FileText className="w-4 h-4" /> {currentUser?.bio || currentUser?.company || "—"}</div>
                  <div className="mt-2 text-xs opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> {currentUser?.location || "-"}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { if (currentUser?.html_url) window.open(currentUser.html_url, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
                  <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(currentUser?.html_url || ""); showToast("success", "Profile URL copied"); }} className="cursor-pointer"><LinkIcon /></Button>
                </div>
                <div className="text-xs opacity-60">Repos: <span className="font-medium">{currentUser?.public_repos ?? "—"}</span></div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* SVG preview */}
              <div className="w-full rounded-lg border overflow-hidden">
                <img
                  src={statsUrl}
                  alt={`${currentUser?.login || query}-github-stats`}
                  className="w-full block"
                  onError={() => showToast("error", "Failed to load stats image")}
                />
              </div>

              <div className="mt-4 text-sm opacity-70 grid grid-cols-2 gap-2">
                <div>Username: <span className="font-medium">{currentUser?.login ?? "—"}</span></div>
                <div>Followers: <span className="font-medium">{currentUser?.followers ?? "—"}</span></div>
                <div>Following: <span className="font-medium">{currentUser?.following ?? "—"}</span> </div>
                <div>Created: <span className="font-medium">{createdAt ?? "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Random profiles horizontal scroll */}
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users />
                <CardTitle className="text-sm">Discover profiles</CardTitle>
              </div>
              <div className="text-xs opacity-60">{RANDOM_PROFILES_COUNT} picks</div>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="w-full">
                <div className="grid grid-cols-2 gap-3 overflow-auto py-2">
                  {loadingRandom ? (
                    <div className="p-4 opacity-60">Loading…</div>
                  ) : randomProfiles.length === 0 ? (
                    <div className="p-4 text-sm opacity-60">No suggestions — try refresh</div>
                  ) : (
                    randomProfiles.map((p) => (
                      <div key={p.id} onClick={() => pickSuggestion(p)} className="min-w-[200px] p-3 rounded-lg border hover:shadow cursor-pointer">
                        <div className="flex items-center gap-3">
                          <img src={p.avatar_url} alt={p.login} className="w-12 h-12 rounded-md object-cover" />
                          <div>
                            <div className="font-medium truncate w-30">{p.login}</div>
                            <div className="text-xs opacity-60">Score: {Math.round((p.score || 0) * 100) / 100}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        {/* Center: Full details / rebuilt preview */}
        <section className="lg:col-span-5 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <CardTitle className="text-lg">Profile & Insights</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setShowRawResponse((s) => !s); }} className="cursor-pointer">
                  {showRawResponse ? <Check className="mr-2" /> : <List className="mr-2" />} {showRawResponse ? "Raw On" : "Raw Off"}
                </Button>
                <Button variant="ghost" onClick={copyRawResponse} className="cursor-pointer"><Copy /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loadingUser ? (
                <div className="py-12 text-center"><ImageIcon className="animate-spin mx-auto" /></div>
              ) : !currentUser ? (
                <div className="py-12 text-center text-sm opacity-60">No user loaded — search above.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-md border flex items-center gap-3">
                      <Star />
                      <div>
                        <div className="text-xs opacity-60">Stars (total)</div>
                        <div className="text-sm font-medium">{/* total stars unknown without aggregation */ "—"}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-md border flex items-center gap-3">
                      <Users />
                      <div>
                        <div className="text-xs opacity-60">Followers</div>
                        <div className="text-sm font-medium">{currentUser.followers}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-md border flex items-center gap-3">
                      <Clock />
                      <div>
                        <div className="text-xs opacity-60">Joined</div>
                        <div className="text-sm font-medium">{createdAt}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-md border flex items-center gap-3">
                      <LinkIcon />
                      <div>
                        <div className="text-xs opacity-60">Blog</div>
                        <div className="text-sm font-medium">{currentUser.blog ? <a href={currentUser.blog.startsWith("http") ? currentUser.blog : `https://${currentUser.blog}`} target="_blank" rel="noreferrer" className="underline">{currentUser.blog}</a> : "—"}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight />
                        <div className="text-xs opacity-60">Top repositories</div>
                      </div>
                      <div className="text-xs opacity-60">Sorted by stars</div>
                    </div>

                    <div className="grid gap-2">
                      {topRepos.length === 0 ? (
                        <div className="text-sm opacity-60">No repos to show</div>
                      ) : topRepos.map((r) => (
                        <a key={r.id} href={r.html_url} target="_blank" rel="noreferrer" className="p-3 rounded-md border hover:shadow flex items-start gap-3 cursor-pointer">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">{r.name} <span className="text-xs opacity-60">• {r.language || "—"}</span></div>
                            <div className="text-xs opacity-60 mt-1">{r.description || "No description"}</div>
                          </div>
                          <div className="text-xs opacity-60 flex flex-col items-end">
                            <div className="flex items-center gap-1"><Star className="w-4 h-4" /> {r.stargazers_count}</div>
                            <div className="text-xs opacity-60 mt-2"><Clock className="w-4 h-4" /> {new Date(r.updated_at).toLocaleDateString()}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {showRawResponse && (
                    <div>
                      <div className="text-xs opacity-60">Raw API response</div>
                      <pre className="mt-2 text-xs overflow-auto p-3 rounded-md border" style={{ maxHeight: 240 }}>
                        {prettyJSON(userRawJson || {})}
                      </pre>
                    </div>
                  )}

                  <div>
                    <div className="text-xs opacity-60">Profile fields</div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Company</div>
                        <div className="font-medium">{currentUser.company || "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Email</div>
                        <div className="font-medium">{currentUser.email || "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Location</div>
                        <div className="font-medium">{currentUser.location || "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Public gists</div>
                        <div className="font-medium">{currentUser.public_gists}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: Quick actions / meta */}
        <aside className={clsx("lg:col-span-3 space-y-4 p-4 rounded-2xl", isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2"><Menu /> Quick actions</div>
              <div className="text-xs opacity-60">Context & tools</div>
            </div>
            <div className="text-xs opacity-60">#{currentUser?.id ?? "—"}</div>
          </div>

          <div className="space-y-2">
      

            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={openStatsNewTab}><ExternalLink className="mr-2" /> Open Stats</Button>
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={downloadSvg}><Download className="mr-2" /> Download SVG</Button>
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={() => setSvgOpen(true)}><ImageIcon className="mr-2" /> View Large</Button>
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={toggleRawSvg}><List className="mr-2" /> Toggle Raw SVG</Button>
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
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{(currentUser?.login || query) + " — GitHub stats"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={statsUrl} alt="GitHub stats large" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">SVG by github-readme-stats</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSvgOpen(false)} className="cursor-pointer"><Star /></Button>
              <Button variant="outline" onClick={() => openStatsNewTab()} className="cursor-pointer"><ExternalLink /></Button>
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
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(rawSvg || ""); showToast("success", "SVG copied"); }} className="cursor-pointer"><Copy /></Button>
              <Button variant="ghost" onClick={() => setShowRawSvg(false)} className="cursor-pointer"><List /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

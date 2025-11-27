// src/pages/GitHubUserPage.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Search,
  Star,
  StarOff,
  Menu,
  User,
  Users,
  BookOpen,
  Link as LinkIcon,
  Copy as CopyIcon,
  Github,
  Eye,
  X,
  Check,
  Code,
  RefreshCw,
  ExternalLink,
  Clock,
} from "lucide-react";

import { showToast } from "../lib/ToastHelper";

/* shadcn ui */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

/* theme handler */
import { useTheme } from "@/components/theme-provider";

/* API BASE */
const BASE_ENDPOINT = "https://api.github.com/users/";

export default function GitHubUserPage() {
  /* theme */
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* states */
  const [query, setQuery] = useState("octocat");
  const [userData, setUserData] = useState(null);
  const [rawUserData, setRawUserData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);

  /* saved favorites */
  const [favorites, setFavorites] = useState([]);

  /* mobile sidebar */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* show suggestions */
  const [showSuggest, setShowSuggest] = useState(false);

  /* random profiles list */
  const [randomProfiles, setRandomProfiles] = useState([]);

  /* raw view toggle */
  const [showRaw, setShowRaw] = useState(false);

  const searchRef = useRef(null);

  /* Load favorites from localStorage */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("github_favs") || "[]");
      setFavorites(saved);
    } catch (err) {
      console.error("LocalStorage read error", err);
    }
  }, []);

  /** Save favorites to localStorage */
  function saveFavorite(username) {
    if (favorites.includes(username)) {
      showToast("info", "Already saved");
      return;
    }

    const stored = [...favorites, username];
    setFavorites(stored);
    localStorage.setItem("github_favs", JSON.stringify(stored));

    showToast("success", `Saved @${username}`);
  }

  /** Remove favorite */
  function removeFavorite(username) {
    const updated = favorites.filter((u) => u !== username);
    setFavorites(updated);
    localStorage.setItem("github_favs", JSON.stringify(updated));
    showToast("info", `Removed @${username}`);
  }

  /** Fetch user details */
  async function fetchUser(username) {
    if (!username) return;

    try {
      setLoadingUser(true);
      setShowRaw(false);
      setUserData(null);
      setRawUserData(null);

      const res = await fetch(BASE_ENDPOINT + username);

      if (!res.ok) {
        showToast("error", "User not found");
        setUserData(null);
        setRawUserData(null);
        return;
      }

      const data = await res.json();
      setUserData(data);
      setRawUserData(data);

      showToast("success", `Fetched @${username}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch user");
    } finally {
      setLoadingUser(false);
    }
  }

  /** Suggestions while typing */
  async function fetchSuggestions(text) {
    if (!text || text.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);

      const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(text)}&per_page=6`);
      const data = await res.json();

      if (data?.items) {
        setSuggestions(data.items.slice(0, 6)); // limit to 6 suggestions
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  /* fetch the default user */
  useEffect(() => {
    fetchUser("octocat");
    fetchRandomProfiles();
  }, []);

  /* handler: when user types */
  function onChangeQuery(value) {
    setQuery(value);
    setShowSuggest(true);
    fetchSuggestions(value);
  }

  /* Fetch 10 random profiles */
  async function fetchRandomProfiles() {
    try {
      setLoadingRandom(true);
      // pick a random "since" id to page
      const since = Math.floor(Math.random() * 50000) + 1;
      const res = await fetch(`https://api.github.com/users?since=${since}&per_page=10`);
      if (!res.ok) {
        setRandomProfiles([]);
        return;
      }
      const data = await res.json();
      setRandomProfiles(data.slice(0, 10));
    } catch (err) {
      console.error(err);
      setRandomProfiles([]);
    } finally {
      setLoadingRandom(false);
    }
  }

  return (
    <div
      className={clsx(
        "min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto transition-colors",
        
      )}
    >
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-start gap-3 w-full">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={clsx("md:hidden p-2", isDark ? "text-zinc-100" : "text-zinc-800")}
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className={clsx(
                  isDark ? "bg-zinc-900 text-white" : "bg-white text-black"
                )}
              >
                <SidebarContent
                  isDark={isDark}
                  favorites={favorites}
                  fetchUser={(u) => {
                    fetchUser(u);
                    setSidebarOpen(false);
                  }}
                  removeFavorite={removeFavorite}
                />
              </SheetContent>
            </Sheet>

            <div>
              <h1
                className={clsx(
                  "text-2xl md:text-3xl font-extrabold tracking-tight",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                Revolyx · GitHub Explorer
              </h1>
              <p className={clsx("text-sm mt-0.5", isDark ? "text-zinc-300" : "text-slate-600")}>
                Search profiles, save favorites, inspect raw JSON, and explore random users.
              </p>
            </div>
          </div>

          {/* Desktop sidebar quick trigger */}
          <div className="ml-auto hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRandomProfiles()}
              className="cursor-pointer"
            >
              <RefreshCw size={16} /> Random 10
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar */}
        <aside
          className={clsx(
            "hidden lg:block p-4 rounded-xl border h-[80vh] overflow-hidden",
            isDark ? "bg-black border-zinc-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}
        >
          <SidebarContent
            isDark={isDark}
            favorites={favorites}
            fetchUser={fetchUser}
            removeFavorite={removeFavorite}
          />
        </aside>

        {/* RIGHT / CENTER CONTENT */}
        <section className="lg:col-span-3 space-y-6">
          {/* SEARCH + RANDOM ROW */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Input
                ref={searchRef}
                placeholder="Search GitHub username…"
                value={query}
                onChange={(e) => onChangeQuery(e.target.value)}
                className={clsx(
                  "pr-10",
                  isDark ? "bg-zinc-800 text-white border-zinc-700" : "bg-white text-slate-900 border-slate-200"
                )}
                onFocus={() => setShowSuggest(true)}
              />
              <Search
                className={clsx("absolute right-3 top-2.5 pointer-events-none", isDark ? "text-zinc-400" : "text-slate-400")}
                size={18}
              />
              <AnimatePresence>
                {showSuggest && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={clsx(
                      "absolute left-0 right-0 mt-2 rounded-xl border p-2 z-30 shadow-xl",
                      isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-slate-200"
                    )}
                  >
                    {loadingSuggestions && (
                      <div className="text-xs opacity-60 py-2 text-center">
                        Searching…
                      </div>
                    )}

                    {suggestions.map((s) => (
                      <div
                        key={s.login}
                        className={clsx(
                          "p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-all",
                          isDark
                            ? "hover:bg-zinc-800/50"
                            : "hover:bg-slate-100"
                        )}
                        onClick={() => {
                          setQuery(s.login);
                          setShowSuggest(false);
                          fetchUser(s.login);
                        }}
                      >
                        <img
                          src={s.avatar_url}
                          alt={s.login}
                          className="w-8 h-8 rounded-full border"
                        />
                        <span className="font-medium">{s.login}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant="default"
                onClick={() => fetchUser(query)}
                className="cursor-pointer"
              >
                <User size={16} /> Fetch
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setShowSuggest(false);
                  searchRef.current?.focus?.();
                }}
                className="cursor-pointer"
              >
                Clear
              </Button>

              <Button
                variant="ghost"
                className="hidden md:flex cursor-pointer"
                onClick={() => fetchRandomProfiles()}
                title="Load 10 random profiles"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>

          {/* RANDOM PROFILES ROW */}
          <Card
            className={clsx(
              "rounded-2xl border",
              isDark ? "bg-black border-zinc-700 text-white" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <CardHeader className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Clock size={18} />
                <div>
                  <h3 className="font-semibold">Discover — 10 Random Profiles</h3>
                  <p className="text-xs opacity-70">Quickly explore random GitHub users.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => fetchRandomProfiles()} className="cursor-pointer">
                  <RefreshCw size={14} /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRandomProfiles([])} className="cursor-pointer">
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <div className="flex gap-3">
                  {loadingRandom ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-pulse h-20 w-20 rounded-lg bg-zinc-700/30" />
                      <div className="animate-pulse h-20 w-20 rounded-lg bg-zinc-700/30" />
                      <div className="animate-pulse h-20 w-20 rounded-lg bg-zinc-700/30" />
                    </div>
                  ) : randomProfiles?.length ? (
                    randomProfiles.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                          "flex-shrink-0 w-50 p-3 rounded-xl border cursor-pointer shadow-sm",
                          isDark ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-700/60" : "bg-white border-slate-200 hover:bg-slate-50"
                        )}
                        onClick={() => fetchUser(p.login)}
                        title={`Open @${p.login}`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={p.avatar_url} alt={p.login} className="w-12 h-12 rounded-full border" />
                          <div className="flex-1">
                            <div className="font-semibold text-sm truncate">@{p.login}</div>
                            <div className="text-xs opacity-60">ID: {p.id}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="icon" variant="ghost" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); saveFavorite(p.login); }}>
                            <Star size={14} />
                          </Button>
                          <Button size="icon" variant="ghost" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(BASE_ENDPOINT + p.login); showToast("success", "Endpoint copied"); }}>
                            <CopyIcon size={14} />
                          </Button>
                          <Button size="icon" variant="ghost" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(p.html_url, "_blank"); }}>
                            <ExternalLink size={14} />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sm opacity-60">No random users found.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* USER PREVIEW CARD */}
          <Card
            className={clsx(
              "rounded-2xl border overflow-hidden",
              isDark ? "bg-black border-zinc-700 text-white" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            {loadingUser ? (
              <LoadingCard isDark={isDark} />
            ) : userData ? (
              <UserCard
                isDark={isDark}
                user={userData}
                rawUser={rawUserData}
                saveFavorite={saveFavorite}
                favorites={favorites}
                copyEndpoint={(text) => {
                  navigator.clipboard.writeText(text);
                  showToast("success", "Endpoint copied");
                }}
                showRaw={showRaw}
                setShowRaw={setShowRaw}
              />
            ) : (
              <div className="p-6 text-center opacity-60 text-sm">
                No user data yet — search or click a random profile.
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

/* --------------------------------------------- */
/* ------------ SIDEBAR CONTENT ---------------- */
/* --------------------------------------------- */
function SidebarContent({ isDark, favorites, fetchUser, removeFavorite }) {
  return (
    <ScrollArea className="h-full pt-6 p-3">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Star className="text-yellow-400" /> Saved Users
      </h2>

      {favorites.length === 0 && (
        <p className="text-sm opacity-60 mb-4">No saved users yet. Save a user from the profile card or the random list.</p>
      )}

      <div className="space-y-3">
        {favorites.map((u) => (
          <div
            key={u}
            className={clsx(
              "flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all",
              isDark
                ? "border-zinc-700 hover:bg-zinc-800/50"
                : "border-slate-200 hover:bg-slate-50"
            )}
          >
            <button onClick={() => fetchUser(u)} className="flex-1 text-left cursor-pointer">
              @{u}
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={() => fetchUser(u)}
                title="Open"
              >
                <ExternalLink size={14} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={() => removeFavorite(u)}
                title="Remove"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <p className="text-sm opacity-70">
        Saved locally on your browser. Clearing browser data will remove them.
      </p>
    </ScrollArea>
  );
}

/* --------------------------------------------- */
/* ---------------- USER CARD ------------------ */
/* --------------------------------------------- */

function UserCard({ isDark, user, rawUser, saveFavorite, favorites, copyEndpoint, showRaw, setShowRaw }) {
  return (
    <>
      <CardHeader className="p-6">
        <div className="flex items-start gap-4">
          <img
            src={user.avatar_url}
            className="w-24 h-24 rounded-full border shadow"
            alt={`${user.login} avatar`}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {user.name || user.login}
                  <a href={user.html_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline text-sm opacity-80">
                    <Github size={16} /> @{user.login}
                  </a>
                </CardTitle>
                <p className="text-sm opacity-70 mt-1">{user.bio}</p>
              </div>

            </div>

            <div className="mt-3 flex items-center gap-3">
              <small className="text-xs opacity-60">{user.location || "Location not set"}</small>
              {user.company && <small className="text-xs opacity-60">• {user.company}</small>}
              <small className="text-xs opacity-60">• Joined: {new Date(user.created_at).toLocaleDateString()}</small>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={<Users size={18} />} label="Followers" value={user.followers} />
          <Stat icon={<Users size={18} />} label="Following" value={user.following} />
          <Stat icon={<BookOpen size={18} />} label="Repos" value={user.public_repos} />
          <Stat icon={<Eye size={18} />} label="Gists" value={user.public_gists} />
        </div>

        <Separator className="my-2" />

        {/* LINKS & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <LinkRow label="Profile" url={user.html_url} />
            {user.blog && <LinkRow label="Website" url={user.blog} />}
            {user.twitter_username && <LinkRow label="Twitter" url={`https://twitter.com/${user.twitter_username}`} />}
          </div>

          <div className="flex items-center gap-3">
         

            <Button variant="outline" size="sm" onClick={() => window.open(user.html_url, "_blank")} className="cursor-pointer">
              <ExternalLink size={14} /> Open GitHub
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">
              <Code size={14} /> {showRaw ? "Hide Raw" : "Show Raw"}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showRaw && (
            <motion.pre
              key="raw"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={clsx("overflow-auto p-3 rounded-md text-xs border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-200")}
            >
              {JSON.stringify(rawUser || user, null, 2)}
            </motion.pre>
          )}
        </AnimatePresence>
      </CardContent>
    </>
  );
}

/* --------------------------------------------- */
/* ---------------- SMALL COMPONENTS ----------- */
/* --------------------------------------------- */

function Stat({ icon, label, value }) {
  return (
    <div className="p-3 rounded-xl border border-zinc-700/10 bg-transparent text-center">
      <div className="flex justify-center mb-1 opacity-90">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}

function LinkRow({ label, url }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <LinkIcon size={14} />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline opacity-85 hover:opacity-100 break-all"
      >
        {label}: {url}
      </a>
    </div>
  );
}

function LoadingCard({ isDark }) {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className={clsx("h-20 w-20 rounded-full", isDark ? "bg-zinc-700/30" : "bg-slate-200")} />
        <div className={clsx("h-4 rounded w-32", isDark ? "bg-zinc-700/30" : "bg-slate-200")} />
        <div className={clsx("h-3 rounded w-52", isDark ? "bg-zinc-700/30" : "bg-slate-200")} />
        <div className={clsx("h-3 rounded w-full", isDark ? "bg-zinc-700/30" : "bg-slate-200")} />
        <div className={clsx("h-3 rounded w-3/4", isDark ? "bg-zinc-700/30" : "bg-slate-200")} />
      </div>
    </div>
  );
}

/* --------------------------------------------- */
/* ---------------- Copy Button ---------------- */
/* --------------------------------------------- */

function CopyButton({ textToCopy, onCopied = () => {}, small = false }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e?.stopPropagation?.();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onCopied();
      // reset after brief moment
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("Copy failed", err);
      showToast("error", "Copy failed");
    }
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.96 }}
      className={clsx(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 border hover:shadow-sm cursor-pointer select-none",
        small ? "text-sm" : ""
      )}
      aria-label="Copy to clipboard"
    >
      <AnimatePresence initial={false}>
        {!copied ? (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="inline-flex items-center gap-2"
          >
            <CopyIcon size={14} /> Copy
          </motion.span>
        ) : (
          <motion.span
            key="check"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="inline-flex items-center gap-2 text-green-400"
          >
            <Check size={14} /> Copied
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

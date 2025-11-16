// src/pages/GitHubUserPage.jsx
"use client";

import React, { useEffect, useState } from "react";
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
  Copy,
  Github,
  Eye,
  X,
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
  const [suggestions, setSuggestions] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  /* saved favorites */
  const [favorites, setFavorites] = useState([]);

  /* mobile sidebar */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* show suggestions */
  const [showSuggest, setShowSuggest] = useState(false);

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

      const res = await fetch(BASE_ENDPOINT + username);

      if (!res.ok) {
        showToast("error", "User not found");
        setUserData(null);
        return;
      }

      const data = await res.json();
      setUserData(data);

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

      const res = await fetch(`https://api.github.com/search/users?q=${text}`);
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
  }, []);

  /* handler: when user types */
  function onChangeQuery(value) {
    setQuery(value);
    setShowSuggest(true);
    fetchSuggestions(value);
  }

  return (
    <div
      className={clsx(
        "min-h-screen p-6 max-w-8xl mx-auto transition-colors",
        isDark ? "bg-black" : "bg-white"
      )}
    >
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1
            className={clsx(
              "text-3xl md:text-4xl font-extrabold",
              isDark ? "text-zinc-50" : "text-zinc-900"
            )}
          >
            Revolyx · GitHub User API
          </h1>
          <p
            className={clsx(
              "text-sm mt-1",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            Enter a GitHub username to fetch their public profile.
          </p>
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="md:hidden cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu />
            </Button>
          </SheetTrigger>

          {/* Mobile Sidebar */}
          <SheetContent
            side="left"
            className={clsx(
              isDark ? "bg-black text-white" : "bg-white text-black"
            )}
          >
            <SidebarContent
              isDark={isDark}
              favorites={favorites}
              fetchUser={fetchUser}
              removeFavorite={removeFavorite}
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* MAIN GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <aside
          className={clsx(
            "hidden lg:block p-4 rounded-xl border h-[80vh]",
            isDark ? "bg-black/40 border-zinc-800 text-white" : "bg-white/80 border-zinc-200 text-black"
          )}
        >
          <SidebarContent
            isDark={isDark}
            favorites={favorites}
            fetchUser={fetchUser}
            removeFavorite={removeFavorite}
          />
        </aside>

        {/* RIGHT CONTENT */}
        <section className="lg:col-span-3 space-y-8">

          {/* SEARCH BOX */}
          <div className="relative">
            <Input
              placeholder="Search GitHub username…"
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              className={clsx(
                isDark
                  ? "bg-black/40 text-white border-zinc-700"
                  : "bg-white text-black border-zinc-300"
              )}
              onFocus={() => setShowSuggest(true)}
            />

            <Search
              className={clsx(
                "absolute right-3 top-2.5",
                isDark ? "text-zinc-400" : "text-zinc-600"
              )}
              size={18}
            />

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggest && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={clsx(
                    "absolute left-0 right-0 mt-2 rounded-xl border p-2 z-30 shadow-xl",
                    isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
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
                          : "hover:bg-zinc-100"
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
                        className="w-7 h-7 rounded-full border"
                      />
                      <span>{s.login}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* USER PREVIEW CARD */}
          <Card
            className={clsx(
              "rounded-2xl border",
              isDark
                ? "bg-black/40 border-zinc-800 text-white"
                : "bg-white/80 border-zinc-200 text-black"
            )}
          >
            {loadingUser ? (
              <LoadingCard isDark={isDark} />
            ) : userData ? (
              <UserCard
                isDark={isDark}
                user={userData}
                saveFavorite={saveFavorite}
                favorites={favorites}
                copyEndpoint={() => {
                  navigator.clipboard.writeText(BASE_ENDPOINT + userData.login);
                  showToast("success", "Endpoint copied");
                }}
              />
            ) : (
              <div className="p-6 text-center opacity-60 text-sm">
                No user data found.
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
    <ScrollArea className="h-full pt-10 p-3">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Star className="text-yellow-500" /> Saved Users
      </h2>

      {favorites.length === 0 && (
        <p className="text-sm opacity-60 mb-4">No saved users yet.</p>
      )}

      <div className="space-y-3">
        {favorites.map((u) => (
          <div
            key={u}
            className={clsx(
              "flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all",
              isDark
                ? "border-zinc-700 hover:bg-zinc-800/50"
                : "border-zinc-300 hover:bg-zinc-100"
            )}
          >
            <span
              onClick={() => fetchUser(u)}
              className="flex-1 cursor-pointer"
            >
              @{u}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={() => removeFavorite(u)}
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <p className="text-sm opacity-70">
        These are saved locally on your browser.
      </p>
    </ScrollArea>
  );
}

/* --------------------------------------------- */
/* ---------------- USER CARD ------------------ */
/* --------------------------------------------- */

function UserCard({ isDark, user, saveFavorite, favorites, copyEndpoint }) {
  return (
    <>
      <CardHeader className="p-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar_url}
            className="w-20 h-20 rounded-full border shadow"
            alt="profile"
          />
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              {user.name || user.login}
              <Github size={20} />
            </CardTitle>
            <p className="text-sm opacity-70">@{user.login}</p>

            {/* Favorite Button */}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 cursor-pointer"
              onClick={() => {
                if (favorites.includes(user.login)) {
                  showToast("info", "Already saved");
                } else {
                  saveFavorite(user.login);
                }
              }}
            >
              <Star size={15} />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* BASIC INFO */}
        {user.bio && (
          <p className={clsx("text-sm", isDark ? "text-zinc-300" : "text-zinc-700")}>
            {user.bio}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Stat icon={<Users size={18} />} label="Followers" value={user.followers} />
          <Stat icon={<Users size={18} />} label="Following" value={user.following} />
          <Stat icon={<BookOpen size={18} />} label="Repos" value={user.public_repos} />
          <Stat icon={<Eye size={18} />} label="Gists" value={user.public_gists} />
        </div>

        <Separator className="my-4" />

        {/* LINKS */}
        <div className="flex flex-col gap-2">
          <LinkRow label="Profile" url={user.html_url} />
          {user.blog && <LinkRow label="Website" url={user.blog} />}
          {user.twitter_username && (
            <LinkRow label="Twitter" url={`https://twitter.com/${user.twitter_username}`} />
          )}
        </div>

        <Separator className="my-4" />

        {/* QUICK ACTIONS */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={copyEndpoint} className="cursor-pointer">
            <Copy size={14} /> Copy Endpoint
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(user, null, 2));
              showToast("success", "JSON copied");
            }}
            className="cursor-pointer"
          >
            <Copy size={14} /> Copy JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(user.html_url, "_blank")}
            className="cursor-pointer"
          >
            <Github size={14} /> Open GitHub
          </Button>
        </div>
      </CardContent>
    </>
  );
}

/* --------------------------------------------- */
/* ---------------- SMALL COMPONENTS ----------- */
/* --------------------------------------------- */

function Stat({ icon, label, value }) {
  return (
    <div className="p-3 rounded-xl border border-zinc-700/40 bg-black/20 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}

function LinkRow({ label, url }) {
  return (
    <div className="flex items-center gap-2">
      <LinkIcon size={14} />
      <a
        href={url}
        target="_blank"
        className="underline text-sm opacity-80 hover:opacity-100"
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
        <div className="h-20 w-20 bg-zinc-700/40 rounded-full" />
        <div className="h-4 bg-zinc-700/40 rounded w-32" />
        <div className="h-3 bg-zinc-700/40 rounded w-52" />
        <div className="h-3 bg-zinc-700/40 rounded w-full" />
        <div className="h-3 bg-zinc-700/40 rounded w-3/4" />
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";

import {
  Layers,
  Copy,
  Loader2,
  GitCompare,
  Settings,
  Search,
  X,
} from "lucide-react";

import MDEditor from "@uiw/react-md-editor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import index from "@/data/aiPromptIndex.json";
import { showToast } from "@/lib/ToastHelper";
import { useTheme } from "../components/theme-provider";

/* ---------------- CONSTANTS ---------------- */

const RAW_BASE =
  "https://raw.githubusercontent.com/x1xhlol/system-prompts-and-models-of-ai-tools/main/";

const CACHE = new Map();

const TOKEN_RULES = {
  gpt: { ratio: 1.33, cost: 0.002 },
  claude: { ratio: 1.25, cost: 0.003 },
};

/* ---------------- HELPERS ---------------- */

function getModelRule(model) {
  if (!model) return TOKEN_RULES.gpt;
  return model.toLowerCase().includes("claude")
    ? TOKEN_RULES.claude
    : TOKEN_RULES.gpt;
}

function getStats(text, model) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const rule = getModelRule(model);
  const tokens = Math.round(words * rule.ratio);
  const cost = ((tokens / 1000) * rule.cost).toFixed(4);
  return { chars, words, tokens, cost };
}

function diffLines(a, b) {
  const A = a.split("\n");
  const B = b.split("\n");
  const max = Math.max(A.length, B.length);

  return Array.from({ length: max }).map((_, i) => {
    if (A[i] !== B[i]) {
      return {
        type: !A[i] ? "added" : !B[i] ? "removed" : "modified",
        left: A[i] || "",
        right: B[i] || "",
      };
    }
    return { type: "same", left: A[i], right: B[i] };
  });
}

/* ---------------- COMPONENT ---------------- */

export default function PromptsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [model, setModel] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [comparePrompt, setComparePrompt] = useState(null);

  const [promptText, setPromptText] = useState("");
  const [compareText, setCompareText] = useState("");

  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareView, setCompareView] = useState("side");

  const [fileSearch, setFileSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  const [showCompareOverlay, setShowCompareOverlay] = useState(false);

  /* ---------------- MODELS ---------------- */

  const models = useMemo(() => Object.keys(index).sort(), []);

  useEffect(() => {
    if (!models.length) return;
    setModel(models[0]);
    setSelectedPrompt(index[models[0]][0]);
  }, [models]);

  /* ---------------- UNIVERSAL SEARCH ---------------- */

  const prompts = useMemo(() => {
    if (!model) return [];

    return index[model].filter((p) => {
      const q = globalSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(fileSearch.toLowerCase()) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          model.toLowerCase().includes(q))
      );
    });
  }, [model, fileSearch, globalSearch]);

  /* ---------------- LOAD PROMPTS ---------------- */

  async function loadPrompt(p, setter) {
    if (CACHE.has(p.path)) {
      setter(CACHE.get(p.path));
      return;
    }
    const text = await fetch(RAW_BASE + p.path).then((r) => r.text());
    CACHE.set(p.path, text);
    setter(text);
  }

  useEffect(() => {
    if (!selectedPrompt) return;
    setLoading(true);
    loadPrompt(selectedPrompt, setPromptText)
      .catch(() => showToast("error", "Failed to load prompt"))
      .finally(() => setLoading(false));
  }, [selectedPrompt]);

  useEffect(() => {
    if (!comparePrompt) return;
    loadPrompt(comparePrompt, setCompareText);
  }, [comparePrompt]);

  /* ---------------- STATS ---------------- */

  const stats = useMemo(
    () => getStats(promptText, model),
    [promptText, model]
  );

  const diff = useMemo(
    () => diffLines(promptText, compareText),
    [promptText, compareText]
  );

  /* ---------------- RENDER ---------------- */

  return (
    <div className="min-h-screen overflow-hidden max-w-8xl pb-10 mx-auto p-6">
      <Toaster richColors />

      {/* HEADER */}
      <header className="flex flex-wrap justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold flex  items-center gap-2">
          <Layers />
          Prompt Library
        </h1>

        <div className="flex gap-2">
          <Input
            placeholder="Universal search…"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-64"
          />

          <Button
            variant="outline"
            onClick={() => {
              setCompareMode((v) => !v);
              showToast("info", "Compare mode toggled");
            }}
          >
            <GitCompare className="w-4 h-4 mr-1" />
            Compare
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
        {/* LEFT */}
        <aside className="lg:col-span-3">
          <Card className="dark:bg-black/80  bg-white/80 overflow-hidden">
            <CardHeader>
              <CardTitle>Browse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full h-100">
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Search filenames…"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
              />

              <ScrollArea className="h-fit pr-2">
                {prompts.map((p) => (
                  <div
                    key={p.path}
                    onClick={() =>
                      compareMode
                        ? (setComparePrompt(p), setShowCompareOverlay(true))
                        : setSelectedPrompt(p)
                    }
                    className="p-3 mb-2 rounded-lg border cursor-pointer hover:bg-accent/40"
                  >
                    <div className="text-sm font-medium">{p.name}</div>
                    <Badge className="mt-1 backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">{p.category}</Badge>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER */}
        <main className="lg:col-span-6">
          <Card className="h-[700px] flex flex-col dark:bg-black/80 bg-white/80">
            <CardHeader className="flex justify-between">
              <CardTitle>{selectedPrompt?.name}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(promptText);
                  showToast("success", "Copied");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </CardHeader>

            <Separator />

            <CardContent
              id="doc-content"
              className="prose prose-lg dark:prose-invert mt-6 pb-20 no-scrollbar text-neutral-800 dark:text-neutral-200 overflow-auto"
              style={{ maxHeight: "72vh", paddingRight: 18 }}>
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
               
                         <div data-color-mode={isDark ? "dark" : "light"}
            className="prose prose-invert sm:max-w-5xl sm:mx-auto dark:bg-[#0a0a0a] bg-white text-neutral-200  ">
                <div className="wmde-markdown-var"> </div>
                    <MDEditor.Markdown 
                source={promptText}
                className="bg-transparent  sm:text-lg p-10 rounded-xl" // add global ul styles - tutorial
              />
              </div>
                
              )}
            </CardContent>
          </Card>
        </main>
     <aside className="lg:col-span-3">
          <Card className="dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Stat label="Characters" value={stats.chars} />
              <Stat label="Words" value={stats.words} />
              <Stat label="Tokens" value={stats.tokens} />
              <Stat label="Est. Cost" value={`$${stats.cost}`} highlight />
            </CardContent>
          </Card>
        </aside>

      </div>

      {/* FULLSCREEN COMPARE OVERLAY */}
      <AnimatePresence>
        {showCompareOverlay && comparePrompt && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-4 bg-background rounded-xl flex flex-col overflow-hidden">
              <div className="flex justify-between p-4 border-b">
                <h2 className="font-semibold">Compare Prompts</h2>
                <div className="flex gap-2">
                  <Select value={compareView} onValueChange={setCompareView}>
                    <SelectTrigger className="w-28 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="side">Side</SelectItem>
                      <SelectItem className="cursor-pointer" value="diff">Diff</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowCompareOverlay(false)}
                    className="cursor-pointer"
                  >
                    <X />
                  </Button>
                </div>
              </div>

              {compareView === "side" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
                  {[promptText, compareText].map((t, i) => (
                   
            <CardContent
              id="doc-content"
              className="prose prose-lg dark:prose-invert mt-6 pb-20 no-scrollbar text-neutral-800 dark:text-neutral-200 overflow-auto"
              style={{ maxHeight: "72vh", paddingRight: 18 }}>
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
               
                         <div data-color-mode={isDark ? "dark" : "light"}
            className="prose prose-invert sm:max-w-5xl sm:mx-auto dark:bg-[#0a0a0a] bg-white text-neutral-200  ">
                <div className="wmde-markdown-var"> </div>
                    <MDEditor.Markdown 
                source={t}
                className="bg-transparent  sm:text-lg p-10 rounded-xl" // add global ul styles - tutorial
              />
              </div>
                
              )}
              <Separator/>
            </CardContent>
            
                  ))}
                </div>
              ) : (
                <ScrollArea className="flex-1 overflow-y-auto h-200 p-4 font-mono text-xs">
                         {diff.map((d, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "grid  grid-cols-1  sm:grid-cols-2 gap-2 p-1",
                          d.type === "added" && "bg-green-500/10",
                          d.type === "removed" && "bg-red-500/10",
                          d.type === "modified" && "bg-yellow-500/10"
                        )}
                      >
                        <pre className="whitespace-pre-wrap">{d.left}</pre>
                        <pre className="whitespace-pre-wrap">{d.right}</pre>
                      </div>
                    ))}
                </ScrollArea>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- SUB ---------------- */

function Stat({ label, value, highlight }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <Badge className={highlight ? "backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300" : "backdrop-blur-md bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300"}>{value}</Badge>
    </div>
  );
}

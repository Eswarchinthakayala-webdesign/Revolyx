// src/pages/DogAPIPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Menu,
  X,
  Copy,
  RefreshCw,
  Download,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Info,
} from "lucide-react";

/* shadcn-ui */
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/* Syntax Highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* Theme provider */
import { useTheme } from "@/components/theme-provider";

const ENDPOINT = "https://dog.ceo/api/breeds/image/random";

export default function DogAPIPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [dogUrl, setDogUrl] = useState("");
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  /* Fetch dog */
  async function fetchDog() {
    try {
      setLoading(true);
      const res = await fetch(ENDPOINT);
      const json = await res.json();

      if (!json?.message) {
        showToast("error", "Invalid response from API");
        return;
      }

      setDogUrl(json.message);
      setRawData(json);
      showToast("success", "Random dog fetched");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch dog");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDog();
  }, []);

  /* Quick Actions */
  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(ENDPOINT);
    showToast("success", "Endpoint copied");
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(rawData, null, 2));
    showToast("success", "JSON copied");
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dog-api.json";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "JSON downloaded");
  };

  return (
    <div
      className={clsx(
        "min-h-screen p-6 max-w-8xl mx-auto",
        isDark ? "bg-black" : "bg-white"
      )}
    >
      {/* HEADER */}
      <header className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold", isDark ? "text-zinc-50" : "text-zinc-900")}>
            Revolyx · Dog Generator API
          </h1>
          <p className={clsx("text-sm mt-1", isDark ? "text-zinc-300" : "text-zinc-600")}>
            Generate a random dog image using Dog CEO API.
          </p>
        </div>

        {/* Mobile Sidebar */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden cursor-pointer">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[300px] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Actions</div>
              <Button variant="ghost" onClick={() => setSheetOpen(false)} className="cursor-pointer">
                <X />
              </Button>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={fetchDog}>
                <RefreshCw /> Refresh
              </Button>
              <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={handleCopyEndpoint}>
                <Copy /> Copy Endpoint
              </Button>
              <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={handleCopyJSON}>
                <Copy /> Copy JSON
              </Button>
              <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={handleDownloadJSON}>
                <Download /> Download JSON
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside
          className={clsx(
            "hidden lg:block h-[78vh] w-full p-4 rounded-xl border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white/70 border-zinc-200"
          )}
        >
          <h3 className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-800")}>
            Quick Actions
          </h3>
          <Separator className="my-3" />

          <div className="space-y-3">
            <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={fetchDog}>
              <RefreshCw /> Refresh Dog
            </Button>
            <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={handleCopyEndpoint}>
              <Copy /> Copy Endpoint
            </Button>
            <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={handleCopyJSON}>
              <Copy /> Copy JSON
            </Button>
            <Button variant="outline" className="w-full cursor-pointer justify-start" onClick={handleDownloadJSON}>
              <Download /> Download JSON
            </Button>
          </div>

          <Separator className="my-4" />

          <Card
            className={clsx(
              "p-3 rounded-xl border",
              isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200"
            )}
          >
            <div className="text-xs opacity-70">Current Dog Image URL</div>
            <div className="text-[11px] mt-1 break-all">
              {dogUrl ? dogUrl : "—"}
            </div>
          </Card>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* PREVIEW CARD */}
          <Card
            className={clsx(
              "rounded-2xl border overflow-hidden",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200"
            )}
          >
            <CardHeader
              className={clsx(
                "p-5 border-b flex items-center justify-between",
                isDark ? "bg-black/60 border-zinc-800" : "bg-white/80 border-zinc-200"
              )}
            >
              <div>
                <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
                  Dog Image
                </CardTitle>
                <p className={clsx("text-xs mt-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  Random dog generated from Dog CEO API.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" className="cursor-pointer" onClick={fetchDog} disabled={loading}>
                  <RefreshCw className={loading ? "animate-spin" : ""} />
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={() => setImageOpen(true)}>
                  <ImageIcon />
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={() => setShowRaw(!showRaw)}>
                  <Eye /> {showRaw ? "Hide Raw" : "Show Raw"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex justify-center">
              {loading ? (
                <div className="text-center text-sm opacity-70">Loading…</div>
              ) : (
                <img
                  src={dogUrl}
                  alt="Random Dog"
                  className="rounded-xl w-full  object-cover border shadow cursor-pointer"
                  onClick={() => setImageOpen(true)}
                />
              )}
            </CardContent>

            {/* RAW JSON */}
            <AnimatePresence>
              {showRaw && rawData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={clsx(
                    "p-4 border-t",
                    isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200"
                  )}
                >
                  <SyntaxHighlighter
                    language="json"
                    style={isDark ? oneDark : oneLight}
                    customStyle={{ background: "transparent" }}
                  >
                    {JSON.stringify(rawData, null, 2)}
                  </SyntaxHighlighter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* JSON VIEWER SECTION */}
          <Card
            className={clsx(
              "rounded-2xl border",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200"
            )}
          >
            <CardHeader className="flex items-center justify-between">
              <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
                Response JSON
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={handleCopyJSON}>
                  <Copy />
                </Button>
                <Button variant="ghost" className="cursor-pointer" onClick={handleDownloadJSON}>
                  <Download />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg overflow-auto border p-2 max-h-[420px]">
                <SyntaxHighlighter
                  language="json"
                  style={isDark ? oneDark : oneLight}
                  customStyle={{ background: "transparent" }}
                >
                  {JSON.stringify(rawData, null, 2)}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* IMAGE DIALOG */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent
          className={clsx(
            "max-w-md w-full rounded-xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader>
            <DialogTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
              Dog Image
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center p-4">
            <img
              src={dogUrl}
              alt="Dog"
              className="rounded-xl border shadow-lg max-w-full"
            />
          </div>

          <DialogFooter className="flex justify-end p-3 border-t">
            <Button variant="outline" className="cursor-pointer" onClick={() => setImageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

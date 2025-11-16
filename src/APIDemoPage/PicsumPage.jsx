// src/pages/PicsumPage.jsx
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
  Image as ImageIcon,
  Eye,
  Info,
  Link as LinkIcon,
} from "lucide-react";

/* shadcn components */
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

/* syntax highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* theme */
import { useTheme } from "@/components/theme-provider";

const ENDPOINT = "https://picsum.photos/600/400";

export default function PicsumPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [imageUrl, setImageUrl] = useState("");
  const [blobData, setBlobData] = useState(null);
  const [headersInfo, setHeadersInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  /* MOBILE SIDEBAR */
  const [sheetOpen, setSheetOpen] = useState(false);

  /* RAW VIEWER */
  const [showRaw, setShowRaw] = useState(false);

  /* Fetch Picsum Image */
  async function fetchImage() {
    try {
      setLoading(true);

      const res = await fetch(ENDPOINT);

      if (!res.ok) {
        showToast("error", "Failed to fetch image");
        return;
      }

      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);

      setImageUrl(localUrl);
      setBlobData(blob);

      const headerDump = {};
      res.headers.forEach((v, k) => (headerDump[k] = v));
      setHeadersInfo(headerDump);

      showToast("success", "New image fetched");
    } catch (err) {
      console.error(err);
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchImage();
  }, []);

  /* Quick Actions */
  function copyEndpoint() {
    navigator.clipboard.writeText(ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  function copyImageUrl() {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    showToast("success", "Image URL copied");
  }

  function downloadImage() {
    if (!blobData) return;

    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "picsum-image.jpg";
    a.click();

    showToast("success", "Image downloaded");
  }

  function downloadHeadersJSON() {
    const blob = new Blob([JSON.stringify(headersInfo, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "picsum-headers.json";
    a.click();

    showToast("success", "Headers JSON downloaded");
  }

  return (
    <div
      className={clsx(
        "min-h-screen p-6 max-w-8xl mx-auto",
        isDark ? "bg-black" : "bg-white"
      )}
    >
      {/* HEADER */}
      <header className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1
            className={clsx(
              "text-3xl md:text-4xl font-extrabold",
              isDark ? "text-zinc-50" : "text-zinc-900"
            )}
          >
            Revolyx · Picsum Image API
          </h1>
          <p className={clsx("text-sm mt-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
            Generate high-quality random images using Picsum API.
          </p>
        </div>

        {/* MOBILE SIDEBAR BUTTON */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="md:hidden cursor-pointer"
              onClick={() => setSheetOpen(true)}
            >
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-4 w-72">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

            <div className="space-y-3">
              <Button variant="outline" className="w-full cursor-pointer" onClick={fetchImage}>
                <RefreshCw /> Refresh Image
              </Button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={copyEndpoint}>
                <Copy /> Copy Endpoint
              </Button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={copyImageUrl}>
                <LinkIcon /> Copy Image URL
              </Button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={downloadImage}>
                <Download /> Download Image
              </Button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={downloadHeadersJSON}>
                <Download /> Headers JSON
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* MAIN GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR (DESKTOP) */}
        <aside
          className={clsx(
            "hidden lg:block p-4 h-[80vh] rounded-xl border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white/70 border-zinc-200"
          )}
        >
          <h3 className={clsx("text-sm font-semibold mb-2", isDark ? "text-zinc-100" : "text-zinc-900")}>
            Quick Actions
          </h3>

          <Separator className="my-3" />

          <div className="space-y-3">
            <Button variant="outline" className="w-full cursor-pointer" onClick={fetchImage}>
              <RefreshCw /> Refresh
            </Button>

            <Button variant="outline" className="w-full cursor-pointer" onClick={copyEndpoint}>
              <Copy /> Copy Endpoint
            </Button>

            <Button variant="outline" className="w-full cursor-pointer" onClick={copyImageUrl}>
              <LinkIcon /> Copy Image URL
            </Button>

            <Button variant="outline" className="w-full cursor-pointer" onClick={downloadImage}>
              <Download /> Download Image
            </Button>

            <Button variant="outline" className="w-full cursor-pointer" onClick={downloadHeadersJSON}>
              <Info /> Download Headers
            </Button>
          </div>
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
                  Random Image
                </CardTitle>
                <p className={clsx("text-xs mt-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  Click to view fullscreen.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" className="cursor-pointer" onClick={fetchImage}>
                  <RefreshCw className={loading ? "animate-spin" : ""} />
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={() => setImageOpen(true)}>
                  <Eye /> View
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={() => setShowRaw(!showRaw)}>
                  <Info /> {showRaw ? "Hide Headers" : "Show Headers"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex justify-center">
              {loading ? (
                <div className="text-center text-sm opacity-70">Loading…</div>
              ) : (
                <img
                  src={imageUrl}
                  className="rounded-xl max-w-lg shadow-lg cursor-pointer border"
                  onClick={() => setImageOpen(true)}
                  alt="Picsum Random"
                />
              )}
            </CardContent>

            {/* RAW HEADERS viewer */}
            <AnimatePresence>
              {showRaw && (
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
                    {JSON.stringify(headersInfo, null, 2)}
                  </SyntaxHighlighter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>
      </main>

      {/* IMAGE DIALOG */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full rounded-xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader>
            <DialogTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
              Full Image Preview
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center p-4">
            <img
              src={imageUrl}
              alt="Full preview"
              className="rounded-xl max-w-full border shadow-lg"
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

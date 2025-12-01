// src/pages/PlantsPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ImageIcon,
  ExternalLink,
  Download,
  Loader2,
  Copy,
  Leaf,
  Sprout,
  Flower2,
  Droplet,
  SunMedium,
  ThermometerSun,
  Shield,
  Trees,
  Info,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { useTheme } from "@/components/theme-provider";

const LIST_ENDPOINT = "https://perenual.com/api/v2/species-list";
const DETAILS_ENDPOINT = "https://perenual.com/api/v2/species/details";
const API_KEY = "sk-cnlQ6919d214b0f9c13509"; // replace with your key

/* Utility */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function getImageUrl(item) {
  const d = item?.default_image;
  if (!d) return "";
  return (
    d.medium_url ||
    d.regular_url ||
    d.original_url ||
    d.small_url ||
    d.thumbnail ||
    ""
  );
}
function ensureArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

export default function PlantsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selectedPlant, setSelectedPlant] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  // Load Neem on startup
  useEffect(() => {
    fetchDetails(1155);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchSpecies(q) {
    if (!q) return;
    setLoadingSuggest(true);
    try {
      const url = `${LIST_ENDPOINT}?key=${API_KEY}&q=${q}&page=1`;
      const res = await fetch(url);
      const json = await res.json();
      setSuggestions(json?.data || []);
    } catch {
      setSuggestions([]);
    }
    setLoadingSuggest(false);
  }

  async function fetchDetails(id) {
    setLoadingDetails(true);
    try {
      const url = `${DETAILS_ENDPOINT}/${id}?key=${API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      setSelectedPlant(json);
      setRawResp(json);
      setShowRaw(false);
      showToast("success", `Loaded ${json?.common_name || "Plant"}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load plant details");
    }
    setLoadingDetails(false);
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => searchSpecies(v), 300);
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    if (!query) return;
    setLoadingSuggest(true);
    try {
      const url = `${LIST_ENDPOINT}?key=${API_KEY}&q=${query}`;
      const res = await fetch(url);
      const json = await res.json();
      const first = json?.data?.[0];
      if (first) fetchDetails(first.id);
      else showToast("info", "No plants found.");
    } catch {}
    setLoadingSuggest(false);
  }

  function downloadJSON() {
    const data = rawResp || selectedPlant;
    if (!data) return;
    const blob = new Blob([prettyJSON(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `plant.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded");
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(
      `${LIST_ENDPOINT}?key=${API_KEY}&q=${encodeURIComponent(query)}`
    );
    showToast("success", "Endpoint copied");
  }

  return (
    <div className="min-h-screen p-6 pb-10 max-w-8xl mx-auto">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Plant Encyclopedia</h1>
          <p className="text-sm opacity-70">Search species, view detailed plant information.</p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className={clsx(
            "flex items-center gap-2 w-full md:w-[560px] rounded-lg px-3 py-2",
            isDark
              ? "bg-black/50 border border-zinc-800"
              : "bg-white border border-zinc-200"
          )}
        >
          <Search className="opacity-60" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search plants: neem, rose, aloe, ficus..."
            className="border-0 bg-transparent shadow-none"
            onFocus={() => setShowSuggest(true)}
          />
          <Button className="cursor-pointer" type="submit" variant="outline">
            <Search />
          </Button>
        </form>
      </header>

      {/* SUGGESTIONS */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-6 right-6 md:left-auto md:right-auto md:w-[560px] rounded-xl overflow-hidden shadow-xl",
              isDark
                ? "bg-black border border-zinc-800"
                : "bg-white border border-zinc-200"
            )}
          >
            {loadingSuggest && (
              <li className="p-3 text-sm opacity-60">Searching...</li>
            )}
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                onClick={() => {
                  fetchDetails(s.id);
                  setShowSuggest(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getImageUrl(s)}
                    className="w-12 h-10 rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{s.common_name || "Unknown"}</div>
                    <div className="text-xs opacity-60">{s.family || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.cycle || "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* MAIN GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left  */}
        <section className="lg:col-span-9 space-y-4">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden",
              isDark ? "bg-black/40 border border-zinc-800" : "bg-white"
            )}
          >
            {/* Card Header */}
            <CardHeader
              className={clsx(
                "p-5 border-b flex justify-between flex-wrap gap-3",
                isDark ? "border-zinc-800 bg-black/50" : "border-zinc-200"
              )}
            >
              <div>
                <CardTitle>Plant Details</CardTitle>
                <div className="text-xs opacity-60">
                  {selectedPlant?.common_name || "Pick a plant from search"}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() =>
                    selectedPlant?.id
                      ? fetchDetails(selectedPlant.id)
                      : fetchDetails(1155)
                  }
                  variant="outline"
                >
                  <Loader2
                    className={loadingDetails ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw(!showRaw)}>
                  <Info /> Raw JSON
                </Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>
                  <ImageIcon /> Image
                </Button>
                <Button className="cursor-pointer" variant="outline" onClick={downloadJSON}>
                  <Download /> Download
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* LOADING */}
              {loadingDetails ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              ) : !selectedPlant ? (
                <div className="py-12 text-center opacity-60">
                  Search a plant to view details...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* LEFT BLOCK (IMAGE + BASIC INFO) */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl h-fit border space-y-3",
                      isDark
                        ? "bg-black/20 border-zinc-800"
                        : "bg-white border-zinc-200"
                    )}
                  >
                    <img
                      src={getImageUrl(selectedPlant)}
                      className="w-full h-48 object-cover rounded-lg"
                    />

                    <div className="text-xl font-semibold">
                      {selectedPlant.common_name}
                    </div>
                    <div className="text-xs opacity-70 italic">
                      {ensureArray(selectedPlant.scientific_name).join(", ")}
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="opacity-60 text-xs">Family</span>
                        <div className="font-medium">{selectedPlant.family}</div>
                      </div>
                      <div>
                        <span className="opacity-60 text-xs">Genus</span>
                        <div className="font-medium">{selectedPlant.genus}</div>
                      </div>
                      <div>
                        <span className="opacity-60 text-xs">Origin</span>
                        <div className="font-medium">
                          {ensureArray(selectedPlant.origin).join(", ") || "—"}
                        </div>
                      </div>
                      <div>
                        <span className="opacity-60 text-xs">Type</span>
                        <div className="font-medium">{selectedPlant.type}</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() =>
                        window.open(selectedPlant.care_guides, "_blank")
                      }
                    >
                      <ExternalLink className="mr-2" /> Care Guides
                    </Button>
                  </div>

                  {/* RIGHT BLOCK (DETAIL GRID) */}
                  <div
                    className={clsx(
                      "md:col-span-2 p-4 rounded-xl border space-y-4",
                      isDark
                        ? "bg-black/20 border-zinc-800"
                        : "bg-white border-zinc-200"
                    )}
                  >
                    {/* DESCRIPTION */}
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-md mb-1">
                        <Leaf /> About this plant
                      </div>
                      <p className="text-sm opacity-80 leading-relaxed">
                        {selectedPlant.description ||
                          "No description available."}
                      </p>
                    </div>

                    <Separator />

                    {/* KEY ATTRIBUTES */}
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-md mb-2">
                        <Shield /> Key attributes
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs flex gap-1 items-center">
                            <Droplet /> Watering
                          </div>
                          <div className="font-medium">
                            {selectedPlant.watering}
                          </div>
                        </div>

                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs flex gap-1 items-center">
                            <SunMedium /> Sunlight
                          </div>
                          <div className="font-medium">
                            {ensureArray(selectedPlant.sunlight).join(", ") ||
                              "—"}
                          </div>
                        </div>

                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs flex gap-1 items-center">
                            <Trees /> Soil
                          </div>
                          <div className="font-medium">
                            {ensureArray(selectedPlant.soil).join(", ") || "—"}
                          </div>
                        </div>

                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs flex gap-1 items-center">
                            <Sprout /> Growth Rate
                          </div>
                          <div className="font-medium">
                            {selectedPlant.growth_rate}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ANATOMY */}
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-md mb-2">
                        <Flower2 /> Plant Anatomy
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        {ensureArray(selectedPlant.plant_anatomy).map(
                          (part, i) => (
                            <div
                              key={i}
                              className="p-2 border rounded-md flex flex-col"
                            >
                              <span className="font-medium capitalize">
                                {part.part}
                              </span>
                              <span className="text-xs opacity-70">
                                {ensureArray(part.color).join(", ")}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* TOXICITY */}
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-md mb-2">
                        <Info /> Safety & Toxicity
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs">Poisonous to humans</div>
                          <div className="font-medium">
                            {String(selectedPlant.poisonous_to_humans)}
                          </div>
                        </div>

                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs">Poisonous to pets</div>
                          <div className="font-medium">
                            {String(selectedPlant.poisonous_to_pets)}
                          </div>
                        </div>

                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs">Edible fruit</div>
                          <div className="font-medium">
                            {String(selectedPlant.edible_fruit)}
                          </div>
                        </div>

                        <div className="p-2 border rounded-md">
                          <div className="opacity-60 text-xs">Medicinal</div>
                          <div className="font-medium">
                            {String(selectedPlant.medicinal)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* HARDINESS MAP */}
                    {selectedPlant?.hardiness_location?.full_url && (
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-md mb-2">
                          <ThermometerSun /> Hardiness Zones
                        </div>

                        <iframe
                          src={selectedPlant.hardiness_location.full_url}
                          className="w-full rounded-xl border"
                          style={{ height: "340px" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            {/* RAW JSON */}
            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-4 border-t"
                >
                  <pre className="text-xs overflow-auto" style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* RIGHT PANEL */}
        <aside
          className={clsx(
            "lg:col-span-3 p-4 h-fit rounded-2xl space-y-4",
            isDark ? "bg-black/40 border border-zinc-800" : "bg-white border border-zinc-200"
          )}
        >
          <div>
            <h3 className="font-semibold">Developer Tools</h3>
            <p className="text-xs opacity-60">Debugging endpoints and JSON</p>

            <div className="mt-3 space-y-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={copyEndpoint}>
                <Copy /> Copy API Endpoint
              </Button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={downloadJSON}>
                <Download /> Download JSON
              </Button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={() => setShowRaw(!showRaw)}>
                <Info /> Toggle Raw
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* IMAGE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPlant?.common_name || "Image"}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center" style={{ height: "60vh" }}>
            <img
              src={getImageUrl(selectedPlant)}
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
            />
          </div>

          <DialogFooter>
            <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}>
              <X />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

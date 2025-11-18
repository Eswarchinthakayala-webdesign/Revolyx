// src/pages/OpenFoodPage.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ImageIcon,
  ExternalLink,
  Download,
  Loader2,
  Info,
  Tag,
  List,
  Box,
  Clipboard,
  AlertCircle,
  Heart,
  BarChart2,
  Package,
  Percent,
  Calendar,
  Globe2,
  Award,
  Mic,
  Zap,
  User,
  CornerUpRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * Professional OpenFoodFacts product viewer page
 *
 * - Default endpoint provided in the user's object
 * - Renders product metadata, nutrition facts, ingredients, labels, and link
 * - Large, well-structured layout with cards and a right-hand data panel
 *
 * Replace / update `DEFAULT_ENDPOINT` as needed.
 */

const DEFAULT_ENDPOINT = "https://world.openfoodfacts.org/api/v0/product/737628064502.json"; // provided
const DEFAULT_BARCODE = "737628064502";

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Utility to safely read nested values */
const safe = (v, fallback = "—") => (v === null || v === undefined || v === "") ? fallback : v;

export default function OpenFoodPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [barcode, setBarcode] = useState(DEFAULT_BARCODE);
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [raw, setRaw] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  /* Fetch and normalize product */
  async function fetchProduct(forBarcodeOrUrl) {
    setError(null);
    setLoading(true);
    try {
      // Determine if user supplied a URL or barcode
      const maybeUrl = forBarcodeOrUrl?.startsWith?.("http");
      const url = maybeUrl ? forBarcodeOrUrl : `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(forBarcodeOrUrl)}.json`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Fetch failed (${res.status})`);
      }
      const json = await res.json();

      // OpenFoodFacts returns { status: 1/0, product: {...} }
      if (json.status === 0 || !json.product) {
        setProduct(null);
        setRaw(json);
        setError("Product not found");
        showToast("info", "Product not found for that barcode/URL");
      } else {
        setRaw(json);
        const p = json.product;
        // Normalize useful fields into a compact model the UI will consume
        const model = {
          code: safe(p.code, p.id || barcode),
          name: safe(p.product_name || p.product_name_en || p.generic_name),
          brands: (p.brands || "").split(",").map(s => s.trim()).filter(Boolean),
          quantity: p.quantity || p.serving_size || "",
          packaging: p.packaging || "",
          categories: (p.categories || "").split(",").map(s => s.trim()).filter(Boolean),
          labels: (p.labels || "").split(",").map(s => s.trim()).filter(Boolean),
          stores: (p.stores || "").split(",").map(s => s.trim()).filter(Boolean),
          countries: (p.countries_tags || []).map(t => t.replace("en:", "")),
          ingredients_text: p.ingredients_text || p.ingredients_text_en || "",
          ingredients: (p.ingredients || []).map(ing => ({
            text: ing.text,
            percent: ing.percent,
            vegan: ing.vegan,
            vegetarian: ing.vegetarian,
            vegetarian_status: ing.vegetarian_status,
            ingredient_from_palm_oil: ing.ingredient_from_palm_oil
          })),
          allergens: p.allergens || p.allergens_text || "",
          traces: p.traces || "",
          nutriscore: p.nutriscore_grade || p.nutriscore || null,
          ecoscore: p.ecoscore_grade || p.ecoscore || null,
          image: p.image_front_full_url || p.image_front_url || p.image_url || "",
          url: p.url || "",
          nutriments: p.nutriments || {},
          nova_group: p.nova_group || p.nova_groups || null,
          manufacturers: (p.manufacturers || "").split(",").map(s => s.trim()).filter(Boolean),
          generic_name: p.generic_name || "",
          brands_tags: p.brands_tags || [],
          ingredients_analysis: p.ingredients_analysis_tags || []
        };
        setProduct(model);
        showToast("success", `Loaded: ${model.name || model.code}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch product");
      showToast("error", "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    fetchProduct(barcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Derived values for nutrition */
  const nutritionPer100 = useMemo(() => {
    if (!product?.nutriments) return {};
    const n = product.nutriments;
    // Common fields: energy-kcal_100g, fat_100g, saturated-fat_100g, carbohydrates_100g, sugars_100g, proteins_100g, salt_100g, sodium_100g
    return {
      energy_kcal: n["energy-kcal_100g"] ?? n["energy_100g"] ?? n["energy-kcal_value"] ?? null,
      energy_kj: n["energy-kj_100g"] ?? n["energy_kj_100g"] ?? null,
      fat: n["fat_100g"] ?? null,
      saturated_fat: n["saturated-fat_100g"] ?? n["saturated_fat_100g"] ?? null,
      carbs: n["carbohydrates_100g"] ?? n["carbohydrates_value"] ?? null,
      sugars: n["sugars_100g"] ?? null,
      fiber: n["fiber_100g"] ?? null,
      proteins: n["proteins_100g"] ?? null,
      salt: n["salt_100g"] ?? (n["sodium_100g"] ? (Number(n["sodium_100g"]) * 2.54).toFixed(2) : null),
      sodium: n["sodium_100g"] ?? null
    };
  }, [product]);

  /* Helper: download raw JSON */
  function downloadJSON() {
    if (!raw && !product) {
      showToast("info", "No data to download");
      return;
    }
    const payload = raw || product;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `openfood_product_${(product?.code || "product")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Copy product summary to clipboard */
  async function copySummary() {
    if (!product) return showToast("info", "No product loaded");
    const summary = {
      name: product.name,
      code: product.code,
      brands: product.brands,
      quantity: product.quantity,
      nutriscore: product.nutriscore,
      ecoscore: product.ecoscore
    };
    try {
      await navigator.clipboard.writeText(prettyJSON(summary));
      showToast("success", "Product summary copied");
    } catch {
      showToast("error", "Failed to copy");
    }
  }

  /* Render helpers */
  function Badge({ children }) {
    return <span className="inline-block text-xs px-2 py-1 rounded-full border font-medium">{children}</span>;
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>OpenFood — Product Inspector</h1>
          <p className="mt-1 text-sm opacity-70">Inspect product info, nutrition facts, ingredients, and metadata from OpenFoodFacts.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchProduct(endpoint || barcode); }}
            className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Enter barcode (e.g. 737628064502) or full OpenFoodFacts product URL"
              value={endpoint === DEFAULT_ENDPOINT ? barcode : endpoint}
              onChange={(e) => {
                const val = e.target.value;
                // If looks like URL, set endpoint; otherwise assume barcode
                if (val.startsWith("http")) {
                  setEndpoint(val.trim());
                } else {
                  setBarcode(val.trim());
                  setEndpoint(val.trim());
                }
              }}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchProduct(endpoint || barcode)}><Search /> Fetch</Button>
            <Button type="button" variant="ghost" className="px-3" onClick={() => { setBarcode(DEFAULT_BARCODE); setEndpoint(DEFAULT_ENDPOINT); fetchProduct(DEFAULT_BARCODE); }}><RotateIcon /></Button>
          </form>
        </div>
      </header>

      {/* Body layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Main product viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center gap-4 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  {product?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name || "product image"} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">{product?.name || "Loading product..."}</CardTitle>
                  <div className="text-xs opacity-60">
                    <span className="font-medium">{product?.brands?.join(", ") || "Unknown brand"}</span>
                    {" • "}
                    <span>{product?.quantity || product?.packaging || "—"}</span>
                    {" • "}
                    <span className="ml-1">{product?.code}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide JSON" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Image</Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /></Button>
                <Button variant="ghost" onClick={() => copySummary()}><Clipboard /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : error ? (
                <div className="py-8 text-center text-sm text-red-500"><AlertCircle className="inline-block mr-2" />{error}</div>
              ) : !product ? (
                <div className="py-8 text-center text-sm opacity-60">No product loaded.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left column - image + basic meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-hidden">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name} className="w-full h-56 object-cover" />
                      ) : (
                        <div className="h-56 flex items-center justify-center text-sm opacity-60">No image</div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Brands</div>
                        <div className="font-medium">{product.brands?.join(", ") || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Manufacturers</div>
                        <div className="font-medium">{product.manufacturers?.join(", ") || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Barcode</div>
                        <div className="font-medium">{product.code}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Packaging</div>
                        <div className="font-medium">{product.packaging || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Countries</div>
                        <div className="font-medium">{product.countries?.join(", ") || "—"}</div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.labels?.slice(0, 6).map((l, i) => <Badge key={i}><Tag className="inline-block mr-1" size={12} /> {l}</Badge>)}
                        {product.nutriscore && <Badge><Award className="inline-block mr-1" size={12} /> Nutri-{product.nutriscore.toUpperCase()}</Badge>}
                        {product.ecoscore && <Badge><Globe2 className="inline-block mr-1" size={12} /> Eco-{product.ecoscore.toUpperCase()}</Badge>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button variant="outline" onClick={() => { if (product.url) window.open(product.url, "_blank"); else showToast("info", "No product page available"); }}><CornerUpRight /> View on OpenFoodFacts</Button>
                    </div>
                  </div>

                  {/* Middle column - Summary & Nutrition */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-1", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-3">Overview</div>
                    <div className="text-sm leading-relaxed mb-4">
                      <div className="mb-2"><span className="font-medium">Generic:</span> {product.generic_name || "—"}</div>
                      <div className="mb-2"><span className="font-medium">Categories:</span> {product.categories?.join(" › ") || "—"}</div>
                      <div className="mb-2"><span className="font-medium">Allergens / Traces:</span> {product.allergens || product.traces || "—"}</div>
                      <div className="mb-2"><span className="font-medium">Serving size:</span> {product.quantity || "—"}</div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-3">Nutrition (per 100g)</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Energy (kcal)</div>
                        <div className="text-lg font-medium">{nutritionPer100.energy_kcal ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Fat (g)</div>
                        <div className="text-lg font-medium">{nutritionPer100.fat ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Saturates (g)</div>
                        <div className="text-lg font-medium">{nutritionPer100.saturated_fat ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Carbs (g)</div>
                        <div className="text-lg font-medium">{nutritionPer100.carbs ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Sugars (g)</div>
                        <div className="text-lg font-medium">{nutritionPer100.sugars ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Protein (g)</div>
                        <div className="text-lg font-medium">{nutritionPer100.proteins ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Salt (g)</div>
                        <div className="text-lg font-medium">{nutritionPer100.salt ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Fiber (g)</div>
                        <div className="text-lg font-medium">{nutritionPer100.fiber ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide raw" : "Show raw"}</Button>
                    </div>
                  </div>

                  {/* Right column - Ingredients, analysis */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-1", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Ingredients</div>

                    <div className="text-sm mb-3">
                      {product.ingredients_text ? (
                        <div className="leading-relaxed text-sm">{product.ingredients_text}</div>
                      ) : product.ingredients && product.ingredients.length > 0 ? (
                        <ul className="list-inside list-disc space-y-1">
                          {product.ingredients.map((ing, i) => (
                            <li key={i}>
                              <div className="font-medium">{ing.text || "—"}</div>
                              {ing.percent ? <div className="text-xs opacity-60">({ing.percent}%)</div> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs opacity-60">No ingredients data.</div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Analysis</div>
                    <div className="text-xs opacity-60 mb-2">Tags (ingredients analysis / labels)</div>
                    <div className="flex flex-wrap gap-2">
                      {product.ingredients_analysis?.length > 0 ? (
                        product.ingredients_analysis.map((t, i) => <Badge key={i}>{t.replace("en:", "")}</Badge>)
                      ) : (
                        <div className="text-xs opacity-60">No ingredient analysis tags.</div>
                      )}
                    </div>

                    <div className="mt-4 text-xs opacity-60">
                      NutriScore: <span className="font-medium">{product.nutriscore ? product.nutriscore.toUpperCase() : "—"}</span>
                      {" • "}
                      EcoScore: <span className="font-medium">{product.ecoscore ? product.ecoscore.toUpperCase() : "—"}</span>
                      {" • "}
                      NOVA: <span className="font-medium">{product.nova_group ?? "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && raw && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 360 }}>
                    {prettyJSON(raw)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Side meta panel */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Product Data</div>
              <div className="text-xs opacity-60">Live from OpenFoodFacts</div>
            </div>
            <div className="text-xs opacity-60">{new Date().toLocaleDateString()}</div>
          </div>

          <Separator />

          <div className="text-sm">
            <div className="text-xs opacity-60">Source</div>
            <div className="font-medium mb-2">OpenFoodFacts</div>

            <div className="text-xs opacity-60">Endpoint</div>
            <div className="text-sm break-words mb-2">{safe(endpoint)}</div>

            <div className="mt-2 space-y-2">
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Export JSON</Button>
              <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(endpoint); showToast("success", "Endpoint copied"); }}><Clipboard /> Copy Endpoint</Button>
              <Button variant="ghost" onClick={() => { if (product?.url) window.open(product.url, "_blank"); else showToast("info", "No product page"); }}><ExternalLink /> Open product page</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs opacity-60">Quick facts</div>
            <div className="mt-2 text-sm space-y-1">
              <div><span className="font-medium">Labels:</span> {product?.labels?.slice(0, 3).join(", ") || "—"}</div>
              <div><span className="font-medium">Stores:</span> {product?.stores?.slice(0, 3).join(", ") || "—"}</div>
              <div><span className="font-medium">Ingredients count:</span> {product?.ingredients?.length ?? "—"}</div>
              <div><span className="font-medium">Nutri/Eco:</span> {product?.nutriscore ? product.nutriscore.toUpperCase() : "—"} / {product?.ecoscore ? product.ecoscore.toUpperCase() : "—"}</div>
            </div>
          </div>

        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{product?.name || "Product image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {product?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product?.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from OpenFoodFacts</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><AlertCircle /></Button>
              <Button variant="outline" onClick={() => { if (product?.url) window.open(product.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Small helper icons not provided in lucide-react import above; simple inline components */
function RotateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.2-5.8" /><polyline points="21 3 21 9 15 9" /></svg>
);
}

// src/pages/ImagePlayground.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fabric } from "fabric"; // <-- Fabric v5 import (install fabric@5.3.0)
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Image as ImageIcon,
  Download,
  RotateCcw,
  RotateCw,
  Trash2,
  Pen,
  Type,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Crop,
  Check,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "../components/theme-provider";

/**
 * ImagePlayground (Fabric v5)
 * - Requires: fabric@5.x installed
 * - Full client-side editor: filters, crop, rotate, draw, text, undo/redo, export
 */

const UID = () => Math.random().toString(36).slice(2, 9);

export default function ImagePlayground() {
  const { theme } = useTheme?.() ?? { theme: "light" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Fabric / canvas refs
  const canvasRef = useRef(null); // fabric.Canvas
  const imgRef = useRef(null); // fabric.Image main
  const cropRectRef = useRef(null);
  const historyRef = useRef({ stack: [], index: -1 });
  const isApplyingRef = useRef(false);

  // UI state
  const [loaded, setLoaded] = useState(false);
  const [imageName, setImageName] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#fffbeb");
  const [brushWidth, setBrushWidth] = useState(6);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [watermarkOnExport, setWatermarkOnExport] = useState(true);
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    blur: 0,
    grayscale: false,
  });
  const canvasId = useMemo(() => `ip-canvas-${UID()}`, []);

  // Initialize fabric canvas once on client
  useEffect(() => {
    if (canvasRef.current) return;
    const c = new fabric.Canvas(canvasId, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: isDark ? "#071124" : "#ffffff",
    });

    // default size
    c.setWidth(960);
    c.setHeight(640);

    // push initial snapshot helper
    const pushSnapshot = () => {
      if (!c || isApplyingRef.current) return;
      try {
        const snapshot = JSON.stringify(c.toDatalessJSON(["selectable"]));
        const h = historyRef.current;
        if (h.index < h.stack.length - 1) h.stack = h.stack.slice(0, h.index + 1);
        h.stack.push(snapshot);
        h.index = h.stack.length - 1;
        if (h.stack.length > 80) {
          h.stack.shift();
          h.index = h.stack.length - 1;
        }
      } catch {}
    };

    // listen for modifications
    c.on("object:added", pushSnapshot);
    c.on("object:modified", pushSnapshot);
    c.on("object:removed", pushSnapshot);
    c.on("path:created", pushSnapshot);

    // small initial snapshot
    setTimeout(pushSnapshot, 80);

    canvasRef.current = c;
    return () => {
      try {
        c.dispose();
      } catch {}
      canvasRef.current = null;
    };
  }, [canvasId, isDark]);

  // History helpers
  const pushHistory = useCallback(() => {
    const c = canvasRef.current;
    if (!c || isApplyingRef.current) return;
    try {
      const snapshot = JSON.stringify(c.toDatalessJSON(["selectable"]));
      const h = historyRef.current;
      if (h.index < h.stack.length - 1) h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push(snapshot);
      h.index = h.stack.length - 1;
      if (h.stack.length > 80) {
        h.stack.shift();
        h.index = h.stack.length - 1;
      }
    } catch {}
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.index <= 0) {
      showToast("info", "Nothing to undo");
      return;
    }
    h.index -= 1;
    const snapshot = h.stack[h.index];
    if (!snapshot) return;
    isApplyingRef.current = true;
    canvasRef.current?.loadFromJSON(snapshot, () => {
      canvasRef.current.requestRenderAll();
      isApplyingRef.current = false;
    });
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) {
      showToast("info", "Nothing to redo");
      return;
    }
    h.index += 1;
    const snapshot = h.stack[h.index];
    if (!snapshot) return;
    isApplyingRef.current = true;
    canvasRef.current?.loadFromJSON(snapshot, () => {
      canvasRef.current.requestRenderAll();
      isApplyingRef.current = false;
    });
  }, []);

  // Filters rebuild (fabric Image filters)
  const rebuildFilters = useCallback(() => {
    if (!imgRef.current) return;
    const f = [];
    if (filters.grayscale) f.push(new fabric.Image.filters.Grayscale());
    if (Math.abs(filters.brightness) > 0.0001) f.push(new fabric.Image.filters.Brightness({ brightness: filters.brightness }));
    if (Math.abs(filters.contrast) > 0.0001) f.push(new fabric.Image.filters.Contrast({ contrast: filters.contrast }));
    if (filters.blur > 0.0001) f.push(new fabric.Image.filters.Blur({ blur: filters.blur }));
    imgRef.current.filters = f;
    imgRef.current.applyFilters();
    canvasRef.current?.requestRenderAll();
  }, [filters]);

  useEffect(() => {
    rebuildFilters();
  }, [filters, rebuildFilters]);

  // Drawing mode config
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.isDrawingMode = drawing;
    if (drawing && c.freeDrawingBrush) {
      c.freeDrawingBrush.color = brushColor;
      c.freeDrawingBrush.width = brushWidth;
      c.freeDrawingBrush.shadow = new fabric.Shadow({ color: brushColor, blur: 0, offsetX: 0, offsetY: 0 });
    }
  }, [drawing, brushColor, brushWidth]);

  // Load image from file input
  const handleFileChange = useCallback(
    (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setImageName(f.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const c = canvasRef.current;
        if (!c) {
          showToast("error", "Editor not ready");
          return;
        }
        // clear existing
        c.discardActiveObject();
        c.getObjects().forEach((o) => c.remove(o));
        imgRef.current = null;

        // create fabric image
        fabric.Image.fromURL(
          dataUrl,
          (img) => {
            // scale to fit reasonable max
            const maxW = 1600;
            const maxH = 1200;
            let iw = img.width || 800;
            let ih = img.height || 600;
            const scale = Math.min(1, Math.min(maxW / iw, maxH / ih));
            const finalW = Math.round(iw * scale);
            const finalH = Math.round(ih * scale);

            c.setWidth(finalW);
            c.setHeight(finalH);

            img.set({
              left: 0,
              top: 0,
              originX: "left",
              originY: "top",
              selectable: true,
              hasControls: true,
              evented: true,
            });

            img.scaleToWidth(finalW);
            img.setCoords();
            c.add(img);
            imgRef.current = img;

            // reset filters and state
            setFilters({ brightness: 0, contrast: 0, blur: 0, grayscale: false });
            rebuildFilters();
            pushHistory();
            setLoaded(true);
            setRotation(0);
            showToast("success", `Loaded ${f.name}`);
          },
          { crossOrigin: "anonymous" }
        );
      };
      reader.onerror = () => showToast("error", "File read failed");
      reader.readAsDataURL(f);
      e.target.value = null;
    },
    [rebuildFilters]
  );

  // Crop helpers
  const startCrop = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !imgRef.current) return;
    setIsCropping(true);
    c.discardActiveObject();
    c.selection = false;

    const rect = new fabric.Rect({
      left: Math.max(12, c.getWidth() * 0.08),
      top: Math.max(12, c.getHeight() * 0.08),
      width: Math.max(80, c.getWidth() * 0.6),
      height: Math.max(60, c.getHeight() * 0.6),
      fill: "rgba(0,0,0,0.12)",
      stroke: "#fff",
      strokeDashArray: [6, 6],
      selectable: true,
      hasBorders: true,
      cornerColor: "#fff",
      cornerStyle: "circle",
      cornerSize: 8,
      objectCaching: false,
    });

    cropRectRef.current = rect;
    c.add(rect);
    c.setActiveObject(rect);
    c.requestRenderAll();
  }, []);

  const cancelCrop = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    if (cropRectRef.current) {
      c.remove(cropRectRef.current);
      cropRectRef.current = null;
    }
    setIsCropping(false);
    c.selection = true;
    c.requestRenderAll();
  }, []);

  const applyCrop = useCallback(() => {
    const c = canvasRef.current;
    const rect = cropRectRef.current;
    const img = imgRef.current;
    if (!c || !rect || !img) {
      setIsCropping(false);
      return;
    }

    // rect bounds on canvas
    const rectLeft = rect.left;
    const rectTop = rect.top;
    const rectWidth = rect.width * rect.scaleX;
    const rectHeight = rect.height * rect.scaleY;

    const imgEl = img.getElement();
    if (!imgEl) {
      showToast("error", "Crop failed: source not available");
      return;
    }

    // mapping canvas -> source pixels
    const imgCanvasW = img.getScaledWidth();
    const imgCanvasH = img.getScaledHeight();
    const imgLeft = img.left;
    const imgTop = img.top;

    const scaleX = imgCanvasW / img.width;
    const scaleY = imgCanvasH / img.height;

    const sx = Math.max(0, (rectLeft - imgLeft) / scaleX);
    const sy = Math.max(0, (rectTop - imgTop) / scaleY);
    const sw = Math.max(1, rectWidth / scaleX);
    const sh = Math.max(1, rectHeight / scaleY);

    try {
      const temp = document.createElement("canvas");
      const dpr = window.devicePixelRatio || 1;
      temp.width = Math.round(sw * dpr);
      temp.height = Math.round(sh * dpr);
      const tctx = temp.getContext("2d");
      tctx.drawImage(imgEl, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh), 0, 0, temp.width, temp.height);
      const dataUrl = temp.toDataURL("image/png");

      fabric.Image.fromURL(
        dataUrl,
        (newImg) => {
          // replace canvas contents
          c.getObjects().forEach((o) => c.remove(o));
          newImg.set({ left: 0, top: 0, originX: "left", originY: "top", selectable: true });
          const w = Math.min(newImg.width, 1600);
          const h = Math.min(newImg.height, 1200);
          c.setWidth(w);
          c.setHeight(h);
          newImg.scaleToWidth(w);
          c.add(newImg);
          imgRef.current = newImg;

          cropRectRef.current = null;
          setIsCropping(false);
          c.selection = true;
          pushHistory();
          showToast("success", "Crop applied");
        },
        { crossOrigin: "anonymous" }
      );
    } catch (e) {
      console.error("Crop error", e);
      showToast("error", "Crop failed");
    }
  }, []);

  // Add text annotation (IText)
  const addText = useCallback((text = "Text") => {
    const c = canvasRef.current;
    if (!c) return;
    const itext = new fabric.IText(text, {
      left: 24,
      top: 24,
      fontFamily: "Inter, system-ui, Arial",
      fill: isDark ? "#fff" : "#111",
      fontSize: 28,
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.35)", blur: 4, offsetX: 0, offsetY: 2 }),
      selectable: true,
    });
    c.add(itext);
    c.setActiveObject(itext);
    pushHistory();
    showToast("success", "Added text");
  }, [isDark]);

  // Remove selected objects
  const removeSelected = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObjects();
    if (!active || active.length === 0) {
      showToast("info", "No selection");
      return;
    }
    active.forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.requestRenderAll();
    pushHistory();
  }, []);

  // Apply rotation (deg)
  const applyRotation = useCallback((deg) => {
    const img = imgRef.current;
    const c = canvasRef.current;
    if (!img || !c) return;
    img.rotate(deg);
    img.setCoords();
    c.requestRenderAll();
    setRotation(((deg % 360) + 360) % 360);
    pushHistory();
  }, []);

  // Export image (with watermark toggle via overlay element opacity)
  const exportImage = useCallback(
    async ({ type = "png", fileName = "export.png", withWatermark = true, quality = 0.92, scaleExport = 1 } = {}) => {
      const c = canvasRef.current;
      if (!c) {
        showToast("error", "Canvas not ready");
        return;
      }

      // find watermark overlay maybe outside canvas (we render one below)
      const container = c.upperCanvasEl?.parentElement;
      const watermarkElem = container?.querySelector("[data-ip-watermark]");

      const savedOpacity = watermarkElem ? watermarkElem.style.opacity : null;
      if (watermarkElem) {
        watermarkElem.style.opacity = withWatermark ? "0.95" : "0";
        watermarkElem.style.pointerEvents = "none";
        watermarkElem.style.zIndex = 9999;
      }

      try {
        const dataUrl = c.toDataURL({
          format: type,
          multiplier: Math.max(1, Math.min(3, Math.round(scaleExport))),
          quality: type === "jpeg" ? quality : undefined,
        });

        if (watermarkElem && savedOpacity !== null) watermarkElem.style.opacity = savedOpacity;

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("success", `Exported ${fileName}`);
      } catch (e) {
        console.error("Export failed", e);
        if (watermarkElem && savedOpacity !== null) watermarkElem.style.opacity = savedOpacity;
        showToast("error", "Export failed");
      }
    },
    []
  );

  // Zoom helper
  const setCanvasZoom = useCallback((z) => {
    const c = canvasRef.current;
    if (!c) return;
    c.setZoom(z);
    setZoom(z);
    c.requestRenderAll();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportImage({ type: "png", fileName: `${imageName || "image"}.png`, withWatermark: watermarkOnExport, scaleExport: window.devicePixelRatio || 1 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, exportImage, imageName, watermarkOnExport]);

  // UI
  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-emerald-500" /> Image Playground
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Client-side editor — filters, crop, rotate, draw, annotate, export.</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="ip-file" className="cursor-pointer">
            <Input id="ip-file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <Button variant="secondary"><ImageIcon className="w-4 h-4 mr-2" /> Upload</Button>
          </label>

          <Button onClick={() => exportImage({ type: "png", fileName: `${imageName || "image"}.png`, withWatermark: watermarkOnExport, scaleExport: Math.max(1, Math.round(window.devicePixelRatio || 1)) })}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>

          <Button variant="outline" onClick={() => { canvasRef.current?.clear(); imgRef.current = null; setLoaded(false); pushHistory(); showToast("success", "Cleared"); }}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow">
            <CardHeader><CardTitle>Tools</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={() => setDrawing((s) => !s)} variant={drawing ? "destructive" : "default"}>
                    <Pen className="w-4 h-4 mr-2" /> {drawing ? "Stop drawing" : "Draw"}
                  </Button>
                  <Button onClick={() => addText()}><Type className="w-4 h-4 mr-2" />Text</Button>
                </div>

                <div>
                  <Label className="text-xs">Brush color</Label>
                  <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-full h-9 rounded border p-0" />
                </div>

                <div>
                  <Label className="text-xs">Brush size</Label>
                  <Slider value={[brushWidth]} onValueChange={(v) => setBrushWidth(v[0])} min={1} max={60} step={1} />
                  <div className="text-xs mt-1">{brushWidth}px</div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={() => undo()} variant="ghost"><Undo className="w-4 h-4 mr-2" />Undo</Button>
                  <Button onClick={() => redo()} variant="ghost"><Redo className="w-4 h-4 mr-2" />Redo</Button>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button onClick={() => startCrop()}><Crop className="w-4 h-4 mr-2" />Start Crop</Button>
                  <Button onClick={() => applyCrop()} disabled={!isCropping}><Check className="w-4 h-4 mr-2" />Apply</Button>
                  <Button variant="outline" onClick={() => cancelCrop()} disabled={!isCropping}><Trash2 className="w-4 h-4 mr-2" />Cancel</Button>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button onClick={() => applyRotation((rotation - 90) % 360)}><RotateCcw className="w-4 h-4 mr-2" />-90</Button>
                  <Button onClick={() => applyRotation((rotation + 90) % 360)}><RotateCw className="w-4 h-4 mr-2" />+90</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4">
            <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Brightness</Label>
                  <Slider value={[Math.round((filters.brightness + 1) * 50)]} onValueChange={(v) => setFilters((p) => ({ ...p, brightness: (v[0] / 50) - 1 }))} min={0} max={100} />
                </div>

                <div>
                  <Label className="text-xs">Contrast</Label>
                  <Slider value={[Math.round((filters.contrast + 1) * 50)]} onValueChange={(v) => setFilters((p) => ({ ...p, contrast: (v[0] / 50) - 1 }))} min={0} max={100} />
                </div>

                <div>
                  <Label className="text-xs">Blur</Label>
                  <Slider value={[Math.round(filters.blur * 100)]} onValueChange={(v) => setFilters((p) => ({ ...p, blur: v[0] / 100 }))} min={0} max={100} />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="gray" checked={filters.grayscale} onCheckedChange={(v) => setFilters((p) => ({ ...p, grayscale: Boolean(v) }))} />
                  <label htmlFor="gray" className="text-sm">Grayscale</label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setFilters({ brightness: 0, contrast: 0, blur: 0, grayscale: false })}>Reset</Button>
                  <Button onClick={() => { pushHistory(); showToast("success", "Snapshot saved"); }}>Snapshot</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4">
            <CardHeader><CardTitle>Zoom & Export</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button onClick={() => setCanvasZoom(Math.max(0.25, zoom - 0.25))}><ZoomOut className="w-4 h-4" /></Button>
                  <div className="flex-1">
                    <Slider value={[Math.round(zoom * 100)]} onValueChange={(v) => setCanvasZoom(v[0] / 100)} min={25} max={300} />
                  </div>
                  <Button onClick={() => setCanvasZoom(Math.min(3, zoom + 0.25))}><ZoomIn className="w-4 h-4" /></Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => exportImage({ type: "png", fileName: `${imageName || "image"}.png`, withWatermark: watermarkOnExport, scaleExport: Math.max(1, Math.round(window.devicePixelRatio || 1)) })}><Download className="w-4 h-4 mr-2" />PNG</Button>
                  <Button variant="outline" onClick={() => exportImage({ type: "jpeg", fileName: `${imageName || "image"}.jpg`, withWatermark: watermarkOnExport, quality: 0.9 })}>JPG</Button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Checkbox id="wm" checked={watermarkOnExport} onCheckedChange={(v) => setWatermarkOnExport(Boolean(v))} />
                  <label htmlFor="wm" className="text-sm">Watermark on export</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* canvas */}
        <section className="lg:col-span-6">
          <Card className="shadow">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Canvas</CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-xs opacity-70">Zoom: {Math.round(zoom * 100)}%</div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ width: "100%", overflow: "auto", background: isDark ? "#071124" : "#f6f7fb", padding: 8, borderRadius: 8 }}>
                <canvas id={canvasId} style={{ borderRadius: 8, display: "block", maxWidth: "100%" }} />
              </div>

              {/* watermark overlay - toggled by export function by changing opacity inline */}
              <div
                data-ip-watermark
                style={{
                  position: "absolute",
                  bottom: 22,
                  right: 22,
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                  padding: "6px 10px",
                  borderRadius: 8,
                  pointerEvents: "none",
                  opacity: watermarkOnExport ? 0.95 : 0,
                  zIndex: 999,
                  fontWeight: 600,
                }}
              >
                Image Playground
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4">
            <CardHeader><CardTitle>Selection</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => removeSelected()} variant="ghost">Remove selected</Button>
                <Button onClick={() => { canvasRef.current?.discardActiveObject(); canvasRef.current?.requestRenderAll(); }}>Deselect</Button>
              </div>
              <div className="text-xs mt-2 text-muted-foreground">Tip: double-click text to edit, drag handles to resize shapes.</div>
            </CardContent>
          </Card>
        </section>

        {/* right */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className="shadow">
            <CardHeader><CardTitle>Meta & Debug</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div><strong>Loaded:</strong> {loaded ? "Yes" : "No"}</div>
                <div><strong>Image:</strong> {imageName || "—"}</div>
                <div><strong>Rotation:</strong> {Math.round(rotation)}°</div>
                <div><strong>Filters:</strong> B {filters.brightness.toFixed(2)} • C {filters.contrast.toFixed(2)} • Blur {filters.blur.toFixed(2)} • Gray {filters.grayscale ? "Yes" : "No"}</div>
              </div>

              <Separator className="my-3" />

              <div className="flex gap-2">
                <Button onClick={() => { pushHistory(); showToast("success", "Snapshot saved"); }}>Save snapshot</Button>
                <Button variant="outline" onClick={() => { if (historyRef.current.stack.length) { navigator.clipboard.writeText(historyRef.current.stack[historyRef.current.index] || ""); showToast("success", "Snapshot JSON copied"); } else showToast("info", "No snapshot"); }}>Copy snapshot</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow">
            <CardHeader><CardTitle>Shortcuts</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">
                <div>Ctrl/Cmd + Z — Undo</div>
                <div>Ctrl/Cmd + Y — Redo</div>
                <div>Ctrl/Cmd + S — Export PNG</div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}

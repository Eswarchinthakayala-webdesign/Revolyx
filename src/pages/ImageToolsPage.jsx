// src/pages/ImageToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";

import {
  Image as ImageIcon,
  Download,
  Copy,
  Loader2,
  Trash2,
  Settings,
  Code,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { toast } from "sonner";

/**
 * ImageToolsPage
 *
 * Tools:
 * - Image compressor (JPEG/WEBP) with quality / max width
 * - Image -> Base64 converter (copy & download)
 * - SVG -> PNG converter (upload or paste svg text)
 *
 * Matches layout and theme of AIToolsPage (left controls, center preview, right debug).
 */

export default function ImageToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Tool selection
  const TOOLS = {
    COMPRESSOR: "compressor",
    TO_BASE64: "to_base64",
    SVG_TO_PNG: "svg_to_png",
  };
  const [selectedTool, setSelectedTool] = useState(TOOLS.COMPRESSOR);

  // File inputs / previews
  const [file, setFile] = useState(null); // original file (File)
  const [previewUrl, setPreviewUrl] = useState(null); // object URL for preview (original)
  const [resultBlobUrl, setResultBlobUrl] = useState(null); // compressed / converted output preview
  const [resultBlob, setResultBlob] = useState(null); // output Blob
  const fileInputRef = useRef(null);

  // Compressor options
  const [outputFormat, setOutputFormat] = useState("image/jpeg"); // image/jpeg or image/webp or image/png
  const [quality, setQuality] = useState(0.75); // 0 - 1
  const [maxWidth, setMaxWidth] = useState(1600); // pixels, 0 = keep original

  // Base64 tool state
  const [base64String, setBase64String] = useState("");

  // SVG -> PNG
  const [svgText, setSvgText] = useState("");
  const [svgWidth, setSvgWidth] = useState(1024);
  const [svgHeight, setSvgHeight] = useState(1024);

  // Debug / info
  const [origSize, setOrigSize] = useState(null);
  const [outSize, setOutSize] = useState(null);

  // Loading
  const [processing, setProcessing] = useState(false);

  // Clear previous blob URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
    };
  }, []);

  // ------------------ Helpers ------------------

  const bytesToSize = (bytes) => {
    if (!bytes && bytes !== 0) return "—";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  const readFile = useCallback((f) => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsArrayBuffer(f);
    });
  }, []);

  const fileToDataUrl = useCallback((f) => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(f);
    });
  }, []);

  // Convert File -> base64 (returns base64 string without data:* prefix)
  const fileToBase64 = useCallback((f) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") return reject(new Error("FileReader result not a string"));
        const commaIndex = result.indexOf(",");
        resolve(result.slice(commaIndex + 1));
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }, []);

  // ------------------ File selection ------------------

  const handleFileSelect = useCallback(
    async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      setOrigSize(f.size);
      // preview url
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);

      // clear previous result
      if (resultBlobUrl) {
        URL.revokeObjectURL(resultBlobUrl);
        setResultBlobUrl(null);
        setResultBlob(null);
        setOutSize(null);
      }

      // clear base64 display for different tool
      setBase64String("");
    },
    [previewUrl, resultBlobUrl]
  );

  // Clear file
  const clearFile = useCallback(() => {
    setFile(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = null;
    setResultBlobUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setResultBlob(null);
    setBase64String("");
    setOrigSize(null);
    setOutSize(null);
  }, []);

  // ------------------ Image compressor ------------------

  // Helper: create Image element from dataURL or blob URL
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // allow local blobs / data urls
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error("Failed to load image"));
      img.src = src;
    });
  }, []);

  // Compress using canvas; returns Blob
  const compressImage = useCallback(
    async (inputFile, options = { type: "image/jpeg", quality: 0.75, maxWidth: 0 }) => {
      if (!inputFile) throw new Error("No file provided");
      // create source URL
      const src = URL.createObjectURL(inputFile);
      try {
        const img = await loadImage(src);

        // compute target size keeping aspect ratio
        let targetWidth = img.width;
        let targetHeight = img.height;
        if (options.maxWidth && options.maxWidth > 0 && img.width > options.maxWidth) {
          const ratio = options.maxWidth / img.width;
          targetWidth = Math.round(img.width * ratio);
          targetHeight = Math.round(img.height * ratio);
        }

        // create canvas and draw
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        // better interpolation for downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // convert to blob
        const blob = await new Promise((resolve) => {
          // For PNG the quality parameter is ignored by toBlob
          canvas.toBlob(
            (b) => {
              resolve(b);
            },
            options.type,
            options.quality
          );
        });
        return blob;
      } finally {
        // revoke src
        URL.revokeObjectURL(src);
      }
    },
    [loadImage]
  );

  const handleCompress = useCallback(async () => {
    if (!file) {
      showToast("error", "Upload an image first");
      return;
    }
    setProcessing(true);
    setResultBlob(null);
    setResultBlobUrl(null);
    setOutSize(null);

    try {
      const blob = await compressImage(file, { type: outputFormat, quality, maxWidth: Number(maxWidth) || 0 });
      if (!blob) throw new Error("Compression returned empty blob");

      setResultBlob(blob);
      const url = URL.createObjectURL(blob);
      setResultBlobUrl(url);
      setOutSize(blob.size);
      showToast("success", `Compressed (${bytesToSize(blob.size)})`);
    } catch (err) {
      console.error("Compress error:", err);
      showToast("error", String(err?.message || err));
    } finally {
      setProcessing(false);
    }
  }, [file, compressImage, outputFormat, quality, maxWidth]);

  // ------------------ Image -> Base64 ------------------

  const handleToBase64 = useCallback(async () => {
    if (!file) {
      showToast("error", "Upload a file first");
      return;
    }
    setProcessing(true);
    try {
      const b64 = await fileToBase64(file);
      setBase64String(b64);
      // also set result blob URL for preview for images
      const dataUrl = await fileToDataUrl(file);
      setResultBlobUrl(dataUrl);
      setOutSize(file.size);
      showToast("success", "Converted to Base64");
    } catch (err) {
      console.error("Base64 error", err);
      showToast("error", "Conversion failed");
    } finally {
      setProcessing(false);
    }
  }, [file, fileToBase64, fileToDataUrl]);

  // Copy base64 (with data:* prefix)
  const handleCopyBase64 = useCallback(async () => {
    if (!base64String) {
      showToast("error", "Nothing to copy");
      return;
    }
    try {
      const mime = file?.type || "application/octet-stream";
      const dataUrl = `data:${mime};base64,${base64String}`;
      await navigator.clipboard.writeText(dataUrl);
      showToast("success", "Base64 copied to clipboard (data URL)");
    } catch {
      showToast("error", "Copy failed");
    }
  }, [base64String, file]);

  // ------------------ SVG -> PNG converter ------------------

  // Read SVG file text (if user uploads .svg)
  const svgFileToText = useCallback((f) => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsText(f);
    });
  }, []);

  const svgStringToPngBlob = useCallback(async (svgString, width = svgWidth, height = svgHeight) => {
    // create a blob from svg string
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    try {
      const img = await loadImage(url);
      // create canvas sized to requested width/height (or intrinsic)
      const canvas = document.createElement("canvas");
      canvas.width = width || img.width;
      canvas.height = height || img.height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngBlob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      return pngBlob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [loadImage, svgWidth, svgHeight]);

  const handleSvgToPng = useCallback(async () => {
    setProcessing(true);
    setResultBlob(null);
    setResultBlobUrl(null);
    setOutSize(null);

    try {
      let svgSource = svgText;
      // if user uploaded an SVG file in `file` and selected tool svg_to_png, prefer file content if svgText empty
      if ((!svgSource || !svgSource.trim()) && file?.type === "image/svg+xml") {
        svgSource = await svgFileToText(file);
      }
      if (!svgSource || !svgSource.trim()) {
        showToast("error", "Provide SVG content (paste or upload .svg)");
        setProcessing(false);
        return;
      }
      const blob = await svgStringToPngBlob(svgSource, Number(svgWidth) || undefined, Number(svgHeight) || undefined);
      if (!blob) throw new Error("SVG→PNG conversion failed");
      setResultBlob(blob);
      const url = URL.createObjectURL(blob);
      setResultBlobUrl(url);
      setOutSize(blob.size);
      showToast("success", `Converted to PNG (${bytesToSize(blob.size)})`);
    } catch (err) {
      console.error("SVG->PNG error", err);
      showToast("error", String(err?.message || err));
    } finally {
      setProcessing(false);
    }
  }, [svgText, file, svgFileToText, svgStringToPngBlob, svgWidth, svgHeight]);

  // ------------------ Download / Copy Result ------------------

  const handleDownloadResult = useCallback(() => {
    const blob = resultBlob;
    if (!blob) {
      showToast("error", "No result to download");
      return;
    }
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    // infer extension from blob type
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    a.download = `image-tools-output-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded");
  }, [resultBlob]);

  const handleCopyResultToClipboard = useCallback(async () => {
    if (!resultBlob) {
      showToast("error", "No result to copy");
      return;
    }
    try {
      // Prefer clipboard.write with blob support
      if (navigator.clipboard && navigator.clipboard.write) {
        const data = [new ClipboardItem({ [resultBlob.type]: resultBlob })];
        await navigator.clipboard.write(data);
        showToast("success", "Image copied to clipboard");
        return;
      }
    } catch (err) {
      // fallback
      console.warn("Clipboard image write failed", err);
    }

    // Fallback: copy data URL text
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        await navigator.clipboard.writeText(dataUrl);
        showToast("success", "Result (data URL) copied to clipboard");
      };
      reader.readAsDataURL(resultBlob);
    } catch {
      showToast("error", "Copy failed");
    }
  }, [resultBlob]);

  // ------------------ UI Rendering ------------------

  // Right panel info: original & output sizes
  const compressionRatio = useMemo(() => {
    if (!origSize || !outSize) return "—";
    try {
      return `${Math.round((outSize / origSize) * 100)}%`;
    } catch {
      return "—";
    }
  }, [origSize, outSize]);

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
              Image Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Compress • Convert to Base64 • SVG → PNG</p>
          </div>

        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
                  {selectedTool === TOOLS.SVG_TO_PNG ? "Vector" : "Raster"}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select
                  value={selectedTool}
                  onValueChange={(v) => {
                    setSelectedTool(v);
                    // reset results when switching
                    setResultBlob(null);
                    setResultBlobUrl(null);
                    setBase64String("");
                    setOutSize(null);
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.COMPRESSOR}>Image Compressor</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.TO_BASE64}>Image → Base64</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.SVG_TO_PNG}>SVG → PNG Converter</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                <Label className="text-xs">Upload file</Label>
                <div className="relative">
                  <Input
                    id="image-upload-tool"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className={clsx(
                      "h-12 border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10"
                    )}
                  />
                  <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <ImageIcon className="w-4  h-4 mr-2" />
                    {file ? file.name : "Click or drag to upload an image"}
                  </div>
                </div>
                <div className="text-xs rounded-2xl w-fit px-2 py-0.5 backdrop-blur-md bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"> (PNG/JPEG/WebP/SVG)</div>

                {selectedTool === TOOLS.COMPRESSOR && (
                  <>
                    <Label className="text-xs mt-2">Output format</Label>
                    <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v)}>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="image/jpeg">JPEG</SelectItem>
                        <SelectItem className="cursor-pointer" value="image/webp">WebP</SelectItem>
                        <SelectItem className="cursor-pointer" value="image/png">PNG (lossless)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-xs mt-3">Quality ({Math.round(quality * 100)}%)</Label>
                    <Slider
                      value={[quality]}
                      onValueChange={(v) => setQuality(Number(v[0]))}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="cursor-pointer"
                    />

                    <Label className="text-xs mt-3">Max width (px, 0 = keep)</Label>
                    <Input
                      value={maxWidth}
                      onChange={(e) => setMaxWidth(Number(e.target.value || 0))}
                      type="number"
                    />
                  </>
                )}

                {selectedTool === TOOLS.TO_BASE64 && (
                  <>
                    <Label className="text-xs mt-2">After upload: press Convert</Label>
                  </>
                )}

                {selectedTool === TOOLS.SVG_TO_PNG && (
                  <>
                    <Label className="text-xs mt-2">SVG input (paste or upload .svg)</Label>
                    <Textarea
                      value={svgText}
                      onChange={(e) => setSvgText(e.target.value)}
                      className="max-h-120 resize-none overflow-y-auto no-scrollbar"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs mt-2">Output width</Label>
                        <Input value={svgWidth} onChange={(e) => setSvgWidth(Number(e.target.value || 0))} type="number" />
                      </div>
                      <div>
                        <Label className="text-xs mt-2">Output height</Label>
                        <Input value={svgHeight} onChange={(e) => setSvgHeight(Number(e.target.value || 0))} type="number" />
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      // dispatch action per tool
                      if (selectedTool === TOOLS.COMPRESSOR) handleCompress();
                      else if (selectedTool === TOOLS.TO_BASE64) handleToBase64();
                      else if (selectedTool === TOOLS.SVG_TO_PNG) handleSvgToPng();
                    }}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                    {selectedTool === TOOLS.COMPRESSOR ? "Compress" : selectedTool === TOOLS.TO_BASE64 ? "Convert to Base64" : "Convert SVG → PNG"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      clearFile();
                      setSvgText("");
                    }}
                    className="cursor-pointer bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  All processing is performed in the browser using Canvas. Large images may be resource-intensive.
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: Preview + output */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Preview & Output
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => {
                  if (resultBlob) handleCopyResultToClipboard();
                  else showToast("info", "No result to copy");
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => {
                  if (resultBlob) handleDownloadResult();
                  else showToast("info", "No result to download");
                }}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-900/50 min-h-[260px] flex flex-col gap-4">
                {/* top: preview */}
                <div className="flex-1 flex items-center justify-center border rounded p-2 bg-transparent">
                  {processing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="animate-spin w-10 h-10 text-slate-500" />
                      <div className="text-sm text-muted-foreground mt-3">Processing…</div>
                    </div>
                  ) : resultBlobUrl ? (
                    // show result preview if available
                    <img src={resultBlobUrl} alt="Result preview" className="max-h-[380px] object-contain" />
                  ) : previewUrl ? (
                    <img src={previewUrl} alt="Original preview" className="max-h-[380px] object-contain" />
                  ) : (
                    <div className="text-sm text-muted-foreground">No preview. Upload an image or SVG and run a conversion/compression.</div>
                  )}
                </div>

                {/* bottom: base64 viewer for to_base64 */}
                {selectedTool === TOOLS.TO_BASE64 && base64String && (
                  <div className="space-y-2">
                    <Label className="text-xs">Base64 (data URL)</Label>
                    <Textarea
                      value={file ? `data:${file.type};base64,${base64String}` : `data:;base64,${base64String}`}
                      readOnly
                      className="max-h-150 overflow-y-auto resize-none "
                    />
                    <div className="flex gap-2">
                      <Button className="cursor-pointer" onClick={handleCopyBase64}><Copy className="w-4 h-4 " />Copy Base64</Button>
                      <Button className="cursor-pointer" onClick={() => {
                        // download as text file containing data URL
                        const dataUrl = `data:${file?.type || "application/octet-stream"};base64,${base64String}`;
                        const blob = new Blob([dataUrl], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `image-base64-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast("success", "Downloaded base64");
                      }} variant="outline"><Download className="w-4 h-4 " />Download</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Tip: Use download or copy to export images. For best compression use WEBP when supported.</div>
                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => {
                    // regenerate: for compressor re-run, for svg convert re-run, for base64 re-run
                    if (selectedTool === TOOLS.COMPRESSOR) handleCompress();
                    else if (selectedTool === TOOLS.TO_BASE64) handleToBase64();
                    else if (selectedTool === TOOLS.SVG_TO_PNG) handleSvgToPng();
                  }}>
                    {selectedTool === TOOLS.COMPRESSOR ? "Re-compress" : selectedTool === TOOLS.TO_BASE64 ? "Re-convert" : "Re-convert"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Right: Details & Quick Actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details & Quick Actions</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Original size</span>
                    <span className="font-medium">{bytesToSize(origSize)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Result size</span>
                    <span className="font-medium">{bytesToSize(outSize)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Ratio</span>
                    <span className="font-medium">{compressionRatio}</span>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Button className="cursor-pointer" onClick={() => {
                      if (!resultBlob) { showToast("info", "No result yet"); return; }
                      handleDownloadResult();
                    }}>Download result</Button>

                    <Button className="cursor-pointer" variant="outline" onClick={() => {
                      if (!resultBlob) { showToast("info", "No result yet"); return; }
                      handleCopyResultToClipboard();
                    }}>Copy result</Button>

                    <Button  className="cursor-pointer" variant="outline" onClick={() => {
                      // quick convert image->base64 if result exists
                      if (!resultBlob) { showToast("info", "No result to base64"); return; }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result;
                        navigator.clipboard.writeText(dataUrl).then(() => showToast("success", "Result (data URL) copied to clipboard"));
                      };
                      reader.readAsDataURL(resultBlob);
                    }}>Copy result as data URL</Button>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    Note: PNG is lossless and won't shrink photographic JPEGs as much as WebP/JPEG. Use WebP for best compression in modern browsers.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 list-disc pl-5">
                  <li>Use max width to reduce large images before compression.</li>
                  <li>WebP usually yields smallest sizes for photos.</li>
                  <li>SVG → PNG rasterizes vector art; choose output dimensions to retain sharpness.</li>
                  <li>All processing is performed in-browser; files are not uploaded.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

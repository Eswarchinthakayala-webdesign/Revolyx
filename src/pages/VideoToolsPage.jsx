// src/pages/VideoToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Loader2,
  Download,
  Film,
  Image as ImageIcon,
  Send,
  Zap,
  Settings,
  Layers,
  Play,
  Pause,
  Scissors,
  ArrowDownCircle,
  ArrowUp,
  ArrowDown,
  List,
  X,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// Tool enum
const TOOLS = {
  COMPRESSOR: "compressor",
  EXTRACT_FRAMES: "extract_frames",
  MERGE_VIDEOS: "merge_videos",
};

// ---------- helpers ----------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function waitForEvent(target, eventName, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Video error"));
    };
    const cleanup = () => {
      target.removeEventListener(eventName, onEvent);
      target.removeEventListener("error", onError);
      clearTimeout(timer);
    };
    target.addEventListener(eventName, onEvent);
    target.addEventListener("error", onError);
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout waiting for " + eventName));
    }, timeout);
  });
}

// ---------- component ----------
export default function VideoToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI
  const [selectedTool, setSelectedTool] = useState(TOOLS.COMPRESSOR);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugText, setDebugText] = useState("");

  // Compressor
  const compressorInputRef = useRef(null);
  const [compressFile, setCompressFile] = useState(null);
  const [compressOriginalUrl, setCompressOriginalUrl] = useState(null);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [targetWidth, setTargetWidth] = useState(720);
  const [targetFps, setTargetFps] = useState(24);

  // Extract frames
  const framesInputRef = useRef(null);
  const [framesFile, setFramesFile] = useState(null);
  const [framesOriginalUrl, setFramesOriginalUrl] = useState(null);
  const [frameInterval, setFrameInterval] = useState(1.0);
  const [frames, setFrames] = useState([]); // [{blob, time, url}]
  const [framesExtracted, setFramesExtracted] = useState(false);

  // Merge videos
  const mergeInputRef = useRef(null);
  const [mergeFiles, setMergeFiles] = useState([]); // [{file, url, id}]
  const [mergedBlob, setMergedBlob] = useState(null);
  const [mergedUrl, setMergedUrl] = useState(null);

  const [file, setFile] = useState(null);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);

  // internal
  const recordedChunksRef = useRef([]);

  // URL syncing for ?tool=
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tool");
      if (t && Object.values(TOOLS).includes(t)) setSelectedTool(t);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      params.set("tool", selectedTool);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    } catch {}
  }, [selectedTool]);

  // --------- Compressor handlers ----------
  useEffect(() => {
    // create/revoke object URL for original compressFile
    if (!compressFile) {
      if (compressOriginalUrl) {
        URL.revokeObjectURL(compressOriginalUrl);
        setCompressOriginalUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(compressFile);
    setCompressOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compressFile]);

  useEffect(() => {
    if (compressedBlob) {
      const u = URL.createObjectURL(compressedBlob);
      setCompressedUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      if (compressedUrl) {
        URL.revokeObjectURL(compressedUrl);
        setCompressedUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compressedBlob]);

  const onCompressFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f)
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      showToast("error", "Please upload a video file.");
      return;
    }
    setCompressFile(f);
    setCompressedBlob(null);
    setDebugText("");
    showToast("success", `Loaded ${f.name}`);
  };

  const handleCompress = useCallback(async () => {
    if (!compressFile) {
      showToast("error", "Upload a video to compress");
      return;
    }
    setLoading(true);
    setDebugText("");
    setCompressedBlob(null);
    recordedChunksRef.current = [];
    try {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(compressFile);

      await waitForEvent(video, "loadedmetadata");
      const origW = video.videoWidth;
      const origH = video.videoHeight;
      const aspect = origH / origW;
      const w = Math.min(targetWidth, origW);
      const h = Math.round(w * aspect);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      const stream = canvas.captureStream(targetFps);
      let options = { mimeType: "video/webm;codecs=vp9" };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) recordedChunksRef.current.push(ev.data);
      };

      await video.play().catch(() => { /* ignore autoplay block */ });
      recorder.start();

      // Draw frames in a loop by seeking progressively to avoid playing audio
      const duration = video.duration;
      const fps = targetFps;
      const step = 1 / fps;
      let t = 0;
      while (t < duration) {
        video.currentTime = Math.min(t, duration);
        await waitForEvent(video, "seeked");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // allow time for MediaRecorder to grab frame
        await new Promise((r) => setTimeout(r, Math.max(0, step * 1000 * 0.9)));
        t += step;
      }

      // final frame
      video.currentTime = duration;
      await waitForEvent(video, "seeked");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // stop recorder after a short delay to flush last frames
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        setTimeout(() => recorder.stop(), 200);
      });

      const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || "video/webm" });
      setCompressedBlob(blob);
      showToast("success", "Compression complete (WebM output)");
      setDebugText(`Original: ${origW}x${origH}, Output: ${w}x${h}, Duration: ${duration.toFixed(2)}s`);
      URL.revokeObjectURL(video.src);
    } catch (err) {
      console.error("Compress error", err);
      showToast("error", String(err?.message || err));
      setDebugText(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [compressFile, targetWidth, targetFps]);

  // --------- Extract frames handlers ----------
  useEffect(() => {
    if (!framesFile) {
      if (framesOriginalUrl) {
        URL.revokeObjectURL(framesOriginalUrl);
        setFramesOriginalUrl(null);
      }
      setFrames([]);
      setFramesExtracted(false);
      return;
    }
    const url = URL.createObjectURL(framesFile);
    setFramesOriginalUrl(url);
    setFrames([]);
    setFramesExtracted(false);
    setDebugText("");
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framesFile]);

  const onFramesFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile1(f)
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      showToast("error", "Please upload a video file.");
      return;
    }
    setFramesFile(f);
    showToast("success", `Loaded ${f.name}`);
  };

  const handleExtractFrames = useCallback(async () => {
    if (!framesFile) {
      showToast("error", "Upload a video to extract frames");
      return;
    }
    setLoading(true);
    setFrames([]);
    setDebugText("");
    try {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(framesFile);
      await waitForEvent(video, "loadedmetadata");
      const duration = video.duration;

      // choose canvas size (cap to 1280)
      const maxW = 1280;
      const w = Math.min(video.videoWidth, maxW);
      const h = Math.round((video.videoHeight / video.videoWidth) * w);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      const times = [];
      for (let t = 0; t < duration; t += frameInterval) times.push(Math.min(t, duration));
      // always include final frame
      if (times[times.length - 1] !== duration) times.push(duration);

      const collected = [];
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        video.currentTime = t;
        await waitForEvent(video, "seeked");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // convert to blob
        const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        const url = URL.createObjectURL(blob);
        collected.push({ blob, url, time: t });
        // small delay
        await new Promise((r) => setTimeout(r, 40));
      }

      setFrames(collected);
      setFramesExtracted(true);
      showToast("success", `Extracted ${collected.length} frames`);
      setDebugText(`Interval: ${frameInterval}s — Resolution: ${w}x${h} — Duration: ${duration.toFixed(2)}s`);
      URL.revokeObjectURL(video.src);
    } catch (err) {
      console.error("Frames error", err);
      showToast("error", String(err?.message || err));
      setDebugText(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [framesFile, frameInterval]);

  // cleanup frame object URLs when frames update / unmount
  useEffect(() => {
    return () => {
      frames.forEach((f) => {
        try {
          URL.revokeObjectURL(f.url);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // --------- Merge videos handlers ----------
  useEffect(() => {
    // revoke previous merged URL if blob changes
    if (mergedBlob) {
      const u = URL.createObjectURL(mergedBlob);
      setMergedUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      if (mergedUrl) {
        URL.revokeObjectURL(mergedUrl);
        setMergedUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedBlob]);

  const onMergeFilesChange = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("video/"));
    if (!files.length) {
      showToast("error", "Please select at least one video.");
      return;
    }
    // map to objects with id and object url
    const mapped = files.map((f, i) => ({ id: `${Date.now()}-${i}`, file: f, url: URL.createObjectURL(f) }));
    // append to existing list
    setMergeFiles((prev) => {
      // revoke prev urls (we keep prev items, so no revoke)
      return [...prev, ...mapped];
    });
    const lastFileName = files[files.length - 1].name;
    setFile2(lastFileName);
    showToast("success", `Added ${mapped.length} videos (last: ${lastFileName})`);
  };

  // reorder merge files
  const reorderMerge = (index, dir) => {
    setMergeFiles((prev) => {
      const arr = [...prev];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return arr;
      const tmp = arr[j];
      arr[j] = arr[index];
      arr[index] = tmp;
      return arr;
    });
  };

  const removeMergeFile = (index) => {
    setMergeFiles((prev) => {
      const arr = [...prev];
      const removed = arr.splice(index, 1)[0];
      try {
        URL.revokeObjectURL(removed.url);
      } catch {}
      return arr;
    });
  };

  const handleMergeVideos = useCallback(async () => {
    if (!mergeFiles.length) {
      showToast("error", "Select videos to merge");
      return;
    }
    setLoading(true);
    setMergedBlob(null);
    setDebugText("");
    recordedChunksRef.current = [];
    try {
      const player = document.createElement("video");
      player.muted = true;
      player.playsInline = true;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const fps = 24;
      const stream = canvas.captureStream(fps);
      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) recordedChunksRef.current.push(ev.data);
      };

      recorder.start();

      for (let i = 0; i < mergeFiles.length; i++) {
        const item = mergeFiles[i];
        player.src = item.url;
        await waitForEvent(player, "loadedmetadata");
        // set canvas size based on this video (cap width)
        const maxW = 1280;
        const w = Math.min(player.videoWidth, maxW);
        const h = Math.round((player.videoHeight / player.videoWidth) * w);
        canvas.width = w;
        canvas.height = h;

        // play but use seeking loop for frame export
        await player.play().catch(() => {});
        const duration = player.duration;
        const step = 1 / fps;
        let t = 0;
        while (t < duration) {
          player.currentTime = Math.min(t, duration);
          await waitForEvent(player, "seeked");
          ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
          await new Promise((r) => setTimeout(r, Math.max(0, step * 1000 * 0.9)));
          t += step;
        }
        // final frame
        player.currentTime = duration;
        await waitForEvent(player, "seeked");
        ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
      }

      // stop recorder
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        setTimeout(() => recorder.stop(), 300);
      });

      const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || "video/webm" });
      setMergedBlob(blob);
      showToast("success", "Merged videos (WebM output)");
      setDebugText(`Merged ${mergeFiles.length} videos`);
    } catch (err) {
      console.error("Merge error", err);
      showToast("error", String(err?.message || err));
      setDebugText(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [mergeFiles]);

  // cleanup object URLs for mergeFiles on unmount
  useEffect(() => {
    return () => {
      mergeFiles.forEach((m) => {
        try {
          URL.revokeObjectURL(m.url);
        } catch {}
      });
      frames.forEach((f) => {
        try {
          URL.revokeObjectURL(f.url);
        } catch {}
      });
      if (compressOriginalUrl) try { URL.revokeObjectURL(compressOriginalUrl); } catch {}
      if (framesOriginalUrl) try { URL.revokeObjectURL(framesOriginalUrl); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI helpers ----------
  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.COMPRESSOR:
        return "Video Compressor";
      case TOOLS.EXTRACT_FRAMES:
        return "Extract Frames";
      case TOOLS.MERGE_VIDEOS:
        return "Merge Videos";
      default:
        return "Video Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
               Video Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Compress • Extract frames • Merge — all client-side and privacy-friendly</p>
          </div>

          <div className="flex items-center gap-3">


            <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>
              <Settings className="w-4 h-4" /> Info
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300" >{selectedTool === TOOLS.EXTRACT_FRAMES ? "Images" : "Video"}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.COMPRESSOR}>Video Compressor</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.EXTRACT_FRAMES}>Extract Frames</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.MERGE_VIDEOS}>Merge Videos</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {/* Compressor */}
                {selectedTool === TOOLS.COMPRESSOR && (
                  <>
                    <Label className="text-xs">Upload video</Label>
                    <div className="relative">
                    <Input className=" border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" ref={compressorInputRef} type="file" accept="video/*" onChange={onCompressFileChange} />
                     <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                        <Video className="w-4  h-4 mr-2" />
            
                    {file ? file.name : "Upload Video"}
                    </div>
                    </div>
                    <div className="pt-2">
                      <Label className="text-xs mb-1">Target width</Label>
                        <Slider
                        min={240}
                        max={1920}
                        step={16}
                        value={[targetWidth]}
                        onValueChange={(val) => setTargetWidth(val[0])}
                        className="w-full cursor-pointer"
                        />

                      <div className="text-xs mt-1">Width: <span className="font-medium">{targetWidth}px</span></div>
                    </div>
                    <div className="pt-2">
                      <Label className="text-xs mb-1">Target FPS</Label>
                        <Slider
                        min={8}
                        max={60}
                        step={1}
                        value={[targetFps]}
                        onValueChange={(val) => setTargetFps(val[0])}
                        className="w-full cursor-pointer"
                        />

                      <div className="text-xs mt-1">FPS: <span className="font-medium">{targetFps}</span></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 cursor-pointer" onClick={handleCompress} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />} Compress
                      </Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setCompressFile(null); setCompressedBlob(null); setDebugText(""); if (compressorInputRef.current) compressorInputRef.current.value = null; }}>Clear</Button>
                    </div>
                  </>
                )}

                {/* Extract frames */}
                {selectedTool === TOOLS.EXTRACT_FRAMES && (
                  <>
                    <Label className="text-xs">Upload video</Label>
                    <div className="relative">
                    <Input className=" border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" ref={framesInputRef} type="file" accept="video/*" onChange={onFramesFileChange} />
                     <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                        <Video className="w-4  h-4 mr-2" />
            
                    {file1 ? file1.name : "Upload Audio"}
                    </div>
                    </div>
                    <div className="pt-2">
                      <Label className="text-xs mb-1">Frame interval (seconds)</Label>
                    <Slider
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={[frameInterval]}
                    onValueChange={(val) => setFrameInterval(val[0])}
                    className="w-full cursor-pointer"
                    />

                      <div className="text-xs mt-1">Interval: <span className="font-medium">{frameInterval}s</span></div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 cursor-pointer" onClick={handleExtractFrames} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />} Extract
                      </Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setFramesFile(null); setFrames([]); setFramesExtracted(false); setDebugText(""); if (framesInputRef.current) framesInputRef.current.value = null; }}>Clear</Button>
                    </div>
                  </>
                )}

                {/* Merge videos */}
                {selectedTool === TOOLS.MERGE_VIDEOS && (
                  <>
                    <Label className="text-xs">Select videos (multiple)</Label>
                    <div className="relative">
                    <Input className=" border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" ref={mergeInputRef} type="file" accept="video/*" multiple onChange={onMergeFilesChange} />
                     <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                        <Video className="w-4  h-4 mr-2" />
            
                    {file2 ? file2 : "Upload Audio"}
                    </div>
                    </div>
                    <div className="text-xs opacity-70 mt-2">Files selected: <span className="font-medium">{mergeFiles.length}</span></div>

                    <div className="mt-3 space-y-2">
                      {mergeFiles.map((m, idx) => (
                        <div key={m.id} className="flex items-center gap-2 border rounded p-2 bg-white/60 dark:bg-zinc-900/60">
                          <div className="flex-1 text-xs truncate">{m.file.name}</div>
                          <div className="flex items-center gap-1">
                            <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => reorderMerge(idx, -1)}><ArrowUp className="w-4 h-4" /></Button>
                            <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => reorderMerge(idx, +1)}><ArrowDown className="w-4 h-4" /></Button>
                            <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => removeMergeFile(idx)}><X className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 cursor-pointer" onClick={handleMergeVideos} disabled={loading || mergeFiles.length < 1}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Scissors className="w-4 h-4 mr-2" />} Merge
                      </Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { mergeFiles.forEach(m => { try { URL.revokeObjectURL(m.url); } catch {} }); setMergeFiles([]); setMergedBlob(null); setDebugText(""); if (mergeInputRef.current) mergeInputRef.current.value = null; }}>Clear</Button>
                    </div>
                  </>
                )}

                <Separator />
                <div className="text-xs opacity-70">Operations are performed in-browser. Output is WebM for broad support. For MP4/H.264 use server-side ffmpeg or ffmpeg.wasm.</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center: preview & outputs */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">{toolLabel}</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">Client-side processing — privacy-first</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => {
                  if (selectedTool === TOOLS.COMPRESSOR) {
                    if (compressedBlob) downloadBlob(compressedBlob, "compressed.webm");
                    else showToast("error", "No compressed output");
                  } else if (selectedTool === TOOLS.EXTRACT_FRAMES) {
                    if (frames.length) showToast("info", "Use the Save buttons on frames to download individually.");
                    else showToast("error", "No frames extracted");
                  } else if (selectedTool === TOOLS.MERGE_VIDEOS) {
                    if (mergedBlob) downloadBlob(mergedBlob, "merged.webm");
                    else showToast("error", "No merged output");
                  }
                }}><Download className="w-4 h-4" /></Button>

                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setCompressedBlob(null); setMergedBlob(null); setFrames([]); setDebugText(""); showToast("success", "Cleared outputs"); }}>Clear</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-950/50 min-h-[320px]">
                {/* Compressor: show original + compressed side-by-side */}
                {selectedTool === TOOLS.COMPRESSOR && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Original</div>
                      {compressOriginalUrl ? (
                        <video src={compressOriginalUrl} controls className="w-full max-h-[360px] object-contain rounded" />
                      ) : <div className="text-sm opacity-60">Upload a video to preview original</div>}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Compressed</div>
                      {compressedUrl ? (
                        <video src={compressedUrl} controls className="w-full max-h-[360px] object-contain rounded" />
                      ) : <div className="text-sm opacity-60">Compressed result will appear here</div>}
                    </div>

                    <div className="md:col-span-2 mt-3 text-xs text-muted-foreground">{debugText || "Tip: Compare original vs compressed to verify quality."}</div>
                  </div>
                )}

                {/* Extract frames: show original video on top + grid of frames below for comparison */}
                {selectedTool === TOOLS.EXTRACT_FRAMES && (
                  <div>
                    <div className="grid grid-cols-1  gap-4">
                      <div className="md:col-span-1">
                        <div className="text-sm font-medium mb-2">Original video</div>
                        {framesOriginalUrl ? (
                          <video src={framesOriginalUrl} controls className="w-full max-h-[260px] object-contain rounded" />
                        ) : <div className="text-sm opacity-60">Upload a video to preview original</div>}
                      </div>

                      <div className="md:col-span-2">
                        <div className="text-sm font-medium mb-2">Extracted frames (preview)</div>
                        {frames.length ? (
                          <>
                          <div className="space-y-2 h-100 overflow-y-auto p-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {frames.map((f, idx) => (
                                <div key={idx} className="border rounded overflow-hidden bg-white/60 dark:bg-zinc-950/60">
                                  <img src={f.url} alt={`frame-${idx}`} className="w-full h-36 object-cover" />
                                  <div className="p-2 flex items-center justify-between">
                                    <div className="text-xs">t: {f.time.toFixed(2)}s</div>
                                    <div className="flex gap-1">
                                      <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => downloadBlob(f.blob, `frame-${idx + 1}-t${f.time.toFixed(2)}.png`)}>Save</Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <Button className="cursor-pointer" onClick={() => { frames.forEach((f) => downloadBlob(f.blob, `frame-${(Math.random()*1e6|0)}.png`)); showToast("success", "Triggered downloads"); }}>Download all (individually)</Button>
                              <div className="text-xs text-muted-foreground">{debugText}</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm opacity-60">No frames yet. Use the controls to extract frames.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Merge videos: show selected video list + merged preview */}
                {selectedTool === TOOLS.MERGE_VIDEOS && (
                  <div>
                    <div className="mb-3">
                      <div className="text-sm font-medium">Selected videos (preview & order)</div>
                      {mergeFiles.length ? (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {mergeFiles.map((m, idx) => (
                            <div key={m.id} className="flex items-center gap-3 border rounded p-2 bg-white/60 dark:bg-zinc-950/60">
                              
                              <div className="flex-1 text-xs">
                                <div className="font-medium truncate">{m.file.name}</div>
                                <div className="text-xs opacity-70">Order: {idx + 1}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => reorderMerge(idx, -1)}><ArrowUp className="w-4 h-4" /></Button>
                                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => reorderMerge(idx, +1)}><ArrowDown className="w-4 h-4" /></Button>
                                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => removeMergeFile(idx)}><X className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm opacity-60 mt-2">No videos selected. Use the control on the left to add videos.</div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Merged preview</div>
                      {mergedUrl ? (
                        <video src={mergedUrl} controls className="w-full max-h-[360px] object-contain rounded" />
                      ) : (
                        <div className="text-sm opacity-60">Merged output will appear here</div>
                      )}

                      <div className="mt-3 text-xs text-muted-foreground">{debugText}</div>
                      <div className="mt-2 flex gap-2">
                        <Button className="cursor-pointer" onClick={() => { if (mergedBlob) downloadBlob(mergedBlob, "merged.webm"); else showToast("error", "No merged output"); }}>Download merged</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Neutral placeholder */}
                {(![
                  TOOLS.COMPRESSOR,
                  TOOLS.EXTRACT_FRAMES,
                  TOOLS.MERGE_VIDEOS,
                ].includes(selectedTool)) && (
                  <div className="text-sm opacity-60">Select a tool to start</div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Tip: WebM outputs are created in-browser. For MP4/H.264 use server-side transcoding.</div>
                <div>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => {
                    // run appropriate action
                    if (selectedTool === TOOLS.COMPRESSOR) handleCompress();
                    else if (selectedTool === TOOLS.EXTRACT_FRAMES) handleExtractFrames();
                    else if (selectedTool === TOOLS.MERGE_VIDEOS) handleMergeVideos();
                  }}>
                    <Zap className="w-4 h-4 mr-1" />Run
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* right: debug & quick actions */}
        <aside className="lg:col-span-3">
          <div className=" space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div><strong>Tool:</strong> <span className="opacity-80">{toolLabel}</span></div>
                  <div><strong>Compressed size:</strong> <span className="opacity-80">{compressedBlob ? `${(compressedBlob.size/1024/1024).toFixed(2)} MB` : "—"}</span></div>
                  <div><strong>Merged size:</strong> <span className="opacity-80">{mergedBlob ? `${(mergedBlob.size/1024/1024).toFixed(2)} MB` : "—"}</span></div>
                  <div><strong>Frames:</strong> <span className="opacity-80">{frames.length}</span></div>
                  <Separator />
                  <div className="text-xs opacity-70">{debugText || "Processing logs and tips appear here."}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setCompressedBlob(null); setMergedBlob(null); frames.forEach(f => { try { URL.revokeObjectURL(f.url); } catch {} }); setFrames([]); setDebugText(""); showToast("success", "Cleared outputs"); }}>Clear outputs</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => setDebugText("")}>Clear logs</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.COMPRESSOR); showToast("info", "Switched to Compressor"); }}>Go to Compressor</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Video Tools — Notes</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              These tools run entirely in the browser using canvas + MediaRecorder. Output is WebM (VP8/VP9) depending on browser support.
              For production MP4/H.264 or better quality control, consider server-side ffmpeg or ffmpeg.wasm.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}

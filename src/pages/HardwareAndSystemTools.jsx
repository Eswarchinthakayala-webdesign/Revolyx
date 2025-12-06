// src/pages/HardwareAndSystemTools.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Layers,
  Settings,
  Cpu,
  Monitor,
  Wifi,
  Cpu as CpuChip,
  Camera,
  Mic,
  Play,
  StopCircle,
  Download,
  RefreshCw,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import MDEditor from "@uiw/react-md-editor";

// Tools enum for left select
const TOOLS = {
  SYS_INFO: "system_info",
  NETWORK: "network_speed",
  GPU: "gpu_benchmark",
  AUDIO: "audio_test",
  CAMERA: "camera_test",
  MICROPHONE: "microphone_test",
};

// small helper to format bytes
function prettyBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

// ----------------- Main Component -----------------
export default function HardwareAndSystemTools() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [selectedTool, setSelectedTool] = useState(TOOLS.SYS_INFO);

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);

  // ---------- System info state ----------
  const [sysInfo, setSysInfo] = useState({});
  const gatherSystemInfo = useCallback(() => {
    const nav = typeof navigator !== "undefined" ? navigator : {};
    const screenObj = typeof screen !== "undefined" ? screen : {};
    const info = {
      userAgent: nav.userAgent || "—",
      platform: nav.platform || "—",
      languages: nav.languages?.join?.(", ") || nav.language || "—",
      online: nav.onLine ? "online" : "offline",
      cookieEnabled: nav.cookieEnabled ? "yes" : "no",
      deviceMemory: nav.deviceMemory ?? "—",
      hardwareConcurrency: nav.hardwareConcurrency ?? "—",
      cpuClass: nav.cpuClass ?? "—",
      vendor: nav.vendor ?? "—",
      screen: `${screenObj.width || "—"} x ${screenObj.height || "—"} (${screenObj.orientation?.type || "—"})`,
      colorDepth: screenObj.colorDepth ?? "—",
      viewport: `${window.innerWidth} x ${window.innerHeight}`,
    };
    setSysInfo(info);
  }, []);

  // ---------- Network speed estimator ----------
  const [netTestUrl, setNetTestUrl] = useState("https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg"); // fallback public image (can change)
  const [netRunning, setNetRunning] = useState(false);
  const [netResult, setNetResult] = useState(null);
  const netAbortRef = useRef(null);

  const runNetworkTest = useCallback(
    async (sizeHintBytes = null) => {
      // This test measures download throughput by fetching a resource and timing it.
      // Use a URL that allows CORS. If you run locally and CORS blocks, change URL to a CORS-friendly endpoint.
      if (!netTestUrl) {
        showToast("error", "Set a test URL first");
        return;
      }

      setNetRunning(true);
      setNetResult(null);
      netAbortRef.current && netAbortRef.current.abort();
      const controller = new AbortController();
      netAbortRef.current = controller;

      try {
        // add cache-buster
        const u = new URL(netTestUrl);
        u.searchParams.set("_cb", String(Date.now()));

        const start = performance.now();
        const resp = await fetch(u.toString(), { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        // read body as stream to measure transfer accurately
        const reader = resp.body?.getReader?.();
        if (!reader) {
          // fallback: blob
          const blob = await resp.blob();
          const end = performance.now();
          const elapsed = (end - start) / 1000;
          const bytes = blob.size || 0;
          setNetResult({
            bytes,
            elapsed,
            bps: bytes / elapsed,
            pretty: `${prettyBytes(bytes)} in ${elapsed.toFixed(2)}s — ${(bytes / elapsed / 1024).toFixed(2)} KB/s`,
          });
        } else {
          let bytes = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value?.length ?? 0;
          }
          const end = performance.now();
          const elapsed = (end - start) / 1000;
          setNetResult({
            bytes,
            elapsed,
            bps: bytes / elapsed,
            pretty: `${prettyBytes(bytes)} in ${elapsed.toFixed(2)}s — ${(bytes / elapsed / 1024).toFixed(2)} KB/s`,
          });
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          setNetResult({ error: "Test aborted" });
        } else {
          setNetResult({ error: err.message || String(err) });
        }
      } finally {
        setNetRunning(false);
        netAbortRef.current = null;
      }
    },
    [netTestUrl]
  );

  const stopNetworkTest = useCallback(() => {
    netAbortRef.current?.abort();
  }, []);

  // ---------- GPU benchmark (WebGL FPS probe) ----------
  const [gpuRunning, setGpuRunning] = useState(false);
  const [gpuResult, setGpuResult] = useState(null);
  const glCanvasRef = useRef(null);

  const runWebGLBenchmark = useCallback(async (seconds = 3) => {
    setGpuRunning(true);
    setGpuResult(null);
    try {
      const canvas = glCanvasRef.current;
      if (!canvas) {
        setGpuResult({ error: "Canvas not mounted" });
        setGpuRunning(false);
        return;
      }
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setGpuResult({ error: "WebGL not supported" });
        setGpuRunning(false);
        return;
      }

      // simple triangle draw (no shaders heavy work). We'll just call drawArrays each frame and measure frame times.
      let running = true;
      let frames = 0;
      let start = performance.now();

      function frame() {
        if (!running) return;
        // do a quick clear and viewport ops to exercise GPU
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        frames++;
        if (performance.now() - start < seconds * 1000) {
          requestAnimationFrame(frame);
        } else {
          running = false;
          const elapsed = (performance.now() - start) / 1000;
          const fps = frames / elapsed;
          setGpuResult({ frames, elapsed, fps: Number(fps.toFixed(1)) });
          setGpuRunning(false);
        }
      }
      // warm up
      requestAnimationFrame(frame);
    } catch (err) {
      setGpuResult({ error: err.message || String(err) });
      setGpuRunning(false);
    }
  }, []);

  // ---------- Audio test (WebAudio oscillator) ----------
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const startAudioTest = useCallback(() => {
    try {
      const AudioContextCls = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCls) {
        showToast("error", "Web Audio API not supported");
        return;
      }
      const ctx = new AudioContextCls();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = { osc, gain };
      setAudioPlaying(true);
    } catch (err) {
      showToast("error", "Audio start failed");
      console.error(err);
    }
  }, []);

  const stopAudioTest = useCallback(() => {
    try {
      const ref = oscillatorRef.current;
      if (ref) {
        ref.osc.stop?.();
        ref.osc.disconnect?.();
        ref.gain.disconnect?.();
        oscillatorRef.current = null;
      }
      audioCtxRef.current?.close?.();
      audioCtxRef.current = null;
      setAudioPlaying(false);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ---------- Camera test ----------
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraRunning(true);
    } catch (err) {
      setCameraError(err.message || String(err));
    }
  }, []);

  const stopCamera = useCallback(() => {
    try {
      cameraStreamRef.current?.getTracks?.().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      setCameraRunning(false);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const takeSnapshot = useCallback(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    // open in new tab or offer download
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `snapshot-${Date.now()}.png`;
    a.click();
  }, []);

  // ---------- Microphone test (level meter) ----------
  const micStreamRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micAnimationRef = useRef(null);
  const canvasMicRef = useRef(null);
  const [micRunning, setMicRunning] = useState(false);
  const [micError, setMicError] = useState(null);

  const startMicTest = useCallback(async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioContextCls = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextCls();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      micAnalyserRef.current = { analyser, ctx };

      const canvas = canvasMicRef.current;
      const canvasCtx = canvas?.getContext("2d");

      function draw() {
        const bufferLength = analyser.fftSize;
        const data = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const level = Math.min(1, rms * 2);

        if (canvasCtx && canvas) {
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCtx.fillStyle = isDark ? "#22c55e" : "#16a34a";
          canvasCtx.fillRect(0, 0, canvas.width * level, canvas.height);
        }

        micAnimationRef.current = requestAnimationFrame(draw);
      }
      draw();
      setMicRunning(true);
    } catch (err) {
      setMicError(err.message || String(err));
    }
  }, [isDark]);

  const stopMicTest = useCallback(() => {
    try {
      cancelAnimationFrame(micAnimationRef.current);
      micAnimationRef.current = null;
      if (micAnalyserRef.current) {
        micAnalyserRef.current.ctx.close?.();
        micAnalyserRef.current = null;
      }
      micStreamRef.current?.getTracks?.().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicRunning(false);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopNetworkTest();
      stopAudioTest();
      stopCamera();
      stopMicTest();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI labels ----------
  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.SYS_INFO:
        return "System Information";
      case TOOLS.NETWORK:
        return "Network Speed Estimator";
      case TOOLS.GPU:
        return "GPU (WebGL) Benchmark";
      case TOOLS.AUDIO:
        return "Audio Test (WebAudio)";
      case TOOLS.CAMERA:
        return "Camera Test";
      case TOOLS.MICROPHONE:
        return "Microphone Test";
      default:
        return "Hardware & System Tool";
    }
  }, [selectedTool]);

  // ---------- Render ----------
  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
             Hardware & System Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">System info • Network • GPU • Audio • Camera • Microphone</p>
          </div>

          <div className="flex items-center gap-3">


            <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>Notes</Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left: controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tools</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{selectedTool === TOOLS.GPU ? "GPU" : "Client"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                 <SelectContent>
                      <SelectItem className="cursor-pointer" value={TOOLS.SYS_INFO}><Cpu className="mr-2 inline-block w-4 h-4" /> System info</SelectItem>
                      <SelectItem className="cursor-pointer" value={TOOLS.NETWORK}><Wifi className="mr-2 inline-block w-4 h-4" /> Network speed</SelectItem>
                      <SelectItem className="cursor-pointer" value={TOOLS.GPU}><CpuChip className="mr-2 inline-block w-4 h-4" /> GPU benchmark</SelectItem>
                      <SelectItem className="cursor-pointer" value={TOOLS.AUDIO}><Zap className="mr-2 inline-block w-4 h-4" /> Audio test</SelectItem>
                      <SelectItem className="cursor-pointer" value={TOOLS.CAMERA}><Camera className="mr-2 inline-block w-4 h-4" /> Camera test</SelectItem>
                      <SelectItem className="cursor-pointer" value={TOOLS.MICROPHONE}><Mic className="mr-2 inline-block w-4 h-4" /> Microphone test</SelectItem>
                    </SelectContent>
                </Select>

                <Separator />

                {/* Per-tool controls */}
                {selectedTool === TOOLS.SYS_INFO && (
                  <div className="space-y-2">
                    <div className="text-sm">Gather device & browser details.</div>
                    <div className="flex gap-2">
                      <Button className="flex-1 cursor-pointer" onClick={gatherSystemInfo}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(JSON.stringify(sysInfo, null, 2) || ""); showToast("success", "Copied JSON"); }}>Copy</Button>
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.NETWORK && (
                  <div className="space-y-2">
                    <Label className="text-xs">Test URL (CORS required)</Label>
                    <Input value={netTestUrl} onChange={(e) => setNetTestUrl(e.target.value)} />
                    <div className="flex gap-2">
                      <Button className="flex-1 cursor-pointer" onClick={() => runNetworkTest()} disabled={netRunning}><Play className="w-4 h-4 mr-2" /> Start</Button>
                      <Button className="flex-1 cursor-pointer" variant="destructive" onClick={stopNetworkTest} disabled={!netRunning}><StopCircle className="w-4 h-4 mr-2" /> Stop</Button>
                    </div>
                    <div className="text-xs text-muted-foreground">Tip: choose a CORS-enabled resource (image or test file). Results show bytes/time and throughput.</div>
                  </div>
                )}

                {selectedTool === TOOLS.GPU && (
                  <div className="space-y-2">
                    <div className="text-sm">Quick WebGL FPS probe — runs a light draw loop to estimate sustained FPS.</div>
                    <div className="flex gap-2">
                      <Button className="flex-1 cursor-pointer" onClick={() => runWebGLBenchmark(3)} disabled={gpuRunning}><Play className="w-4 h-4 mr-2" /> Run</Button>
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => { setGpuResult(null); }}><RefreshCw className="w-4 h-4 mr-2" /> Clear</Button>
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.AUDIO && (
                  <div className="space-y-2">
                    <div className="text-sm">Play a test tone via WebAudio. Use headphones or speakers to verify output.</div>
                    <div className="flex gap-2">
                      <Button className="flex-1 cursor-pointer" onClick={startAudioTest} disabled={audioPlaying}><Play className="w-4 h-4 mr-2" /> Play</Button>
                      <Button className="flex-1 cursor-pointer" variant="destructive" onClick={stopAudioTest} disabled={!audioPlaying}><StopCircle className="w-4 h-4 mr-2" /> Stop</Button>
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.CAMERA && (
                  <div className="space-y-2">
                    <div className="text-sm">Start camera preview and take snapshots.</div>
                    <div className="flex gap-2">
                      <Button className="flex-1 cursor-pointer" onClick={startCamera} disabled={cameraRunning}><Play className="w-4 h-4 mr-2" /> Start</Button>
                      <Button className="flex-1 cursor-pointer" variant="destructive" onClick={stopCamera} disabled={!cameraRunning}><StopCircle className="w-4 h-4 mr-2" /> Stop</Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button className="flex-1 cursor-pointer" onClick={takeSnapshot} disabled={!cameraRunning}><Download className="w-4 h-4 mr-2" /> Snapshot</Button>
                    </div>
                    {cameraError && <div className="text-xs text-rose-600">Error: {cameraError}</div>}
                  </div>
                )}

                {selectedTool === TOOLS.MICROPHONE && (
                  <div className="space-y-2">
                    <div className="text-sm">Measure microphone input level in real-time.</div>
                    <div className="flex gap-2">
                      <Button className="flex-1 cursor-pointer" onClick={startMicTest} disabled={micRunning}><Play className="w-4 h-4 mr-2" /> Start</Button>
                      <Button className="flex-1 cursor-pointer" variant="destructive" onClick={stopMicTest} disabled={!micRunning}><StopCircle className="w-4 h-4 mr-2" /> Stop</Button>
                    </div>
                    {micError && <div className="text-xs text-rose-600">Error: {micError}</div>}
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Visual tuning</div>
                  <div className="text-xs">This page runs fully in the browser and does not send private audio/video to any server.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center: main content / preview */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">{toolLabel}</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">Client-side tests & diagnostics</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText("Hardware & system tools output"); }}>Copy</Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { setSelectedTool(TOOLS.SYS_INFO); }}>Reset</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-950/50 min-h-[260px]">
                {selectedTool === TOOLS.SYS_INFO && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="w-full md:w-1/2">
                        <div className="text-xs text-muted-foreground">User agent</div>
                        <div className="font-mono text-sm break-words">{sysInfo.userAgent || "—"}</div>
                      </div>
                      <div className="w-full md:w-1/2">
                        <div className="text-xs text-muted-foreground">Platform</div>
                        <div className="text-sm">{sysInfo.platform}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Languages</div>
                        <div className="text-sm">{sysInfo.languages}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Online</div>
                        <div className="text-sm">{sysInfo.online}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Device memory</div>
                        <div className="text-sm">{sysInfo.deviceMemory}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Logical CPUs</div>
                        <div className="text-sm">{sysInfo.hardwareConcurrency}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Screen</div>
                        <div className="text-sm">{sysInfo.screen}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Viewport</div>
                        <div className="text-sm">{sysInfo.viewport}</div>
                      </div>
                    </div>

  
                  </div>
                )}

                {selectedTool === TOOLS.NETWORK && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Test URL</div>
                      <div className="font-mono text-sm break-words">{netTestUrl}</div>
                    </div>

                    <div>
                      {netRunning ? (
                        <div className="text-sm">Running test…</div>
                      ) : netResult ? (
                        netResult.error ? (
                          <div className="text-sm text-rose-600">Error: {netResult.error}</div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Result</div>
                            <div className="text-xs">Bytes: {prettyBytes(netResult.bytes)}</div>
                            <div className="text-xs">Time: {netResult.elapsed.toFixed(2)}s</div>
                            <div className="text-xs">Throughput: {(netResult.bps / 1024).toFixed(2)} KB/s ({(netResult.bps / 1024 / 1024).toFixed(2)} MB/s)</div>
                          </div>
                        )
                      ) : (
                        <div className="text-sm text-muted-foreground">No test run yet</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.GPU && (
                  <div className="space-y-3 text-sm">
                    <div className="mb-2">WebGL canvas (exercise GPU). The simple probe measures how many frames can be drawn for a short interval.</div>
                    <div className="border rounded p-2">
                      <canvas ref={glCanvasRef} width={640} height={240} className="w-full h-auto" />
                    </div>

                    {gpuRunning ? (
                      <div className="text-sm">Running benchmark…</div>
                    ) : gpuResult ? (
                      gpuResult.error ? (
                        <div className="text-sm text-rose-600">Error: {gpuResult.error}</div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-xs">Frames: {gpuResult.frames}</div>
                          <div className="text-xs">Elapsed: {gpuResult.elapsed.toFixed(2)}s</div>
                          <div className="text-xs font-medium">Estimated FPS: {gpuResult.fps}</div>
                        </div>
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground">No run yet</div>
                    )}
                  </div>
                )}

                {selectedTool === TOOLS.AUDIO && (
                  <div className="space-y-3 text-sm">
                    <div>Audio is {audioPlaying ? <span className="text-green-600">playing</span> : <span className="text-rose-600">stopped</span>}.</div>
                    <div className="text-xs text-muted-foreground">Use Play/Stop on the left to control output.</div>
                  </div>
                )}

                {selectedTool === TOOLS.CAMERA && (
                  <div className="space-y-3 text-sm">
                    <div className="border rounded p-2 flex items-center justify-center min-h-[220px] bg-white/60 dark:bg-zinc-900/60">
                      <video ref={videoRef} className="max-h-[400px] w-full object-contain" playsInline muted />
                    </div>
                    <div className="text-xs text-muted-foreground">Preview from camera. Use Snapshot to save an image.</div>
                  </div>
                )}

                {selectedTool === TOOLS.MICROPHONE && (
                  <div className="space-y-3 text-sm">
                    <div className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60">
                      <canvas ref={canvasMicRef} width={640} height={24} className="w-full h-6" />
                    </div>
                    <div className="text-xs text-muted-foreground">Real-time microphone level meter. Allow microphone permission when prompted.</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* right: debug / quick actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4 sticky top-24">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details & Quick Actions</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Selected tool</div>
                    <div className="font-medium">{toolLabel}</div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.SYS_INFO); gatherSystemInfo(); }}>Refresh system</Button>
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.NETWORK); }}>Network</Button>
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.GPU); }}>GPU</Button>
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.CAMERA); }}>Camera</Button>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="text-xs">All tests run entirely in your browser. Camera and microphone require user permission. Network tests depend on CORS and the remote resource.</div>

                  {selectedTool === TOOLS.NETWORK && netResult && (
                    <>
                      <Separator />
                      <div className="text-xs">Export</div>
                      <div className="flex gap-2">
                        <Button className="cursor-pointer" size="sm" onClick={() => { const txt = JSON.stringify(netResult, null, 2); const blob = new Blob([txt], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `network-result-${Date.now()}.json`; a.click(); }}>Download</Button>
                      </div>
                    </>
                  )}

                  {(selectedTool === TOOLS.CAMERA && cameraRunning) && (
                    <>
                      <Separator />
                      <div className="text-xs">Camera actions</div>
                      <div className="flex gap-2">
                        <Button className="cursor-pointer" size="sm" onClick={takeSnapshot}>Snapshot</Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Quick references</CardTitle></CardHeader>
              <CardContent>
                <div className="text-xs space-y-2">
                  <div><strong>Camera:</strong> allow camera permissions in browser.</div>
                  <div><strong>Microphone:</strong> allow mic permission; use headphones to avoid feedback.</div>
                  <div><strong>Network:</strong> choose a CORS-enabled resource for accurate measurements.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hardware & System Tools — Notes</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              These tools run entirely in the browser and use standard Web APIs:
              navigator, screen, WebAudio, getUserMedia, and WebGL. Network tests depend on a CORS-enabled test URL. No media is uploaded anywhere by default — snapshots and audio remain local unless you explicitly download or copy them.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button className="cursor-pointer" onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}

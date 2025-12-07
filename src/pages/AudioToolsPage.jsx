// src/pages/AudioToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";

import {
  Loader2,
  Copy,
  Download,
  Music,
  Scissors,
  Play,
  Pause,
  Zap,
  AlertCircle,
  Layers,
  Settings,
  RefreshCw,
  Speaker,
  Volume2,
  Mic,
  Slash,
  Square,
  User,
  Image as ImageIcon,
  Mic as MicIcon,
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
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { toast } from "sonner"; // lightweight toasts

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Area,
} from "recharts";

// ---------------- Tools Enum ----------------
const TOOLS = {
  PLAYER: "audio_player",
  CUTTER: "audio_cutter",
  SPEED: "audio_speed",
  TRANSCRIBE: "audio_to_text",
  VOICE: "voice_changer",
};

// ---------------- Helpers: WAV encoder + audio utils (unchanged) ----------------
function encodeWAV(float32Array, sampleRate) {
  const buffer = new ArrayBuffer(44 + float32Array.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + float32Array.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, float32Array.length * 2, true);

  let offset = 44;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

async function decodeAudioBuffer(arrayBuffer, audioContext) {
  return await audioContext.decodeAudioData(arrayBuffer.slice(0));
}

function sliceAudioBufferToMonoFloat32(audioBuffer, startSec, endSec) {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endSec * sampleRate));
  const len = Math.max(0, endSample - startSample);
  const tmp = new Float32Array(len);

  const channelCount = audioBuffer.numberOfChannels;
  for (let ch = 0; ch < channelCount; ch++) {
    const data = audioBuffer.getChannelData(ch).subarray(startSample, endSample);
    for (let i = 0; i < len; i++) {
      tmp[i] = (tmp[i] || 0) + data[i] / channelCount;
    }
  }
  return { samples: tmp, sampleRate };
}

async function renderBufferWithRate(audioBuffer, playbackRate) {
  if (playbackRate <= 0) throw new Error("playbackRate must be > 0");

  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration / playbackRate;
  const length = Math.ceil(duration * sampleRate);

  const offlineCtx = new OfflineAudioContext(1, length, sampleRate);

  const src = offlineCtx.createBufferSource();
  const single = offlineCtx.createBuffer(1, audioBuffer.length, sampleRate);

  const chCount = audioBuffer.numberOfChannels;
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let ch = 0; ch < chCount; ch++) sum += audioBuffer.getChannelData(ch)[i];
    single.getChannelData(0)[i] = sum / chCount;
  }

  src.buffer = single;
  src.playbackRate.value = playbackRate;
  src.connect(offlineCtx.destination);
  src.start(0);

  const rendered = await offlineCtx.startRendering();
  return rendered;
}

async function renderBufferWithEffect(audioBuffer, effectName, effectParams = {}) {
  const sampleRate = audioBuffer.sampleRate;
  const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);

  const single = offlineCtx.createBuffer(1, audioBuffer.length, sampleRate);
  const chCount = audioBuffer.numberOfChannels;
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let ch = 0; ch < chCount; ch++) sum += audioBuffer.getChannelData(ch)[i];
    single.getChannelData(0)[i] = sum / chCount;
  }

  const src = offlineCtx.createBufferSource();
  src.buffer = single;

  if (effectName === "robot") {
    const biquad = offlineCtx.createBiquadFilter();
    biquad.type = "highpass";
    biquad.frequency.value = 800;

    const distortion = offlineCtx.createWaveShaper();
    const curve = new Float32Array(65536);
    const k = 20;
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / curve.length - 1;
      curve[i] = ((3 + k) * x * 20 * Math.PI) / (Math.PI + k * Math.abs(x));
    }
    distortion.curve = curve;
    distortion.oversample = "4x";

    src.connect(biquad);
    biquad.connect(distortion);
    distortion.connect(offlineCtx.destination);
    src.connect(offlineCtx.destination);

    src.start(0);
    const rendered = await offlineCtx.startRendering();
    return rendered;
  } else {
    src.connect(offlineCtx.destination);
    src.start(0);
    const rendered = await offlineCtx.startRendering();
    return rendered;
  }
}

// ----------------- Cover art extraction (unchanged) -----------------
async function extractCoverFromFile(file) {
  try {
    const headBuf = await file.slice(0, 10).arrayBuffer();
    const head = new Uint8Array(headBuf);
    if (head.length < 10) return null;
    if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return null;

    const versionMajor = head[3];
    const tagSize =
      (head[6] & 0x7f) * 0x200000 +
      (head[7] & 0x7f) * 0x4000 +
      (head[8] & 0x7f) * 0x80 +
      (head[9] & 0x7f);

    const cap = Math.min(tagSize + 10, 5 * 1024 * 1024);
    const fullBuf = await file.slice(0, cap).arrayBuffer();
    const bytes = new Uint8Array(fullBuf);

    const readUInt32BE = (arr, off) =>
      (arr[off] << 24) | (arr[off + 1] << 16) | (arr[off + 2] << 8) | arr[off + 3];
    const readUInt24BE = (arr, off) =>
      (arr[off] << 16) | (arr[off + 1] << 8) | arr[off + 2];

    let offset = 10;
    const end = Math.min(10 + tagSize, bytes.length);

    while (offset + 10 < end) {
      let frameId = "";
      let frameSize = 0;
      let headerSize = 0;

      if (versionMajor === 2) {
        if (offset + 6 > bytes.length) break;
        frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
        frameSize = readUInt24BE(bytes, offset + 3);
        headerSize = 6;
      } else if (versionMajor === 3) {
        if (offset + 10 > bytes.length) break;
        frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
        frameSize = readUInt32BE(bytes, offset + 4);
        headerSize = 10;
      } else if (versionMajor === 4) {
        if (offset + 10 > bytes.length) break;
        frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
        frameSize =
          (bytes[offset + 4] & 0x7f) * 0x200000 +
          (bytes[offset + 5] & 0x7f) * 0x4000 +
          (bytes[offset + 6] & 0x7f) * 0x80 +
          (bytes[offset + 7] & 0x7f);
        headerSize = 10;
      } else {
        break;
      }

      offset += headerSize;
      if (frameSize <= 0 || offset + frameSize > bytes.length) break;

      if (frameId === "APIC" || frameId === "PIC") {
        const frameData = bytes.subarray(offset, offset + frameSize);
        let p = 0;
        const encoding = frameData[p++];

        let mime = "";
        if (frameId === "APIC") {
          while (p < frameData.length && frameData[p] !== 0) mime += String.fromCharCode(frameData[p++]);
          p++;
        } else {
          mime = String.fromCharCode(frameData[p], frameData[p + 1], frameData[p + 2]);
          if (mime.toUpperCase() === "JPG") mime = "image/jpeg";
          else mime = "image/" + mime.toLowerCase();
          p += 3;
        }

        const picType = frameData[p++];

        while (p < frameData.length && frameData[p] !== 0) p++;
        if (p < frameData.length && frameData[p] === 0) p++;

        const imageData = frameData.subarray(p);
        if (imageData && imageData.length > 16) {
          const blob = new Blob([imageData], { type: mime || "image/jpeg" });
          const url = URL.createObjectURL(blob);
          return url;
        } else {
          return null;
        }
      }

      offset += frameSize;
    }
  } catch (err) {
    return null;
  }
  return null;
}

// ----------------- Main component (enhanced) -----------------
export default function AudioToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [selectedTool, setSelectedTool] = useState(TOOLS.PLAYER);

  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const audioCtxRef = useRef(null);

  const [coverUrl, setCoverUrl] = useState(null);

  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const [cutStart, setCutStart] = useState(0);
  const [cutEnd, setCutEnd] = useState(0);

  const [voiceEffect, setVoiceEffect] = useState("chipmunk");
  const [voiceEffectParam, setVoiceEffectParam] = useState(1.4);

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const recognitionRef = useRef(null);

  const [sampleRate, setSampleRate] = useState(null);
  const [channels, setChannels] = useState(null);
  const [file, setFile] = useState(null);

  // === Visualizer & analyzer refs/state ===
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const timeDomainRef = useRef(null);
  const animationFrameRef = useRef(null);

  const mediaSourceRef = useRef(null);

  // Recharts-friendly state (throttled updates)
  const [freqChartData, setFreqChartData] = useState([]); // array of {x, value}
  const [realtimeWaveData, setRealtimeWaveData] = useState([]); // array of {x, y}
  const [staticWaveData, setStaticWaveData] = useState([]); // computed once when buffer loads

  // equalizer bands (6-band peaking filters)
  const EQ_BANDS = [
    { label: "60Hz", freq: 60 },
    { label: "170Hz", freq: 170 },
    { label: "350Hz", freq: 350 },
    { label: "1kHz", freq: 1000 },
    { label: "3.5kHz", freq: 3500 },
    { label: "10kHz", freq: 10000 },
  ];
  const [eqGains, setEqGains] = useState(new Array(EQ_BANDS.length).fill(0)); // dB

  // noise/stats
  const [rms, setRms] = useState(0);
  const [noiseEstimate, setNoiseEstimate] = useState(0);
  const [spectralFlatness, setSpectralFlatness] = useState(0);

  // BPM
  const [detectedBpm, setDetectedBpm] = useState(null);
  const [bpmConfidence, setBpmConfidence] = useState(null);

  // throttle refs to prevent state flooding (avoid max update depth)
  const lastUpdateRef = useRef(0); // timestamp of last setState update
  const updateIntervalMs = 80; // ~12 updates/sec

  // ensure AudioContext created early
  useEffect(() => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // sync selectedTool query param
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (selectedTool) params.set("tool", selectedTool);
      else params.delete("tool");
      const q = params.toString();
      window.history.replaceState(null, "", pathname + (q ? `?${q}` : ""));
    } catch (e) {}
  }, [selectedTool]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
  }, []); // on unmount

  // ---------------- File handling ----------------
  const handleFileChange = useCallback(
    async (e) => {
      const f = e.target.files?.[0];
      setFile(f);
      if (!f) return;
      if (!f.type.startsWith("audio/")) {
        toast.error("Please upload a valid audio file (mp3, wav, m4a, etc.)");
        return;
      }

      setLoading(true);
      setAudioFile(f);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      if (coverUrl) {
        URL.revokeObjectURL(coverUrl);
        setCoverUrl(null);
      }

      const url = URL.createObjectURL(f);
      setAudioUrl(url);

      try {
        const cover = await extractCoverFromFile(f);
        if (cover) {
          setCoverUrl(cover);
        }
      } catch (err) {
        // ignore
      }

      try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;

        const arrayBuffer = await f.arrayBuffer();
        const decoded = await decodeAudioBuffer(arrayBuffer, ctx);
        setAudioBuffer(decoded);
        setSampleRate(decoded.sampleRate);
        setChannels(decoded.numberOfChannels);
        setDuration(decoded.duration);
        setCutStart(0);
        setCutEnd(decoded.duration);
        showToast("success", `Loaded ${f.name}`);

        // run BPM detection (synchronous here)
        try {
          const { bpm, confidence } = estimateBPMFromAudioBuffer(decoded);
          if (bpm) {
            setDetectedBpm(Math.round(bpm));
            setBpmConfidence(Math.round(confidence * 100));
          } else {
            setDetectedBpm(null);
            setBpmConfidence(null);
          }
        } catch (err) {
          console.warn("BPM detect failed", err);
          setDetectedBpm(null);
          setBpmConfidence(null);
        }

        // compute static waveform data (for Recharts)
        const sw = computeStaticWaveformData(decoded, 500); // produce up to 500 samples
        setStaticWaveData(sw);
      } catch (err) {
        console.error("decode error", err);
        showToast("error", "Failed to decode audio (file may be unsupported)");
        setAudioBuffer(null);
      } finally {
        setLoading(false);
      }
    },
    [audioUrl, coverUrl]
  );

  // ---------------- Audio element events ----------------
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onTime = () => setCurrentTime(audioEl.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onLoaded = () => {
      setDuration(audioEl.duration || duration);
      setCurrentTime(audioEl.currentTime || 0);
    };

    audioEl.addEventListener("timeupdate", onTime);
    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audioEl.removeEventListener("timeupdate", onTime);
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [duration]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = useCallback(async () => {
    const el = audioRef.current;
    if (!el) {
      showToast("error", "No audio loaded");
      return;
    }
    try {
      if (el.paused) {
        await el.play();
      } else {
        el.pause();
      }
    } catch (err) {
      showToast("error", "Playback failed — user gesture required or file unsupported");
      console.error(err);
    }
  }, []);

  const handleSeek = useCallback((value) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Number(value);
    setCurrentTime(Number(value));
  }, []);

  // ---------------- CUTTER & SPEED & VOICE (unchanged behavior) ----------------
  const exportCutAsWav = useCallback(async () => {
    if (!audioBuffer) {
      showToast("error", "No audio loaded");
      return;
    }
    const start = Math.max(0, Math.min(cutStart, audioBuffer.duration));
    const end = Math.max(0, Math.min(cutEnd, audioBuffer.duration));
    if (end <= start) {
      showToast("error", "Invalid cut range");
      return;
    }
    setLoading(true);
    try {
      const { samples, sampleRate } = sliceAudioBufferToMonoFloat32(audioBuffer, start, end);
      const wavBlob = encodeWAV(samples, sampleRate);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cut-${Math.round(start)}-${Math.round(end)}s.wav`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("success", "Cut exported");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to export cut");
    } finally {
      setLoading(false);
    }
  }, [audioBuffer, cutStart, cutEnd]);

  const previewCut = useCallback(() => {
    if (!audioRef.current || !audioBuffer) {
      showToast("error", "Nothing to preview");
      return;
    }
    const el = audioRef.current;
    el.currentTime = Math.max(0, cutStart);
    el.playbackRate = playbackRate;
    el.play().catch(() => {});
    const stopAt = () => {
      if (el.currentTime >= cutEnd - 0.05) {
        el.pause();
        el.removeEventListener("timeupdate", stopAt);
      }
    };
    el.addEventListener("timeupdate", stopAt);
  }, [cutStart, cutEnd, playbackRate, audioBuffer]);

  const exportSpeedAdjusted = useCallback(
    async (rate) => {
      if (!audioBuffer) {
        showToast("error", "No audio loaded");
        return;
      }
      if (rate <= 0) {
        showToast("error", "Invalid playback rate");
        return;
      }
      setLoading(true);
      try {
        const rendered = await renderBufferWithRate(audioBuffer, rate);
        const samples = rendered.numberOfChannels === 1
          ? rendered.getChannelData(0).slice(0)
          : (() => {
              const len = rendered.length;
              const tmp = new Float32Array(len);
              for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
                const data = rendered.getChannelData(ch);
                for (let i = 0; i < len; i++) tmp[i] = (tmp[i] || 0) + data[i] / rendered.numberOfChannels;
              }
              return tmp;
            })();

        const wav = encodeWAV(samples, rendered.sampleRate);
        const url = URL.createObjectURL(wav);
        const a = document.createElement("a");
        a.href = url;
        a.download = `speed-${rate.toFixed(2)}x.wav`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Export complete");
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to render/export at new speed");
      } finally {
        setLoading(false);
      }
    },
    [audioBuffer]
  );

  // ---------------- VOICE CHANGER (existing preview/export code reused) ----------------
  const stopVoicePreview = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (typeof ctx.__voicePreviewCleanup === "function") {
        try { ctx.__voicePreviewCleanup(); } catch (e) {}
        delete ctx.__voicePreviewCleanup;
      }
      if (ctx.__voicePreviewSource) {
        try { ctx.__voicePreviewSource.stop(0); } catch (e) {}
        try { ctx.__voicePreviewSource.disconnect(); } catch (e) {}
        delete ctx.__voicePreviewSource;
      }
      if (ctx.__voicePreviewOsc) {
        try { ctx.__voicePreviewOsc.stop(0); } catch (e) {}
        try { ctx.__voicePreviewOsc.disconnect(); } catch (e) {}
        delete ctx.__voicePreviewOsc;
      }
      if (ctx.__voicePreviewTimeout) {
        clearTimeout(ctx.__voicePreviewTimeout);
        delete ctx.__voicePreviewTimeout;
      }
    } catch (err) {
      console.warn("stopVoicePreview error", err);
    }
  }, []);

  const previewVoiceEffect = useCallback(async () => {
    if (!audioBuffer) {
      showToast("error", "No audio loaded");
      return;
    }
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      stopVoicePreview();

      const src = ctx.createBufferSource();
      const single = ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
      const chCount = audioBuffer.numberOfChannels;
      for (let i = 0; i < audioBuffer.length; i++) {
        let sum = 0;
        for (let ch = 0; ch < chCount; ch++) sum += audioBuffer.getChannelData(ch)[i];
        single.getChannelData(0)[i] = sum / chCount;
      }
      src.buffer = single;

      ctx.__voicePreviewSource = src;

      const cleanup = () => {
        try {
          if (ctx.__voicePreviewSource) {
            try { ctx.__voicePreviewSource.stop(0); } catch (e) {}
            try { ctx.__voicePreviewSource.disconnect(); } catch (e) {}
            delete ctx.__voicePreviewSource;
          }
          if (ctx.__voicePreviewOsc) {
            try { ctx.__voicePreviewOsc.stop(0); } catch (e) {}
            try { ctx.__voicePreviewOsc.disconnect(); } catch (e) {}
            delete ctx.__voicePreviewOsc;
          }
          if (ctx.__voicePreviewTimeout) {
            clearTimeout(ctx.__voicePreviewTimeout);
            delete ctx.__voicePreviewTimeout;
          }
        } catch (e) {}
      };

      ctx.__voicePreviewCleanup = cleanup;

      if (voiceEffect === "chipmunk") {
        src.playbackRate.value = voiceEffectParam || 1.6;
        src.connect(ctx.destination);
        src.start(0);
        src.onended = () => cleanup();
      } else if (voiceEffect === "deep") {
        src.playbackRate.value = voiceEffectParam || 0.75;
        src.connect(ctx.destination);
        src.start(0);
        src.onended = () => cleanup();
      } else if (voiceEffect === "robot") {
        const gain = ctx.createGain();
        const modOsc = ctx.createOscillator();
        const modGain = ctx.createGain();

        modOsc.type = "square";
        modOsc.frequency.value = voiceEffectParam || 30;
        modGain.gain.value = 0.5;

        try {
          modOsc.connect(modGain);
          modGain.connect(gain.gain);
        } catch (e) {
          modOsc.disconnect();
          modGain.disconnect();
        }

        src.connect(gain);
        gain.connect(ctx.destination);

        ctx.__voicePreviewOsc = modOsc;
        ctx.__voicePreviewSource = src;

        try { modOsc.start(0); } catch (e) {}
        try { src.start(0); } catch (e) {}

        src.onended = () => cleanup();
        ctx.__voicePreviewTimeout = setTimeout(() => {
          cleanup();
        }, Math.ceil(src.buffer.duration * 1000) + 500);
      }

      showToast("success", "Previewing voice effect");
    } catch (err) {
      console.error("voice preview error", err);
      showToast("error", "Voice preview failed");
    }
  }, [audioBuffer, voiceEffect, voiceEffectParam, stopVoicePreview]);

  useEffect(() => {
    return () => {
      stopVoicePreview();
    };
  }, [stopVoicePreview]);

  const exportVoiceChanged = useCallback(async () => {
    if (!audioBuffer) {
      showToast("error", "No audio loaded");
      return;
    }
    setLoading(true);
    try {
      if (voiceEffect === "chipmunk" || voiceEffect === "deep") {
        const rate = voiceEffect === "chipmunk" ? (voiceEffectParam || 1.6) : (voiceEffectParam || 0.75);
        const rendered = await renderBufferWithRate(audioBuffer, rate);
        const samples = rendered.numberOfChannels === 1
          ? rendered.getChannelData(0).slice(0)
          : (() => {
              const len = rendered.length;
              const tmp = new Float32Array(len);
              for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
                const data = rendered.getChannelData(ch);
                for (let i = 0; i < len; i++) tmp[i] = (tmp[i] || 0) + data[i] / rendered.numberOfChannels;
              }
              return tmp;
            })();
        const wav = encodeWAV(samples, rendered.sampleRate);
        const url = URL.createObjectURL(wav);
        const a = document.createElement("a");
        a.href = url;
        a.download = `voice-${voiceEffect}-${(voiceEffectParam || 1).toFixed(2)}x.wav`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Export complete");
      } else if (voiceEffect === "robot") {
        const rendered = await renderBufferWithEffect(audioBuffer, "robot", { freq: voiceEffectParam || 30 });
        const samples = rendered.numberOfChannels === 1
          ? rendered.getChannelData(0).slice(0)
          : (() => {
              const len = rendered.length;
              const tmp = new Float32Array(len);
              for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
                const data = rendered.getChannelData(ch);
                for (let i = 0; i < len; i++) tmp[i] = (tmp[i] || 0) + data[i] / rendered.numberOfChannels;
              }
              return tmp;
            })();
        const wav = encodeWAV(samples, rendered.sampleRate);
        const url = URL.createObjectURL(wav);
        const a = document.createElement("a");
        a.href = url;
        a.download = `voice-robot-${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Export complete");
      } else {
        showToast("error", "Unknown effect");
      }
    } catch (err) {
      console.error("export voice changed err", err);
      showToast("error", "Export failed");
    } finally {
      setLoading(false);
    }
  }, [audioBuffer, voiceEffect, voiceEffectParam]);

  // ---------------- TRANSCRIBE (unchanged) ----------------
  const startTranscription = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("error", "Speech Recognition not supported in this browser");
      return;
    }

    if (!recognitionRef.current) {
      const r = new SpeechRecognition();
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";
      recognitionRef.current = r;
    }

    const r = recognitionRef.current;
    if (!r) return;

    r.onstart = () => {
      setRecognizing(true);
      showToast("success", "Listening...");
    };
    r.onerror = (e) => {
      console.error("recognition error", e);
      showToast("error", "Recognition error");
    };
    r.onend = () => {
      setRecognizing(false);
      showToast("info", "Stopped");
    };
    r.onresult = (evt) => {
      let interim = "";
      let final = "";
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const rres = evt.results[i];
        if (rres.isFinal) final += rres[0].transcript;
        else interim += rres[0].transcript;
      }
      setTranscript((prev) => {
        if (final) return `${prev} ${final}`.trim();
        return `${prev} ${interim}`.trim();
      });
    };

    try {
      r.start();
    } catch (err) {
      console.error("start error", err);
      showToast("error", "Could not start recognition (maybe already running)");
    }
  }, []);

  const stopTranscription = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) {
      setRecognizing(false);
      return;
    }
    try {
      r.stop();
    } catch (err) {
      console.warn("stop err", err);
    }
    setRecognizing(false);
  }, []);

  const copyTranscript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transcript || "");
      showToast("success", "Copied transcript");
    } catch {
      showToast("error", "Failed to copy");
    }
  }, [transcript]);

  const downloadTranscript = useCallback(() => {
    if (!transcript) {
      showToast("error", "No transcript");
      return;
    }
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded transcript");
  }, [transcript]);

  const formatTime = (s = 0) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ---------------- Visualizer / Analyser setup (Recharts integration) ----------------
  useEffect(() => {
    // stop previous loop to safely rebuild chain
    stopVisualizerLoop();

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const audioEl = audioRef.current;
    if (!audioEl || !audioUrl) {
      analyserRef.current = null;
      return;
    }

    // --- Create MediaElementSource only once ---
    if (!mediaSourceRef.current) {
      try {
        mediaSourceRef.current = ctx.createMediaElementSource(audioEl);
      } catch (e) {
        console.warn("createMediaElementSource failed", e);
        analyserRef.current = null;
        return;
      }
    }

    const source = mediaSourceRef.current;

    // build EQ nodes
    const eqNodes = EQ_BANDS.map((b, i) => {
      const n = ctx.createBiquadFilter();
      n.type = "peaking";
      n.frequency.value = b.freq;
      n.Q.value = 1.0;
      n.gain.value = eqGains[i] ?? 0;
      return n;
    });

    // disconnect previous connections from source before reconnecting to new chain
    try {
      source.disconnect();
    } catch (e) {
      // ignore
    }

    // connect chain
    source.connect(eqNodes[0]);
    for (let i = 0; i < eqNodes.length - 1; i++) {
      eqNodes[i].connect(eqNodes[i + 1]);
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    eqNodes[eqNodes.length - 1].connect(analyser);
    analyser.connect(ctx.destination);

    analyserRef.current = { analyser, eqNodes, source };

    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    timeDomainRef.current = new Uint8Array(analyser.fftSize);

    // start visualizer loop
    if (!animationFrameRef.current) startVisualizerLoop();

    return () => {
      if (analyserRef.current) {
        const { analyser: an, eqNodes: nodes } = analyserRef.current;
        nodes.forEach((n) => {
          try { n.disconnect(); } catch {}
        });
        if (an) try { an.disconnect(); } catch {}
      }
      analyserRef.current = null;
    };
  }, [audioUrl, eqGains]); // re-run on audio url change or eq changes

  // visualizer loop (compute arrays and throttle setState)
  const startVisualizerLoop = useCallback(() => {
    if (animationFrameRef.current) return;

    const draw = () => {
      try {
        const ctx = audioCtxRef.current;
        const analyzerData = analyserRef.current;
        if (!ctx || !analyzerData) {
          animationFrameRef.current = requestAnimationFrame(draw);
          return;
        }
        const { analyser } = analyzerData;

        analyser.getByteFrequencyData(dataArrayRef.current);
        analyser.getByteTimeDomainData(timeDomainRef.current);

        // compute RMS & noise estimate & spectral flatness
        {
          // RMS from timeDomainRef
          let sumSq = 0;
          for (let i = 0; i < timeDomainRef.current.length; i++) {
            const n = (timeDomainRef.current[i] - 128) / 128;
            sumSq += n * n;
          }
          const _rms = Math.sqrt(sumSq / timeDomainRef.current.length);
          // update quickly but not every frame via throttled setState
          setRms(_rms);

          // noise estimate: average of high-frequency bins (top 30%)
          const freqArr = dataArrayRef.current;
          const startIdx = Math.floor(freqArr.length * 0.7);
          let hfSum = 0;
          for (let i = startIdx; i < freqArr.length; i++) hfSum += freqArr[i];
          const hfAvg = hfSum / Math.max(1, freqArr.length - startIdx);
          setNoiseEstimate(hfAvg / 255);

          // spectral flatness (geometric mean / arithmetic mean)
          let geo = 1.0;
          let ar = 0;
          let small = 1e-12;
          const cap = Math.min(freqArr.length, 1024);
          for (let i = 0; i < cap; i++) {
            const v = (freqArr[i] + 1) / 256; // avoid zeros
            geo *= v;
            ar += v;
          }
          geo = Math.pow(geo + small, 1 / cap);
          ar = ar / cap;
          const flatness = geo / (ar + small);
          setSpectralFlatness(flatness);
        }

        // Prepare Recharts-friendly arrays but throttle setState to avoid rerender flood
        const now = performance.now();
        const shouldUpdate = now - (lastUpdateRef.current || 0) > updateIntervalMs;
        if (shouldUpdate) {
          lastUpdateRef.current = now;

          // Reduce frequency data to a manageable number of points for charting (e.g., 128)
          const freqLen = Math.min(128, dataArrayRef.current.length);
          const step = Math.floor(dataArrayRef.current.length / freqLen) || 1;
          const freqPoints = [];
          for (let i = 0; i < dataArrayRef.current.length; i += step) {
            const v = dataArrayRef.current[i] / 255;
            freqPoints.push({ x: i, value: Math.round(v * 100) }); // scale 0..100 for chart
            if (freqPoints.length >= freqLen) break;
          }

          // Realtime waveform: sample down the time domain to e.g., 300 points
          const waveLen = 300;
          const tStep = Math.floor(timeDomainRef.current.length / waveLen) || 1;
          const wavePoints = [];
          for (let i = 0; i < timeDomainRef.current.length; i += tStep) {
            const v = (timeDomainRef.current[i] - 128) / 128; // -1..1
            wavePoints.push({ x: i, y: parseFloat(v.toFixed(3)) });
            if (wavePoints.length >= waveLen) break;
          }

          // Apply state updates (throttled)
          setFreqChartData(freqPoints);
          setRealtimeWaveData(wavePoints);
        }
      } catch (err) {
        // swallow errors
      } finally {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    animationFrameRef.current = requestAnimationFrame(draw);
  }, []);

  const stopVisualizerLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // stop when component unmount
  useEffect(() => {
    return () => {
      stopVisualizerLoop();
      if (analyserRef.current) {
        try {
          const { analyser, eqNodes, source } = analyserRef.current;
          if (source) try { source.disconnect(); } catch (e) {}
          if (eqNodes) eqNodes.forEach((n) => { try { n.disconnect(); } catch {} });
          if (analyser) try { analyser.disconnect(); } catch (e) {}
        } catch (e) {}
      }
    };
  }, [stopVisualizerLoop]);

  // draw static waveform from decoded AudioBuffer -> compute array for recharts
  function computeStaticWaveformData(audioBuf, maxPoints = 500) {
    try {
      if (!audioBuf) return [];
      const channelCount = audioBuf.numberOfChannels;
      // mixdown to mono (first channel or averaged)
      const len = audioBuf.length;
      const raw = new Float32Array(len);
      if (channelCount === 1) {
        raw.set(audioBuf.getChannelData(0));
      } else {
        for (let ch = 0; ch < channelCount; ch++) {
          const chd = audioBuf.getChannelData(ch);
          for (let i = 0; i < len; i++) {
            raw[i] = (raw[i] || 0) + chd[i] / channelCount;
          }
        }
      }

      const blockSize = Math.ceil(len / maxPoints);
      const data = [];
      for (let i = 0; i < len; i += blockSize) {
        let maxVal = 0;
        for (let j = 0; j < blockSize && i + j < len; j++) {
          const v = Math.abs(raw[i + j]);
          if (v > maxVal) maxVal = v;
        }
        data.push({ x: i, y: parseFloat((maxVal * (raw[i] < 0 ? -1 : 1)).toFixed(3)) });
      }
      return data;
    } catch (err) {
      return [];
    }
  }

  // ---------------- Equalizer UI -> update gain on nodes ----------------
  useEffect(() => {
    if (!analyserRef.current) return;
    const { eqNodes } = analyserRef.current;
    if (!eqNodes) return;
    for (let i = 0; i < eqNodes.length; i++) {
      try {
        eqNodes[i].gain.setValueAtTime(eqGains[i] || 0, audioCtxRef.current.currentTime);
      } catch (e) {}
    }
  }, [eqGains]);

  // ----------------- BPM detection function (naive energy autocorrelation) -----------------
  function estimateBPMFromAudioBuffer(audioBuf) {
    try {
      const sr = audioBuf.sampleRate;
      const data = audioBuf.getChannelData(0);
      const len = data.length;
      const downsample = Math.max(1, Math.floor(sr / 8000)); // down to ~8kHz
      const small = [];
      for (let i = 0; i < len; i += downsample) small.push(data[i]);
      const frameSize = 1024;
      const hop = 512;
      const energy = [];
      for (let i = 0; i + frameSize < small.length; i += hop) {
        let e = 0;
        for (let j = 0; j < frameSize; j++) {
          const v = small[i + j] || 0;
          e += v * v;
        }
        energy.push(Math.log(e + 1e-8));
      }
      const n = energy.length;
      if (n < 16) return { bpm: null, confidence: 0 };

      const ac = new Float32Array(n);
      for (let lag = 0; lag < n; lag++) {
        let s = 0;
        for (let i = 0; i < n - lag; i++) {
          s += (energy[i] - 0) * (energy[i + lag] - 0);
        }
        ac[lag] = s;
      }
      const secondsPerFrame = (hop * downsample) / sr;
      const bpmCandidates = [];
      for (let lag = 1; lag < ac.length; lag++) {
        const periodSeconds = lag * secondsPerFrame;
        const bpm = 60 / periodSeconds;
        if (bpm >= 40 && bpm <= 240) {
          bpmCandidates.push({ lag, bpm, val: ac[lag] });
        }
      }
      if (bpmCandidates.length === 0) return { bpm: null, confidence: 0 };
      bpmCandidates.sort((a, b) => b.val - a.val);
      const top = bpmCandidates.slice(0, 4);
      const weightSum = top.reduce((s, c) => s + Math.abs(c.val), 0) || 1;
      const bpm = top.reduce((s, c) => s + c.bpm * Math.abs(c.val), 0) / weightSum;
      const conf = Math.min(1, Math.abs(top[0].val) / (Math.abs(top[1]?.val || top[0].val) + 1e-9));
      return { bpm, confidence: conf };
    } catch (err) {
      return { bpm: null, confidence: 0 };
    }
  }

  // ---------------- UI rendering ----------------
  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.PLAYER:
        return "Audio Player";
      case TOOLS.CUTTER:
        return "Audio Cutter";
      case TOOLS.SPEED:
        return "Playback Speed";
      case TOOLS.TRANSCRIBE:
        return "Audio → Text (Speech Recognition)";
      case TOOLS.VOICE:
        return "Voice Changer";
      default:
        return "Audio Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      <header className="mb-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
              Audio Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Play • Cut • Change speed • Transcribe • Voice changer • Visualize</p>
          </div>

          <div className="flex items-center gap-3">
            <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>
              <Zap className="w-4 h-4" /> Info
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{selectedTool === TOOLS.TRANSCRIBE ? "Speech" : "Audio"}</Badge>
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
                    <SelectItem className="cursor-pointer" value={TOOLS.PLAYER}>Audio Player</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.CUTTER}>Audio Cutter</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.SPEED}>Audio Speed Changer</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.VOICE}>Voice Changer</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.TRANSCRIBE}>Audio → Text (Web Speech)</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                <Label className="text-xs">Upload audio file</Label>
                <div className="relative">
                  <Input id="audio-upload" type="file" accept="audio/*" onChange={handleFileChange} className=" border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" />
                  <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <MicIcon className="w-4 h-4 mr-2" />
                    {file ? file.name : "Upload Audio"}
                  </div>
                </div>

                {audioFile && (
                  <div className="text-xs opacity-80">
                    Loaded: <span className="font-medium">{audioFile.name}</span> • {formatTime(duration)}
                  </div>
                )}

                <Separator />

                {selectedTool === TOOLS.CUTTER && (
                  <>
                    <Label className="text-xs">Cut range (seconds)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={cutStart} onChange={(e) => setCutStart(Number(e.target.value || 0))} className="w-1/2" />
                      <Input type="number" value={cutEnd} onChange={(e) => setCutEnd(Number(e.target.value || 0))} className="w-1/2" />
                    </div>
                    <div className="text-xs opacity-70">Tip: Click preview to play the selected range.</div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={previewCut} className="flex-1 cursor-pointer">
                        <Play className="w-4 h-4" /> Preview
                      </Button>
                      <Button onClick={exportCutAsWav} className="flex-1 bg-red-500 hover:bg-red-600 dark:text-white text-black cursor-pointer">
                        <Download className="w-4 h-4 " /> Export
                      </Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.SPEED && (
                  <>
                    <Label className="text-xs">Playback rate</Label>
                    <div className="flex items-center gap-3">
                      <Slider min={0.5} max={2.0} step={0.05} value={[playbackRate]} onValueChange={(v) => setPlaybackRate(v[0])} className="w-full cursor-pointer" />
                      <div className="text-xs w-14 text-right">{playbackRate.toFixed(2)}x</div>
                    </div>

                    <div className="text-xs opacity-70">Preview uses playback rate. Export will render a new audio file at this speed.</div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => exportSpeedAdjusted(playbackRate)} className="flex-1 cursor-pointer">
                        <Download className="w-4 h-4" /> Export at {playbackRate.toFixed(2)}x
                      </Button>
                      <Button className="cursor-pointer" onClick={() => { setPlaybackRate(1); showToast("success", "Reset to 1.0x"); }} variant="outline">
                        <RefreshCw className="w-4 h-4 " /> Reset
                      </Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.VOICE && (
                  <>
                    <Label className="text-xs">Effect</Label>
                    <Select value={voiceEffect} onValueChange={setVoiceEffect}>
                      <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="chipmunk">Chipmunk (higher pitch)</SelectItem>
                        <SelectItem className="cursor-pointer" value="deep">Deep (lower pitch)</SelectItem>
                        <SelectItem className="cursor-pointer" value="robot">Robot (metallic)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-xs mt-3">Effect parameter</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={voiceEffect === "robot" ? 10 : 0.5}
                        max={voiceEffect === "robot" ? 100 : 2.5}
                        step={voiceEffect === "robot" ? 1 : 0.05}
                        value={[voiceEffectParam]}
                        onValueChange={(val) => setVoiceEffectParam(val[0])}
                        className="w-full cursor-pointer"
                      />
                      <div className="text-xs w-20 text-right">{voiceEffectParam}</div>
                    </div>

                    <div className="text-xs opacity-70 mt-2">Preview will play the file with the chosen effect. Export will render a WAV with the effect applied.</div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={previewVoiceEffect} className="flex-1 cursor-pointer">
                        <Play className="w-4 h-4 " /> Preview
                      </Button>
                      <Button onClick={exportVoiceChanged} className="flex-1 bg-red-500 hover:bg-red-600 dark:text-white text-black cursor-pointer">
                        <Download className="w-4 h-4 " /> Export
                      </Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.TRANSCRIBE && (
                  <>
                    <Label className="text-xs">Transcription</Label>
                    <div className="text-sm mb-2 text-muted-foreground">
                      This uses the browser's Web Speech API and listens to your microphone. It cannot reliably transcribe uploaded audio unless you route audio to your mic.
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={startTranscription} disabled={recognizing} className="flex-1 cursor-pointer">
                        <Mic className="w-4 h-4 " /> Start
                      </Button>
                      <Button onClick={stopTranscription} disabled={!recognizing} variant="destructive" className="flex-1 cursor-pointer">
                        <Square className="w-4 h-4 " /> Stop
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={copyTranscript} className="flex-1 cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                      <Button onClick={downloadTranscript} className="flex-1 cursor-pointer">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Volume</span>
                    <span className="text-xs font-medium">{Math.round(volume * 100)}%</span>
                  </div>
                  <Slider className="cursor-pointer" value={[volume]} onValueChange={(v) => setVolume(Number(v[0]))} min={0} max={1} step={0.01} />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button className="cursor-pointer" onClick={() => { setAudioFile(null); setAudioUrl(null); setAudioBuffer(null); setTranscript(""); setCurrentTime(0); if (coverUrl) { URL.revokeObjectURL(coverUrl); setCoverUrl(null); } }}>
                    <RefreshCw className="w-4 h-4 " /> Clear
                  </Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>Help</Button>
                </div>

              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: player / preview & visualizers */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" /> {toolLabel}
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(audioFile?.name || ""); showToast("success", "Copied filename"); }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { if (audioUrl) { const a = document.createElement("a"); a.href = audioUrl; a.download = audioFile?.name || "audio"; a.click(); } else showToast("error", "No audio to download"); }}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-950/50">
                <div className="w-full h-full flex items-center justify-center border m-2 p-2 border-dashed rounded-2xl ">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className=" object-contain rounded-md shadow-sm" />
                  ) : (
                    <div className="w-full h-44 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-70" />
                        <div className="text-sm opacity-80">{audioFile ? audioFile.name : "No cover art"}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* audio element & controls */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center flex-wrap gap-3">
                    <Button onClick={togglePlay} className="flex cursor-pointer items-center gap-2">
                      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {playing ? "Pause" : "Play"}
                    </Button>

                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <Speaker className="w-4 h-4" />
                      <div>{formatTime(currentTime)} / {formatTime(duration)}</div>
                    </div>

                    <div className="ml-auto text-xs px-1 py-0.5 rounded-2xl backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">Playback rate: {playbackRate.toFixed(2)}x</div>
                  </div>

                  <div>
                    <Slider className="cursor-pointer" min={0} max={duration || 1} step={0.01} value={[currentTime]} onValueChange={(v) => handleSeek(v[0])} />
                  </div>

                  <audio ref={audioRef} src={audioUrl || ""} controls={false} style={{ width: "100%" }} onEnded={() => setPlaying(false)} />

                  {/* Visualizers (Recharts) */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {/* Frequency Visualizer (Bar-like) */}
                    <div className="rounded-md border p-3 bg-white/60 dark:bg-zinc-950/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Frequency Visualizer</div>
                        <div className="text-xs opacity-70">{Math.round((noiseEstimate || 0) * 100)}% noise • RMS: {rms.toFixed(3)} • Flatness: {spectralFlatness.toFixed(3)}</div>
                      </div>
                      <div className="w-full h-28">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={freqChartData}>
                            <XAxis dataKey="x" hide />
                            <YAxis hide domain={[0, 100]} />
                            <Bar dataKey="value" fill="#10b981" isAnimationActive={false} radius={[3,3,3,3]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Realtime Waveform */}
                    <div className="rounded-md border p-3 bg-white/60 dark:bg-zinc-950/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Waveform</div>
                        <div className="text-xs opacity-70">Realtime + static</div>
                      </div>

                      {/* Realtime waveform */}
                      <div className="w-full h-20 mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={realtimeWaveData}>
                            <XAxis dataKey="x" hide />
                            <YAxis domain={[-1, 1]} hide />
                            <Line type="monotone" dataKey="y" stroke={isDark ? "#DDD" : "#111"} strokeWidth={2} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Static waveform */}
                      <div className="w-full h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={staticWaveData}>
                            <XAxis dataKey="x" hide />
                            <YAxis domain={[-1, 1]} hide />
                            <Area type="monotone" dataKey="y" stroke="#10b981" fill="#10b98133" isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Equalizer Simulator */}
                    <div className="rounded-md border p-3 bg-white/60 dark:bg-zinc-950/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Equalizer Simulator</div>
                        <div className="text-xs opacity-70">Adjust band gains (dB)</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {EQ_BANDS.map((b, i) => (
                          <div key={b.label} className="flex flex-col">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>{b.label}</span>
                              <span className="font-medium">{eqGains[i].toFixed(1)} dB</span>
                            </div>
                            <Slider
                              min={-12}
                              max={12}
                              step={0.5}
                              value={[eqGains[i]]}
                              onValueChange={(val) =>
                                setEqGains((prev) => {
                                  const next = [...prev];
                                  next[i] = val[0];
                                  return next;
                                })
                              }
                              className="w-full cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Noise Analyzer & BPM */}
                    <div className="rounded-md border p-3 bg-white/60 dark:bg-zinc-950/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Noise Analyzer & BPM</div>
                        <div className="text-xs opacity-70">BPM: {detectedBpm ?? "—"} {bpmConfidence ? `(${bpmConfidence}% confident)` : ""}</div>
                      </div>
                      <div className="text-xs">
                        <div>RMS (volume): {rms.toFixed(3)}</div>
                        <div>High-frequency noise estimate: {(noiseEstimate * 100).toFixed(1)}%</div>
                        <div>Spectral flatness: {spectralFlatness.toFixed(3)}</div>
                      </div>
                    </div>
                  </div>

                  {/* display transcript when transcribe tool selected */}
                  {selectedTool === TOOLS.TRANSCRIBE && (
                    <div className="mt-3">
                      <Label className="text-xs mb-2">Transcript</Label>
                      <div className="rounded border p-3 min-h-[120px] bg-white/60 dark:bg-zinc-950/60">
                        <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* when cutter selected show visual summary */}
                  {selectedTool === TOOLS.CUTTER && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <div>Selection: <span className="font-medium">{formatTime(cutStart)} — {formatTime(cutEnd)} </span></div>
                      <div className="text-xs mt-1">Tip: Use the timeline above to seek, then set start/end to the current position for precision.</div>
                      <div className="mt-2 flex gap-2">
                        <Button className="cursor-pointer" onClick={() => { setCutStart(currentTime); showToast("success", "Cut start set to current time"); }} size="sm">Set start</Button>
                        <Button className="cursor-pointer" onClick={() => { setCutEnd(currentTime); showToast("success", "Cut end set to current time"); }} size="sm">Set end</Button>
                        <Button className="cursor-pointer" onClick={() => { setCutStart(0); setCutEnd(duration); showToast("success", "Reset range"); }} size="sm" variant="outline">Reset</Button>
                      </div>
                    </div>
                  )}

                  {selectedTool === TOOLS.VOICE && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <div>Effect: <span className="font-medium">{voiceEffect}</span> • Param: <span className="font-medium">{voiceEffectParam}</span></div>
                      <div className="text-xs mt-1">Preview plays the file locally with effect applied; export renders a WAV with effect.</div>
                    </div>
                  )}

                </div>
              </div>
            </CardContent>
          </Card>

          {selectedTool === TOOLS.SPEED && (
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Preview & Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">When you press Play, audio will play at the chosen rate. Use "Export" on the left to render a new audio file at this speed (resampled).</div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Right column: Debug / actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details & Debug</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Sample rate</span>
                    <span className="font-medium">{sampleRate ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Channels</span>
                    <span className="font-medium">{channels ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Playback rate</span>
                    <span className="font-medium">{playbackRate.toFixed(2)}x</span>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    Notes:
                    <ul className="list-disc ml-4 mt-2">
                      <li>All operations are client-side — no files are uploaded to any server.</li>
                      <li>Transcription uses the browser's Web Speech API and listens to microphone input.</li>
                      <li>Exported files are WAV (mono, 16-bit PCM) for broad compatibility.</li>
                      <li>Cover art extraction currently detects ID3v2 APIC frames in MP3 files (best-effort).</li>
                      <li>Visualizers use the Web Audio API AnalyserNode — enable audio playback to see realtime results.</li>
                    </ul>
                  </div>

                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.PLAYER); showToast("success", "Switched to Player"); }}>Open Player</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.CUTTER); showToast("success", "Switched to Cutter"); }}>Open Cutter</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.SPEED); showToast("success", "Switched to Speed"); }}>Open Speed</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.VOICE); showToast("success", "Switched to Voice Changer"); }}>Open Voice</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.TRANSCRIBE); showToast("success", "Switched to Transcribe"); }}>Open Transcribe</Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </aside>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audio Tools — Notes</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              These tools run entirely in the browser using the Web Audio API and Web Speech API:
            </p>
            <ul className="list-disc ml-5 mt-2 text-sm">
              <li><strong>Player:</strong> Upload and play audio locally. Cover art (if embedded in MP3 ID3v2 APIC) will be shown automatically.</li>
              <li><strong>Cutter:</strong> Select a range and export as WAV (mono, 16-bit PCM).</li>
              <li><strong>Speed:</strong> Change playback rate for preview; export a new WAV rendered at the selected speed.</li>
                      <li><strong>Voice changer:</strong> Apply simple effects (Chipmunk/Deep via playback rate; Robot via processing) and export to WAV.</li>
              <li><strong>Audio → Text:</strong> Uses the Web Speech API to transcribe microphone input (browser support required). Uploads cannot be transcribed directly unless played into the mic or server-side transcription is used.</li>
              <li><strong>Visualizers:</strong> Frequency visualizer, waveform, equalizer simulator, noise analyzer and BPM detection are computed client-side using Web Audio API and Recharts for visualization.</li>
            </ul>
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

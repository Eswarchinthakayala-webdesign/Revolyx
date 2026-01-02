"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Copy, FileText, Play, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast, Toaster } from "sonner";

export default function YoutubeTranscriptPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchTranscript = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError("Invalid YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(`/api/transcript?videoId=${videoId}`);
      const transcriptData = await response.json();

      if (response.ok) {
        setData({
          videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          transcript: transcriptData,
          fullText: transcriptData.map(t => t.text).join(" ")
        });
      } else {
        setError(transcriptData.error);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.fullText);
    toast.success("Transcript copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 font-sans">
      <Toaster richColors />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 mb-4">
            <Youtube className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
            Video <span className="text-red-600">Transcript</span>
          </h1>
          <p className="text-zinc-400 text-lg">Extract text from any YouTube video in seconds.</p>
        </header>

        {/* Input Area */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            placeholder="Paste YouTube URL (e.g., https://www.youtube.com/watch?v=...)" 
            className="bg-zinc-900 border-zinc-800 h-12 text-zinc-200"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button 
            onClick={fetchTranscript} 
            disabled={loading || !url}
            className="h-12 px-8 bg-red-600 hover:bg-red-700 font-bold"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Generate"}
          </Button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <AnimatePresence>
          {data && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Sidebar: Thumbnail */}
              <div className="md:col-span-1 space-y-4">
                <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <img src={data.thumbnail} alt="Thumbnail" className="w-full object-cover" />
                  <div className="p-4">
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300" onClick={() => window.open(url, '_blank')}>
                      <Play className="w-4 h-4 mr-2" /> Watch Video
                    </Button>
                  </div>
                </Card>
                <Button onClick={copyToClipboard} className="w-full bg-white text-black hover:bg-zinc-200 font-bold">
                  <Copy className="w-4 h-4 mr-2" /> Copy Full Text
                </Button>
              </div>

              {/* Main: Transcript Body */}
              <Card className="md:col-span-2 bg-zinc-900 border-zinc-800 h-[600px] flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-zinc-300">
                    <FileText className="w-5 h-5" /> Transcript
                  </div>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">Auto-generated</Badge>
                </div>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {data.transcript.map((item, index) => (
                      <div key={index} className="group flex gap-4">
                        <span className="text-xs font-mono text-red-500 opacity-50 pt-1">
                          {Math.floor(item.offset / 1000)}s
                        </span>
                        <p className="text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
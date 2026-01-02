"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Youtube, 
  Copy, 
  FileText, 
  Play, 
  Loader2, 
  AlertCircle, 
  Download,
  ExternalLink,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      setError("Please enter a valid YouTube URL");
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
          transcript: transcriptData, // Array of { start, dur, text }
          fullText: transcriptData.map(t => t.text).join(" ")
        });
        toast.success("Transcript generated!");
      } else {
        setError(transcriptData.error || "Failed to fetch transcript");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.fullText);
    toast.success("Full transcript copied!");
  };

  // Helper to format seconds to MM:SS
  const formatTime = (seconds) => {
    const s = Math.floor(parseFloat(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Youtube className="text-red-600 w-9 h-9" />
            Revolyx Transcript
          </h1>
          <p className="text-sm opacity-70 mt-1">Convert YouTube speech to text instantly</p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT PANEL: INPUT & INFO */}
        <aside className="lg:col-span-1 space-y-4">
          <Card className="bg-white/60 dark:bg-black/60 backdrop-blur-md sticky top-4">
            <CardHeader><CardTitle className="text-lg">Input</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium opacity-70">YouTube Video URL</label>
                <div className="relative">
                  <Input 
                    placeholder="https://youtube.com/watch?v=..." 
                    className="bg-background pr-10"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <Search className="absolute right-3 top-2.5 w-4 h-4 opacity-40" />
                </div>
              </div>

              <Button 
                onClick={fetchTranscript} 
                disabled={loading || !url}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
              >
                {loading ? (
                  <><Loader2 className="animate-spin mr-2 w-4 h-4" /> Extracting...</>
                ) : (
                  "Generate Transcript"
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {data && (
                <div className="pt-4 space-y-4">
                  <Separator />
                  <div className="rounded-lg overflow-hidden border">
                    <img src={data.thumbnail} alt="Video Preview" className="w-full h-auto" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="w-full">
                      <Copy className="w-4 h-4 mr-2" /> Copy All Text
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <a href={`https://youtube.com/watch?v=${data.videoId}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" /> Open on YouTube
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* RIGHT PANEL: TRANSCRIPT DISPLAY */}
        <section className="lg:col-span-3">
          <Card className="bg-white/60 dark:bg-black/60 backdrop-blur-md h-full min-h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Transcript Result</CardTitle>
              </div>
              {data && (
                <Badge variant="secondary" className="font-mono">
                  {data.transcript.length} Segments
                </Badge>
              )}
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-250px)] p-6">
                {!data && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-20">
                    <Youtube className="w-20 h-20 mb-4" />
                    <p className="text-xl font-medium">Ready to extract</p>
                    <p className="text-sm">Enter a URL to see the magic happen</p>
                  </div>
                )}

                {loading && (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse flex gap-4">
                        <div className="h-4 w-12 bg-muted rounded mt-1"></div>
                        <div className="h-4 flex-1 bg-muted rounded mt-1"></div>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {data && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {data.transcript.map((item, index) => (
                        <div key={index} className="group flex gap-6 hover:bg-muted/30 p-2 rounded-md transition-colors">
                          <span className="text-xs font-mono font-bold text-red-600 bg-red-600/10 h-fit px-2 py-1 rounded">
                            {formatTime(item.start)}
                          </span>
                          <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
            
            {data && (
              <div className="p-4 border-t bg-muted/10 flex justify-end">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                  const blob = new Blob([data.fullText], { type: 'text/plain' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `transcript-${data.videoId}.txt`;
                  link.click();
                }}>
                  <Download className="w-3 h-3 mr-2" /> Download .txt
                </Button>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
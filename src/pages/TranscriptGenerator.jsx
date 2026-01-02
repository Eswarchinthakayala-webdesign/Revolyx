"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Youtube, Loader2, Copy } from "lucide-react";

export default function YoutubeTranscript() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extractVideoId = (url) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
    );
    return match ? match[1] : null;
  };

  const handleGenerate = async () => {
    setError("");
    setTranscript("");

    const id = extractVideoId(url);
    if (!id) {
      setError("Invalid YouTube URL");
      return;
    }

    setVideoId(id);
    setLoading(true);

    try {
      const res = await fetch(`/api/transcript?videoId=${id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setTranscript(data.transcript);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          YouTube Transcript Generator
        </h1>
        <p className="text-zinc-500">
          Paste a YouTube link to extract captions instantly
        </p>
      </div>

      {/* Input */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="font-mono"
            />
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Youtube />
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {videoId && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Thumbnail */}
            <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
              <img
                src={thumbnail}
                alt="YouTube Thumbnail"
                className="w-full h-full object-cover"
              />
            </Card>

            {/* Transcript */}
            <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-row justify-between">
                <CardTitle className="text-sm">Transcript</CardTitle>
                {transcript && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      navigator.clipboard.writeText(transcript)
                    }
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {transcript || "Transcript will appear here..."}
                  </pre>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

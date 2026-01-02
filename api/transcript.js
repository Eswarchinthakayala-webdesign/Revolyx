// api/transcript.js
import { getSubtitles } from 'youtube-caption-extractor';

export default async function handler(req, res) {
  // In Vercel Node functions, query params are in req.query
  const { videoId, lang = 'en' } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  try {
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: lang,
    });

    if (!subtitles || subtitles.length === 0) {
      return res.status(404).json({ error: "No captions found for this video." });
    }

    // Set CORS headers so your Vite dev server can talk to it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    return res.status(200).json(subtitles);
  } catch (error) {
    console.error("Extraction Error:", error);
    return res.status(500).json({ 
      error: "YouTube restricted the request or captions are disabled.",
      details: error.message 
    });
  }
}
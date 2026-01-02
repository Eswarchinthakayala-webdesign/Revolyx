import { getSubtitles } from 'youtube-caption-extractor';

export default async function handler(req, res) {
  const { videoId, lang = 'en' } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  try {
    // getSubtitles returns an array of { start, dur, text }
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: lang,
    });

    if (!subtitles || subtitles.length === 0) {
      return res.status(404).json({ error: "No captions found for this video." });
    }

    return res.status(200).json(subtitles);
  } catch (error) {
    console.error("Extraction Error:", error);
    return res.status(500).json({ 
      error: "Failed to extract transcript.",
      details: error.message 
    });
  }
}
import { YoutubeTranscript } from "youtube-transcript";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId" });
  }

  try {
    // 🔴 IMPORTANT: Explicitly pass options
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });

    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        error: "Transcript exists but is empty",
      });
    }

    const text = transcript.map((t) => t.text).join(" ");

    return res.status(200).json({
      transcript: text,
      segments: transcript,
    });
  } catch (err) {
    console.error("Transcript Error:", err);

    return res.status(500).json({
      error:
        "Transcript not available for this video (disabled, private, or blocked)",
    });
  }
}

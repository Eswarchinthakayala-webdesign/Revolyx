import { YoutubeTranscript } from "youtube-transcript";

export default async function handler(req, res) {
  // Allow CORS for Vite frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId" });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const text = transcript
      .map((item) => item.text)
      .join(" ");

    res.status(200).json({ transcript: text });
  } catch (error) {
    res.status(500).json({
      error: "Transcript not available for this video",
    });
  }
}

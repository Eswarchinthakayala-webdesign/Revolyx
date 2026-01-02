// pages/api/transcript.js
import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    res.status(200).json(transcript);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch transcript. Ensure the video has captions enabled." });
  }
}
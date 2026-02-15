import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;

  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  // Build the TMDB Image URL
  // path should be something like /w200/filename.jpg or /original/filename.jpg
  const tmdbImageUrl = `https://image.tmdb.org/t/p${path}`;

  try {
    const response = await fetch(tmdbImageUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `TMDB Image Error: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=31536000");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).send(Buffer.from(buffer));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

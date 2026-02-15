import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path, ...otherParams } = req.query;

  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  const apiKey = process.env.KINOPOISK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Kinopoisk API key not configured on server",
    });
  }

  // Build the Kinopoisk API URL
  // We expect path to start with /movie, etc.
  const kpUrl = new URL(`https://api.kinopoisk.dev/v1.4${path}`);

  // Forward all other query parameters
  Object.entries(otherParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      kpUrl.searchParams.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => kpUrl.searchParams.append(key, v));
    }
  });

  try {
    const response = await fetch(kpUrl.toString(), {
      method: req.method || "GET",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

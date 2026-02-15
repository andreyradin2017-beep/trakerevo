export const config = {
  runtime: "nodejs",
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  if (!path) {
    return new Response(JSON.stringify({ error: "Missing path parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.KINOPOISK_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Kinopoisk API key not configured on server" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Build the Kinopoisk API URL
  // We expect path to start with /movie, etc.
  const kpUrl = new URL(`https://api.kinopoisk.dev/v1.4${path}`);

  // Forward all other query parameters
  url.searchParams.forEach((value, key) => {
    if (key !== "path") {
      kpUrl.searchParams.append(key, value);
    }
  });

  try {
    const response = await fetch(kpUrl.toString(), {
      method: req.method,
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      // Note: For GET requests, we don't send a body
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Enable CORS for this proxy
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

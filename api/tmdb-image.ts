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

  // Build the TMDB Image URL
  // path should be something like /w200/filename.jpg or /original/filename.jpg
  const tmdbImageUrl = `https://image.tmdb.org/t/p${path}`;

  try {
    const response = await fetch(tmdbImageUrl);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `TMDB Image Error: ${response.statusText}` }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

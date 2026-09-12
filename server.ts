import { Hono } from "hono";

const app = new Hono();

// Search API using native fetch to parse YouTube search
app.get("/api/search", async (c) => {
  try {
    const q = c.req.query("q");
    if (!q) {
      return c.json({ error: "Query is required" }, 400);
    }
    
    // Fetch raw search HTML using standard fetch
    const searchUrl = `https://youtube.com{encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
    const response = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const html = await response.text();
    
    // Extract ytInitialData json from script tags safely
    const jsonRegex = /ytInitialData\s*=\s*({.+?});/;
    const match = html.match(jsonRegex);
    
    if (!match) {
      return c.json({ results: [] });
    }
    
    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    
    // Format results cleanly to match your original front-end properties
    const videos = contents
      .filter((item: any) => item.videoRenderer)
      .slice(0, 20)
      .map((item: any) => {
        const v = item.videoRenderer;
        return {
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || "Unknown Title",
          thumbnail: v.thumbnail?.thumbnails?.[0]?.url || "",
          duration: v.lengthText?.simpleText || "0:00",
          author: v.ownerText?.runs?.[0]?.text || "Unknown Artist"
        };
      });
      
    return c.json({ results: videos });
  } catch (error) {
    console.error("Search error:", error);
    return c.json({ error: "Failed to search" }, 500);
  }
});

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return app.fetch(request, env, ctx);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};

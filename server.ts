import { Hono } from "hono";
import ytSearch from "yt-search";

const app = new Hono();

app.get("/api/search", async (c) => {
  try {
    const q = c.req.query("q");
    if (!q) {
      return c.json({ error: "Query is required" }, 400);
    }
    
    const r = await ytSearch(q);
    const videos = r.videos.slice(0, 20).map(v => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.timestamp,
      author: v.author.name
    }));
    
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

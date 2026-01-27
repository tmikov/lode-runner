const server = Bun.serve({
  port: 8000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    if (path === "/") {
      path = "/index.html";
    }

    const file = Bun.file("." + path);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);

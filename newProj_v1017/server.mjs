import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

export function startServer(port = Number(process.env.PORT || 5174)) {
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!file.startsWith(root + sep)) throw new Error("outside project");
      const info = await stat(file);
      if (!info.isFile()) throw new Error("not a file");
      const type = types[extname(file)] || "application/octet-stream";
      const base = {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes",
      };
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || "");
      if (range) {
        const start = Number(range[1]);
        const end = range[2]
          ? Math.min(Number(range[2]), info.size - 1)
          : info.size - 1;
        if (start >= info.size || end < start) {
          res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
          res.end();
          return;
        }
        res.writeHead(206, {
          ...base,
          "Content-Range": `bytes ${start}-${end}/${info.size}`,
          "Content-Length": end - start + 1,
        });
        if (req.method === "HEAD") res.end();
        else createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { ...base, "Content-Length": info.size });
      if (req.method === "HEAD") res.end();
      else if (type === "audio/wav" || type === "video/mp4")
        createReadStream(file).pipe(res);
      else res.end(await readFile(file));
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  });
  return new Promise((resolveReady, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () =>
      resolveReady({
        server,
        url: `http://localhost:${server.address().port}`,
      }),
    );
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  startServer().then(({ url }) => console.log(`DeepSeek MV preview: ${url}/`));
}

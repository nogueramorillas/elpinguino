const http = require("http");
const path = require("path");
const zlib = require("zlib");
const handler = require("serve-handler");

const port = process.env.PORT || 3000;

// The whole repo is the web root, so keep tooling, config and private files out of it:
// scripts/, node_modules/, any dotfile or dot-folder (.git, .claude, .env…; only
// .well-known stays reachable), the server and npm files, and stray files whose
// name starts with "+".
const BLOCKED = /^\/(scripts|node_modules)(\/|$)|^\/\.(?!well-known\/)|^\/\+|^\/(server\.js|package(-lock)?\.json)$/;

const notFound = (response) => {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
};

// Cache: files asked for with ?v= (styles.css?v=31, script.js?v=16, data/proyectos.json?v=16)
// never change under the same URL; images can be cached a week; pages always revalidate (ETag).
const cacheControl = (pathname, search) => {
  if (/[?&]v=/.test(search)) return "public, max-age=31536000, immutable";
  if (/\.(webp|png|jpe?g|gif|svg|ico|avif|woff2?|mp4|webm)$/.test(pathname)) return "public, max-age=604800, stale-while-revalidate=86400";
  return "no-cache";
};

// On-the-fly brotli/gzip for text files (html, css, js, json, svg, xml, txt).
const COMPRESSIBLE = /^(text\/|application\/(javascript|json|xml|manifest\+json)|image\/svg\+xml)/;
const compress = (request, response) => {
  if (request.method !== "GET") return;
  const accept = String(request.headers["accept-encoding"] || "");
  const encoding = /\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gzip" : null;
  if (!encoding) return;
  const writeHead = response.writeHead;
  response.writeHead = function (status, ...rest) {
    response.writeHead = writeHead;
    const headers = rest.find((r) => r && typeof r === "object") || {};
    const type = String(headers["Content-Type"] || response.getHeader("Content-Type") || "");
    const size = Number(headers["Content-Length"] || 0);
    if (status !== 200 || !COMPRESSIBLE.test(type) || headers["Content-Range"] || size < 1024) {
      return writeHead.call(response, status, ...rest);
    }
    delete headers["Content-Length"];
    headers["Content-Encoding"] = encoding;
    headers["Vary"] = "Accept-Encoding";
    if (headers.ETag && !String(headers.ETag).startsWith("W/")) headers.ETag = `W/${headers.ETag}`;
    const z = encoding === "br"
      ? zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: size } })
      : zlib.createGzip({ level: 6 });
    const write = response.write.bind(response);
    const end = response.end.bind(response);
    z.on("data", (chunk) => write(chunk));
    z.on("end", () => end());
    z.on("error", () => end());
    response.write = (chunk, enc, cb) => { z.write(chunk, enc, cb); return true; };
    response.end = (chunk, enc, cb) => {
      if (typeof chunk === "function") { cb = chunk; chunk = null; }
      if (typeof enc === "function") { cb = enc; enc = undefined; }
      if (chunk) z.write(chunk, enc);
      if (cb) response.once("finish", cb);
      z.end();
      return response;
    };
    return writeHead.call(response, status, headers);
  };
};

http
  .createServer((request, response) => {
    // www.elpinguino.pro → elpinguino.pro (one canonical host for Google)
    const host = (request.headers.host || "").toLowerCase();
    if (host.startsWith("www.")) {
      response.writeHead(301, { Location: `https://${host.slice(4)}${request.url}` });
      return response.end();
    }

    // Normalise the path (decode, backslashes, dot segments, case) so encoded
    // or tricky URLs can't slip past the block list.
    let pathname;
    let search;
    try {
      const url = new URL(request.url, "http://localhost");
      pathname = decodeURIComponent(url.pathname);
      search = url.search;
    } catch {
      return notFound(response);
    }
    pathname = path.posix.normalize(pathname.replace(/\\/g, "/")).replace(/\/{2,}/g, "/").toLowerCase();
    if (BLOCKED.test(pathname)) return notFound(response);

    // cache headers only for real files (200/304); errors and redirects are never cached long
    const cache = cacheControl(pathname, search);
    const writeHead = response.writeHead;
    response.writeHead = function (status, ...rest) {
      response.writeHead = writeHead;
      response.setHeader("Cache-Control", status === 200 || status === 304 ? cache : "no-cache");
      return writeHead.call(response, status, ...rest);
    };
    // the browser sends back the weak ETag we gave it for compressed files
    const inm = request.headers["if-none-match"];
    if (inm) request.headers["if-none-match"] = String(inm).replace(/^W\//, "");
    compress(request, response);

    // No folder listings: only files that are linked from the site get served.
    return handler(request, response, { directoryListing: false, etag: true });
  })
  .listen(port, () => {
    console.log(`Serving elpinguino on port ${port}`);
  });

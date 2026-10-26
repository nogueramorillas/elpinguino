const http = require("http");
const handler = require("serve-handler");

const port = process.env.PORT || 3000;

http
  .createServer((request, response) => {
    // www.elpinguino.pro → elpinguino.pro (one canonical host for Google)
    const host = (request.headers.host || "").toLowerCase();
    if (host.startsWith("www.")) {
      response.writeHead(301, { Location: `https://${host.slice(4)}${request.url}` });
      return response.end();
    }
    return handler(request, response);
  })
  .listen(port, () => {
    console.log(`Serving elpinguino on port ${port}`);
  });

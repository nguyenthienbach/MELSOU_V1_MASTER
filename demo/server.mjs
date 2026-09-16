/** Local Melsou preview: serves UI assets and forwards only /api/* to the Worker. */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const recoveryRoot = join(root, 'recovery_fb38');
const port = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    try {
      const workerRequest = new Request(url, { method: request.method, headers: request.headers, body });
      const workerResponse = await worker.fetch(workerRequest, process.env);
      response.writeHead(workerResponse.status, Object.fromEntries(workerResponse.headers.entries()));
      response.end(Buffer.from(await workerResponse.arrayBuffer()));
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'LOCAL_API_FAILURE', message: error.message }));
    }
    return;
  }

  // SPA rewrites for landing page / sub-routes
  if (
    url.pathname === '/' ||
    url.pathname === '/ve-melsou' ||
    url.pathname === '/goi-san-pham' ||
    url.pathname === '/templates' ||
    url.pathname === '/chinh-sach-bao-mat' ||
    url.pathname === '/chinh-sach-bao-hanh' ||
    url.pathname === '/wordpress-oauth-callback' ||
    url.pathname.startsWith('/blog/') ||
    url.pathname === '/recovery_fb38' ||
    url.pathname === '/recovery_fb38/' ||
    url.pathname === '/recovery_fb38/index.html'
  ) {
    try {
      const indexPath = join(recoveryRoot, 'index.html');
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(await readFile(indexPath));
      return;
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Failed to load index.html');
      return;
    }
  }

  const sanitizedPath = url.pathname.replace(/^\/recovery_fb38\//, '').replace(/^\//, '');

  const candidates = [
    normalize(join(recoveryRoot, sanitizedPath)),
    normalize(join(root, sanitizedPath))
  ];

  for (const filePath of candidates) {
    if (!filePath.startsWith(root)) continue;
    try {
      const info = await stat(filePath);
      if (info.isFile()) {
        response.writeHead(200, {
          'Content-Type': types[extname(filePath).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        });
        response.end(await readFile(filePath));
        return;
      }
    } catch {
      // try next candidate
    }
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}).listen(port, '0.0.0.0', () => console.log(`Melsou demo listening on 0.0.0.0:${port}`));

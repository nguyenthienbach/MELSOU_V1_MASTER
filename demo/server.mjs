/** Local Melsou preview: serves UI assets and forwards only /api/* to the Worker. */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'
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

  const requestPath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
  const filePath = normalize(join(root, requestPath));
  if (!filePath.startsWith(root)) { response.writeHead(403).end('Forbidden'); return; }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('not file');
    response.writeHead(200, { 'Content-Type': types[extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Melsou demo: http://127.0.0.1:${port}`));

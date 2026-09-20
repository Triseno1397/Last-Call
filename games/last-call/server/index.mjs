/**
 * Standalone dialogue server, for playing the built game (`npm run preview`)
 * or hosting it somewhere with the key held server-side.
 *
 *   ANTHROPIC_API_KEY=... npm run serve:ai
 */
import { createServer } from 'node:http';
import { handleDialogue } from './dialogueMiddleware.mjs';

const port = Number(process.env['PORT'] ?? 8787);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname === '/api/dialogue') {
    void handleDialogue(req, res);
    return;
  }
  res.statusCode = 404;
  res.end('Not found');
});

server.listen(port, () => {
  const hasKey = Boolean(process.env['ANTHROPIC_API_KEY']);
  console.log(`Last Call dialogue server on http://localhost:${port}/api/dialogue`);
  console.log(hasKey ? 'ANTHROPIC_API_KEY found.' : 'No ANTHROPIC_API_KEY set — requests will fail.');
});

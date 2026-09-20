import { DEFAULT_MODEL, describeError, generateTurn } from './dialogueService.mjs';

const MAX_BODY_BYTES = 200_000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

/**
 * The dialogue endpoint, as plain Node handlers so the same code serves the
 * Vite dev server and the standalone server.
 *
 * It is a local relay: it holds the API key so the browser never sees it. It is
 * not hardened for public hosting — put it behind auth before exposing it.
 */
export async function handleDialogue(req, res) {
  if (req.method === 'GET') {
    send(res, 200, {
      ok: true,
      hasKey: Boolean(process.env['ANTHROPIC_API_KEY']),
      model: process.env['LAST_CALL_MODEL'] || DEFAULT_MODEL,
    });
    return;
  }

  if (req.method !== 'POST') {
    send(res, 405, { error: 'POST only' });
    return;
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw);
    const started = Date.now();
    // A key sent by the browser is the caller's own, used instead of the
    // server's. The server key is never revealed either way.
    const headerKey = req.headers['x-dialogue-key'];
    const apiKey = typeof headerKey === 'string' && headerKey.length > 0 ? headerKey : undefined;
    const result = await generateTurn(body, apiKey ? { apiKey } : {});
    send(res, 200, { ...result, ms: Date.now() - started });
  } catch (error) {
    const { status, message } = describeError(error);
    send(res, status, { error: message });
  }
}

/** Vite plugin: serves /api/dialogue during `npm run dev`. */
export function dialoguePlugin() {
  return {
    name: 'last-call-dialogue',
    configureServer(server) {
      server.middlewares.use('/api/dialogue', (req, res) => {
        void handleDialogue(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/dialogue', (req, res) => {
        void handleDialogue(req, res);
      });
    },
  };
}

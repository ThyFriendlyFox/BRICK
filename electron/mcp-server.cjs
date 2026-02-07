/**
 * BRICK MCP Server
 * 
 * A minimal, spec-compliant MCP (Model Context Protocol) server that exposes
 * a `log_progress` tool. Coding agents (Cursor, Claude Code, etc.) connect
 * to this server and call log_progress to send context into BRICK.
 * 
 * Supports two transports:
 *   1. Streamable HTTP (POST /mcp) — for Cursor and newer clients
 *   2. SSE transport (GET /sse + POST /message) — for Claude Code --transport http
 */

const http = require('http');
const crypto = require('crypto');
const os = require('os');

// ─── Protocol Constants ──────────────────────────────────────────────────────

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'brick', version: '1.0.0' };

const LOG_PROGRESS_TOOL = {
  name: 'log_progress',
  description:
    'Send a short, clear summary of what you just did or are about to do in the code. ' +
    'This will be used to generate social/media posts about your work.',
  inputSchema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'A concise, natural-language summary of the change or decision. ' +
          "E.g., 'Converted class components to functional components in Onboarding flow' " +
          "or 'Added error boundaries and fallback UI'. Keep under 120 characters.",
      },
    },
    required: ['summary'],
  },
};

// ─── Session & State ─────────────────────────────────────────────────────────

/** @type {Map<string, { sseRes: http.ServerResponse | null, createdAt: number }>} */
const sessions = new Map();

/** @type {Set<(event: { summary: string, timestamp: string, sessionId: string }) => void>} */
const progressListeners = new Set();

/** @type {{ summary: string, timestamp: string, sessionId: string }[]} */
const progressLog = [];

// ─── JSON-RPC Helpers ────────────────────────────────────────────────────────

function jsonRpcResponse(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// ─── MCP Request Handler ─────────────────────────────────────────────────────

/**
 * Handle a single JSON-RPC request and return a response (or null for notifications).
 * @param {object} request - Parsed JSON-RPC request
 * @param {string} sessionId - The session ID
 * @returns {object|null} JSON-RPC response, or null for notifications
 */
function handleMcpRequest(request, sessionId) {
  const { id, method, params } = request;

  switch (method) {
    // ── Lifecycle ──
    case 'initialize':
      return jsonRpcResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: SERVER_INFO,
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      // Notifications have no response
      return null;

    case 'ping':
      return jsonRpcResponse(id, {});

    // ── Tools ──
    case 'tools/list':
      return jsonRpcResponse(id, {
        tools: [LOG_PROGRESS_TOOL],
      });

    case 'tools/call': {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName !== 'log_progress') {
        return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);
      }

      const summary = args.summary;
      if (!summary || typeof summary !== 'string') {
        return jsonRpcError(id, -32602, 'Missing or invalid "summary" argument');
      }

      const event = {
        summary,
        timestamp: new Date().toISOString(),
        sessionId,
      };

      // Store in log
      progressLog.push(event);

      // Notify all listeners (Electron main process picks these up)
      for (const listener of progressListeners) {
        try {
          listener(event);
        } catch (err) {
          console.error('[MCP] Error in progress listener:', err);
        }
      }

      return jsonRpcResponse(id, {
        content: [
          {
            type: 'text',
            text: `Progress logged: "${summary}"`,
          },
        ],
      });
    }

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────

/** @type {http.Server | null} */
let server = null;
let serverPort = 3777;

/**
 * Read the full request body as a string.
 * @param {http.IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

/**
 * Set CORS headers on every response.
 * @param {http.ServerResponse} res
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

/**
 * Get or create a session for a request.
 * @param {http.IncomingMessage} req
 * @returns {string} sessionId
 */
function getOrCreateSession(req) {
  const existing = req.headers['mcp-session-id'];
  if (existing && sessions.has(existing)) {
    return existing;
  }
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { sseRes: null, createdAt: Date.now() });
  return sessionId;
}

/**
 * Handle incoming HTTP requests.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function handleRequest(req, res) {
  setCorsHeaders(res);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ── Health check ──
  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'brick-mcp-server',
      version: '1.0.0',
      status: 'running',
      activeSessions: sessions.size,
      totalProgressEvents: progressLog.length,
    }));
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Transport 1: Streamable HTTP (POST /mcp)
  // Used by Cursor and newer MCP clients.
  // ══════════════════════════════════════════════════════════════════════════

  if (pathname === '/mcp' && req.method === 'POST') {
    const sessionId = getOrCreateSession(req);

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(jsonRpcError(null, -32700, 'Parse error')));
      return;
    }

    // Handle batch requests
    const requests = Array.isArray(body) ? body : [body];
    const responses = [];

    for (const request of requests) {
      const response = handleMcpRequest(request, sessionId);
      if (response !== null) {
        responses.push(response);
      }
    }

    res.setHeader('Mcp-Session-Id', sessionId);

    if (responses.length === 0) {
      // All notifications, no responses needed
      res.writeHead(202);
      res.end();
    } else if (responses.length === 1 && !Array.isArray(body)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responses[0]));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responses));
    }
    return;
  }

  // Streamable HTTP: GET /mcp for SSE stream (server→client notifications)
  if (pathname === '/mcp' && req.method === 'GET') {
    const accept = req.headers['accept'] || '';
    if (!accept.includes('text/event-stream')) {
      res.writeHead(406, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Accept header must include text/event-stream' }));
      return;
    }

    const sessionId = getOrCreateSession(req);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Mcp-Session-Id': sessionId,
    });
    res.write(': connected\n\n');

    // Store SSE connection for this session
    const session = sessions.get(sessionId);
    if (session) session.sseRes = res;

    req.on('close', () => {
      const s = sessions.get(sessionId);
      if (s) s.sseRes = null;
    });
    return;
  }

  // Streamable HTTP: DELETE /mcp to close session
  if (pathname === '/mcp' && req.method === 'DELETE') {
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId) sessions.delete(sessionId);
    res.writeHead(204);
    res.end();
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Transport 2: SSE Transport (GET /sse + POST /message)
  // Used by Claude Code with --transport http.
  // ══════════════════════════════════════════════════════════════════════════

  if (pathname === '/sse' && req.method === 'GET') {
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { sseRes: res, createdAt: Date.now() });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send the endpoint event — tells the client where to POST messages
    const messageUrl = `/message?sessionId=${sessionId}`;
    res.write(`event: endpoint\ndata: ${messageUrl}\n\n`);

    // Keepalive ping every 30s
    const keepalive = setInterval(() => {
      try { res.write(': keepalive\n\n'); } catch { clearInterval(keepalive); }
    }, 30000);

    req.on('close', () => {
      clearInterval(keepalive);
      sessions.delete(sessionId);
    });
    return;
  }

  if (pathname === '/message' && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId || !sessions.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(jsonRpcError(null, -32600, 'Invalid or missing sessionId')));
      return;
    }

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(jsonRpcError(null, -32700, 'Parse error')));
      return;
    }

    const response = handleMcpRequest(body, sessionId);

    // For SSE transport, we send the response on the SSE stream
    const session = sessions.get(sessionId);
    if (session && session.sseRes) {
      if (response !== null) {
        session.sseRes.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
      }
      // Acknowledge receipt
      res.writeHead(202);
      res.end();
    } else {
      // Fallback: respond directly if no SSE connection
      if (response !== null) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else {
        res.writeHead(202);
        res.end();
      }
    }
    return;
  }

  // ── 404 ──
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the local network IP address (first non-internal IPv4).
 * @returns {string}
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Start the MCP server.
 * @param {number} [port=3777] - Port to listen on
 * @returns {Promise<{ port: number, ip: string, wsUrl: string, httpUrl: string }>}
 */
function startServer(port = 3777) {
  return new Promise((resolve, reject) => {
    if (server) {
      reject(new Error('MCP server is already running'));
      return;
    }

    serverPort = port;
    server = http.createServer(handleRequest);

    server.on('error', (err) => {
      server = null;
      reject(err);
    });

    server.listen(port, '0.0.0.0', () => {
      const ip = getLocalIP();
      const urls = {
        port,
        ip,
        httpUrl: `http://${ip}:${port}/mcp`,
        sseUrl: `http://${ip}:${port}/sse`,
        healthUrl: `http://${ip}:${port}/`,
      };
      console.log(`[MCP] Server listening on port ${port}`);
      console.log(`[MCP]   Streamable HTTP: ${urls.httpUrl}`);
      console.log(`[MCP]   SSE transport:   ${urls.sseUrl}`);
      console.log(`[MCP]   Health check:    ${urls.healthUrl}`);
      resolve(urls);
    });
  });
}

/**
 * Stop the MCP server.
 * @returns {Promise<void>}
 */
function stopServer() {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }

    // Close all SSE connections
    for (const [, session] of sessions) {
      if (session.sseRes) {
        try { session.sseRes.end(); } catch { /* ignore */ }
      }
    }
    sessions.clear();

    server.close(() => {
      server = null;
      console.log('[MCP] Server stopped');
      resolve();
    });
  });
}

/**
 * Register a listener for log_progress events.
 * @param {(event: { summary: string, timestamp: string, sessionId: string }) => void} callback
 * @returns {() => void} Unsubscribe function
 */
function onProgress(callback) {
  progressListeners.add(callback);
  return () => progressListeners.delete(callback);
}

/**
 * Get the current server status.
 * @returns {{ running: boolean, port: number | null, ip: string | null, activeSessions: number, totalEvents: number }}
 */
function getStatus() {
  if (!server) {
    return { running: false, port: null, ip: null, activeSessions: 0, totalEvents: progressLog.length };
  }
  return {
    running: true,
    port: serverPort,
    ip: getLocalIP(),
    activeSessions: sessions.size,
    totalEvents: progressLog.length,
  };
}

/**
 * Get the progress log.
 * @returns {{ summary: string, timestamp: string, sessionId: string }[]}
 */
function getProgressLog() {
  return [...progressLog];
}

module.exports = {
  startServer,
  stopServer,
  onProgress,
  getStatus,
  getProgressLog,
  getLocalIP,
};

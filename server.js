import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── RAMS proxy ──
// Use pathFilter + global mount so http-proxy-middleware sees the full path
app.use(
  createProxyMiddleware({
    target: 'https://rumytechnologies.com',
    pathFilter: '/rams-api',
    changeOrigin: true,
    pathRewrite: { '^/rams-api': '/rams' },
    secure: true,
    cookieDomainRewrite: '',
    cookiePathRewrite: { '/rams': '/rams-api' },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('Origin', 'https://rumytechnologies.com');
      },
      proxyRes: (proxyRes) => {
        const cookies = proxyRes.headers['set-cookie'];
        if (cookies) {
          proxyRes.headers['set-cookie'] = cookies.map((c) =>
            c
              .replace(/Path=\/rams/gi, 'Path=/rams-api')
              .replace(/;\s*Secure/gi, '')
              .replace(/;\s*SameSite=\w+/gi, '; SameSite=Lax')
          );
        }
      },
    },
  }),
);

// ── Time Doctor proxy ──
// Handle CORS preflight for TD API
app.options('/td-api/{*splat}', (_req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  });
  res.sendStatus(204);
});

// ── Time Doctor v1.1 proxy (activity stats) ──
app.options('/td-api-v11/{*splat}', (_req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  });
  res.sendStatus(204);
});

app.use(
  createProxyMiddleware({
    target: 'https://api2.timedoctor.com',
    pathFilter: '/td-api-v11',
    changeOrigin: true,
    pathRewrite: { '^/td-api-v11': '/api/1.1' },
    secure: true,
    on: {
      proxyRes: (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*';
        proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization';
      },
    },
  }),
);

app.use(
  createProxyMiddleware({
    target: 'https://api2.timedoctor.com',
    pathFilter: '/td-api',
    changeOrigin: true,
    pathRewrite: { '^/td-api': '/api/1.0' },
    secure: true,
    on: {
      proxyRes: (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*';
        proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization';
      },
    },
  }),
);

// ── World Cup 2026: football-data.org proxy ──
// Injects X-Auth-Token from FD_TOKEN env when present; otherwise forwards the
// token the client pasted in Settings (kept out of the JS bundle either way).
app.use(
  createProxyMiddleware({
    target: 'https://api.football-data.org',
    pathFilter: '/football-api',
    changeOrigin: true,
    pathRewrite: { '^/football-api': '/v4' },
    secure: true,
    on: {
      proxyReq: (proxyReq) => {
        if (process.env.FD_TOKEN) proxyReq.setHeader('X-Auth-Token', process.env.FD_TOKEN);
      },
      proxyRes: (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*';
      },
    },
  }),
);

// ── World Cup 2026: API-Football proxy (events / MOTM) ──
app.use(
  createProxyMiddleware({
    target: 'https://v3.football.api-sports.io',
    pathFilter: '/apifootball-api',
    changeOrigin: true,
    pathRewrite: { '^/apifootball-api': '' },
    secure: true,
    on: {
      proxyReq: (proxyReq) => {
        if (process.env.APIFOOTBALL_KEY) proxyReq.setHeader('x-apisports-key', process.env.APIFOOTBALL_KEY);
      },
      proxyRes: (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*';
      },
    },
  }),
);

// ── Serve static build ──
app.use(express.static(join(__dirname, 'dist')));

// ── SPA fallback ──
app.get('/{*splat}', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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

// ── Serve static build ──
app.use(express.static(join(__dirname, 'dist')));

// ── SPA fallback ──
app.get('/{*splat}', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

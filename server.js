import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── RAMS proxy ──
app.use(
  '/rams-api',
  createProxyMiddleware({
    target: 'https://rumytechnologies.com',
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
        // Rewrite any Set-Cookie paths and remove Secure/SameSite restrictions
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
app.use(
  '/td-api',
  createProxyMiddleware({
    target: 'https://api2.timedoctor.com',
    changeOrigin: true,
    pathRewrite: { '^/td-api': '/api/1.0' },
    secure: true,
    on: {
      proxyRes: (proxyRes) => {
        // Allow browser to store credentials
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

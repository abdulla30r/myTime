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

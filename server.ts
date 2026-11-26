import express, { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Endpoint proxy de streaming para evitar bloqueos Mixed Content (HTTPS -> HTTP) y CORS en servidores de radio
  const handleStreamProxy = (req: Request, res: Response) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      res.status(400).send('Invalid or missing stream URL');
      return;
    }

    const proxyStream = (urlToFetch: string, redirectsLeft = 5) => {
      if (redirectsLeft <= 0) {
        if (!res.headersSent) res.status(502).send('Too many redirects');
        return;
      }

      try {
        const parsedUrl = new URL(urlToFetch);
        const client = parsedUrl.protocol === 'https:' ? https : http;

        const upstreamReq = client.get(
          parsedUrl,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AudioCarRadio/1.0',
              'Accept': '*/*',
              'Icy-MetaData': '0',
              ...(req.headers.range ? { Range: req.headers.range } : {}),
            },
            timeout: 15000,
          },
          (upstreamRes) => {
            const statusCode = upstreamRes.statusCode || 200;

            // Seguir redirecciones (301, 302, 303, 307, 308)
            if (
              [301, 302, 303, 307, 308].includes(statusCode) &&
              upstreamRes.headers.location
            ) {
              const nextUrl = new URL(upstreamRes.headers.location, urlToFetch).toString();
              upstreamRes.resume();
              proxyStream(nextUrl, redirectsLeft - 1);
              return;
            }

            if (!res.headersSent) {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');

              const contentType = upstreamRes.headers['content-type'];
              if (contentType) {
                res.setHeader('Content-Type', contentType);
              } else {
                res.setHeader('Content-Type', 'audio/mpeg');
              }

              if (upstreamRes.headers['accept-ranges']) {
                res.setHeader('Accept-Ranges', upstreamRes.headers['accept-ranges']);
              }
              if (upstreamRes.headers['content-range']) {
                res.setHeader('Content-Range', upstreamRes.headers['content-range']);
              }

              res.status(statusCode);
            }

            upstreamRes.pipe(res);

            req.on('close', () => {
              upstreamRes.destroy();
              upstreamReq.destroy();
            });
          }
        );

        upstreamReq.on('error', (err) => {
          console.warn('Stream proxy upstream error:', err.message);
          if (!res.headersSent) {
            res.status(502).send('Upstream audio stream unreachable');
          } else {
            res.end();
          }
        });

        upstreamReq.on('timeout', () => {
          upstreamReq.destroy();
          if (!res.headersSent) {
            res.status(504).send('Upstream audio stream timeout');
          }
        });
      } catch (err) {
        if (!res.headersSent) {
          res.status(400).send('Malformed stream URL');
        }
      }
    };

    proxyStream(targetUrl);
  };

  app.options(['/api/stream-proxy', '/radio/api/stream-proxy'], (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin');
    res.sendStatus(204);
  });

  app.get(['/api/stream-proxy', '/radio/api/stream-proxy'], handleStreamProxy);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use((req, _res, next) => {
      if (req.url === '/' || req.url === '/index.html') {
        req.url = '/radio/';
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use('/radio/assets', express.static(path.join(distPath, 'assets')));
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use('/radio', express.static(distPath));
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AudioCar Radio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

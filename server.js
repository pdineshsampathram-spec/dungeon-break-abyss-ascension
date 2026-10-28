// =====================================================================
//  DUNGEON BREAK — Local Development Server with No-Cache Headers
// =====================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const BUILD_ID = Date.now().toString(36);

const server = http.createServer((req, res) => {
  let reqPath = '';
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    reqPath = req.url.split('?')[0];
  }

  if (req.method === 'POST' && reqPath === '/save_screenshot') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, dataUrl } = JSON.parse(body);
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const fname = path.basename(filename);
        const artifactDir = process.env.ARTIFACT_DIR || '/Users/ramteja/.gemini/antigravity-ide/brain/89b85ee7-f0de-452b-b3c4-c97818c8c865';
        try { fs.writeFileSync(path.join(artifactDir, fname), base64Data, 'base64'); } catch (e) {}
        fs.mkdirSync(path.join(__dirname, 'scratch'), { recursive: true });
        fs.writeFileSync(path.join(__dirname, 'scratch', fname), base64Data, 'base64');
        fs.mkdirSync(path.join(__dirname, 'screenshots'), { recursive: true });
        fs.writeFileSync(path.join(__dirname, 'screenshots', fname), base64Data, 'base64');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, saved: fname }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    // Strict No-Cache Headers so browsers never cache stale ES modules
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    };

    console.log(`[REQ] ${req.method} ${req.url} -> 200 (${contentType})`);

    // For JavaScript files, serve directly with strict no-cache headers
    if (ext === '.js') {
      fs.readFile(filePath, 'utf8', (readErr, content) => {
        if (readErr) {
          res.writeHead(500);
          res.end('Read Error');
          return;
        }
        res.writeHead(200, headers);
        res.end(content);
      });
      return;
    }

    // For HTML, dynamically update script and link tags with current BUILD_ID
    if (ext === '.html') {
      fs.readFile(filePath, 'utf8', (readErr, content) => {
        if (readErr) {
          res.writeHead(500);
          res.end('Read Error');
          return;
        }
        const rewritten = content
          .replace(/(href="css\/[^"]+\.css)(\?v=[^"]*)?"/g, `$1?b=${BUILD_ID}"`)
          .replace(/(src="\.\/js\/main\.js)(\?v=[^"]*)?"/g, `$1?b=${BUILD_ID}"`);
        res.writeHead(200, headers);
        res.end(rewritten);
      });
      return;
    }

    // Support HTTP Range requests for audio streaming (.mp3, .wav)
    const rangeHeader = req.headers.range;
    if (rangeHeader && (ext === '.mp3' || ext === '.wav')) {
      const totalSize = stats.size;
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
        res.end();
        return;
      }

      const chunksize = (end - start) + 1;
      const rangeHeaders = {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize
      };

      res.writeHead(206, rangeHeaders);
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
      return;
    }

    headers['Accept-Ranges'] = 'bytes';
    headers['Content-Length'] = stats.size;
    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Dungeon Break No-Cache Server running at http://localhost:${PORT}/`);
});

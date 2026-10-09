const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  // Normalize and decode URI
  let reqUrl = decodeURI(req.url.split('?')[0]);
  if (reqUrl === '/') reqUrl = '/index.html';
  if (reqUrl === '/favicon.ico') reqUrl = '/logo.png';

  const filePath = path.join(__dirname, reqUrl);

  // Security check
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
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const isImage = ext === '.png' || ext === '.jpg' || ext === '.jpeg';
    const cacheHeader = isImage ? 'public, max-age=86400' : 'no-cache, no-store, must-revalidate';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheHeader
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Arham Aurà Luxury Experience live at http://localhost:${PORT}`);
});

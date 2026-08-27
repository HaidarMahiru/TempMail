const http = require('http');
const fs = require('fs');
const path = require('path');
const TempMail = require('./mail.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Direct instance cache
let currentTempMail = null;

async function getTempMailInstance() {
  if (!currentTempMail || !currentTempMail.token) {
    currentTempMail = new TempMail();
    await currentTempMail.init();
  }
  return currentTempMail;
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // Handle CORS options preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- API Proxy Routes ---

  // GET /api/init -> Initialize token and fetch available domains
  if (pathname === '/api/init' && req.method === 'GET') {
    try {
      const mail = await getTempMailInstance();
      return sendJson(res, 200, {
        status: 'success',
        token: mail.token,
        domains: mail.domains
      });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  }

  // GET /api/create -> Create custom or random email
  if (pathname === '/api/create' && req.method === 'GET') {
    try {
      const mail = await getTempMailInstance();
      const customName = reqUrl.searchParams.get('name');
      const customDomain = reqUrl.searchParams.get('domain');

      const fullEmail = mail.setMail(customName, customDomain);
      return sendJson(res, 200, {
        status: 'success',
        email: fullEmail,
        username: mail.username,
        domain: mail.domain
      });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  }

  // GET /api/inbox -> Check inbox for an email address
  if (pathname === '/api/inbox' && req.method === 'GET') {
    try {
      const emailParam = reqUrl.searchParams.get('email');
      const mail = await getTempMailInstance();

      if (emailParam) {
        const parts = emailParam.split('@');
        mail.setMail(parts[0], parts[1]);
      } else if (!mail.username) {
        mail.setMail();
      }

      const messages = await mail.getInbox();
      return sendJson(res, 200, {
        status: 'success',
        email: mail.getEmail(),
        messages: messages || []
      });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  }

  // GET /api/message -> Fetch single message details
  if (pathname === '/api/message' && req.method === 'GET') {
    try {
      const emailParam = reqUrl.searchParams.get('email');
      const idParam = reqUrl.searchParams.get('id');

      if (!emailParam || !idParam) {
        return sendJson(res, 400, { status: 'error', message: 'Parameter email dan id diperlukan.' });
      }

      const mail = await getTempMailInstance();
      const parts = emailParam.split('@');
      mail.setMail(parts[0], parts[1]);

      const messageDetail = await mail.getMessage(idParam);
      return sendJson(res, 200, { status: 'success', message: messageDetail });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  }

  // GET /api/source -> Fetch message raw source (EML)
  if (pathname === '/api/source' && req.method === 'GET') {
    try {
      const emailParam = reqUrl.searchParams.get('email');
      const idParam = reqUrl.searchParams.get('id');

      if (!emailParam || !idParam) {
        return sendJson(res, 400, { status: 'error', message: 'Parameter email dan id diperlukan.' });
      }

      const mail = await getTempMailInstance();
      const parts = emailParam.split('@');
      mail.setMail(parts[0], parts[1]);

      const sourceText = await mail.getMessageSource(idParam);
      return sendJson(res, 200, { status: 'success', source: sourceText });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  }

  // DELETE /api/message -> Delete a specific message
  if (pathname === '/api/message' && req.method === 'DELETE') {
    try {
      const emailParam = reqUrl.searchParams.get('email');
      const idParam = reqUrl.searchParams.get('id');

      if (!emailParam || !idParam) {
        return sendJson(res, 400, { status: 'error', message: 'Parameter email dan id diperlukan.' });
      }

      const mail = await getTempMailInstance();
      const parts = emailParam.split('@');
      mail.setMail(parts[0], parts[1]);

      await mail.deleteMessage(idParam);
      return sendJson(res, 200, { status: 'success', message: 'Pesan berhasil dihapus.' });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  }

  // DELETE /api/inbox -> Purge all messages in inbox
  if (pathname === '/api/inbox' && req.method === 'DELETE') {
    try {
      const emailParam = reqUrl.searchParams.get('email');
      if (!emailParam) {
        return sendJson(res, 400, { status: 'error', message: 'Parameter email diperlukan.' });
      }

      const mail = await getTempMailInstance();
      const parts = emailParam.split('@');
      mail.setMail(parts[0], parts[1]);

      await mail.purgeInbox();
      return sendJson(res, 200, { status: 'success', message: 'Inbox berhasil dibersihkan.' });
    } catch (err) {
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  }

  // --- SEO & Robots / Sitemap Routes ---
  if (pathname === '/robots.txt' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: http://${req.headers.host || 'localhost:3000'}/sitemap.xml\n`);
  }

  if (pathname === '/sitemap.xml' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>http://${req.headers.host || 'localhost:3000'}/</loc>\n    <changefreq>always</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`);
  }

  if (pathname === '/favicon.ico' && req.method === 'GET') {
    const faviconPath = path.join(PUBLIC_DIR, 'favicon.svg');
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    return fs.createReadStream(faviconPath).pipe(res);
  }

  // --- Static Files & SPA Routing ---
  const ext = path.extname(pathname).toLowerCase();

  if (ext && MIME_TYPES[ext]) {
    // Serve actual static assets (style.css, app.js, logo.svg, etc.) regardless of URL prefix
    const baseName = path.basename(pathname);
    const staticFilePath = path.join(PUBLIC_DIR, baseName);

    fs.stat(staticFilePath, (err, stats) => {
      if (!err && stats.isFile()) {
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] });
        return fs.createReadStream(staticFilePath).pipe(res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    });
    return;
  }

  // SPA HTML Route Fallback (e.g. /, /email/haidarapis-399@anogz.com)
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(` 🚀 TEMPMAIL SOFT NEOBRUTALISM WEB SERVER READY!  `);
    console.log(` 🌐 Server URL : http://localhost:${port}`);
    console.log(`==================================================\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = (parseInt(PORT) || 3000) + 1;
    console.log(`[!] Port ${PORT} busy, retrying on port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);


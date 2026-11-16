require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const net = require('net');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Base de datos temporal en memoria
const shortUrls = new Map();
let nextId = 1;

// Página principal
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Registrar una URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  if (!originalUrl || typeof originalUrl !== 'string') {
    return res.json({ error: 'invalid url' });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl.trim());
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  if (
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    (!parsedUrl.hostname.includes('.') && !net.isIP(parsedUrl.hostname))
  ) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, function(err) {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const id = nextId++;

    shortUrls.set(id, originalUrl.trim());

    res.json({
      original_url: originalUrl.trim(),
      short_url: id
    });
  });
});

// Redireccionar usando el número corto
app.get('/api/shorturl/:short_url', function(req, res) {
  const id = Number(req.params.short_url);
  const originalUrl = shortUrls.get(id);

  if (!originalUrl) {
    return res.status(404).json({ error: 'No short URL found' });
  }

  res.redirect(originalUrl);
});

// Iniciar servidor
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

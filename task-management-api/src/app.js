const path = require('path');
const express = require('express');
const { nodeEnv } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '100kb' }));

// small request logger (not used while testing)
if (nodeEnv !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(req.method + ' ' + req.originalUrl + ' ' + res.statusCode + ' ' + (Date.now() - start) + 'ms');
    });
    next();
  });
}

app.use(express.static(path.join(__dirname, '..', 'public'))); // the web page
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
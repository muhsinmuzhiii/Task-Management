const app = require('./app');
const { port, nodeEnv } = require('./config/env');

const server = app.listen(port, () => {
  console.log('Task Management API running on http://localhost:' + port + ' (' + nodeEnv + ')');
});

// stop the server nicely on Ctrl + C
function shutdown() {
  console.log('Stopping server...');
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
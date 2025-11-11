// server.js
// Simple WebSocket server implementing the commands used by the UI.
// Run: node server.js

const WebSocket = require('ws');

const PORT = 5566;

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});

// in-memory file store (shared across clients)
const fileSystem = {
  'readme.txt': 'Welcome to TCP Server!\nThis is a test file.',
  'config.ini': '[Settings]\nport=5566\nip=127.0.0.1',
  'data.txt': 'Sample data file content'
};

let serverStart = Date.now();

function parseCommand(message) {
  if (!message) return null;
  const tokens = message.toString().trim().split(' ');
  const cmd = tokens[0].toUpperCase();
  const args = tokens.slice(1);
  return { cmd, args };
}

wss.on('connection', function connection(ws, req) {
  console.log('Client connected:', req.socket.remoteAddress);
  ws.send('WELCOME: Connected to TCP Server Pro');

  ws.on('message', function incoming(message) {
    console.log('received:', message.toString());
    const parsed = parseCommand(message);
    if (!parsed) { ws.send('ERROR: invalid command'); return; }

    const { cmd, args } = parsed;
    switch (cmd) {
      case 'TIME': {
        const now = new Date();
        ws.send(`${now.toISOString().slice(0,10)} ${now.toLocaleTimeString()}`);
        break;
      }
      case 'ECHO': {
        ws.send(args.join(' '));
        break;
      }
      case 'LIST': {
        ws.send('📁 Directory listing:');
        Object.keys(fileSystem).forEach(f => ws.send(`  📄 ${f}`));
        break;
      }
      case 'READ': {
        const name = args[0];
        if (!name) { ws.send('ERROR: READ needs filename'); }
        else if (fileSystem[name] === undefined) ws.send(`ERROR: File '${name}' not found`);
        else {
          ws.send(`📖 ${name}:`);
          ws.send(fileSystem[name]);
        }
        break;
      }
      case 'CREATE': {
        const name = args[0];
        if (!name) { ws.send('ERROR: CREATE needs filename'); }
        else if (fileSystem[name] !== undefined) ws.send(`ERROR: File '${name}' already exists`);
        else {
          fileSystem[name] = '';
          ws.send(`OK: Created ${name}`);
        }
        break;
      }
      case 'WRITE': {
        const name = args[0];
        const content = args.slice(1).join(' ');
        if (!name) { ws.send('ERROR: WRITE needs filename and content'); }
        else {
          fileSystem[name] = content;
          ws.send(`OK: Written to ${name}`);
        }
        break;
      }
      case 'APPEND': {
        const name = args[0];
        const content = args.slice(1).join(' ');
        if (!name) { ws.send('ERROR: APPEND needs filename and content'); }
        else {
          fileSystem[name] = (fileSystem[name] || '') + content;
          ws.send(`OK: Appended to ${name}`);
        }
        break;
      }
      case 'DELETE': {
        const name = args[0];
        if (!name) { ws.send('ERROR: DELETE needs filename'); }
        else if (fileSystem[name] === undefined) ws.send(`ERROR: '${name}' not found`);
        else {
          delete fileSystem[name];
          ws.send(`OK: Deleted ${name}`);
        }
        break;
      }
      case 'STATS': {
        ws.send(`Commands handled: ${/* not tracked per-client */ 'N/A'}`);
        ws.send(`Files: ${Object.keys(fileSystem).length}`);
        ws.send(`Server uptime (s): ${Math.floor((Date.now()-serverStart)/1000)}`);
        break;
      }
      case 'UPTIME': {
        ws.send(`Server uptime (s): ${Math.floor((Date.now()-serverStart)/1000)}`);
        break;
      }
      default:
        ws.send(`ERROR: Unknown command '${cmd}'`);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

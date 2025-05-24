const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// --- Constants ---
const PORTS = {
  TCP: 4001,
  UDP: 4002,
  AUCTION: 4003,
  CHAT: 4004,
};
const resources = ['Orium', 'Fuelium', 'Cractonium', 'Elizabentite'];
const prices = { Orium: 100, Fuelium: 200, Cractonium: 250, Elizabentite: 600 };
const events = [];
const sessions = new Map();

/**
 * Безопасно парсит JSON
 * @param {string} str
 * @returns {object|null}
 */
function safeJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Отправляет сообщение клиенту
 * @param {WebSocket} ws
 * @param {object} data
 */
function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * Широковещательная отправка
 * @param {Set<WebSocket>} clients
 * @param {object} data
 */
function broadcast(clients, data) {
  for (const client of clients) {
    send(client, data);
  }
}

// --- TCP-эмуляция (регистрация кораблей) ---
const tcpWss = new WebSocket.Server({ port: PORTS.TCP });
tcpWss.on('connection', (ws) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, ws);
  send(ws, { type: 'session', sessionId });

  ws.on('message', (message) => {
    const data = safeJSON(message.toString());
    if (!data || typeof data.message !== 'string') {
      send(ws, { type: 'error', message: 'Invalid message format' });
      return;
    }
    send(ws, { type: 'response', message: `Received: ${data.message}` });
  });

  ws.on('close', () => {
    sessions.delete(sessionId);
  });
});
console.log(`TCP-emulated WebSocket server on port ${PORTS.TCP}`);

// --- UDP-эмуляция (потоковая передача цен) ---
const udpWss = new WebSocket.Server({ port: PORTS.UDP });
udpWss.on('connection', (ws) => {
  send(ws, { type: 'prices', prices });
});
setInterval(() => {
  resources.forEach((resource) => {
    prices[resource] = Math.max(50, prices[resource] + (Math.random() * 20 - 10));
  });
  broadcast(udpWss.clients, { type: 'prices', prices });
}, 1000);
console.log(`UDP-emulated WebSocket server on port ${PORTS.UDP}`);

// --- Аукционные события ---
const wss = new WebSocket.Server({ port: PORTS.AUCTION });
wss.on('connection', (ws) => {
  send(ws, { type: 'welcome', message: '[Connected to Cosmic Exchange]' });
});
function scheduleAuctionEvent() {
  const timeout = Math.random() * 30000 + 30000; // 30 сек - 1 мин
  setTimeout(() => {
    const event = {
      type: 'artifact',
      message: `Artifact "Heart of star ${Math.random().toString(36).substring(3).toUpperCase()}" appeared!`,
      timestamp: new Date(),
    };
    events.push(event);
    broadcast(wss.clients, event);
    scheduleAuctionEvent();
  }, timeout);
}
scheduleAuctionEvent();
console.log(`WebSocket server on port ${PORTS.AUCTION}`);

// --- Чат ---
const chatWss = new WebSocket.Server({ port: PORTS.CHAT });
chatWss.on('connection', (ws) => {
  send(ws, { type: 'chat', message: '[Connected to chat]' });

  ws.on('message', (message) => {
    const data = safeJSON(message.toString());
    if (!data || typeof data.message !== 'string') {
      send(ws, { type: 'error', message: 'Invalid chat message' });
      return;
    }
    console.log(`Chat: ${data.message}`);
    broadcast(chatWss.clients, { type: 'chat', message: data.message });
  });

  ws.on('close', () => {
    console.log('Chat client disconnected');
  });
});
console.log(`Chat WebSocket server on port ${PORTS.CHAT}`);
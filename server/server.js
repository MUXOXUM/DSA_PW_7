const WebSocket = require('ws');

// Хранилище сессий и данных
const sessions = new Map();
const resources = ['Ore', 'Fuel', 'Crystals'];
const prices = { Ore: 100, Fuel: 200, Crystals: 300 };
const events = [];

// WebSocket сервер для TCP-эмуляции (регистрация кораблей, порт 4001)
const tcpWss = new WebSocket.Server({ port: 4001 });
tcpWss.on('connection', (ws) => {
  const sessionId = Math.random().toString(36).substring(2);
  sessions.set(sessionId, ws);
  ws.send(JSON.stringify({ type: 'session', sessionId }));

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    ws.send(JSON.stringify({ type: 'response', message: `Received: ${data.message}` }));
  });

  ws.on('close', () => {
    sessions.delete(sessionId);
  });
});
console.log('TCP-emulated WebSocket server on port 4001');

// WebSocket сервер для UDP-эмуляции (потоковая передача цен, порт 4002)
const udpWss = new WebSocket.Server({ port: 4002 });
udpWss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'prices', prices }));
});
setInterval(() => {
  resources.forEach((resource) => {
    prices[resource] = Math.max(50, prices[resource] + (Math.random() * 20 - 10));
  });
  udpWss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'prices', prices }));
    }
  });
}, 1000);
console.log('UDP-emulated WebSocket server on port 4002');

// WebSocket сервер для аукционных событий (порт 4003)
const wss = new WebSocket.Server({ port: 4003 });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Cosmic Exchange' }));
});
setInterval(() => {
  const event = {
    type: 'artifact',
    message: `Unique artifact "${Math.random().toString(36).substring(7)}" appeared!`,
    timestamp: new Date(),
  };
  events.push(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
}, Math.random() * 240000 + 60000); // 1-5 минут
console.log('WebSocket server on port 4003');

// WebSocket сервер для чата (порт 4004)
const chatWss = new WebSocket.Server({ port: 4004 });
chatWss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'chat', message: 'Connected to chat' }));

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    console.log(`Chat: ${data.message}`);
    // Рассылаем сообщение всем клиентам
    chatWss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'chat', message: data.message }));
      }
    });
  });

  ws.on('close', () => {
    console.log('Chat client disconnected');
  });
});
console.log('Chat WebSocket server on port 4004');
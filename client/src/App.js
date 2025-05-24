import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [servers, setServers] = useState([{ ip: 'localhost', port: 4001 }]);
  const [sessionId, setSessionId] = useState('');
  const [prices, setPrices] = useState({});
  const [events, setEvents] = useState([]);
  const [newServer, setNewServer] = useState({ ip: '', port: '' });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatWs, setChatWs] = useState(null);

  // TCP-эмуляция через WebSocket
  const connectTCP = (ip, port) => {
    const ws = new WebSocket(`ws://${ip}:${port}`);
    ws.onopen = () => {
      console.log('Connected to TCP-emulated server');
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'session') {
        setSessionId(data.sessionId);
      }
    };
    ws.onclose = () => {
      console.log('TCP-emulated disconnected');
    };
  };

  // UDP-эмуляция через WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4002');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'prices') {
        setPrices(data.prices);
      }
    };
    return () => ws.close();
  }, []);

  // WebSocket для аукционных событий
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4003');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [...prev.slice(-10), data]);
    };
    return () => ws.close();
  }, []);

  // WebSocket для чата
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4004');
    setChatWs(ws);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        setChatMessages((prev) => [...prev.slice(-20), data.message]);
      }
    };
    return () => ws.close();
  }, []);

  // Функция для добавления нового сервера
  const addServer = () => {
    if (newServer.ip && newServer.port) {
      setServers([...servers, { ...newServer }]);
      setNewServer({ ip: '', port: '' }); // Сброс значений после добавления
    }
  };

  // Функция для удаления сервера
  const removeServer = (index) => {
    setServers(servers.filter((_, i) => i !== index));
  };

  // Отправка сообщения в чат
  const sendChatMessage = () => {
    if (chatWs && chatInput.trim()) {
      chatWs.send(JSON.stringify({ type: 'chat', message: `User: ${chatInput}` }));
      setChatInput('');
    }
  };

  return (
    <div className="App">
      <h1>Cosmic Exchange</h1>
      <div className="server-management">
        <h2>Manage Servers</h2>
        <input
          placeholder="IP"
          value={newServer.ip}
          onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
        />
        <input
          placeholder="Port"
          value={newServer.port}
          onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
        />
        <button onClick={addServer}>Add Server</button>
        <ul>
          {servers.map((server, index) => (
            <li key={index}>
              {server.ip}:{server.port}
              <button onClick={() => connectTCP(server.ip, server.port)}>Connect</button>
              <button onClick={() => removeServer(index)}>Remove</button>
            </li>
          ))}
        </ul>
        {sessionId && <p>Session ID: {sessionId}</p>}
      </div>
      <div className="market-data">
        <h2>Resource Prices</h2>
        <ul>
          {Object.entries(prices).map(([resource, price]) => (
            <li key={resource}>{resource}: {price.toFixed(2)}</li>
          ))}
        </ul>
      </div>
      <div className="events">
        <h2>Auction Events</h2>
        <ul>
          {events.map((event, index) => (
            <li key={index}>
              {event.timestamp ? event.timestamp.toLocaleString() : ''}: {event.message}
            </li>
          ))}
        </ul>
      </div>
      <div className="chat">
        <h2>Chat with Admin</h2>
        <div className="chat-messages">
          {chatMessages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
        <input
          placeholder="Type your message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
        />
        <button onClick={sendChatMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
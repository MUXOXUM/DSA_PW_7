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
  
    ws.onopen = () => {
      console.log('WebSocket connected (ws://localhost:4003)');
    };
  
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((prevEvents) => {
          // Обрезаем до 10 последних элементов, включая новый
          const newEvents = [...prevEvents, data];
          return newEvents.slice(-10);
        });
      } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
      }
    };
  
    ws.onclose = (event) => {
      console.log(`WebSocket закрыт (код: ${event.code})`);
    };
  
    return () => {
      ws.close();
      console.log('WebSocket закрыт вручную');
    };
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
      <h1>Космическая биржа</h1>
      <div className="columns-container">
        <div className="left-column">
          <div className="server-management">
            <h2>Управление серверами</h2>
            <input
              placeholder="IP-адрес"
              value={newServer.ip}
              onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
            />
            <input
              placeholder="Порт"
              value={newServer.port}
              onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
            />
            <button onClick={addServer}>Добавить сервер</button>
            <ul>
              {servers.map((server, index) => (
                <li key={index}>
                  {server.ip}:{server.port}
                  <button onClick={() => connectTCP(server.ip, server.port)}>Подключиться</button>
                  <button onClick={() => removeServer(index)}>Удалить</button>
                </li>
              ))}
            </ul>
            {sessionId && <p>ID сессии: {sessionId}</p>}
          </div>
          <div className="chat">
            <h2>Чат с администратором</h2>
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <p key={index}>{message}</p>
              ))}
            </div>
            <input
              placeholder="Введите сообщение..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <button onClick={sendChatMessage}>Отправить</button>
          </div>
        </div>
        <div className="right-column">
          <div className="market-data">
            <h2>Цены на ресурсы</h2>
            <ul>
              {Object.entries(prices).map(([resource, price]) => (
                <li key={resource}>{resource}: {price != null ? price.toFixed(2) : '—'}</li>
              ))}
            </ul>
          </div>
          <div className="events">
            <h2>События аукциона</h2>
            <ul>
              {events.map((event, index) => (
                <li key={index}>
                  {event.timestamp ? event.timestamp.toLocaleString() : ''}: {event.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
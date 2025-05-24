import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatWs, setChatWs] = useState(null);

  // Подключение к чату через WebSocket
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

  // Отправка сообщения
  const sendChatMessage = () => {
    if (chatWs && chatInput.trim()) {
      chatWs.send(JSON.stringify({ type: 'chat', message: `Admin: ${chatInput}` }));
      setChatInput('');
    }
  };

  return (
    <div className="App">
      <h1>Cosmic Exchange Admin Panel</h1>
      <div className="chat">
        <h2>Chat with Users</h2>
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
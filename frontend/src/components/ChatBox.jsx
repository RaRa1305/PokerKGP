import React, { useState, useEffect, useRef } from 'react';

const ChatBox = ({ socket, tableId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to the newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on('RECEIVE_CHAT', handleNewMessage);
    return () => socket.off('RECEIVE_CHAT', handleNewMessage);
  }, [socket]);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    socket.emit('SEND_CHAT', { 
      tableId, 
      username: currentUser.username, 
      message: input, 
      isEmote: false 
    });
    setInput('');
  };

  const sendEmote = (emote) => {
    socket.emit('SEND_CHAT', { 
      tableId, 
      username: currentUser.username, 
      message: emote, 
      isEmote: true 
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '300px', width: '300px', background: 'rgba(25, 25, 25, 0.8)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
      
      {/* Message History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ fontSize: '0.9rem' }}>
            <span style={{ color: '#888', fontSize: '0.75rem', marginRight: '5px' }}>[{msg.timestamp}]</span>
            <span style={{ color: msg.username === currentUser.username ? '#4caf50' : '#ffcc00', fontWeight: 'bold' }}>
              {msg.username}: 
            </span>
            {msg.isEmote ? (
              <span style={{ fontSize: '1.5rem', marginLeft: '5px' }}>{msg.message}</span>
            ) : (
              <span style={{ color: '#fff', marginLeft: '5px' }}>{msg.message}</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Emote Quick-Bar */}
      <div style={{ display: 'flex', gap: '10px', padding: '5px 10px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        <button onClick={() => sendEmote('🔥')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🔥</button>
        <button onClick={() => sendEmote('💀')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>💀</button>
        <button onClick={() => sendEmote('😎')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>😎</button>
        <button onClick={() => sendEmote('🤬')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🤬</button>
      </div>

      {/* Text Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Trash talk here..." 
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '4px' }}
        />
        <button type="submit" style={{ marginLeft: '5px', background: '#4caf50', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
      </form>

    </div>
  );
};

export default ChatBox;
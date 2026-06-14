import React, { useState, useEffect, useRef } from 'react';

const ChatBox = ({ socket, tableId, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false); // NEW: Toggle state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]); // Scroll when opened or new message arrives

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (data) => setMessages((prev) => [...prev, data]);
    socket.on('RECEIVE_CHAT', handleNewMessage);
    return () => socket.off('RECEIVE_CHAT', handleNewMessage);
  }, [socket]);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    socket.emit('SEND_CHAT', { tableId, username: currentUser.username, message: input, isEmote: false });
    setInput('');
  };

  const sendEmote = (emote) => {
    socket.emit('SEND_CHAT', { tableId, username: currentUser.username, message: emote, isEmote: true });
  };

  // --- MINIMIZED STATE ---
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ background: 'rgba(25, 25, 25, 0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '50px', height: '50px', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        💬
      </button>
    );
  }

  // --- MAXIMIZED STATE ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '280px', width: '260px', background: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(4px)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', position: 'relative' }}>
      
      {/* Close Button */}
      <button 
        onClick={() => setIsOpen(false)} 
        style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#e91e63', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', zIndex: 10, fontWeight: 'bold' }}
      >
        ✕
      </button>

      {/* Message History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ fontSize: '0.85rem' }}>
            <span style={{ color: '#888', fontSize: '0.7rem', marginRight: '5px' }}>[{msg.timestamp}]</span>
            <span style={{ color: msg.username === currentUser.username ? '#4caf50' : '#ffcc00', fontWeight: 'bold' }}>{msg.username}: </span>
            {msg.isEmote ? <span style={{ fontSize: '1.2rem', marginLeft: '5px' }}>{msg.message}</span> : <span style={{ color: '#fff', marginLeft: '5px' }}>{msg.message}</span>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Emote Quick-Bar */}
      <div style={{ display: 'flex', gap: '10px', padding: '5px 10px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        {['🔥', '💀', '😎', '🤬'].map(emote => (
          <button key={emote} onClick={() => sendEmote(emote)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>{emote}</button>
        ))}
      </div>

      {/* Text Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Trash talk..." style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem' }} />
        <button type="submit" style={{ marginLeft: '5px', background: '#4caf50', color: '#fff', border: 'none', padding: '0 10px', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
      </form>
    </div>
  );
};

export default ChatBox;
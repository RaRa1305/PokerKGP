import React, { useState } from 'react';
import axios from 'axios';

const Lobby = ({ currentUser, handleLoginSuccess, handleLogout, handleJoin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
        const res = await axios.post(`http://localhost:3000${endpoint}`, { username, password });
        const { token, ...userData } = res.data;
        handleLoginSuccess(userData, token);
    } catch (err) {
        setAuthError(err.response?.data?.message || 'Authentication failed');
    }
  };

  if (!currentUser) {
    return (
      <div className="app-container lobby-wrapper">
        <div className="lobby-card">
          <h1 className="lobby-title">Poker Room</h1>
          <p style={{ color: '#aaa', marginBottom: '2rem' }}>{isRegistering ? 'Create an account to play.' : 'Login to your account.'}</p>
          {authError && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{authError}</div>}
          <form onSubmit={handleAuth} className="auth-form">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="casino-input" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="casino-input" required />
            <button type="submit" className="casino-btn">{isRegistering ? 'REGISTER' : 'LOGIN'}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}>
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container lobby-wrapper">
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span>{currentUser.username} | Bankroll: ${currentUser.chips}</span>
        <button onClick={handleLogout} className="action-btn btn-fold" style={{ padding: '0.5rem 1rem' }}>LOGOUT</button>
      </div>
      <div className="lobby-card">
        <h1 className="lobby-title">Poker Room</h1>
        <p style={{ color: '#aaa', marginBottom: '2rem' }}>Enter a Room ID to join or create a table.</p>
        <form onSubmit={(e) => handleJoin(e, roomInput)} className="auth-form">
          <input type="text" placeholder="Room ID (e.g. HIGHROLLER)" value={roomInput} onChange={(e) => setRoomInput(e.target.value.toUpperCase())} className="casino-input" style={{ textTransform: 'uppercase' }} required />
          <button type="submit" className="casino-btn">JOIN TABLE</button>
        </form>
      </div>
    </div>
  );
};

export default Lobby;
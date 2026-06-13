import React, { useState } from 'react';

const Account = ({ currentUser, handleLogout, handleJoin }) => {
  const [roomInput, setRoomInput] = useState('');

  return (
    <div className="app-container lobby-wrapper">
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '15px' }}>
        <button onClick={handleLogout} className="action-btn btn-fold" style={{ padding: '0.5rem 1rem' }}>
          LOGOUT
        </button>
      </div>

      <div className="lobby-card" style={{ maxWidth: '600px', width: '100%' }}>
        <h2 style={{ color: '#ffcc00', marginBottom: '10px' }}>Welcome, {currentUser.username}</h2>
        
        {/* Bankroll Dashboard */}
        <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center' }}>
          <p style={{ color: '#aaa', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Current Bankroll</p>
          <h1 style={{ color: '#4caf50', margin: '0', fontSize: '3rem' }}>${currentUser.chips}</h1>
        </div>

        {/* Room Joiner */}
        <div style={{ background: '#333', padding: '20px', borderRadius: '8px' }}>
          <p style={{ color: '#aaa', marginBottom: '15px' }}>Join an existing table or create a new one.</p>
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text" 
              placeholder="Room ID" 
              value={roomInput} 
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())} 
              className="casino-input" 
              required 
            />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={(e) => handleJoin(e, roomInput, 'join')} className="casino-btn" style={{ flex: 1 }}>
                JOIN SEAT
              </button>
              <button onClick={(e) => handleJoin(e, roomInput, 'spectate')} className="casino-btn" style={{ flex: 1, backgroundColor: '#555' }}>
                SPECTATE
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Account;
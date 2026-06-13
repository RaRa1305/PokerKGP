import React, { useState, useEffect } from 'react';

const Account = ({ currentUser, setCurrentUser, handleLogout, handleJoin, socket }) => {
  const [roomInput, setRoomInput] = useState('');

  useEffect(() => {
    if (!socket) return;
    
    const handleBankrollUpdate = ({ newBalance }) => {
      const updatedUser = { ...currentUser, chips: newBalance };
      localStorage.setItem('poker_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    };

    socket.on('BANKROLL_UPDATED', handleBankrollUpdate);

    return () => {
      socket.off('BANKROLL_UPDATED', handleBankrollUpdate);
    };
  }, [socket, currentUser, setCurrentUser]);

  const handleReload = () => {
    if (socket && currentUser) {
      socket.emit('RELOAD_BANKROLL', { userId: currentUser._id });
    }
  };

  return (
    <div className="app-container lobby-wrapper">
      {/* Top Right Logout Button */}
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
          
          {/* Show a reload button if they drop below $100 */}
          {currentUser.chips < 100 && (
            <button 
              onClick={handleReload} 
              className="action-btn btn-call" 
              style={{ marginTop: '15px', padding: '0.5rem 2rem' }}
            >
              CLAIM 1,000 FREE CHIPS
            </button>
          )}
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
              <button 
                onClick={(e) => handleJoin(e, roomInput, 'join')} 
                className="casino-btn" 
                style={{ flex: 1 }}
              >
                JOIN SEAT
              </button>
              <button 
                onClick={(e) => handleJoin(e, roomInput, 'spectate')} 
                className="casino-btn" 
                style={{ flex: 1, backgroundColor: '#555' }}
              >
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
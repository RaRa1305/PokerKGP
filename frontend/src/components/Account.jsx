import React, { useState, useEffect } from 'react';

const Account = ({ currentUser, setCurrentUser, handleLogout, handleJoin, socket }) => {
  const [roomInput, setRoomInput] = useState('');

  // Listen for the updated bankroll from the server
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

      <div style={{ maxWidth: '1000px', width: '100%', marginTop: '40px', marginLeft: '5%', marginRight: 'auto' }}>
        <h2 style={{ color: '#ffcc00', marginBottom: '20px', textAlign: 'center', fontSize: '2rem' }}>
          Welcome, {currentUser.username}
        </h2>
        
        {/* TWO-COLUMN LAYOUT CONTAINER */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* LEFT COLUMN: Bankroll & Room Joiner */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Bankroll Box */}
            <div className="lobby-card" style={{ background: '#222', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#aaa', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Bankroll</p>
              <h1 style={{ color: '#4caf50', margin: '0', fontSize: '3.5rem' }}>${currentUser.chips}</h1>
              
              {currentUser.chips < 500 && (
                <button 
                  onClick={handleReload} 
                  className="action-btn btn-call" 
                  style={{ marginTop: '20px', padding: '0.8rem 2rem', width: '100%' }}
                >
                  CLAIM $1,000 FREE CHIPS
                </button>
              )}
            </div>

            {/* Room Joiner Box */}
            <div className="lobby-card" style={{ background: '#333', padding: '30px', borderRadius: '8px' }}>
              <p style={{ color: '#aaa', marginBottom: '15px', textAlign: 'center' }}>Join an existing table or create a new one.</p>
              <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="text" 
                  placeholder="Room ID" 
                  value={roomInput} 
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())} 
                  className="casino-input" 
                  style={{ marginBottom: '15px' }}
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

          {/* RIGHT COLUMN: Lifetime Statistics */}
          <div style={{ flex: '1 1 400px' }}>
            <div className="lobby-card" style={{ background: '#2a2a2a', padding: '30px', borderRadius: '8px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: '#aaa', margin: '0 0 30px 0', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '2px' }}>
                Career Statistics
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* Stat Row 1 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #444' }}>
                  <span style={{ color: '#888', fontSize: '1.2rem' }}>Hands Played</span>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {currentUser.stats?.handsPlayed || 0}
                  </span>
                </div>
                
                {/* Stat Row 2 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #444' }}>
                  <span style={{ color: '#888', fontSize: '1.2rem' }}>Pots Won</span>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {currentUser.stats?.potsWon || 0}
                  </span>
                </div>
                
                {/* Stat Row 3 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: '1.2rem' }}>Biggest Pot Won</span>
                  <span style={{ color: '#ffcc00', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    ${currentUser.stats?.biggestPotWon || 0}
                  </span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Account;
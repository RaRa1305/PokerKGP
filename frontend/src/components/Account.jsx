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
    <div 
      className="app-container lobby-wrapper" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '20px' // Adds a little breathing room on smaller screens
      }}
    >
      {/* Centered Main Container */}
      <div style={{ maxWidth: '900px', width: '100%' }}> 
        <h2 style={{ color: '#ffcc00', marginBottom: '30px', textAlign: 'center', fontSize: '2.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          Welcome, {currentUser.username}
        </h2>
        
        {/* TWO-COLUMN LAYOUT CONTAINER */}
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* LEFT COLUMN: Bankroll & Room Joiner */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Bankroll Box - GLASS EFFECT */}
            <div className="lobby-card" style={{ background: 'rgba(25, 25, 25, 0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: '#bbb', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>Current Bankroll</p>
              <h1 style={{ color: '#4caf50', margin: '0', fontSize: '3.5rem', textShadow: '0px 0px 10px rgba(76, 175, 80, 0.3)' }}>₹{currentUser.chips}</h1>
              
              {currentUser.chips < 500 && (
                <button 
                  onClick={handleReload} 
                  className="action-btn btn-call" 
                  style={{ marginTop: '20px', padding: '0.8rem 2rem', width: '100%', borderRadius: '8px' }}
                >
                  CLAIM ₹1,000 FREE CHIPS
                </button>
              )}
            </div>

            {/* Room Joiner Box - GLASS EFFECT */}
            <div className="lobby-card" style={{ background: 'rgba(25, 25, 25, 0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '12px' }}>
              <p style={{ color: '#bbb', marginBottom: '20px', textAlign: 'center', fontSize: '0.95rem' }}>Join an existing table or create a new one.</p>
              <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="text" 
                  placeholder="Room ID" 
                  value={roomInput} 
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())} 
                  className="casino-input" 
                  style={{ marginBottom: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid #444', color: '#fff' }}
                  required 
                />
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button 
                    onClick={(e) => handleJoin(e, roomInput, 'join')} 
                    className="casino-btn" 
                    style={{ flex: 1, borderRadius: '6px' }}
                  >
                    JOIN SEAT
                  </button>
                  <button 
                    onClick={(e) => handleJoin(e, roomInput, 'spectate')} 
                    className="casino-btn" 
                    style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}
                  >
                    SPECTATE
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Lifetime Statistics */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Stats Box - GLASS EFFECT & FLEX GROW */}
            <div className="lobby-card" style={{ flex: 1, background: 'rgba(25, 25, 25, 0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px 30px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: '#bbb', margin: '0 0 40px 0', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '3px', fontSize: '1rem' }}>
                Career Statistics
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: '#999', fontSize: '1.1rem' }}>Hands Played</span>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {currentUser.stats?.handsPlayed || 0}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: '#999', fontSize: '1.1rem' }}>Pots Won</span>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {currentUser.stats?.potsWon || 0}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#999', fontSize: '1.1rem' }}>Biggest Pot Won</span>
                  <span style={{ color: '#ffcc00', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0px 0px 8px rgba(255, 204, 0, 0.3)' }}>
                    ₹{currentUser.stats?.biggestPotWon || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON - Centered at the bottom */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <button 
            onClick={handleLogout} 
            className="action-btn btn-fold" 
            style={{ padding: '0.8rem 3rem', fontSize: '1.1rem', borderRadius: '8px', letterSpacing: '1px' }}
          >
            LOGOUT
          </button>
        </div>

      </div>
    </div>
  );
};

export default Account;
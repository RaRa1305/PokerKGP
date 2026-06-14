import React from 'react';
import PlayingCard from './PlayingCard';

const ActionTray = ({ myCards, isMyTurn, currentBet, betAmount, setBetAmount, amountToCall, myChips, sendAction }) => {
  return (
    <div className="action-tray">
      {myCards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#ffcc00', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>
            Your Hand
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {myCards.map((card, idx) => (
              <div key={idx} style={{ transform: 'scale(0.9)', transformOrigin: 'bottom' }}> 
                <PlayingCard index={idx} cardString={card} />
              </div>
            ))}
          </div>
        </div>
      )}

      {isMyTurn && (
        <div className="action-controls">
          <div style={{ marginBottom: '15px', color: 'white', fontWeight: 'bold' }}>
            <label style={{ fontSize: '1.2rem', marginRight: '10px', color: '#ffcc00' }}>
              {currentBet === 0 ? 'Bet Amount: ₹' : 'Raise To: ₹'}
            </label>
            <input 
              type="number" 
              value={betAmount} 
              min={currentBet > 0 ? currentBet : 0} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="casino-input"
              style={{ width: '100px', padding: '0.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => sendAction('fold', 0)} className="action-btn btn-fold">
              FOLD
            </button>
            <button onClick={() => sendAction('call', 0)} className={`action-btn ${amountToCall >= myChips ? 'btn-allin' : 'btn-call'}`}>
              {amountToCall >= myChips ? `ALL IN (₹${myChips})` : (amountToCall > 0 ? `CALL ₹${amountToCall}` : 'CHECK')}
            </button>
            <button 
              disabled={currentBet > 0 && betAmount <= currentBet} 
              onClick={() => sendAction('raise', betAmount)} 
              className={`action-btn ${betAmount >= myChips ? 'btn-allin' : ((currentBet > 0 && betAmount <= currentBet) ? 'btn-disabled' : 'btn-raise')}`}
            >
              {betAmount >= myChips ? 'SHOVE ALL IN' : (currentBet === 0 ? `BET ₹${betAmount}` : `RAISE TO ₹${betAmount}`)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionTray;
import React from 'react';
import PlayingCard from './PlayingCard';

const PlayerSeat = ({ player, index, uiIndex, totalPlayers, isTheirTurn, isDealer, hasCards, socketId, myCards, spectatorCards }) => {
  // Radial Math
  const activeIndex = uiIndex !== undefined ? uiIndex : index;
  const angle = (activeIndex / totalPlayers) * (2 * Math.PI) + (Math.PI / 2);
  const radiusX = 460; 
  const radiusY = 240; 
  const x = Math.cos(angle) * radiusX;
  const y = Math.sin(angle) * radiusY;

  return (
    <div className="player-seat-wrapper" style={{ transform: `translate(${x}px, ${y}px)` }}>
      {hasCards && (
        <div style={{ position: 'absolute', top: '-25px', left: '-40px', display: 'flex', gap: '2px', zIndex: 30, transform: 'scale(0.35)', transformOrigin: 'bottom left' }}>
          
          {/* It is my seat, show my cards */}
          {player.id === socketId && myCards.length > 0 ? (
            myCards.map((card, idx) => <PlayingCard key={idx} index={idx} cardString={card} />)
          ) : 
          /* I am a spectator, show this player's known cards */
          spectatorCards && spectatorCards.length > 0 ? (
            spectatorCards.map((card, idx) => <PlayingCard key={idx} index={idx} cardString={card} />)
          ) : 
          /*I am playing, this is an opponent, show card backs */
          (
            <>
              <PlayingCard index={0} hidden={true} />
              <PlayingCard index={1} hidden={true} />
            </>
          )}

        </div>
      )}

      <div className={`player-badge ${isTheirTurn ? 'active-turn' : ''}`}>
        {isDealer && <div className="dealer-button">D</div>}
        
        <div style={{ fontWeight: 'bold', color: player.id === socketId ? '#ffcc00' : 'white', fontSize: '1.1rem', marginBottom: '4px' }}>
          {player.username}
        </div>
        <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.2rem' }}>
          ₹{player.chips}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '4px', textTransform: 'uppercase' }}>
          {player.status}
        </div>
        
        {player.roundBet > 0 && (
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', padding: '2px 0', marginTop: '6px', fontSize: '0.9rem' }}>
            Bet: ₹{player.roundBet}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSeat;
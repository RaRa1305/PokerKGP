import React from 'react';
import PlayingCard from './PlayingCard';

const CasinoTable = ({ tableState, myId, revealedHands = [] }) => {
    if (!tableState) return <div>Loading Table...</div>;

    return (
        <div className="casino-table-container">
            {/* Community Cards */}
            <div className="community-cards">
                {tableState.board && tableState.board.map((card, idx) => (
                    <PlayingCard key={`board-${idx}`} cardString={card} index={idx} />
                ))}
            </div>

            {/* Pot */}
            <div className="pot-display">
                Pot: ${tableState.pot || 0}
            </div>

            {/* Players */}
            {tableState.players.map((player, idx) => {
                const isMe = player.id === myId;
                const isTurn = tableState.currentTurn === player.id;
                
                const revealedData = revealedHands.find(r => r.username === player.username);
                
                // Determine what cards to render
                let cardsToRender = [];
                let isHidden = false;

                if (isMe && player.holeCards) {
                    cardsToRender = player.holeCards;
                } else if (revealedData) {
                    cardsToRender = revealedData.cards;
                } else if (!isMe && player.status !== 'Waiting' && player.status !== 'Folded' && tableState.phase !== 'waiting') {
                    cardsToRender = ['back', 'back'];
                    isHidden = true;
                }

                return (
                    <div key={player.id} className={`player-seat seat-${idx} ${isTurn ? 'active-turn' : ''}`}>
                        <div><strong>{player.username} {isMe && '(You)'}</strong></div>
                        <div>${player.chips}</div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{player.status}</div>
                        
                        {cardsToRender.length > 0 && (
                            <div className="player-cards">
                                {cardsToRender.map((c, i) => (
                                    <PlayingCard 
                                        key={`player-${player.id}-${i}`} 
                                        cardString={c} 
                                        hidden={isHidden} 
                                        index={i} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CasinoTable;
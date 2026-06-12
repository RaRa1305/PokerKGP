import React from 'react';

const CasinoTable = ({ tableState, myId }) => {
    if (!tableState) return <div>Loading Table...</div>;

    const renderCard = (cardString, index) => {
        const isRed = cardString.includes('h') || cardString.includes('d');
        return (
            <div key={index} className={`card ${isRed ? 'red' : ''}`}>
                {cardString}
            </div>
        );
    };

    return (
        <div className="casino-table-container">
            {/* Community Cards */}
            <div className="community-cards">
                {tableState.board && tableState.board.map((card, idx) => renderCard(card, idx))}
            </div>

            {/* Pot */}
            <div className="pot-display">
                Pot: ${tableState.pot || 0}
            </div>

            {/* Players */}
            {tableState.players.map((player, idx) => {
                const isMe = player.id === myId;
                const isTurn = tableState.currentTurn === player.id;
                
                return (
                    <div key={player.id} className={`player-seat seat-${idx} ${isTurn ? 'active-turn' : ''}`}>
                        <div><strong>{player.username} {isMe && '(You)'}</strong></div>
                        <div>${player.chips}</div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{player.status}</div>
                        
                        {/* Render Hole Cards if they exist (usually only sent to the specific user) */}
                        {player.holeCards && (
                            <div className="player-cards">
                                {player.holeCards.map((c, i) => renderCard(c, i))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CasinoTable;
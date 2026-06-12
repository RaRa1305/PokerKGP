import React, { useState } from 'react';

const ActionTray = ({ socket, tableId, currentBet, isMyTurn, playerChips, callAmount }) => {
    const [raiseAmount, setRaiseAmount] = useState(currentBet + 20);

    const handleAction = (actionType, amount = 0) => {
        if (!isMyTurn) return;
        socket.emit('PLAYER_ACTION', { tableId, action: actionType, amount });
    };

    return (
        <div className="action-tray">
            <button 
                className="action-btn btn-fold" 
                onClick={() => handleAction('fold')} 
                disabled={!isMyTurn}
            >
                Fold
            </button>
            
            <button 
                className="action-btn btn-check-call" 
                onClick={() => handleAction('call')} 
                disabled={!isMyTurn}
            >
                {callAmount === 0 ? 'Check' : `Call $${callAmount}`}
            </button>

            <div className="raise-container">
                <input 
                    type="number" 
                    className="raise-input"
                    value={raiseAmount} 
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                    min={currentBet + 1}
                    max={playerChips}
                    disabled={!isMyTurn}
                />
                <button 
                    className="action-btn btn-raise" 
                    onClick={() => handleAction('raise', raiseAmount)} 
                    disabled={!isMyTurn || raiseAmount <= currentBet}
                >
                    Raise
                </button>
            </div>
        </div>
    );
};

export default ActionTray;
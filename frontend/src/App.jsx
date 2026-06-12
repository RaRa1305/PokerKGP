import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import CasinoTable from './components/CasinoTable';
import ActionTray from './components/ActionTray';
import Login from './components/Login';
import './styles/App.css';

const socket = io('http://localhost:3000', { autoConnect: false });

function App() {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('poker_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [joined, setJoined] = useState(false);
    const [tableState, setTableState] = useState(null);
    const [holeCards, setHoleCards] = useState([]);
    const [revealedHands, setRevealedHands] = useState([]);
    const [systemMessage, setSystemMessage] = useState('');

    const targetTableId = 'Table_1';

    useEffect(() => {
        if (!currentUser) return;

        socket.connect();

        socket.on('TABLE_SYNC', (data) => {
            setTableState(data);
            if (data.phase === 'pre-flop') setRevealedHands([]);
        });
        socket.on('HOLE_CARDS', (data) => setHoleCards(data.cards));
        socket.on('GAME_MESSAGE', (data) => setSystemMessage(data.message));
        socket.on('SHOWDOWN_RESULTS', (data) => {
            setSystemMessage(data.message);
            setRevealedHands(data.revealedHands);
        });

        return () => {
            socket.off('TABLE_SYNC');
            socket.off('HOLE_CARDS');
            socket.off('GAME_MESSAGE');
            socket.off('SHOWDOWN_RESULTS');
            socket.disconnect();
        };
    }, [currentUser]);

    const handleLoginSuccess = (userData, token) => {
        localStorage.setItem('poker_user', JSON.stringify(userData));
        localStorage.setItem('poker_token', token);
        setCurrentUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('poker_user');
        localStorage.removeItem('poker_token');
        setCurrentUser(null);
        setJoined(false);
        socket.disconnect();
    };

    const joinTable = () => {
        socket.emit('JOIN_TABLE', { 
            username: currentUser.username, 
            tableId: targetTableId, 
            userId: currentUser._id 
        });
        setJoined(true);
    };

    const startGame = () => socket.emit('START_GAME', { tableId: targetTableId });

    if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} />;

    if (!joined) {
        return (
            <div className="poker-room">
                <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span>{currentUser.username} | ${currentUser.chips}</span>
                    <button onClick={handleLogout} className="action-btn btn-fold">Logout</button>
                </div>
                <h1>PokerKGP Casino Floor</h1>
                <button className="action-btn btn-check-call" onClick={joinTable}>Sit at Table 1</button>
            </div>
        );
    }

    const myPlayer = tableState?.players.find(p => p.id === socket.id);
    const isMyTurn = tableState?.currentTurn === socket.id;
    const callAmount = myPlayer ? Math.max(0, tableState.currentBet - (myPlayer.roundBet || 0)) : 0;

    if (tableState && myPlayer) myPlayer.holeCards = holeCards;

    return (
        <div className="poker-room">
            <h2 style={{ height: '30px' }}>{systemMessage || 'Waiting for action...'}</h2>
            
            <CasinoTable 
                tableState={tableState} 
                myId={socket.id} 
                revealedHands={revealedHands} 
            />
            
            {tableState?.phase === 'waiting' ? (
                <button className="action-btn btn-check-call" onClick={startGame}>Start Hand</button>
            ) : (
                <ActionTray 
                    socket={socket} 
                    tableId={targetTableId} 
                    currentBet={tableState?.currentBet || 0}
                    isMyTurn={isMyTurn}
                    playerChips={myPlayer?.chips || 0}
                    callAmount={callAmount}
                />
            )}
        </div>
    );
}

export default App;
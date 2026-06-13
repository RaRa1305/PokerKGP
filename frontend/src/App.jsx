import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import ActionTray from './components/ActionTray';
import PlayerSeat from './components/PlayerSeat';
import PlayingCard from './components/PlayingCard';
import './styles/Casino.css';

console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL);
const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000');

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('poker_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [inGame, setInGame] = useState(false);
  const [tableData, setTableData] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [gameMessage, setGameMessage] = useState('');
  const [boardCards, setBoardCards] = useState([]);
  const [gamePhase, setGamePhase] = useState('waiting');
  const [revealedHands, setRevealedHands] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [spectatorCards, setSpectatorCards] = useState({});

  const myPlayer = tableData?.players.find(p => p.id === socket.id);
  const amountToCall = (tableData?.currentBet || 0) - (myPlayer?.roundBet || 0);

  const userIndex = tableData?.players.findIndex(p => p.id === socket.id);

  const getUIIndex = (serverIndex, total) => {
    if (userIndex === undefined || userIndex === -1) return serverIndex;
    return (serverIndex - heroIndex + total) % total;
  };

  useEffect(() => {
    if (!currentUser) return;
    socket.connect();

    socket.on('SPECTATOR_CARDS', (cardMap) => setSpectatorCards(cardMap));
    socket.on('TABLE_SYNC', (data) => {
      setTableData(data);
      setBoardCards(data.board || []);
      setGamePhase(data.phase || 'waiting');
      if (data.phase === 'pre-flop') {
        setRevealedHands(null);
        setSpectatorCards({});
      }
    });
    
    socket.on('HOLE_CARDS', (data) => setMyCards(data.cards));
    socket.on('GAME_MESSAGE', (data) => setGameMessage(data.message));
    socket.on('BOARD_UPDATED', (data) => {
      setBoardCards(data.board);
      setGamePhase(data.phase);
      setRevealedHands(null); 
    });
    socket.on('SHOWDOWN_RESULTS', (data) => {
      setGameMessage(data.message);
      setRevealedHands(data.revealedHands);
    });

    return () => {
      socket.off('SPECTATOR_CARDS');
      socket.off('TABLE_SYNC');
      socket.off('HOLE_CARDS');
      socket.off('GAME_MESSAGE');
      socket.off('BOARD_UPDATED');
      socket.off('SHOWDOWN_RESULTS');
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (tableData && socket.id && tableData.currentTurn === socket.id) {
      setBetAmount(tableData.currentBet > 0 ? tableData.currentBet : 50);
    }
  }, [tableData?.currentTurn, tableData?.currentBet, socket.id]);

  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem('poker_user', JSON.stringify(userData));
    localStorage.setItem('poker_token', token);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('poker_user');
    localStorage.removeItem('poker_token');
    setCurrentUser(null);
    setInGame(false);
    socket.disconnect();
  };

  const handleJoin = (e, roomInput, actionType = 'join') => {
    e.preventDefault();
    if (currentUser && roomInput.trim()) {
      const payload = { 
        username: currentUser.username, 
        tableId: roomInput.trim().toUpperCase(),
        userId: currentUser._id 
      };

      if (actionType === 'spectate') {
        socket.emit('SPECTATE_TABLE', payload);
      } else {
        socket.emit('JOIN_TABLE', payload);
      }
      
      setInGame(true);
    }
  };

  const startGame = () => {
    if (tableData?.tableId) socket.emit('START_GAME', { tableId: tableData.tableId });
  };

  const sendAction = (action, amount) => {
    if (tableData?.tableId) socket.emit('PLAYER_ACTION', { tableId: tableData.tableId, action, amount });
  };

  if (!currentUser || !inGame) {
    return <Lobby currentUser={currentUser} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} handleJoin={handleJoin} />;
  }

  return (
    <div className="app-container">
      <h1 className="lobby-title" style={{ textAlign: 'center', fontSize: '1.8rem' }}>
        Room: {tableData?.tableId || 'Lobby'}
      </h1>
      
      <div className="top-nav">
        <div style={{ color: '#4caf50', fontSize: '1.2rem', fontWeight: 'bold' }}>
          {gameMessage || 'Waiting for players...'}
        </div>
        {(!tableData?.dealerId || tableData.dealerId === socket.id) && gamePhase === 'waiting' && tableData?.players?.length >= 2 && (
          <button onClick={startGame} className="deal-btn">DEAL NEW HAND</button>
        )}
      </div>

      <div className="poker-table">
        <div className="main-pot">Main Pot: ${tableData?.pot || 0}</div>

        <div className="community-cards">
          {[0, 1, 2, 3, 4].map(index => (
             boardCards[index] 
              ? <PlayingCard key={index} index={index} cardString={boardCards[index]} />
              : <div key={index} className="card-placeholder"></div>
          ))}
        </div>

        {tableData?.players.map((player, index) => (
          <PlayerSeat 
            key={player.id} 
            player={player} 
            index={index}
            uiIndex={uiIndex} 
            totalPlayers={tableData.players.length} 
            isTheirTurn={tableData.currentTurn === player.id} 
            isDealer={tableData.dealerId === player.id} 
            hasCards={gamePhase !== 'waiting' && player.status !== 'Folded'} 
            socketId={socket.id} 
            myCards={myCards}
            spectatorCards={spectatorCards[player.id]} 
          />
        ))}
      </div>
      
      {revealedHands && (
        <div style={{ padding: '1rem', background: '#333', borderRadius: '8px', border: '2px solid #e91e63', marginBottom: '250px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#e91e63' }}>Showdown!</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {revealedHands.map((rh, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ minWidth: '80px' }}>{rh.username}:</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {rh.cards.map((c, i) => <PlayingCard key={i} cardString={c} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {(gamePhase !== 'waiting' || tableData?.currentTurn === socket.id) && (
        <ActionTray 
          myCards={myCards} 
          isMyTurn={tableData?.currentTurn === socket.id} 
          currentBet={tableData?.currentBet || 0} 
          betAmount={betAmount} 
          setBetAmount={setBetAmount} 
          amountToCall={amountToCall} 
          myChips={myPlayer?.chips || 0} 
          sendAction={sendAction} 
        />
      )}
    </div>
  );
}

export default App;
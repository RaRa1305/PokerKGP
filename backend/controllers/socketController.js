const gameState = require('../gameState');
const { createDeck, shuffleDeck, Hand } = require('../utils/pokerMath');
const User = require('../models/User');

module.exports = (io) => {
    const syncChips = async (pId) => {
        const p = gameState.players[pId];
        if (p?.dbUserId) await User.findByIdAndUpdate(p.dbUserId, { chips: p.chips }).catch(() => {});
    };

    const evaluateShowdown = async (tableId) => {
        const table = gameState.tables[tableId];
        if (!table || table.phase !== 'river') return;

        let activeInvestments = [...new Set(table.players
            .filter(pId => gameState.players[pId].status !== 'Folded')
            .map(pId => Math.round(gameState.players[pId].totalInvested || 0))
        )].sort((a, b) => a - b);
        
        let pots = [], previousInvestment = 0;

        activeInvestments.forEach(currentInv => {
            let contributionCap = currentInv - previousInvestment;
            if (contributionCap > 0) {
                let pot = { amount: 0, eligible: [] };
                table.players.forEach(pId => {
                    let p = gameState.players[pId];
                    let playerTotal = Math.round(p.totalInvested || 0);
                    let actualContribution = Math.min(Math.max(0, playerTotal - previousInvestment), contributionCap);

                    if (actualContribution > 0) pot.amount += actualContribution;
                    if (p.status !== 'Folded' && playerTotal >= currentInv) pot.eligible.push(pId);
                });
                pots.push(pot);
                previousInvestment = currentInv;
            }
        });

        let payoutMessages = [];
        
        for (let i = 0; i < pots.length; i++) {
            let pot = pots[i];
            if (pot.amount === 0 || pot.eligible.length === 0) continue;
            let potName = i === 0 ? "Main Pot" : `Side Pot ${i}`;

            if (pot.eligible.length === 1) {
                let winnerId = pot.eligible[0];
                gameState.players[winnerId].chips += pot.amount;
                payoutMessages.push(`${gameState.players[winnerId].username} wins $${pot.amount} from ${potName} (Uncontested)`);
                await syncChips(winnerId);
                let dbUserId = gameState.players[winnerId].dbUserId;
                if (dbUserId) {
                    try {
                        await User.findByIdAndUpdate(dbUserId, {
                            $inc: { "stats.potsWon": 1 },
                            $max: { "stats.biggestPotWon": pot.amount }
                        });
                    } catch (err) { console.error(err); }
                }
                continue;
            }

            let activeHands = pot.eligible.map(pId => {
                let solved = Hand.solve(gameState.players[pId].holeCards.concat(table.board));
                solved.playerId = pId;
                return solved;
            });

            const winners = Hand.winners(activeHands);
            const splitPot = Math.floor(pot.amount / winners.length);

            for (let w of winners) {
                gameState.players[w.playerId].chips += splitPot;
                await syncChips(w.playerId); 
                let dbUserId = gameState.players[w.playerId].dbUserId;
                if (dbUserId) {
                    try {
                        await User.findByIdAndUpdate(dbUserId, {
                            $inc: { "stats.potsWon": 1 },
                            $max: { "stats.biggestPotWon": splitPot }
                        });
                    } catch (err) { console.error(err); }
                }
            }

            let winnerNames = winners.map(w => gameState.players[w.playerId].username).join(' & ');
            payoutMessages.push(`${winnerNames} wins $${pot.amount} (${potName}: ${winners[0].descr})`);
        }

        io.to(tableId).emit('SHOWDOWN_RESULTS', {
            message: payoutMessages.join(' | '),
            potAwarded: table.pot,
            revealedHands: table.players.map(pId => ({
                username: gameState.players[pId].username,
                cards: gameState.players[pId].holeCards,
                status: gameState.players[pId].status
            })).filter(p => p.status !== 'Folded')
        });

        table.pot = 0; table.phase = 'waiting'; table.currentBet = 0;
        table.players.forEach(p => { gameState.players[p].totalInvested = 0; gameState.players[p].roundBet = 0; });
        
        let currentIdx = table.players.indexOf(table.dealerId);
        table.dealerIndex = currentIdx !== -1 ? (currentIdx + 1) % table.players.length : 0;
        table.dealerId = table.players[table.dealerIndex];

        syncTable(tableId);
    };

    const advancePhase = (tableId) => {
        const table = gameState.tables[tableId];
        if (!table) return;

        if (table.phase === 'pre-flop') {
            table.deck.pop(); table.board.push(table.deck.pop(), table.deck.pop(), table.deck.pop()); table.phase = 'flop';
        } else if (table.phase === 'flop' || table.phase === 'turn') {
            table.deck.pop(); table.board.push(table.deck.pop()); table.phase = table.phase === 'flop' ? 'turn' : 'river';
        } else if (table.phase === 'river') {
            return evaluateShowdown(tableId);
        }

        table.actionsThisRound = 0; table.currentBet = 0;
        table.players.forEach(p => {
            gameState.players[p].roundBet = 0;
            if (gameState.players[p].status !== 'Folded' && gameState.players[p].status !== 'All-In') gameState.players[p].status = 'Waiting';
        });

        let nextIndex = table.dealerIndex, foundPlayer = false;
        for (let i = 0; i < table.players.length; i++) {
            nextIndex = (nextIndex + 1) % table.players.length;
            const pId = table.players[nextIndex];
            if (gameState.players[pId].status !== 'Folded' && gameState.players[pId].status !== 'All-In') {
                table.turnIndex = nextIndex; table.currentTurn = pId; foundPlayer = true; break;
            }
        }
        if (!foundPlayer) table.currentTurn = null;

        syncTable(tableId);

        const playersInHand = table.players.filter(pId => gameState.players[pId].status !== 'Folded');
        const playersCanAct = playersInHand.filter(pId => gameState.players[pId].status !== 'All-In');
        if (playersCanAct.length <= 1 && playersInHand.length > 1) setTimeout(() => advancePhase(tableId), 1500);
    };

    const syncTable = (tableId) => {
        const table = gameState.tables[tableId];
        io.to(tableId).emit('TABLE_SYNC', {
            tableId, board: table.board, phase: table.phase, pot: table.pot || 0,
            dealerId: table.dealerId, currentTurn: table.currentTurn, currentBet: table.currentBet || 0,
            players: table.players.map(id => ({
                id, username: gameState.players[id].username, chips: gameState.players[id].chips,
                status: gameState.players[id].status || 'Waiting', roundBet: gameState.players[id].roundBet || 0  
            }))
        });
    };

    io.on('connection', (socket) => {
        socket.on('JOIN_TABLE', async ({ username, tableId, userId }) => {
            if (!gameState.tables[tableId]) {
                gameState.tables[tableId] = { players: [], board: [], phase: 'waiting', deck: [], pot: 0, currentBet: 0 };
            }

            const table = gameState.tables[tableId];
            const isPlayingAnywhere = Object.values(gameState.players).some(p => 
                p && (p.dbUserId === userId || p.username === username)
            );

            if (isPlayingAnywhere) {
                socket.emit('JOIN_ERROR', { message: "You are already playing at a table! Please leave it before joining." });
                return; // Abort everything right here
            }

            let initialChips = 1000;
            if (userId) {
                try {
                    const dbUser = await User.findById(userId);
                    if (dbUser) initialChips = dbUser.chips; 
                } catch (err) {
                    console.error("DB Error fetching chips:", err);
                }
            }

            gameState.players[socket.id] = { username, chips: initialChips, tableId, dbUserId: userId };
            
            if (!gameState.tables[tableId].players.includes(socket.id)) {
                gameState.tables[tableId].players.push(socket.id);
            }
            
            socket.join(tableId);
            syncTable(tableId);
        });

        socket.on('SPECTATE_TABLE', ({ username, tableId,userId }) => {

            const table = gameState.tables[tableId]; 
            
            if (table) {
                const isAlreadyPlaying = table.players.some(pId => 
                    gameState.players[pId] && 
                    (gameState.players[pId].userId === userId || gameState.players[pId].username === username)
                );

                if (isAlreadyPlaying) {
                    socket.emit('JOIN_ERROR', { message: "You cannot spectate a table you are already playing at." });
                    return; // Abort the spectate request completely
                }

                socket.join(`${tableId}_SPECTATORS`); 
                socket.join(tableId); 

                socket.emit('TABLE_SYNC', {
                    tableId, board: table.board, phase: table.phase, pot: table.pot || 0,
                    dealerId: table.dealerId, currentTurn: table.currentTurn, currentBet: table.currentBet || 0,
                    players: table.players.map(id => ({
                        id, username: gameState.players[id].username, chips: gameState.players[id].chips,
                        status: gameState.players[id].status || 'Waiting', roundBet: gameState.players[id].roundBet || 0  
                    }))
                });

                if (table.phase !== 'waiting') {
                    const currentCardsMap = {};
                    table.players.forEach(pId => {
                        currentCardsMap[pId] = gameState.players[pId].holeCards;
                    });
                    socket.emit('SPECTATOR_CARDS', currentCardsMap);
                } 
            }
        });

        socket.on('RELOAD_BANKROLL', async ({ userId }) => {
            try {
                const user = await User.findById(userId);
                if (user && user.chips < 100) {
                    user.chips += 1000; 
                    await user.save();
                    
                    if (gameState.players[socket.id]) {
                        gameState.players[socket.id].chips = user.chips;
                    }

                    socket.emit('BANKROLL_UPDATED', { newBalance: user.chips });
                }
            } catch (err) {
                console.error("Error reloading bankroll:", err);
            }
        });

        socket.on('START_GAME', ({ tableId }) => {
            const table = gameState.tables[tableId];
            if (!table || table.phase !== 'waiting' || table.players.length < 2) return io.to(tableId).emit('GAME_MESSAGE', { message: "Cannot start game." });

            table.deck = shuffleDeck(createDeck());
            table.board = []; table.phase = 'pre-flop'; table.actionsThisRound = 0;
            if (table.dealerIndex === undefined || table.dealerIndex === -1) { table.dealerIndex = 0; table.dealerId = table.players[0]; }

            let sbIndex = (table.dealerIndex + 1) % table.players.length;
            let bbIndex = (table.dealerIndex + 2) % table.players.length;
            let utgIndex = table.players.length === 2 ? table.dealerIndex : (table.dealerIndex + 3) % table.players.length;

            let sbPlayerId = table.players[sbIndex], bbPlayerId = table.players[bbIndex];

            const allCardsMap = {};

            table.players.forEach(async pId => { 
                let p = gameState.players[pId];
                p.status = 'Waiting'; p.roundBet = 0; p.totalInvested = 0; p.holeCards = [table.deck.pop(), table.deck.pop()];
                io.to(pId).emit('HOLE_CARDS', { cards: p.holeCards });
                allCardsMap[pId] = p.holeCards;

                if (p.dbUserId) {
                    try {
                        await User.findByIdAndUpdate(p.dbUserId, { $inc: { "stats.handsPlayed": 1 } });
                    } catch (err) {
                        console.error("Hands played track error:", err);
                    }
                }
            });

            io.to(`${tableId}_SPECTATORS`).emit('SPECTATOR_CARDS', allCardsMap);
            
            gameState.players[sbPlayerId].chips -= 10; gameState.players[sbPlayerId].roundBet = 10; gameState.players[sbPlayerId].totalInvested = 10; gameState.players[sbPlayerId].status = 'Small Blind';
            gameState.players[bbPlayerId].chips -= 20; gameState.players[bbPlayerId].roundBet = 20; gameState.players[bbPlayerId].totalInvested = 20; gameState.players[bbPlayerId].status = 'Big Blind';

            table.pot = 30; table.currentBet = 20; table.lastRaiseAmount = 20; table.turnIndex = utgIndex; table.currentTurn = table.players[table.turnIndex];
            syncTable(tableId);
            io.to(tableId).emit('GAME_MESSAGE', { message: 'Blinds posted. Pre-flop action is on!' });
        });

        socket.on('PLAYER_ACTION', async ({ tableId, action, amount }) => {
            const table = gameState.tables[tableId];
            if (!table || table.currentTurn !== socket.id) return;
            const player = gameState.players[socket.id];

            if (action === 'raise') {
                amount = parseInt(amount, 10);
                if (isNaN(amount) || amount <= 0) return; // Ignore malicious/broken requests
            }

            if (action === 'fold') {
                player.status = 'Folded'; table.actionsThisRound++;
            } else if (action === 'call') {
                let callAmt = Math.min(player.chips, table.currentBet - (player.roundBet || 0));
                player.status = callAmt === player.chips ? 'All-In' : (callAmt === 0 ? 'Checked' : `Called $${callAmt}`);
                player.chips -= callAmt; table.pot += callAmt; player.roundBet = (player.roundBet || 0) + callAmt; player.totalInvested = (player.totalInvested || 0) + callAmt;
                table.actionsThisRound++; 
            } else if (action === 'raise') {
                const minRaiseTarget = table.currentBet + (table.lastRaiseAmount || 0);
                const playerTotalAvailable = player.chips + (player.roundBet || 0);

                if (amount < minRaiseTarget && amount !== playerTotalAvailable) return;
                
                if (amount <= table.currentBet) return;

                let raiseAmt = Math.min(player.chips, amount - (player.roundBet || 0));
                player.status = raiseAmt === player.chips ? 'All-In' : `Raised to $${amount}`;

                if (player.status !== 'All-In' || (player.roundBet || 0) + raiseAmt > table.currentBet) {
                    table.lastRaiseAmount = amount - table.currentBet; 
                    table.currentBet = (player.roundBet || 0) + raiseAmt;
                }

                player.chips -= raiseAmt; 
                table.pot += raiseAmt; 
                player.roundBet = (player.roundBet || 0) + raiseAmt; 
                player.totalInvested = (player.totalInvested || 0) + raiseAmt;
                table.actionsThisRound = 1; 
            }

            const playersInHand = table.players.filter(pId => gameState.players[pId].status !== 'Folded');
            if (playersInHand.length === 1) {
                let winner = gameState.players[playersInHand[0]];
                winner.chips += table.pot;
                io.to(tableId).emit('GAME_MESSAGE', { message: `${winner.username} wins $${table.pot} (Everyone folded)` });
                await syncChips(playersInHand[0]); 

                let dbUserId = winner.dbUserId;
                if (dbUserId && table.pot > 0) {
                    try {
                        await User.findByIdAndUpdate(dbUserId, {
                            $inc: { "stats.potsWon": 1 },
                            $max: { "stats.biggestPotWon": table.pot }
                        });
                    } catch (err) { console.error(err); }
                }

                table.pot = 0; table.phase = 'waiting'; table.currentBet = 0; table.currentTurn = null;
                table.dealerIndex = (table.players.indexOf(table.dealerId) + 1) % table.players.length; table.dealerId = table.players[table.dealerIndex];
                return syncTable(tableId);
            }

            const playersCanAct = playersInHand.filter(pId => gameState.players[pId].status !== 'All-In');
            if (playersCanAct.length === 0 || (table.actionsThisRound >= playersCanAct.length && playersCanAct.every(pId => gameState.players[pId].roundBet === table.currentBet))) {
                return advancePhase(tableId);
            }

            let nextIndex = table.turnIndex;
            for (let i = 0; i < table.players.length; i++) {
                nextIndex = (nextIndex + 1) % table.players.length;
                if (gameState.players[table.players[nextIndex]].status !== 'Folded' && gameState.players[table.players[nextIndex]].status !== 'All-In') {
                    table.turnIndex = nextIndex; table.currentTurn = table.players[nextIndex]; break;
                }
            }
            syncTable(tableId);
        });

        socket.on('LEAVE_TABLE', async () => {
            const p = gameState.players[socket.id];
            if (!p) return;

            const tableId = p.tableId;
            const table = gameState.tables[tableId];

            if (table) {
                if (table.currentTurn === socket.id) {
                    p.status = 'Folded';
                    let playersInHand = table.players.filter(id => gameState.players[id]?.status !== 'Folded');
                    
                    if (playersInHand.length === 1) {
                        gameState.players[playersInHand[0]].chips += table.pot;
                        io.to(tableId).emit('GAME_MESSAGE', { message: `${gameState.players[playersInHand[0]].username} wins $${table.pot} (Opponent left)` });
                        await syncChips(playersInHand[0]);
                        
                        let dbUserId = gameState.players[playersInHand[0]].dbUserId;
                        if (dbUserId && table.pot > 0) {
                            try {
                                await User.findByIdAndUpdate(dbUserId, {
                                    $inc: { "stats.potsWon": 1 },
                                    $max: { "stats.biggestPotWon": table.pot }
                                });
                            } catch (err) { console.error(err); }
                        }

                        table.pot = 0; table.phase = 'waiting'; table.currentBet = 0; table.currentTurn = null;
                    } else {
                        advancePhase(tableId); 
                    }
                }

                table.players = table.players.filter(id => id !== socket.id);
                
                await syncChips(socket.id);

                socket.leave(tableId);
                socket.leave(`${tableId}_SPECTATORS`);

                io.to(tableId).emit('GAME_MESSAGE', { message: `${p.username} has left the table.` });
                syncTable(tableId);
            }

            delete gameState.players[socket.id];
        });

        socket.on('disconnect', async () => {
            const p = gameState.players[socket.id];
            if (p) {
                await syncChips(socket.id); 
                const table = gameState.tables[p.tableId];
                if (table) {
                    if (table.phase === 'waiting') table.players = table.players.filter(id => id !== socket.id);
                    if (table.currentTurn === socket.id) {
                        p.status = 'Folded';
                        let playersInHand = table.players.filter(id => gameState.players[id]?.status !== 'Folded');
                        if (playersInHand.length === 1) {
                            gameState.players[playersInHand[0]].chips += table.pot;
                            io.to(p.tableId).emit('GAME_MESSAGE', { message: `${gameState.players[playersInHand[0]].username} wins $${table.pot} (Opponent disconnected)` });
                            await syncChips(playersInHand[0]); 

                            let dbUserId = gameState.players[playersInHand[0]].dbUserId;
                            if (dbUserId && table.pot > 0) {
                                try {
                                    await User.findByIdAndUpdate(dbUserId, {
                                        $inc: { "stats.potsWon": 1 },
                                        $max: { "stats.biggestPotWon": table.pot }
                                    });
                                } catch (err) { console.error(err); }
                            }
                            
                            table.pot = 0; table.phase = 'waiting'; table.currentBet = 0; table.currentTurn = null;
                        } else {
                            let nextIndex = table.turnIndex;
                            for (let i = 0; i < table.players.length; i++) {
                                nextIndex = (nextIndex + 1) % table.players.length;
                                if (gameState.players[table.players[nextIndex]]?.status !== 'Folded' && gameState.players[table.players[nextIndex]]?.status !== 'All-In') {
                                    table.turnIndex = nextIndex; table.currentTurn = table.players[nextIndex]; break;
                                }
                            }
                        }
                        syncTable(p.tableId);
                    }
                }
                delete gameState.players[socket.id];
            }
        });
    });
};
const Hand = require('pokersolver').Hand;

function createDeck() {
    const suits = ['h', 'd', 'c', 's']; 
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) { deck.push(rank + suit); }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

//Showdown Logic
function evaluateShowdown(tableId, gameState, io) {
    const table = gameState.tables[tableId];
    if (!table || table.phase !== 'river') return;

    let activeInvestments = [...new Set(
        table.players
            .filter(pId => gameState.players[pId].status !== 'Folded')
            .map(pId => Math.round(gameState.players[pId].totalInvested || 0))
    )].sort((a, b) => a - b);
    
    let pots = [];
    let previousInvestment = 0;

    activeInvestments.forEach(currentInvestment => {
        let contributionCap = currentInvestment - previousInvestment;
        if (contributionCap > 0) {
            let pot = { amount: 0, eligible: [] };
            
            table.players.forEach(pId => {
                let p = gameState.players[pId];
                let playerTotal = Math.round(p.totalInvested || 0);
                
                let availableToSlice = Math.max(0, playerTotal - previousInvestment);
                let actualContribution = Math.min(availableToSlice, contributionCap);

                if (actualContribution > 0) {
                    pot.amount += actualContribution;
                }

                if (p.status !== 'Folded' && playerTotal >= currentInvestment) {
                    pot.eligible.push(pId);
                }
            });
            
            pots.push(pot);
            previousInvestment = currentInvestment;
        }
    });

    let payoutMessages = [];
    
    pots.forEach((pot, index) => {
        if (pot.amount === 0 || pot.eligible.length === 0) return;

        let potName = index === 0 ? "Main Pot" : `Side Pot ${index}`;

        if (pot.eligible.length === 1) {
            let winnerId = pot.eligible[0];
            gameState.players[winnerId].chips += pot.amount;
            payoutMessages.push(`${gameState.players[winnerId].username} wins $${pot.amount} from ${potName} (Uncontested)`);
            return;
        }

        let activeHands = [];
        pot.eligible.forEach(pId => {
            const fullHand = gameState.players[pId].holeCards.concat(table.board);
            const solvedHand = Hand.solve(fullHand);
            solvedHand.playerId = pId;
            activeHands.push(solvedHand);
        });

        const winners = Hand.winners(activeHands);
        const splitPot = Math.floor(pot.amount / winners.length);
        const winningDescription = winners[0].descr;

        winners.forEach(w => {
            gameState.players[w.playerId].chips += splitPot;
        });

        const winnerNames = winners.map(w => gameState.players[w.playerId].username).join(' & ');
        payoutMessages.push(`${winnerNames} wins $${pot.amount} (${potName}: ${winningDescription})`);
    });

    io.to(tableId).emit('SHOWDOWN_RESULTS', {
        message: payoutMessages.join(' | '),
        potAwarded: table.pot,
        revealedHands: table.players
            .map(pId => ({
                username: gameState.players[pId].username,
                cards: gameState.players[pId].holeCards,
                status: gameState.players[pId].status
            }))
            .filter(p => p.status !== 'Folded')
    });

    // Reset for the next hand
    table.pot = 0; 
    table.phase = 'waiting'; 
    table.currentBet = 0;
    table.players.forEach(p => {
        gameState.players[p].totalInvested = 0;
        gameState.players[p].roundBet = 0;
    });

    let currentIdx = table.players.indexOf(table.dealerId);
    table.dealerIndex = currentIdx !== -1 ? (currentIdx + 1) % table.players.length : 0;
    table.dealerId = table.players[table.dealerIndex];

    io.to(tableId).emit('TABLE_SYNC', {
        tableId: tableId, 
        board: table.board, 
        phase: table.phase, 
        pot: table.pot, 
        currentTurn: null, 
        currentBet: 0, 
        roundBet: 0, 
        dealerId: table.dealerId,
        players: table.players.map(id => ({
            id: id, 
            username: gameState.players[id].username, 
            chips: gameState.players[id].chips, 
            status: gameState.players[id].status, 
            roundBet: 0
        }))
    });
}

module.exports = { createDeck, shuffleDeck, evaluateShowdown };
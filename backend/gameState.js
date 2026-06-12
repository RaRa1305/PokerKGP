// Centralized in-memory store for active tables and connected players
const gameState = {
    tables: {},
    players: {}
};

module.exports = gameState;
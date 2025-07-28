/**
 * Games CRUD Module
 * Manages game library, integrates with CheapShark API
 */

class GamesModule {
    constructor(database, apiClient) {
        this.db = database;
        this.api = apiClient;
        this.collection = 'games';
    }

    // Add game to local library
    async addGame(gameData) {
        return await window.GameHubValidation.ErrorHandler.handleAsyncOperation(async () => {
            // If gameData has gameId, fetch full details from API
            if (gameData.gameId && !gameData.name) {
                const apiGame = await this.api.getGameDetails(gameData.gameId);
                if (apiGame) {
                    gameData = this.mapApiGameToLocal(apiGame);
                }
            }

            // Validate game data
            const validationErrors = window.GameHubValidation.DataValidator.validateGameData(gameData);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            // Check if game already exists
            const existing = await this.db.query(this.collection, game => 
                game.title.toLowerCase() === (gameData.name || gameData.title).toLowerCase()
            );

            if (existing.length > 0) {
                throw new Error('Game already exists in library');
            }

            const game = await this.db.create(this.collection, {
                title: window.GameHubValidation.DataValidator.sanitizeString(gameData.name || gameData.title),
                developer: window.GameHubValidation.DataValidator.sanitizeString(gameData.developer || 'Unknown Developer'),
                genre: window.GameHubValidation.DataValidator.sanitizeArray(gameData.genre || []),
                platform: window.GameHubValidation.DataValidator.sanitizeArray(gameData.platform || []),
                description: window.GameHubValidation.DataValidator.sanitizeString(gameData.description || ''),
                image: gameData.imageUrl || gameData.image || '',
                status: gameData.status || 'available'
            });

            return game;
        }, 'Add Game');
    }

    // Get all games
    async getAllGames() {
        return await this.db.read(this.collection);
    }

    // Get game by ID
    async getGameById(id) {
        return await this.db.read(this.collection, id);
    }

    // Update game
    async updateGame(id, updateData) {
        const game = await this.getGameById(id);
        if (!game) {
            throw new Error('Game not found');
        }

        return await this.db.update(this.collection, id, updateData);
    }

    // Delete game
    async deleteGame(id) {
        return await this.db.delete(this.collection, id);
    }

    // Search local games
    async searchGames(searchTerm) {
        return await this.db.search(this.collection, searchTerm, ['title', 'description', 'developer']);
    }

    // Search games via API
    async searchGamesAPI(query, page = 1) {
        return await this.api.searchGames(query, page);
    }

    // Get popular games from API
    async getPopularGames(page = 1) {
        return await this.api.getPopularGames(page);
    }

    // Get games by genre
    async getGamesByGenre(genre) {
        return await this.db.query(this.collection, game => 
            game.genre && Array.isArray(game.genre) && 
            game.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()))
        );
    }

    // Get games by platform
    async getGamesByPlatform(platform) {
        return await this.db.query(this.collection, game => 
            game.platform && Array.isArray(game.platform) && 
            game.platform.some(p => p.toLowerCase().includes(platform.toLowerCase()))
        );
    }

    // Map API game data to local format
    mapApiGameToLocal(apiGame) {
        return {
            title: apiGame.name || apiGame.title,
            developer: apiGame.developers ? apiGame.developers.map(d => d.name).join(', ') : 'Unknown Developer',
            genre: apiGame.genres ? apiGame.genres.map(g => g.name) : [],
            platform: apiGame.platforms ? apiGame.platforms.map(p => p.platform.name) : [],
            description: apiGame.description_raw || apiGame.description || '',
            image: apiGame.background_image || '',
            status: 'available'
        };
    }

    // Get game statistics
    async getGameStats() {
        const games = await this.getAllGames();
        const genres = {};
        const platforms = {};

        games.forEach(game => {
            if (game.genre && Array.isArray(game.genre)) {
                game.genre.forEach(g => {
                    genres[g] = (genres[g] || 0) + 1;
                });
            }
            if (game.platform && Array.isArray(game.platform)) {
                game.platform.forEach(p => {
                    platforms[p] = (platforms[p] || 0) + 1;
                });
            }
        });

        return {
            total: games.length,
            genres,
            platforms
        };
    }
}

// Module will be initialized by database.js

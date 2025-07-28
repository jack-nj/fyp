/**
 * Tags/Categories CRUD Module
 * Manages game genres, tags, and categories
 */

class TagsModule {
    constructor(database) {
        this.db = database;
        this.collection = 'tags';
        this.initializeDefaultTags();
    }

    // Initialize default tags if none exist
    async initializeDefaultTags() {
        const existingTags = await this.getAllTags();
        if (existingTags.length === 0) {
            const defaultTags = [
                { name: 'Action', type: 'genre', color: '#ff6b6b' },
                { name: 'Adventure', type: 'genre', color: '#4ecdc4' },
                { name: 'RPG', type: 'genre', color: '#45b7d1' },
                { name: 'Strategy', type: 'genre', color: '#96ceb4' },
                { name: 'Simulation', type: 'genre', color: '#feca57' },
                { name: 'Sports', type: 'genre', color: '#ff9ff3' },
                { name: 'Racing', type: 'genre', color: '#54a0ff' },
                { name: 'Puzzle', type: 'genre', color: '#5f27cd' },
                { name: 'Horror', type: 'genre', color: '#341f97' },
                { name: 'Indie', type: 'category', color: '#00d2d3' },
                { name: 'AAA', type: 'category', color: '#ff6348' },
                { name: 'Early Access', type: 'status', color: '#ffa502' },
                { name: 'Multiplayer', type: 'feature', color: '#2ed573' },
                { name: 'Single Player', type: 'feature', color: '#1e90ff' },
                { name: 'Co-op', type: 'feature', color: '#3742fa' }
            ];

            for (const tag of defaultTags) {
                await this.createTag(tag);
            }
        }
    }

    // Create new tag
    async createTag(tagData) {
        // Validate required fields
        if (!tagData.name) {
            throw new Error('Tag name is required');
        }

        // Check if tag already exists
        const existing = await this.db.query(this.collection, tag => 
            tag.name.toLowerCase() === tagData.name.toLowerCase()
        );

        if (existing.length > 0) {
            throw new Error('Tag already exists');
        }

        const tag = this.db.create(this.collection, {
            name: tagData.name,
            type: tagData.type || 'custom', // genre, category, feature, status, custom
            color: tagData.color || this.generateRandomColor(),
            description: tagData.description || '',
            isActive: tagData.isActive !== undefined ? tagData.isActive : true,
            gameCount: 0,
            createdBy: tagData.createdBy || null
        });

        return tag;
    }

    // Get all tags
    getAllTags() {
        return this.db.read(this.collection);
    }

    // Get active tags only
    async getActiveTags() {
        return await this.db.query(this.collection, tag => tag.isActive);
    }

    // Get tag by ID
    getTagById(id) {
        return this.db.read(this.collection, id);
    }

    // Get tags by type
    getTagsByType(type) {
        return this.db.query(this.collection, tag => tag.type === type && tag.isActive);
    }

    // Update tag
    updateTag(id, updateData) {
        const tag = this.getTagById(id);
        if (!tag) {
            throw new Error('Tag not found');
        }

        // Check for duplicate name if name is being updated
        if (updateData.name && updateData.name !== tag.name) {
            const existing = this.db.query(this.collection, t => 
                t.name.toLowerCase() === updateData.name.toLowerCase() && t.id !== id
            );
            if (existing.length > 0) {
                throw new Error('Tag name already exists');
            }
        }

        return this.db.update(this.collection, id, updateData);
    }

    // Delete tag
    deleteTag(id) {
        const tag = this.getTagById(id);
        if (!tag) {
            throw new Error('Tag not found');
        }

        // Remove tag from all games that use it
        if (window.GameHubDB.games) {
            const games = window.GameHubDB.games.getAllGames();
            games.forEach(game => {
                if (game.tags && game.tags.includes(tag.name)) {
                    const updatedTags = game.tags.filter(t => t !== tag.name);
                    window.GameHubDB.games.updateGame(game.id, { tags: updatedTags });
                }
            });
        }

        return this.db.delete(this.collection, id);
    }

    // Search tags
    searchTags(searchTerm) {
        return this.db.search(this.collection, searchTerm, ['name', 'description']);
    }

    // Get popular tags (by game count)
    getPopularTags(limit = 10) {
        return this.getActiveTags()
            .sort((a, b) => b.gameCount - a.gameCount)
            .slice(0, limit);
    }

    // Update tag game count
    updateTagGameCount(tagName) {
        const tag = this.getTagByName(tagName);
        if (!tag) return;

        // Count games with this tag
        const games = window.GameHubDB.games?.getAllGames() || [];
        const gameCount = games.filter(game => 
            game.tags && game.tags.includes(tagName)
        ).length;

        this.updateTag(tag.id, { gameCount });
    }

    // Get tag by name
    getTagByName(name) {
        const tags = this.db.query(this.collection, tag => 
            tag.name.toLowerCase() === name.toLowerCase()
        );
        return tags.length > 0 ? tags[0] : null;
    }

    // Bulk update tag game counts
    updateAllTagGameCounts() {
        const tags = this.getAllTags();
        tags.forEach(tag => {
            this.updateTagGameCount(tag.name);
        });
    }

    // Generate random color for new tags
    generateRandomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#341f97', '#00d2d3',
            '#ff6348', '#ffa502', '#2ed573', '#1e90ff', '#3742fa'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Get tags with games
    getTagsWithGames() {
        const tags = this.getActiveTags();
        return tags.map(tag => ({
            ...tag,
            games: this.getGamesByTag(tag.name)
        }));
    }

    // Get games by tag
    getGamesByTag(tagName) {
        if (!window.GameHubDB.games) return [];
        
        const games = window.GameHubDB.games.getAllGames();
        return games.filter(game => 
            game.tags && game.tags.includes(tagName)
        );
    }

    // Add tag to game
    addTagToGame(gameId, tagName) {
        if (!window.GameHubDB.games) {
            throw new Error('Games module not available');
        }

        const game = window.GameHubDB.games.getGameById(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        const tag = this.getTagByName(tagName);
        if (!tag) {
            throw new Error('Tag not found');
        }

        if (!game.tags) game.tags = [];
        if (!game.tags.includes(tagName)) {
            game.tags.push(tagName);
            window.GameHubDB.games.updateGame(gameId, { tags: game.tags });
            this.updateTagGameCount(tagName);
        }
    }

    // Remove tag from game
    removeTagFromGame(gameId, tagName) {
        if (!window.GameHubDB.games) {
            throw new Error('Games module not available');
        }

        const game = window.GameHubDB.games.getGameById(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        if (game.tags && game.tags.includes(tagName)) {
            game.tags = game.tags.filter(t => t !== tagName);
            window.GameHubDB.games.updateGame(gameId, { tags: game.tags });
            this.updateTagGameCount(tagName);
        }
    }

    // Toggle tag active status
    toggleTagStatus(id) {
        const tag = this.getTagById(id);
        if (!tag) {
            throw new Error('Tag not found');
        }

        return this.updateTag(id, { isActive: !tag.isActive });
    }

    // Get tag statistics
    getTagStats() {
        const tags = this.getAllTags();
        const activeTagsCount = tags.filter(t => t.isActive).length;
        const typeStats = {};

        tags.forEach(tag => {
            if (!typeStats[tag.type]) {
                typeStats[tag.type] = 0;
            }
            typeStats[tag.type]++;
        });

        return {
            total: tags.length,
            active: activeTagsCount,
            inactive: tags.length - activeTagsCount,
            byType: typeStats,
            totalGameAssignments: tags.reduce((sum, tag) => sum + tag.gameCount, 0)
        };
    }

    // Create tag if it doesn't exist
    createTagIfNotExists(tagName, type = 'custom') {
        const existing = this.getTagByName(tagName);
        if (existing) {
            return existing;
        }

        return this.createTag({
            name: tagName,
            type: type
        });
    }
}

// Module will be initialized by database.js

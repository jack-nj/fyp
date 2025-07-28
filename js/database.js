/**
 * GameHub Local - Firebase-Only Database
 * Direct Firebase Firestore access - no caching or mock data
 * Always fetches fresh data from Firebase
 */

class SimpleVectorStore {
    constructor() {
        this.db = null;
        this.isReady = false;
        
        // Wait for Firebase to be available with better error handling
        this.initializeAsync();
    }
    
    async initializeAsync() {
        try {
            // Wait for Firebase to be fully initialized
            let attempts = 0;
            while (attempts < 50) { // 5 second timeout
                if (window.FIREBASE_ENABLED && window.firebase && window.firebase.db) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.FIREBASE_ENABLED || !window.firebase || !window.firebase.db) {
                throw new Error('Firebase is required but not available. Please check your Firebase configuration.');
            }
            
            this.db = window.firebase.db;
            console.log('Database: Using Firebase Firestore (Cloud-Only Mode)');
            console.log('Database connection:', !!this.db);
            
            await this.initializeFirestore();
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    // Initialize Firestore collections
    async initializeFirestore() {
        try {
            // Test Firebase connection
            await this.db.collection('users').limit(1).get();
            this.isReady = true;
            console.log('✅ Firebase-only database initialized successfully (NO CACHE)');
            
        } catch (error) {
            console.error('❌ Failed to initialize Firebase database:', error);
            throw new Error(`Firebase initialization failed: ${error.message}`);
        }
    }

    // Wait for database to be ready
    async waitForReady() {
        while (!this.isReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Generic CRUD operations - CREATE
    async create(collection, data) {
        await this.waitForReady();
        
        try {
            // Auto-generate fields for specific collections
            if (collection === 'moderationLogs' && !data.timestamp) {
                data.timestamp = new Date().toISOString();
            }
            
            if (collection === 'reviews' && !data.timestamp) {
                data.timestamp = new Date().toISOString();
            }
            
            if (collection === 'recommendations' && !data.timestamp) {
                data.timestamp = new Date().toISOString();
            }
            
            // Validate and clean data according to schema
            const cleanData = this.validateData(collection, data);
            
            const item = {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...cleanData
            };

            // Create in Firestore - DIRECT FIREBASE ACCESS
            const docRef = await this.db.collection(collection).add(item);
            const newItem = { id: docRef.id, ...item };
            
            console.log(`✅ Created ${collection} item in Firebase:`, newItem.id);
            return newItem;
            
        } catch (error) {
            console.error(`❌ Error creating ${collection} item:`, error);
            throw new Error(`Failed to create ${collection}: ${error.message}`);
        }
    }

    // Generic CRUD operations - READ
    async read(collection, id = null) {
        await this.waitForReady();
        
        try {
            if (id) {
                // Get single document - DIRECT FIREBASE ACCESS
                const doc = await this.db.collection(collection).doc(id).get();
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                }
                return null;
            } else {
                // Get all documents - DIRECT FIREBASE ACCESS (NO CACHE)
                console.log(`📥 Fetching ${collection} from Firebase...`);
                const snapshot = await this.db.collection(collection).get();
                const data = [];
                
                snapshot.forEach(doc => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                
                console.log(`✅ Fetched ${data.length} items from ${collection} (Firebase)`);
                return data;
            }
        } catch (error) {
            console.error(`❌ Error reading ${collection} from Firebase:`, error);
            throw new Error(`Failed to read ${collection}: ${error.message}`);
        }
    }

    // Generic CRUD operations - UPDATE
    async update(collection, id, data) {
        await this.waitForReady();
        
        try {
            // Update in Firestore - DIRECT FIREBASE ACCESS
            const updateData = {
                ...data,
                updatedAt: new Date().toISOString()
            };
            
            await this.db.collection(collection).doc(id).update(updateData);
            
            // Return updated item - DIRECT FIREBASE ACCESS
            const doc = await this.db.collection(collection).doc(id).get();
            const result = doc.exists ? { id: doc.id, ...doc.data() } : null;
            console.log(`✅ Updated ${collection} item in Firebase:`, id);
            return result;
            
        } catch (error) {
            console.error(`❌ Error updating ${collection} item:`, error);
            throw new Error(`Failed to update ${collection}: ${error.message}`);
        }
    }

    // Generic CRUD operations - DELETE
    async delete(collection, id) {
        await this.waitForReady();
        
        try {
            // Delete from Firestore - DIRECT FIREBASE ACCESS
            await this.db.collection(collection).doc(id).delete();
            
            console.log(`✅ Deleted ${collection} item from Firebase:`, id);
            return true;
            
        } catch (error) {
            console.error(`❌ Error deleting ${collection} item:`, error);
            throw new Error(`Failed to delete ${collection}: ${error.message}`);
        }
    }

    // Query operations - DIRECT FIREBASE ACCESS
    async query(collection, predicate) {
        await this.waitForReady();
        
        try {
            // Get data from Firestore and apply filter - NO CACHE
            const items = await this.read(collection);
            const results = items.filter(predicate);
            console.log(`✅ Query ${collection} from Firebase: ${results.length} matches`);
            return results;
        } catch (error) {
            console.error(`❌ Error querying ${collection}:`, error);
            throw new Error(`Failed to query ${collection}: ${error.message}`);
        }
    }

    // Search operations - DIRECT FIREBASE ACCESS
    async search(collection, searchTerm, fields = []) {
        await this.waitForReady();
        
        try {
            // Get data from Firestore and apply search - NO CACHE
            const items = await this.read(collection);
            const term = searchTerm.toLowerCase();
            
            const results = items.filter(item => {
                if (fields.length === 0) {
                    // Search all string fields
                    return Object.values(item).some(value => 
                        typeof value === 'string' && value.toLowerCase().includes(term)
                    );
                } else {
                    // Search specific fields
                    return fields.some(field => 
                        item[field] && typeof item[field] === 'string' && 
                        item[field].toLowerCase().includes(term)
                    );
                }
            });
            
            console.log(`✅ Search ${collection} in Firebase for "${searchTerm}": ${results.length} matches`);
            return results;
        } catch (error) {
            console.error(`❌ Error searching ${collection}:`, error);
            throw new Error(`Failed to search ${collection}: ${error.message}`);
        }
    }

    // Clear all data (Firebase-only)
    async clearAll() {
        await this.waitForReady();
        
        const collections = ['users', 'games', 'reviews', 'recommendations', 'tags', 'moderationLogs'];
        
        for (const collection of collections) {
            await this.clearCollection(collection);
        }
    }

    // Clear specific collection (Firebase-only)
    async clearCollection(collection) {
        await this.waitForReady();
        
        try {
            // Get all documents in collection - DIRECT FIREBASE ACCESS
            const snapshot = await this.db.collection(collection).get();
            
            // Delete all documents
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            console.log(`✅ Cleared ${collection} collection in Firebase`);
        } catch (error) {
            console.error(`❌ Error clearing ${collection}:`, error);
            throw new Error(`Failed to clear ${collection}: ${error.message}`);
        }
    }

    // Get collection stats - DIRECT FIREBASE ACCESS
    async getStats() {
        await this.waitForReady();
        
        const collections = ['users', 'games', 'reviews', 'recommendations', 'tags', 'moderationLogs'];
        const stats = {};
        
        for (const collection of collections) {
            try {
                const snapshot = await this.db.collection(collection).get();
                stats[collection] = snapshot.size;
            } catch (error) {
                console.warn(`Failed to get stats for ${collection}:`, error.message);
                stats[collection] = 0;
            }
        }
        
        return stats;
    }

    // Database schema definition
    getSchema() {
        return {
            users: {
                required: ['username', 'email', 'password', 'role'],
                fields: ['username', 'email', 'password', 'role', 'displayName', 'isActive']
            },
            games: {
                required: ['title', 'developer'],
                fields: ['title', 'developer', 'genre', 'platform', 'description', 'image', 'status']
            },
            reviews: {
                required: ['gameId', 'userId', 'rating'],
                fields: ['gameId', 'userId', 'rating', 'title', 'content', 'helpful', 'notHelpful', 'isRecommended', 'isEdited', 'isFlagged', 'moderationStatus']
            },
            recommendations: {
                required: ['userId'],
                fields: ['userId', 'recommendations', 'generatedAt', 'isViewed', 'preferences', 'algorithm']
            },
            tags: {
                required: ['name'],
                fields: ['name', 'color', 'category', 'gameCount', 'isActive']
            },
            moderationLogs: {
                required: ['action'],
                fields: ['timestamp', 'action', 'sentiment', 'flagged', 'threshold', 'mood', 'analyzed']
            }
        };
    }

    // Validate data against schema
    validateData(collection, data) {
        const schema = this.getSchema()[collection];
        if (!schema) {
            throw new Error(`Unknown collection: ${collection}`);
        }

        // Check required fields
        for (const field of schema.required) {
            if (!(field in data) || data[field] === undefined || data[field] === null || data[field] === '') {
                throw new Error(`Missing required field: ${field} in ${collection}`);
            }
        }

        // Remove any fields not in schema
        const cleanData = {};
        for (const field of schema.fields) {
            if (field in data) {
                cleanData[field] = data[field];
            }
        }

        return cleanData;
    }
}

// CheapShark API Client - Real game deals data (no authentication required)
// This provides actual game data from Steam and other PC gaming platforms

class CheapSharkApiClient {
    constructor() {
        this.baseUrl = 'https://www.cheapshark.com/api/1.0';
        this.cachedDeals = null;
        this.cachedStores = null;
        this.lastCacheTime = null;
        this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
    }

    // Get all stores for reference
    async getStores() {
        if (this.cachedStores) {
            return this.cachedStores;
        }

        try {
            const response = await fetch(`${this.baseUrl}/stores`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const stores = await response.json();
            this.cachedStores = stores;
            return stores;
        } catch (error) {
            console.error('CheapShark stores API error:', error.message);
            throw new Error('Unable to fetch store information from API');
        }
    }

    // Convert CheapShark deal format to our expected game format
    convertDealToGame(deal) {
        const savings = parseFloat(deal.savings) || 0;
        const steamRating = deal.steamRatingPercent ? parseFloat(deal.steamRatingPercent) : 75;
        
        return {
            id: deal.gameID || deal.dealID,
            name: deal.title || 'Unknown Game',
            title: deal.title || 'Unknown Game',
            developer: 'Various PC Game Developers',
            description_raw: `${deal.title || 'This game'} is currently ${savings > 0 ? `on sale with ${Math.round(savings)}% off` : 'available'}! ${deal.steamRatingText ? `Steam rating: ${deal.steamRatingText}` : 'Check out this great PC game.'} Normal price: $${deal.normalPrice}, ${savings > 0 ? `Sale price: $${deal.salePrice}` : `Current price: $${deal.salePrice}`}.`,
            genres: [{ name: "PC Game" }], // CheapShark focuses on PC gaming deals
            platforms: [{ platform: { name: "PC" } }],
            released: "Available", // CheapShark doesn't provide exact release dates
            developers: [{ name: "Various PC Game Developers" }],
            publishers: [{ name: "Various" }],
            rating: Math.max(1, Math.min(5, (steamRating / 20))), // Convert 0-100% to 1-5 scale
            background_image: deal.thumb || 'https://via.placeholder.com/460x215?text=Game+Image',
            tags: [
                { name: "PC" }, 
                { name: savings > 0 ? "On Sale" : "Available" },
                { name: steamRating >= 80 ? "Highly Rated" : steamRating >= 60 ? "Well Rated" : "PC Game" }
            ],
            // Additional deal-specific info
            dealInfo: {
                salePrice: deal.salePrice,
                normalPrice: deal.normalPrice,
                savings: deal.savings,
                dealRating: deal.dealRating,
                storeID: deal.storeID,
                dealID: deal.dealID,
                steamRatingPercent: deal.steamRatingPercent,
                steamRatingText: deal.steamRatingText
            }
        };
    }

    // Get game details (acts as our main data source)
    async getGameDeals(pageNumber = 0, pageSize = 60, sortBy = 'Recent') {
        try {
            const response = await fetch(`${this.baseUrl}/deals?pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const deals = await response.json();
            if (!Array.isArray(deals)) {
                throw new Error('Invalid response format from API');
            }
            
            // Filter out deals with missing essential data
            const validDeals = deals.filter(deal => 
                deal.title && deal.title.trim() !== '' && 
                deal.salePrice && deal.normalPrice
            );
            
            return validDeals;
        } catch (error) {
            console.error('CheapShark deals API error:', error.message);
            throw new Error('Unable to fetch game deals from API. Please check your connection and try again.');
        }
    }

    // Search games through deals
    async searchGames(query, page = 1, pageSize = 20) {
        try {
            // Use the search endpoint if available, otherwise filter deals
            const searchUrl = `${this.baseUrl}/deals?title=${encodeURIComponent(query)}&pageNumber=${page - 1}&pageSize=${pageSize}`;
            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const deals = await response.json();
            const games = deals.map(deal => this.convertDealToGame(deal));
            
            return {
                results: games,
                count: games.length,
                next: games.length === pageSize ? `page=${page + 1}` : null,
                previous: page > 1 ? `page=${page - 1}` : null
            };
        } catch (error) {
            console.error('CheapShark search error:', error.message);
            throw new Error('Unable to search games from API. Please check your connection and try again.');
        }
    }

    // Get specific game details by ID
    async getGameDetails(gameId) {
        try {
            // Try to get game info
            const response = await fetch(`${this.baseUrl}/games?id=${gameId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const gameData = await response.json();
            
            if (!gameData.info) {
                throw new Error('Game information not available');
            }
            
            // Convert to our format
            return {
                id: gameId,
                name: gameData.info.title || `Game ${gameId}`,
                description_raw: `${gameData.info.title} - Available on PC gaming platforms. ${gameData.deals && gameData.deals.length > 0 ? `Currently has ${gameData.deals.length} active deal(s) available.` : 'Check for the latest pricing.'} This game has been tracked across multiple stores for the best deals.`,
                genres: [{ name: "PC Game" }],
                platforms: [{ platform: { name: "PC" } }],
                released: "Available",
                developers: [{ name: "Various" }],
                publishers: [{ name: "Various" }],
                rating: 4.0,
                background_image: gameData.info.thumb || 'https://via.placeholder.com/460x215?text=Game+Image',
                tags: [{ name: "PC" }, { name: "Steam" }],
                deals: gameData.deals || []
            };
        } catch (error) {
            console.error('CheapShark game details error:', error.message);
            throw new Error('Unable to get game details from API. Please try again.');
        }
    }

    // Get popular/best deals (acts as our "popular games" function)
    async getPopularGames(page = 1, pageSize = 20) {
        try {
            // Get deals sorted by Steam rating and deal rating
            const deals = await this.getGameDeals(page - 1, pageSize, 'Deal Rating');
            const games = deals
                .filter(deal => deal.steamRatingPercent && parseFloat(deal.steamRatingPercent) >= 70) // Only well-rated games
                .map(deal => this.convertDealToGame(deal));
            
            return {
                results: games,
                count: games.length,
                next: games.length === pageSize ? `page=${page + 1}` : null,
                previous: page > 1 ? `page=${page - 1}` : null
            };
        } catch (error) {
            console.error('CheapShark popular games error:', error.message);
            throw new Error('Unable to get popular games from API. Please check your connection and try again.');
        }
    }

    // Get games by store (similar to genre filtering)
    async getGamesByStore(storeId, page = 1, pageSize = 20) {
        try {
            const response = await fetch(`${this.baseUrl}/deals?storeID=${storeId}&pageNumber=${page - 1}&pageSize=${pageSize}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const deals = await response.json();
            return deals.map(deal => this.convertDealToGame(deal));
        } catch (error) {
            console.error('CheapShark store games error:', error.message);
            throw new Error('Unable to get games by store from API.');
        }
    }

    // Get games on sale
    async getGamesOnSale(page = 1, pageSize = 20, minSavings = 0) {
        try {
            const response = await fetch(`${this.baseUrl}/deals?onSale=1&sortBy=Savings&desc=1&pageNumber=${page - 1}&pageSize=${pageSize}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const deals = await response.json();
            let filteredDeals = deals;
            
            if (minSavings > 0) {
                filteredDeals = deals.filter(deal => parseFloat(deal.savings) >= minSavings);
            }
            
            return {
                results: filteredDeals.map(deal => this.convertDealToGame(deal)),
                count: filteredDeals.length,
                next: filteredDeals.length === pageSize ? `page=${page + 1}` : null,
                previous: page > 1 ? `page=${page - 1}` : null
            };
        } catch (error) {
            console.error('CheapShark sale games error:', error.message);
            throw new Error('Unable to get games on sale from API. Please try again.');
        }
    }

    // Test API connection
    async testApiConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/deals?pageSize=1`);
            if (response.ok) {
                console.log('✅ CheapShark API is working! Using real game deals data.');
                return true;
            }
        } catch (error) {
            console.error('❌ CheapShark API connection test failed:', error.message);
        }
        return false;
    }
}

// Global instances
const db = new SimpleVectorStore();
const cheapSharkApi = new CheapSharkApiClient();

// Export for modules - Initialize immediately
if (!window.GameHubDB) {
    window.GameHubDB = {};
}

window.GameHubDB.db = db;
window.GameHubDB.gameApi = cheapSharkApi;
window.GameHubDB.SimpleVectorStore = SimpleVectorStore;
window.GameHubDB.CheapSharkApiClient = CheapSharkApiClient;

console.log('🔗 GameHubDB initialized with database and API client');

// Initialize CRUD modules after DOM is loaded and Firebase is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Initializing CRUD modules...');
    
    // Wait for Firebase to be available
    let retries = 0;
    const maxRetries = 100; // 10 seconds max wait
    
    while ((!window.FIREBASE_ENABLED || !window.firebase || !window.firebase.db) && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
        if (retries % 10 === 0) {
            console.log(`⏳ Waiting for Firebase... (${retries}/100)`);
        }
    }
    
    if (!window.FIREBASE_ENABLED || !window.firebase || !window.firebase.db) {
        console.error('❌ Firebase not available after waiting. Cannot initialize CRUD modules.');
        return;
    }
    
    console.log('✅ Firebase is ready, initializing modules...');
    
    // Initialize modules and attach to GameHubDB
    try {
        // Wait for database to be ready
        await db.waitForReady();
        
        // Initialize each module with error handling
        try {
            window.GameHubDB.users = new UsersModule(db);
            console.log('✅ UsersModule initialized');
        } catch (error) {
            console.error('❌ UsersModule failed:', error.message);
        }
        
        try {
            window.GameHubDB.games = new GamesModule(db, cheapSharkApi);
            console.log('✅ GamesModule initialized');
        } catch (error) {
            console.error('❌ GamesModule failed:', error.message);
        }
        
        try {
            window.GameHubDB.reviews = new ReviewsModule(db);
            console.log('✅ ReviewsModule initialized');
        } catch (error) {
            console.error('❌ ReviewsModule failed:', error.message);
        }
        
        try {
            window.GameHubDB.recommendations = new RecommendationsModule(db);
            console.log('✅ RecommendationsModule initialized');
        } catch (error) {
            console.error('❌ RecommendationsModule failed:', error.message);
        }
        
        try {
            window.GameHubDB.tags = new TagsModule(db);
            console.log('✅ TagsModule initialized');
        } catch (error) {
            console.error('❌ TagsModule failed:', error.message);
        }
        
        try {
            window.GameHubDB.moderationLogs = new ModerationLogsModule(db);
            console.log('✅ ModerationLogsModule initialized');
        } catch (error) {
            console.error('❌ ModerationLogsModule failed:', error.message);
        }
        
        console.log('✅ All CRUD modules initialization completed');
        
        // Test database connection with live Firebase stats
        const stats = await db.getStats();
        console.log('📊 Live Firebase statistics:', stats);
        
        // Test API connection
        await cheapSharkApi.testApiConnection();
        
    } catch (error) {
        console.error('❌ Error initializing CRUD modules:', error);
        
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 15px; border-radius: 8px; z-index: 1000; max-width: 300px;">
                <strong>Database Error:</strong><br>
                ${error.message}<br>
                <small>Check console for details</small>
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer;">&times;</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
});
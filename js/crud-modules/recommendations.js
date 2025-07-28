/**
 * Recommendations CRUD Module
 * Manages personalized game recommendations
 */

class RecommendationsModule {
    constructor(database) {
        this.db = database;
        this.collection = 'recommendations';
    }

    // Generate recommendations for a user
    async generateRecommendations(userId) {
        const user = await window.GameHubDB.users?.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get user's reviews to understand preferences
        const userReviews = await window.GameHubDB.reviews?.getReviewsByUser(userId) || [];
        const userGames = userReviews.map(r => r.gameId);
        const likedGames = userReviews.filter(r => r.rating >= 4).map(r => r.gameId);

        // Get all games
        const allGames = await window.GameHubDB.games?.getAllGames() || [];
        
        // Filter out games user already reviewed
        const unplayedGames = allGames.filter(game => !userGames.includes(game.id));

        // Generate recommendations based on preferences
        const recommendations = await this.generateBasedOnPreferences(userId, unplayedGames, likedGames);

        // Save recommendations
        const recommendationRecord = await this.db.create(this.collection, {
            userId: userId,
            recommendations: recommendations.slice(0, 10), // Top 10
            generatedAt: new Date().toISOString(),
            isViewed: false,
            preferences: user.preferences.favoriteGenres || []
        });

        return recommendationRecord;
    }

    // Generate recommendations based on user preferences
    async generateBasedOnPreferences(userId, unplayedGames, likedGameIds) {
        const user = await window.GameHubDB.users?.getUserById(userId);
        const favoriteGenres = user?.preferences?.favoriteGenres || [];
        const likedGames = await Promise.all(
            likedGameIds.map(async id => await window.GameHubDB.games?.getGameById(id))
        );
        const validLikedGames = likedGames.filter(Boolean);

        // Score games based on various factors
        const scoredGames = unplayedGames.map(game => {
            let score = 0;

            // Genre preference score
            if (favoriteGenres.length > 0) {
                const genreMatches = game.genre.filter(g => 
                    favoriteGenres.some(fg => fg.toLowerCase() === g.toLowerCase())
                ).length;
                score += genreMatches * 3;
            }

            // Similar to liked games score
            if (validLikedGames.length > 0) {
                validLikedGames.forEach(likedGame => {
                    const genreOverlap = game.genre.filter(g => likedGame.genre.includes(g)).length;
                    const developerMatch = game.developer === likedGame.developer ? 2 : 0;
                    score += genreOverlap + developerMatch;
                });
            }

            // Rating score
            score += game.localRating || game.rating || 0;

            // Popularity score (review count)
            score += Math.min(game.reviewCount || 0, 5) * 0.5;

            return {
                ...game,
                recommendationScore: score,
                reasons: this.generateReasons(game, favoriteGenres, likedGames)
            };
        });

        // Sort by score and return
        return scoredGames
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .map(game => ({
                gameId: game.id,
                score: game.recommendationScore,
                reasons: game.reasons
            }));
    }

    // Generate reasons for recommendation
    generateReasons(game, favoriteGenres, likedGames) {
        const reasons = [];

        // Genre match reasons
        const matchingGenres = game.genre.filter(g => 
            favoriteGenres.some(fg => fg.toLowerCase() === g.toLowerCase())
        );
        if (matchingGenres.length > 0) {
            reasons.push(`Matches your favorite genres: ${matchingGenres.join(', ')}`);
        }

        // Similar games reasons
        const similarGames = likedGames.filter(likedGame => 
            game.genre.some(g => likedGame.genre.includes(g))
        );
        if (similarGames.length > 0) {
            reasons.push(`Similar to games you liked: ${similarGames.slice(0, 2).map(g => g.name).join(', ')}`);
        }

        // High rating reason
        if ((game.localRating || game.rating || 0) >= 4) {
            reasons.push(`Highly rated (${game.localRating || game.rating}/5)`);
        }

        // Developer reason
        const likedDevelopers = likedGames.map(g => g.developer).filter(Boolean);
        if (likedDevelopers.includes(game.developer)) {
            reasons.push(`From a developer you like: ${game.developer}`);
        }

        return reasons.length > 0 ? reasons : ['Popular in the community'];
    }

    // Get all recommendations
    getAllRecommendations() {
        return this.db.read(this.collection);
    }

    // Get recommendation by ID
    getRecommendationById(id) {
        return this.db.read(this.collection, id);
    }

    // Get recommendations for user
    getRecommendationsForUser(userId) {
        return this.db.query(this.collection, rec => rec.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Get latest recommendations for user
    getLatestRecommendationsForUser(userId) {
        const recommendations = this.getRecommendationsForUser(userId);
        return recommendations.length > 0 ? recommendations[0] : null;
    }

    // Mark recommendations as viewed
    markAsViewed(recommendationId) {
        return this.db.update(this.collection, recommendationId, { isViewed: true });
    }

    // Update recommendation (e.g., user feedback)
    updateRecommendation(id, updateData) {
        return this.db.update(this.collection, id, updateData);
    }

    // Delete recommendation
    deleteRecommendation(id) {
        return this.db.delete(this.collection, id);
    }

    // Clear old recommendations for user
    clearOldRecommendations(userId, keepLatest = 3) {
        const userRecs = this.getRecommendationsForUser(userId);
        if (userRecs.length > keepLatest) {
            const toDelete = userRecs.slice(keepLatest);
            toDelete.forEach(rec => this.deleteRecommendation(rec.id));
        }
    }

    // Get recommendation by game
    getRecommendationsByGame(gameId) {
        return this.db.query(this.collection, rec => 
            rec.recommendations.some(r => r.gameId === gameId)
        );
    }

    // Rate recommendation (user feedback)
    rateRecommendation(recommendationId, gameId, rating, feedback = '') {
        const recommendation = this.getRecommendationById(recommendationId);
        if (!recommendation) {
            throw new Error('Recommendation not found');
        }

        const gameRec = recommendation.recommendations.find(r => r.gameId === gameId);
        if (!gameRec) {
            throw new Error('Game not found in recommendations');
        }

        // Add feedback to the specific game recommendation
        gameRec.userFeedback = {
            rating: rating, // 1-5
            feedback: feedback,
            ratedAt: new Date().toISOString()
        };

        return this.updateRecommendation(recommendationId, { recommendations: recommendation.recommendations });
    }

    // Get recommendation statistics
    getRecommendationStats() {
        const recommendations = this.getAllRecommendations();
        const totalRecs = recommendations.reduce((sum, rec) => sum + rec.recommendations.length, 0);
        const viewedRecs = recommendations.filter(rec => rec.isViewed).length;
        
        return {
            totalUsers: new Set(recommendations.map(r => r.userId)).size,
            totalRecommendations: totalRecs,
            viewedRecommendations: viewedRecs,
            averageRecommendationsPerUser: totalRecs / recommendations.length || 0,
            viewRate: viewedRecs / recommendations.length || 0
        };
    }

    // Generate trending recommendations (popular across users)
    generateTrendingRecommendations() {
        const allRecommendations = this.getAllRecommendations();
        const gameFrequency = {};

        // Count how often each game is recommended
        allRecommendations.forEach(rec => {
            rec.recommendations.forEach(gameRec => {
                if (!gameFrequency[gameRec.gameId]) {
                    gameFrequency[gameRec.gameId] = {
                        count: 0,
                        totalScore: 0,
                        gameId: gameRec.gameId
                    };
                }
                gameFrequency[gameRec.gameId].count++;
                gameFrequency[gameRec.gameId].totalScore += gameRec.score;
            });
        });

        // Sort by frequency and average score
        return Object.values(gameFrequency)
            .sort((a, b) => {
                const aAvgScore = a.totalScore / a.count;
                const bAvgScore = b.totalScore / b.count;
                return (b.count * bAvgScore) - (a.count * aAvgScore);
            })
            .slice(0, 10);
    }
}

// Module will be initialized by database.js

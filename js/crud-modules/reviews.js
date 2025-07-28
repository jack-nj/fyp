/**
 * Reviews CRUD Module
 * Manages user reviews and comments on games
 */

class ReviewsModule {
    constructor(database) {
        this.db = database;
        this.collection = 'reviews';
    }

    // Create new review
    async createReview(reviewData) {
        return await window.GameHubValidation.ErrorHandler.handleAsyncOperation(async () => {
            // Validate review data
            const validationErrors = window.GameHubValidation.DataValidator.validateReviewData(reviewData);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            // Check if user already reviewed this game
            const existing = await this.db.query(this.collection, review => 
                review.gameId === reviewData.gameId && review.userId === reviewData.userId
            );

            if (existing.length > 0) {
                throw new Error('User has already reviewed this game');
            }

            const review = await this.db.create(this.collection, {
                gameId: window.GameHubValidation.DataValidator.sanitizeString(reviewData.gameId),
                userId: window.GameHubValidation.DataValidator.sanitizeString(reviewData.userId),
                rating: parseFloat(reviewData.rating),
                title: window.GameHubValidation.DataValidator.sanitizeString(reviewData.title || ''),
                content: window.GameHubValidation.DataValidator.sanitizeString(reviewData.content || ''),
                isRecommended: reviewData.isRecommended || reviewData.rating >= 4,
                helpful: 0,
                notHelpful: 0,
                isEdited: false,
                isFlagged: false,
                moderationStatus: 'approved' // approved, pending, rejected
            });

            // Update game rating
            await this.updateGameAverageRating(reviewData.gameId);

            return review;
        }, 'Create Review');
    }

    // Get all reviews
    async getAllReviews() {
        return await this.db.read(this.collection);
    }

    // Get review by ID
    async getReviewById(id) {
        return await this.db.read(this.collection, id);
    }

    // Get reviews by game ID
    async getReviewsByGame(gameId) {
        return await this.db.query(this.collection, review => review.gameId === gameId);
    }

    // Get reviews by user ID
    async getReviewsByUser(userId) {
        return await this.db.query(this.collection, review => review.userId === userId);
    }

    // Update review
    async updateReview(id, updateData, userId) {
        const review = await this.getReviewById(id);
        if (!review) {
            throw new Error('Review not found');
        }

        // Check if user owns the review
        if (review.userId !== userId) {
            throw new Error('Unauthorized to edit this review');
        }

        // Mark as edited if content changed
        if (updateData.content || updateData.title || updateData.rating) {
            updateData.isEdited = true;
        }

        const updatedReview = await this.db.update(this.collection, id, updateData);

        // Update game rating if rating changed
        if (updateData.rating) {
            await this.updateGameAverageRating(review.gameId);
        }

        return updatedReview;
    }

    // Delete review
    async deleteReview(id, userId, isAdmin = false) {
        const review = await this.getReviewById(id);
        if (!review) {
            throw new Error('Review not found');
        }

        // Check permissions
        if (!isAdmin && review.userId !== userId) {
            throw new Error('Unauthorized to delete this review');
        }

        const gameId = review.gameId;
        const deleted = await this.db.delete(this.collection, id);

        if (deleted) {
            // Update game rating
            await this.updateGameAverageRating(gameId);
        }

        return deleted;
    }

    // Search reviews
    async searchReviews(searchTerm) {
        return await this.db.search(this.collection, searchTerm, ['title', 'content']);
    }

    // Mark review as helpful/not helpful
    async markReviewHelpful(reviewId, isHelpful) {
        const review = await this.getReviewById(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        const updateData = {};
        if (isHelpful) {
            updateData.helpful = (review.helpful || 0) + 1;
        } else {
            updateData.notHelpful = (review.notHelpful || 0) + 1;
        }

        return await this.db.update(this.collection, reviewId, updateData);
    }

    // Flag review for moderation
    async flagReview(reviewId, reason = '') {
        const review = await this.getReviewById(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        return await this.db.update(this.collection, reviewId, {
            isFlagged: true,
            flagReason: reason,
            moderationStatus: 'pending'
        });
    }

    // Moderate review (admin only)
    async moderateReview(reviewId, status, moderatorNotes = '') {
        const review = await this.getReviewById(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        return await this.db.update(this.collection, reviewId, {
            moderationStatus: status,
            moderatorNotes,
            isFlagged: status === 'rejected'
        });
    }

    // Get reviews pending moderation
    async getPendingReviews() {
        return await this.db.query(this.collection, review => 
            review.moderationStatus === 'pending' || review.isFlagged
        );
    }

    // Update game average rating
    async updateGameAverageRating(gameId) {
        // This method calculates game ratings but doesn't store them on the game object
        // since our simplified schema doesn't include rating storage on games
        const gameReviews = await this.getReviewsByGame(gameId);
        const approvedReviews = gameReviews.filter(r => r.moderationStatus === 'approved');
        
        if (approvedReviews.length === 0) {
            // No reviews, so no rating to calculate
            return { averageRating: 0, reviewCount: 0 };
        }

        const averageRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length;
        
        return {
            averageRating: Math.round(averageRating * 10) / 10,
            reviewCount: approvedReviews.length
        };
    }

    // Get top reviews (most helpful)
    async getTopReviews(limit = 10) {
        const allReviews = await this.getAllReviews();
        return allReviews
            .filter(review => review.moderationStatus === 'approved')
            .sort((a, b) => ((b.helpful || 0) - (b.notHelpful || 0)) - ((a.helpful || 0) - (a.notHelpful || 0)))
            .slice(0, limit);
    }

    // Get recent reviews
    async getRecentReviews(limit = 10) {
        const allReviews = await this.getAllReviews();
        return allReviews
            .filter(review => review.moderationStatus === 'approved')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    // Get review statistics
    async getReviewStats() {
        const reviews = await this.getAllReviews();
        const approved = reviews.filter(r => r.moderationStatus === 'approved');
        
        return {
            total: reviews.length,
            approved: approved.length,
            pending: reviews.filter(r => r.moderationStatus === 'pending').length,
            flagged: reviews.filter(r => r.isFlagged).length,
            averageRating: approved.reduce((sum, r) => sum + r.rating, 0) / approved.length || 0,
            recommended: approved.filter(r => r.isRecommended).length
        };
    }
}

// Module will be initialized by database.js

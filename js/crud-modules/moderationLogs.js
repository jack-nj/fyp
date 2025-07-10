/**
 * Moderation Logs CRUD Module
 * Manages system analysis, sentiment tracking, and moderation logs
 */

class ModerationLogsModule {
    constructor(database) {
        this.db = database;
        this.collection = 'moderationLogs';
    }

    // Create moderation log entry
    createLog(logData) {
        // Validate required fields
        if (!logData.type || !logData.targetId) {
            throw new Error('Log type and target ID are required');
        }

        const log = this.db.create(this.collection, {
            type: logData.type, // 'review_moderation', 'sentiment_analysis', 'user_action', 'system_event'
            targetType: logData.targetType || 'unknown', // 'review', 'user', 'game', 'system'
            targetId: logData.targetId,
            action: logData.action || 'unknown',
            moderatorId: logData.moderatorId || null,
            reason: logData.reason || '',
            details: logData.details || {},
            severity: logData.severity || 'low', // low, medium, high, critical
            status: logData.status || 'active', // active, resolved, ignored
            sentiment: logData.sentiment || null, // positive, neutral, negative
            confidence: logData.confidence || null, // 0-1 for ML confidence scores
            automated: logData.automated || false
        });

        return log;
    }

    // Get all logs
    async getAllLogs() {
        return await this.db.read(this.collection);
    }

    // Get log by ID
    getLogById(id) {
        return this.db.read(this.collection, id);
    }

    // Get logs by type
    getLogsByType(type) {
        return this.db.query(this.collection, log => log.type === type);
    }

    // Get logs by target
    getLogsByTarget(targetType, targetId) {
        return this.db.query(this.collection, log => 
            log.targetType === targetType && log.targetId === targetId
        );
    }

    // Get logs by moderator
    getLogsByModerator(moderatorId) {
        return this.db.query(this.collection, log => log.moderatorId === moderatorId);
    }

    // Update log
    updateLog(id, updateData) {
        const log = this.getLogById(id);
        if (!log) {
            throw new Error('Log not found');
        }

        return this.db.update(this.collection, id, updateData);
    }

    // Delete log
    deleteLog(id) {
        return this.db.delete(this.collection, id);
    }

    // Perform sentiment analysis on text (simplified)
    analyzeSentiment(text) {
        if (!text || typeof text !== 'string') {
            return { sentiment: 'neutral', confidence: 0 };
        }

        const positiveWords = [
            'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'love', 'perfect',
            'wonderful', 'brilliant', 'outstanding', 'superb', 'incredible', 'beautiful',
            'fun', 'enjoyable', 'exciting', 'good', 'nice', 'cool', 'best'
        ];

        const negativeWords = [
            'terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'disgusting',
            'disappointing', 'boring', 'annoying', 'frustrating', 'broken', 'buggy',
            'waste', 'useless', 'poor', 'lacking', 'failed', 'sucks', 'trash'
        ];

        const words = text.toLowerCase().split(/\W+/);
        let positiveScore = 0;
        let negativeScore = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        });

        const totalScore = positiveScore + negativeScore;
        if (totalScore === 0) {
            return { sentiment: 'neutral', confidence: 0.5 };
        }

        const sentimentRatio = (positiveScore - negativeScore) / totalScore;
        let sentiment = 'neutral';
        let confidence = Math.abs(sentimentRatio);

        if (sentimentRatio > 0.2) {
            sentiment = 'positive';
        } else if (sentimentRatio < -0.2) {
            sentiment = 'negative';
        }

        return { sentiment, confidence: Math.min(confidence, 1) };
    }

    // Log review sentiment analysis
    logReviewSentiment(reviewId, reviewText) {
        const analysis = this.analyzeSentiment(reviewText);
        
        return this.createLog({
            type: 'sentiment_analysis',
            targetType: 'review',
            targetId: reviewId,
            action: 'sentiment_analyzed',
            details: {
                originalText: reviewText.substring(0, 200), // Store first 200 chars
                analysis: analysis
            },
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            automated: true
        });
    }

    // Log user action
    logUserAction(userId, action, details = {}) {
        return this.createLog({
            type: 'user_action',
            targetType: 'user',
            targetId: userId,
            action: action,
            details: details,
            automated: true
        });
    }

    // Log moderation action
    logModerationAction(moderatorId, targetType, targetId, action, reason) {
        return this.createLog({
            type: 'review_moderation',
            targetType: targetType,
            targetId: targetId,
            action: action,
            moderatorId: moderatorId,
            reason: reason,
            severity: 'medium',
            automated: false
        });
    }

    // Log system event
    logSystemEvent(event, details = {}) {
        return this.createLog({
            type: 'system_event',
            targetType: 'system',
            targetId: 'system',
            action: event,
            details: details,
            automated: true
        });
    }

    // Get flagged content
    getFlaggedContent() {
        return this.db.query(this.collection, log => 
            log.type === 'review_moderation' && 
            (log.action === 'flagged' || log.severity === 'high')
        );
    }

    // Get recent activity
    async getRecentActivity(limit = 50) {
        const allLogs = await this.getAllLogs();
        return allLogs
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    // Get sentiment trends
    getSentimentTrends(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const sentimentLogs = this.db.query(this.collection, log => 
            log.type === 'sentiment_analysis' && 
            new Date(log.createdAt) >= cutoffDate
        );

        const trends = {
            positive: 0,
            neutral: 0,
            negative: 0,
            total: sentimentLogs.length
        };

        sentimentLogs.forEach(log => {
            if (log.sentiment) {
                trends[log.sentiment]++;
            }
        });

        return trends;
    }

    // Mark log as resolved
    resolveLog(id, resolution = '') {
        return this.updateLog(id, {
            status: 'resolved',
            resolution: resolution,
            resolvedAt: new Date().toISOString()
        });
    }

    // Get unresolved issues
    getUnresolvedIssues() {
        return this.db.query(this.collection, log => 
            log.status === 'active' && 
            (log.severity === 'high' || log.severity === 'critical')
        );
    }

    // Clean old logs
    cleanOldLogs(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const oldLogs = this.db.query(this.collection, log => 
            new Date(log.createdAt) < cutoffDate &&
            log.status === 'resolved'
        );

        let deletedCount = 0;
        oldLogs.forEach(log => {
            if (this.deleteLog(log.id)) {
                deletedCount++;
            }
        });

        this.logSystemEvent('log_cleanup', {
            deletedCount: deletedCount,
            cutoffDate: cutoffDate.toISOString()
        });

        return deletedCount;
    }

    // Get moderation statistics
    getModerationStats() {
        const logs = this.getAllLogs();
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = {
            total: logs.length,
            byType: {},
            bySeverity: {},
            byStatus: {},
            recentActivity: {
                lastWeek: logs.filter(l => new Date(l.createdAt) >= lastWeek).length,
                lastMonth: logs.filter(l => new Date(l.createdAt) >= lastMonth).length
            },
            sentiment: this.getSentimentTrends(30)
        };

        logs.forEach(log => {
            // Count by type
            stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
            
            // Count by severity
            stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
            
            // Count by status
            stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
        });

        return stats;
    }

    // Auto-moderate content based on patterns
    autoModerate(content, contentType, contentId) {
        const analysis = this.analyzeSentiment(content);
        
        // Check for spam patterns
        const spamIndicators = [
            /(.)\1{4,}/g, // Repeated characters
            /(https?:\/\/[^\s]+)/g, // URLs
            /[A-Z]{10,}/g, // Excessive caps
            /(.{1,10})\1{3,}/g // Repeated phrases
        ];

        let isSpam = false;
        let spamReasons = [];

        spamIndicators.forEach((pattern, index) => {
            if (pattern.test(content)) {
                isSpam = true;
                spamReasons.push([
                    'repeated_characters',
                    'suspicious_links',
                    'excessive_caps',
                    'repeated_phrases'
                ][index]);
            }
        });

        // Log the analysis
        const logData = {
            type: 'sentiment_analysis',
            targetType: contentType,
            targetId: contentId,
            action: 'auto_moderated',
            details: {
                sentiment: analysis,
                spamDetection: {
                    isSpam: isSpam,
                    reasons: spamReasons
                }
            },
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            severity: isSpam ? 'high' : (analysis.sentiment === 'negative' && analysis.confidence > 0.7 ? 'medium' : 'low'),
            automated: true
        };

        this.createLog(logData);

        return {
            approved: !isSpam && !(analysis.sentiment === 'negative' && analysis.confidence > 0.8),
            needsReview: isSpam || (analysis.sentiment === 'negative' && analysis.confidence > 0.6),
            analysis: analysis,
            spamDetection: { isSpam, reasons: spamReasons }
        };
    }
}

// Module will be initialized by database.js

/**
 * GameHub Data Validation and Error Handling Utilities
 * Provides comprehensive validation for all data operations
 */

class DataValidator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        // At least 6 characters
        return password && password.length >= 6;
    }

    static validateRating(rating) {
        const numRating = parseFloat(rating);
        return !isNaN(numRating) && numRating >= 1 && numRating <= 5;
    }

    static validateGameData(gameData) {
        const errors = [];
        
        if (!gameData.title || gameData.title.trim() === '') {
            errors.push('Game title is required');
        }
        
        if (!gameData.developer || gameData.developer.trim() === '') {
            errors.push('Game developer is required');
        }
        
        return errors;
    }

    static validateUserData(userData) {
        const errors = [];
        
        if (!userData.username || userData.username.trim() === '') {
            errors.push('Username is required');
        }
        
        if (!userData.email || !this.validateEmail(userData.email)) {
            errors.push('Valid email is required');
        }
        
        if (!userData.password || !this.validatePassword(userData.password)) {
            errors.push('Password must be at least 6 characters');
        }
        
        return errors;
    }

    static validateReviewData(reviewData) {
        const errors = [];
        
        if (!reviewData.gameId || reviewData.gameId.trim() === '') {
            errors.push('Game ID is required');
        }
        
        if (!reviewData.userId || reviewData.userId.trim() === '') {
            errors.push('User ID is required');
        }
        
        if (!this.validateRating(reviewData.rating)) {
            errors.push('Rating must be between 1 and 5');
        }
        
        return errors;
    }

    static sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>\"']/g, '');
    }

    static sanitizeArray(arr) {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => item && typeof item === 'string').map(item => this.sanitizeString(item));
    }
}

class ErrorHandler {
    static logError(error, context = '') {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ${context}:`, error);
        
        // Log to moderation system if available
        if (window.GameHubDB && window.GameHubDB.moderationLogs) {
            try {
                window.GameHubDB.moderationLogs.logSystemEvent('error', {
                    message: error.message,
                    context: context,
                    timestamp: timestamp,
                    stack: error.stack
                });
            } catch (logError) {
                console.warn('Failed to log error to moderation system:', logError);
            }
        }
    }

    static showUserError(message, type = 'error') {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'}; 
                color: ${type === 'warning' ? '#000' : '#fff'}; 
                padding: 15px; 
                border-radius: 8px; 
                z-index: 1000; 
                max-width: 300px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            ">
                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong><br>
                ${message}
                <button onclick="this.parentElement.parentElement.remove()" style="
                    float: right; 
                    background: none; 
                    border: none; 
                    color: inherit; 
                    font-size: 18px; 
                    cursor: pointer; 
                    margin-left: 10px;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    static async handleAsyncOperation(operation, context = '') {
        try {
            return await operation();
        } catch (error) {
            this.logError(error, context);
            this.showUserError(error.message);
            throw error;
        }
    }
}

// Make utilities available globally
window.GameHubValidation = {
    DataValidator,
    ErrorHandler
};

console.log('✅ Data validation utilities loaded');

/**
 * Users CRUD Module
 * Manages user accounts, authentication, and profiles
 */

class UsersModule {
    constructor(database) {
        this.db = database;
        this.currentUser = this.loadCurrentUser();
        this.collection = 'users';
    }

    // Load current user from session storage
    loadCurrentUser() {
        const stored = sessionStorage.getItem('gamehub_current_user');
        return stored ? JSON.parse(stored) : null;
    }

    // Save current user to session storage
    saveCurrentUser(user) {
        if (user) {
            sessionStorage.setItem('gamehub_current_user', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('gamehub_current_user');
        }
        this.currentUser = user;
    }

    // Create new user
    async createUser(userData) {
        return await window.GameHubValidation.ErrorHandler.handleAsyncOperation(async () => {
            // Validate user data
            const validationErrors = window.GameHubValidation.DataValidator.validateUserData(userData);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            // Check if username or email already exists
            const existingUser = await this.db.query(this.collection, user => 
                user.username === userData.username || user.email === userData.email
            );

            if (existingUser.length > 0) {
                throw new Error('Username or email already exists');
            }

            // Create user with default values
            const user = await this.db.create(this.collection, {
                username: window.GameHubValidation.DataValidator.sanitizeString(userData.username),
                email: window.GameHubValidation.DataValidator.sanitizeString(userData.email),
                password: userData.password, // Should be hashed in real app
                role: userData.role || 'user',
                displayName: window.GameHubValidation.DataValidator.sanitizeString(userData.displayName || userData.username),
                isActive: true
            });

            return user;
        }, 'Create User');
    }

    // Get all users
    async getAllUsers() {
        return await this.db.read(this.collection);
    }

    // Get user by ID
    async getUserById(id) {
        return await this.db.read(this.collection, id);
    }

    // Get user by username
    async getUserByUsername(username) {
        const users = await this.db.query(this.collection, user => user.username === username);
        return users.length > 0 ? users[0] : null;
    }

    // Update user
    async updateUser(id, updateData) {
        const user = await this.getUserById(id);
        if (!user) {
            throw new Error('User not found');
        }

        // Don't allow updating username or email to existing ones
        if (updateData.username && updateData.username !== user.username) {
            const existing = await this.getUserByUsername(updateData.username);
            if (existing) {
                throw new Error('Username already exists');
            }
        }

        // Update user
        const updatedUser = await this.db.update(this.collection, id, updateData);
        
        // Update current user if it's the same user
        if (this.currentUser && this.currentUser.id === id) {
            this.saveCurrentUser(updatedUser);
        }

        return updatedUser;
    }

    // Delete user
    async deleteUser(id) {
        const user = await this.getUserById(id);
        if (!user) {
            throw new Error('User not found');
        }

        // Logout if deleting current user
        if (this.currentUser && this.currentUser.id === id) {
            this.logout();
        }

        return await this.db.delete(this.collection, id);
    }

    // Simple login (for demo purposes)
    async login(username) {
        const user = await this.getUserByUsername(username);
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isActive) {
            throw new Error('User account is inactive');
        }

        this.saveCurrentUser(user);
        return user;
    }

    // Logout
    logout() {
        this.saveCurrentUser(null);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Check if user is admin
    isAdmin(userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        return user && user.role === 'admin';
    }

    // Search users
    searchUsers(searchTerm) {
        return this.db.search(this.collection, searchTerm, ['username', 'displayName', 'email']);
    }

    // Update user stats
    updateUserStats(userId, statsUpdate) {
        const user = this.getUserById(userId);
        if (!user) return null;

        const newStats = { ...user.stats, ...statsUpdate };
        return this.updateUser(userId, { stats: newStats });
    }

    // Get users by role
    getUsersByRole(role) {
        return this.db.query(this.collection, user => user.role === role);
    }

    // Toggle user active status
    toggleUserStatus(id) {
        const user = this.getUserById(id);
        if (!user) {
            throw new Error('User not found');
        }

        return this.updateUser(id, { isActive: !user.isActive });
    }

    // Get user statistics
    getUserStats() {
        const users = this.getAllUsers();
        return {
            total: users.length,
            active: users.filter(u => u.isActive).length,
            admins: users.filter(u => u.role === 'admin').length,
            regular: users.filter(u => u.role === 'user').length
        };
    }
}

// Module will be initialized by database.js
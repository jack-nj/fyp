/**
 * GameHub Local - Main Application JavaScript
 * Handles UI interactions, data binding, and application logic
 */

class GameHubApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Initialize event listeners
        this.initEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Update UI
        this.updateUserInterface();
        this.showPage('dashboard');
        
        // Show welcome message
        setTimeout(() => {
            this.showNotification('Welcome to GameHub Local! Connected to CheapShark API with real PC game deals.', 'success');
        }, 1000);
        
        // Log app start
        window.GameHubDB.moderationLogs.logSystemEvent('app_started', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            dataSource: 'cheapshark'
        });
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
            });
        });

        // Login/Logout
        document.getElementById('loginBtn').addEventListener('click', () => {
            if (this.currentUser) {
                this.logout();
            } else {
                this.showModal('loginModal');
            }
        });

        // Forms
        this.initFormHandlers();

        // Search and filters
        this.initSearchFilters();

        // Tab switching
        this.initTabSwitching();

        // Window close handler
        window.addEventListener('beforeunload', () => {
            if (this.currentUser) {
                window.GameHubDB.moderationLogs.logUserAction(
                    this.currentUser.id, 
                    'session_ended'
                );
            }
        });
    }

    initFormHandlers() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Add game form
        document.getElementById('addGameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddGame();
        });

        // Edit game form
        document.getElementById('editGameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditGame();
        });

        // Add review form
        document.getElementById('addReviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddReview();
        });

        // Edit review form
        document.getElementById('editReviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditReview();
        });

        // Add user form
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser();
        });

        // Add tag form
        document.getElementById('addTagForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTag();
        });
    }

    initSearchFilters() {
        // Games search
        document.getElementById('gamesSearch').addEventListener('input', (e) => {
            this.filterGames();
        });

        // Reviews search
        document.getElementById('reviewsSearch').addEventListener('input', (e) => {
            this.filterReviews();
        });

        // Users search
        document.getElementById('usersSearch').addEventListener('input', (e) => {
            this.filterUsers();
        });

        // Tags search
        document.getElementById('tagsSearch').addEventListener('input', (e) => {
            this.filterTags();
        });

        // Filter selects
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    initTabSwitching() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.showTab(tab);
            });
        });
    }

    async loadInitialData() {
        try {
            this.showLoading(true);

            // Wait for GameHubDB to be ready first
            console.log('⏳ Waiting for GameHubDB to be ready...');
            if (window.GameHubDB && window.GameHubDB.db) {
                await window.GameHubDB.db.waitForReady();
                console.log('✅ GameHubDB is ready');
            } else {
                throw new Error('GameHubDB not available');
            }

            // Test API connection and update status
            await this.checkApiStatus();

            // Create demo user if no users exist - FIXED: Added await
            const users = await window.GameHubDB.users.getAllUsers();
            console.log(`📊 Found ${users.length} users in database`);
            
            if (users.length === 0) {
                console.log('📝 No users found, creating demo data...');
                await this.createDemoData();
            }

            // Load current user
            this.currentUser = window.GameHubDB.users.getCurrentUser();

            // Update tag game counts
            await window.GameHubDB.tags.updateAllTagGameCounts();

            console.log('✅ Initial data loaded successfully');

        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.showNotification(`Error loading application data: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async checkApiStatus() {
        const isApiWorking = await window.GameHubDB.gameApi.testApiConnection();
        this.updateApiStatus(isApiWorking);
    }

    updateApiStatus(isApiWorking) {
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            if (isApiWorking) {
                apiStatus.innerHTML = '<i class="fas fa-globe"></i> Using CheapShark API';
                apiStatus.style.color = 'var(--success-color)';
            } else {
                apiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> API Connection Failed';
                apiStatus.style.color = 'var(--error-color)';
            }
        }
    }

    async createDemoData() {
        try {
            // Create demo admin user
            const adminUser = window.GameHubDB.users.createUser({
                username: 'admin',
                email: 'admin@gamehub.local',
                displayName: 'Administrator',
                role: 'admin'
            });

            // Create demo regular user
            const demoUser = window.GameHubDB.users.createUser({
                username: 'demo',
                email: 'demo@gamehub.local',
                displayName: 'Demo User',
                role: 'user',
                preferences: {
                    favoriteGenres: ['Action', 'RPG', 'Strategy'],
                    privacy: 'public'
                }
            });

            // Add some demo games with simplified schema
            const demoGames = [
                {
                    title: 'The Witcher 3: Wild Hunt',
                    description: 'An epic open-world RPG adventure with rich storytelling and meaningful choices.',
                    genre: ['RPG', 'Adventure'],
                    platform: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
                    developer: 'CD Projekt Red',
                    image: '',
                    status: 'available'
                },
                {
                    title: 'Minecraft',
                    description: 'A sandbox game where creativity and survival meet in infinite procedural worlds.',
                    genre: ['Simulation', 'Indie', 'Sandbox'],
                    platform: ['PC', 'Mobile', 'PlayStation', 'Xbox', 'Nintendo Switch'],
                    developer: 'Mojang Studios',
                    image: '',
                    status: 'available'
                },
                {
                    title: 'Hades',
                    description: 'A rogue-like dungeon crawler with incredible art, music, and narrative.',
                    genre: ['Action', 'Indie', 'Rogue-like'],
                    platform: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
                    developer: 'Supergiant Games',
                    image: '',
                    status: 'available'
                },
                {
                    title: 'Among Us',
                    description: 'A multiplayer social deduction game of teamwork and betrayal.',
                    genre: ['Strategy', 'Indie', 'Party'],
                    platform: ['PC', 'Mobile', 'PlayStation', 'Xbox', 'Nintendo Switch'],
                    developer: 'InnerSloth',
                    image: '',
                    status: 'available'
                }
            ];

            for (const gameData of demoGames) {
                window.GameHubDB.games.addGame(gameData);
            }

            // Add multiple sample reviews
            const games = await window.GameHubDB.games.getAllGames();
            if (games.length > 0) {
                // Review 1: The Witcher 3 by Demo User
                const review1 = {
                    gameId: games[0].id, // The Witcher 3
                    userId: demoUser.id,
                    rating: 5,
                    title: "Absolutely Amazing RPG!",
                    content: "The Witcher 3 is hands down one of the best RPGs ever made. The story is engaging, the world is vast and beautiful, and the characters are well-developed. I've spent over 100 hours in this world and still discovering new things. Highly recommended for any RPG fan!",
                    moderationStatus: 'approved',
                    helpful: 12,
                    notHelpful: 1
                };
                
                const createdReview1 = window.GameHubDB.reviews.createReview(review1);
                console.log('Sample review 1 created:', createdReview1.id);
                window.GameHubDB.moderationLogs.logReviewSentiment(createdReview1.id, review1.content);

                // Review 2: Minecraft by Admin User
                if (games.length > 1) {
                    const review2 = {
                        gameId: games[1].id, // Minecraft
                        userId: adminUser.id,
                        rating: 4,
                        title: "Creative and Endless Fun",
                        content: "Minecraft offers unlimited creativity and exploration. Perfect for both casual building and survival challenges. The modding community is fantastic, and updates keep adding fresh content. Great for all ages!",
                        moderationStatus: 'approved',
                        helpful: 8,
                        notHelpful: 0
                    };
                    
                    const createdReview2 = window.GameHubDB.reviews.createReview(review2);
                    console.log('Sample review 2 created:', createdReview2.id);
                    window.GameHubDB.moderationLogs.logReviewSentiment(createdReview2.id, review2.content);
                }

                // Review 3: Hades by Demo User
                if (games.length > 2) {
                    const review3 = {
                        gameId: games[2].id, // Hades
                        userId: demoUser.id,
                        rating: 5,
                        title: "Masterpiece of Game Design",
                        content: "Hades combines incredible storytelling with addictive gameplay. Every death feels like progress, and the voice acting is top-notch. Supergiant Games has outdone themselves with this one. The art style and soundtrack are phenomenal!",
                        moderationStatus: 'approved',
                        helpful: 15,
                        notHelpful: 0
                    };
                    
                    const createdReview3 = window.GameHubDB.reviews.createReview(review3);
                    console.log('Sample review 3 created:', createdReview3.id);
                    window.GameHubDB.moderationLogs.logReviewSentiment(createdReview3.id, review3.content);
                }

                // Review 4: Among Us by Admin User
                if (games.length > 3) {
                    const review4 = {
                        gameId: games[3].id, // Among Us
                        userId: adminUser.id,
                        rating: 3,
                        title: "Fun with Friends",
                        content: "Among Us is great for party games with friends. Simple mechanics but requires good communication and deduction skills. Can get repetitive after a while, but updates have added new content.",
                        moderationStatus: 'approved',
                        helpful: 6,
                        notHelpful: 2
                    };
                    
                    const createdReview4 = window.GameHubDB.reviews.createReview(review4);
                    console.log('Sample review 4 created:', createdReview4.id);
                    window.GameHubDB.moderationLogs.logReviewSentiment(createdReview4.id, review4.content);
                }
            }

            // Generate sample recommendations for both users
            if (games.length > 1) {
                // Generate recommendations for demo user
                try {
                    const demoRecommendations = window.GameHubDB.recommendations.generateRecommendations(demoUser.id);
                    console.log('Demo user recommendations generated:', demoRecommendations.id);
                    
                    // Also create a manual recommendation set for admin user
                    const adminRecommendationData = {
                        userId: adminUser.id,
                        algorithm: 'content_based',
                        recommendations: [
                            {
                                gameId: games[0].id, // The Witcher 3
                                score: 0.92,
                                reasons: [
                                    'High-rated RPG with excellent story',
                                    'Matches your preference for quality games',
                                    'Similar to games you\'ve reviewed positively'
                                ]
                            },
                            {
                                gameId: games[2].id, // Hades
                                score: 0.88,
                                reasons: [
                                    'Award-winning indie game',
                                    'Excellent gameplay mechanics',
                                    'Highly rated by similar users'
                                ]
                            }
                        ]
                    };
                    
                    const adminRecommendations = window.GameHubDB.recommendations.createRecommendation(adminRecommendationData);
                    console.log('Admin user recommendations created:', adminRecommendations.id);
                    
                } catch (error) {
                    console.log('Could not generate recommendations:', error.message);
                }
            }

            console.log('Demo data created successfully');

        } catch (error) {
            console.error('Error creating demo data:', error);
        }
    }

    showPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        this.currentPage = pageId;

        // Load page-specific data
        this.loadPageData(pageId);

        // Log page view
        if (this.currentUser) {
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'page_viewed', 
                { page: pageId }
            );
        }
    }

    async loadPageData(pageId) {
        try {
            switch (pageId) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'games':
                    await this.loadGames();
                    break;
                case 'reviews':
                    await this.loadReviews();
                    break;
                case 'recommendations':
                    await this.loadRecommendations();
                    break;
                case 'tags':
                    await this.loadTags();
                    break;
                case 'moderation':
                    await this.loadModeration();
                    break;
                case 'users':
                    await this.loadUsers();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${pageId} data:`, error);
            this.showNotification(`Error loading ${pageId} data`, 'error');
        }
    }

    async loadDashboard() {
        // Update statistics
        const stats = {
            games: (await window.GameHubDB.games.getAllGames()).length,
            reviews: (await window.GameHubDB.reviews.getAllReviews()).length,
            users: (await window.GameHubDB.users.getAllUsers()).filter(u => u.isActive).length,
            tags: (await window.GameHubDB.tags.getActiveTags()).length
        };

        document.getElementById('statsGames').textContent = stats.games;
        document.getElementById('statsReviews').textContent = stats.reviews;
        document.getElementById('statsUsers').textContent = stats.users;
        document.getElementById('statsTags').textContent = stats.tags;

        // Load recent activity
        await this.loadRecentActivity();
    }

    async loadRecentActivity() {
        const recentLogs = await window.GameHubDB.moderationLogs.getRecentActivity(10);
        const activityFeed = document.getElementById('activityFeed');
        
        if (recentLogs.length === 0) {
            activityFeed.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No recent activity</p>';
            return;
        }

        activityFeed.innerHTML = recentLogs.map(log => {
            const timeAgo = this.timeAgo(new Date(log.createdAt));
            const iconColor = this.getActivityIconColor(log.type);
            const icon = this.getActivityIcon(log.type);

            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${iconColor}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${this.formatActivityMessage(log)}</p>
                        <small>${timeAgo}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadGames() {
        const games = await window.GameHubDB.games.getAllGames();
        this.renderGames(games);
        this.loadGameFilters();
    }

    renderGames(games) {
        const gamesGrid = document.getElementById('gamesGrid');
        
        if (games.length === 0) {
            gamesGrid.innerHTML = `
                <div class="col-span-full text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <i class="fas fa-gamepad" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No games in your library yet. Add some games to get started!</p>
                </div>
            `;
            return;
        }

        gamesGrid.innerHTML = games.map(game => {
            // Calculate rating from reviews
            const gameRating = this.calculateGameRating(game.id);
            
            return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-image">
                    ${game.image ? 
                        `<img src="${game.image}" alt="${game.title}" onerror="this.style.display='none'">` : 
                        `<i class="fas fa-gamepad"></i>`
                    }
                </div>
                <div class="game-content">
                    <h3 class="game-title">${game.title}</h3>
                    <div class="game-meta">
                        <div class="game-rating">
                            <i class="fas fa-star"></i>
                            <span>${gameRating.averageRating > 0 ? gameRating.averageRating : 'N/A'}</span>
                        </div>
                        <span class="game-genre">${game.genre.slice(0, 2).join(', ')}</span>
                    </div>
                    <p class="game-description">${game.description || 'No description available.'}</p>
                    <div class="game-actions">
                        <button class="btn-icon" onclick="app.editGame('${game.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="app.deleteGame('${game.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    calculateGameRating(gameId) {
        if (!window.GameHubDB.reviews) {
            return { averageRating: 0, reviewCount: 0 };
        }
        
        return window.GameHubDB.reviews.updateGameAverageRating(gameId);
    }

    loadGameFilters() {
        const games = window.GameHubDB.games.getAllGames();
        const genres = [...new Set(games.flatMap(g => g.genre))].sort();
        const platforms = [...new Set(games.flatMap(g => g.platform))].sort();

        const genreSelect = document.getElementById('gamesGenreFilter');
        const platformSelect = document.getElementById('gamesPlatformFilter');

        genreSelect.innerHTML = '<option value="">All Genres</option>' + 
            genres.map(genre => `<option value="${genre}">${genre}</option>`).join('');

        platformSelect.innerHTML = '<option value="">All Platforms</option>' + 
            platforms.map(platform => `<option value="${platform}">${platform}</option>`).join('');
    }

    async loadReviews() {
        const allReviews = await window.GameHubDB.reviews.getAllReviews();
        const reviews = allReviews
            .filter(r => r.moderationStatus === 'approved')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        this.renderReviews(reviews);
        this.loadReviewFilters();
    }

    renderReviews(reviews) {
        const reviewsList = document.getElementById('reviewsList');
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-star" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No reviews yet. Be the first to write a review!</p>
                </div>
            `;
            return;
        }

        reviewsList.innerHTML = reviews.map(review => {
            const game = window.GameHubDB.games.getGameById(review.gameId);
            const user = window.GameHubDB.users.getUserById(review.userId);
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

            return `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-info">
                            <h3>${review.title || 'Review'}</h3>
                            <div class="review-meta">
                                <span>Game: ${game?.title || 'Unknown'}</span>
                                <span>•</span>
                                <span>By: ${user?.displayName || 'Unknown'}</span>
                                <span>•</span>
                                <span>${this.formatDate(review.createdAt)}</span>
                            </div>
                        </div>
                        <div class="review-rating">
                            <div class="stars">${stars}</div>
                            <span>${review.rating}/5</span>
                        </div>
                    </div>
                    <div class="review-content">
                        ${review.content || 'No review content.'}
                    </div>
                    <div class="review-actions">
                        <button class="btn-icon" onclick="app.markReviewHelpful('${review.id}', true)">
                            <i class="fas fa-thumbs-up"></i> ${review.helpful || 0}
                        </button>
                        <button class="btn-icon" onclick="app.markReviewHelpful('${review.id}', false)">
                            <i class="fas fa-thumbs-down"></i> ${review.notHelpful || 0}
                        </button>
                        ${this.currentUser && (this.currentUser.id === review.userId || this.currentUser.role === 'admin') ? `
                            <button class="btn-icon" onclick="app.editReview('${review.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="app.deleteReview('${review.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadReviewFilters() {
        const games = window.GameHubDB.games.getAllGames();
        const gameSelect = document.getElementById('reviewsGameFilter');
        const reviewGameSelect = document.getElementById('reviewGame');

        const gameOptions = games.map(game => 
            `<option value="${game.id}">${game.title}</option>`
        ).join('');

        gameSelect.innerHTML = '<option value="">All Games</option>' + gameOptions;
        reviewGameSelect.innerHTML = '<option value="">Select a game</option>' + gameOptions;
    }

    loadRecommendations() {
        if (!this.currentUser) {
            document.getElementById('recommendationsContent').innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-user-lock" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">Please login to view personalized recommendations.</p>
                </div>
            `;
            return;
        }

        const recommendations = window.GameHubDB.recommendations.getLatestRecommendationsForUser(this.currentUser.id);
        this.renderRecommendations(recommendations);
    }

    renderRecommendations(recommendations) {
        const content = document.getElementById('recommendationsContent');
        
        if (!recommendations || recommendations.recommendations.length === 0) {
            content.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-lightbulb" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No recommendations yet. Generate some based on your preferences!</p>
                </div>
            `;
            return;
        }

        const gameRecommendations = recommendations.recommendations.map(rec => {
            const game = window.GameHubDB.games.getGameById(rec.gameId);
            if (!game) return null;

            const gameRating = this.calculateGameRating(game.id);

            return `
                <div class="game-card">
                    <div class="game-image">
                        ${game.image ? 
                            `<img src="${game.image}" alt="${game.title}" onerror="this.style.display='none'">` : 
                            `<i class="fas fa-gamepad"></i>`
                        }
                    </div>
                    <div class="game-content">
                        <h3 class="game-title">${game.title}</h3>
                        <div class="game-meta">
                            <div class="game-rating">
                                <i class="fas fa-star"></i>
                                <span>${gameRating.averageRating > 0 ? gameRating.averageRating : 'N/A'}</span>
                            </div>
                            <span class="recommendation-score">Score: ${rec.score.toFixed(1)}</span>
                        </div>
                        <div class="recommendation-reasons">
                            ${rec.reasons.slice(0, 2).map(reason => 
                                `<small style="color: var(--text-muted); display: block;">• ${reason}</small>`
                            ).join('')}
                        </div>
                        <div class="game-actions">
                            <button class="btn-icon" onclick="app.rateRecommendation('${recommendations.id}', '${rec.gameId}', 5)">
                                <i class="fas fa-thumbs-up"></i>
                            </button>
                            <button class="btn-icon" onclick="app.rateRecommendation('${recommendations.id}', '${rec.gameId}', 1)">
                                <i class="fas fa-thumbs-down"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).filter(Boolean);

        content.innerHTML = `
            <div class="page-header" style="margin-bottom: 2rem;">
                <div>
                    <h2>Recommendations for ${this.currentUser.displayName}</h2>
                    <p style="color: var(--text-secondary);">Generated ${this.timeAgo(new Date(recommendations.createdAt))}</p>
                </div>
            </div>
            <div class="games-grid">
                ${gameRecommendations.join('')}
            </div>
        `;

        // Mark as viewed
        window.GameHubDB.recommendations.markAsViewed(recommendations.id);
    }

    loadTags() {
        const tags = window.GameHubDB.tags.getActiveTags();
        this.renderTags(tags);
    }

    renderTags(tags) {
        const tagsGrid = document.getElementById('tagsGrid');
        
        if (tags.length === 0) {
            tagsGrid.innerHTML = `
                <div class="col-span-full text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <i class="fas fa-tags" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No tags available. Create some to organize your games!</p>
                </div>
            `;
            return;
        }

        tagsGrid.innerHTML = tags.map(tag => `
            <div class="tag-card" data-tag-id="${tag.id}">
                <div class="tag-color" style="background: ${tag.color}">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="tag-name">${tag.name}</div>
                <div class="tag-type">${tag.type}</div>
                <div class="tag-count">${tag.gameCount} games</div>
                ${this.currentUser && this.currentUser.role === 'admin' ? `
                    <div class="game-actions" style="margin-top: 1rem;">
                        <button class="btn-icon" onclick="app.editTag('${tag.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="app.deleteTag('${tag.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async loadUsers() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            document.getElementById('usersList').innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">Admin access required to manage users.</p>
                </div>
            `;
            return;
        }

        const users = await window.GameHubDB.users.getAllUsers();
        this.renderUsers(users);
    }

    renderUsers(users) {
        const usersList = document.getElementById('usersList');
        
        usersList.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-avatar">
                    ${user.displayName.charAt(0).toUpperCase()}
                </div>
                <div class="user-details">
                    <div class="user-name">${user.displayName}</div>
                    <div class="user-email">${user.email}</div>
                    <div class="user-meta">
                        <span class="user-role ${user.role}">${user.role}</span>
                        <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                            ${user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span>Joined: ${this.formatDate(user.createdAt)}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-icon" onclick="app.editUser('${user.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="app.toggleUserStatus('${user.id}')" title="Toggle Status">
                        <i class="fas fa-toggle-${user.isActive ? 'on' : 'off'}"></i>
                    </button>
                    ${user.id !== this.currentUser?.id ? `
                        <button class="btn-icon" onclick="app.deleteUser('${user.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    loadModeration() {
        this.showTab('sentiment');
    }

    // Event Handlers
    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        
        if (!username) {
            this.showNotification('Please enter a username', 'error');
            return;
        }

        try {
            const user = window.GameHubDB.users.login(username);
            this.currentUser = user;
            this.hideModal('loginModal');
            this.updateUserInterface();
            this.showNotification(`Welcome back, ${user.displayName}!`, 'success');
            
            // Log login
            window.GameHubDB.moderationLogs.logUserAction(user.id, 'logged_in');
            
            // Refresh current page
            this.loadPageData(this.currentPage);
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    logout() {
        if (this.currentUser) {
            window.GameHubDB.moderationLogs.logUserAction(this.currentUser.id, 'logged_out');
        }
        
        window.GameHubDB.users.logout();
        this.currentUser = null;
        this.updateUserInterface();
        this.showNotification('Logged out successfully', 'success');
        this.showPage('dashboard');
    }

    async handleAddGame() {
        if (!this.currentUser) {
            this.showNotification('Please login to add games', 'error');
            return;
        }

        const gameData = {
            title: document.getElementById('gameTitle').value.trim(),
            description: document.getElementById('gameDescription').value.trim(),
            genre: document.getElementById('gameGenre').value.split(',').map(g => g.trim()).filter(Boolean),
            developer: document.getElementById('gameDeveloper').value.trim(),
            platform: document.getElementById('gamePlatform').value.split(',').map(p => p.trim()).filter(Boolean),
            status: document.getElementById('gameStatus').value,
            image: document.getElementById('gameImage').value.trim()
        };

        try {
            const game = await window.GameHubDB.games.addGame(gameData);
            this.hideModal('addGameModal');
            this.showNotification(`Game "${game.title}" added successfully!`, 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'game_added', 
                { gameId: game.id, gameName: game.title }
            );
            
            // Refresh games page if active
            if (this.currentPage === 'games') {
                this.loadGames();
            }
            
            // Reset form
            document.getElementById('addGameForm').reset();
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Edit game function
    editGame(gameId) {
        const game = window.GameHubDB.games.getGameById(gameId);
        if (!game) {
            this.showNotification('Game not found', 'error');
            return;
        }

        // Populate the edit form with current game data
        document.getElementById('editGameId').value = game.id;
        document.getElementById('editGameTitle').value = game.title || '';
        document.getElementById('editGameDescription').value = game.description || '';
        document.getElementById('editGameGenre').value = Array.isArray(game.genre) ? game.genre.join(', ') : '';
        document.getElementById('editGameDeveloper').value = game.developer || '';
        document.getElementById('editGamePlatform').value = Array.isArray(game.platform) ? game.platform.join(', ') : '';
        document.getElementById('editGameStatus').value = game.status || 'available';
        document.getElementById('editGameImage').value = game.image || '';

        this.showModal('editGameModal');
    }

    async handleEditGame() {
        if (!this.currentUser) {
            this.showNotification('Please login to edit games', 'error');
            return;
        }

        const gameId = document.getElementById('editGameId').value;
        const gameData = {
            title: document.getElementById('editGameTitle').value.trim(),
            description: document.getElementById('editGameDescription').value.trim(),
            genre: document.getElementById('editGameGenre').value.split(',').map(g => g.trim()).filter(Boolean),
            developer: document.getElementById('editGameDeveloper').value.trim(),
            platform: document.getElementById('editGamePlatform').value.split(',').map(p => p.trim()).filter(Boolean),
            status: document.getElementById('editGameStatus').value,
            image: document.getElementById('editGameImage').value.trim()
        };

        try {
            const updatedGame = window.GameHubDB.games.updateGame(gameId, gameData);
            this.hideModal('editGameModal');
            this.showNotification(`Game "${updatedGame.title}" updated successfully!`, 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'game_edited', 
                { gameId: updatedGame.id, gameName: updatedGame.title }
            );
            
            // Refresh games page if active
            if (this.currentPage === 'games') {
                this.loadGames();
            }
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleAddReview() {
        if (!this.currentUser) {
            this.showNotification('Please login to write reviews', 'error');
            return;
        }

        const gameId = document.getElementById('reviewGame').value;
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const title = document.getElementById('reviewTitle').value;
        const content = document.getElementById('reviewContent').value;

        if (!gameId || !rating) {
            this.showNotification('Please select a game and rating', 'error');
            return;
        }

        const reviewData = {
            gameId,
            userId: this.currentUser.id,
            rating: parseInt(rating),
            title,
            content
        };

        try {
            // Auto-moderate the review
            const moderation = window.GameHubDB.moderationLogs.autoModerate(
                content, 
                'review', 
                'temp_id'
            );

            if (!moderation.approved) {
                reviewData.moderationStatus = 'pending';
                this.showNotification('Review submitted for moderation', 'warning');
            }

            const review = window.GameHubDB.reviews.createReview(reviewData);
            
            // Log sentiment analysis
            window.GameHubDB.moderationLogs.logReviewSentiment(review.id, content);
            
            this.hideModal('addReviewModal');
            this.showNotification('Review submitted successfully!', 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'review_written', 
                { reviewId: review.id, gameId }
            );
            
            // Refresh reviews page if active
            if (this.currentPage === 'reviews') {
                this.loadReviews();
            }
            
            // Reset form
            document.getElementById('addReviewForm').reset();
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Edit review function
    editReview(reviewId) {
        const review = window.GameHubDB.reviews.getReviewById(reviewId);
        if (!review) {
            this.showNotification('Review not found', 'error');
            return;
        }

        // Check permissions
        if (!this.currentUser || (this.currentUser.id !== review.userId && this.currentUser.role !== 'admin')) {
            this.showNotification('You can only edit your own reviews', 'error');
            return;
        }

        // Populate the edit form with current review data
        document.getElementById('editReviewId').value = review.id;
        document.getElementById('editReviewGame').value = review.gameId;
        document.getElementById('editReviewTitle').value = review.title || '';
        document.getElementById('editReviewContent').value = review.content || '';
        
        // Set rating
        const ratingInput = document.querySelector(`input[name="editRating"][value="${review.rating}"]`);
        if (ratingInput) {
            ratingInput.checked = true;
        }

        // Load games for the select dropdown
        const games = window.GameHubDB.games.getAllGames();
        const gameSelect = document.getElementById('editReviewGame');
        gameSelect.innerHTML = games.map(game => 
            `<option value="${game.id}" ${game.id === review.gameId ? 'selected' : ''}>${game.title}</option>`
        ).join('');

        this.showModal('editReviewModal');
    }

    async handleEditReview() {
        if (!this.currentUser) {
            this.showNotification('Please login to edit reviews', 'error');
            return;
        }

        const reviewId = document.getElementById('editReviewId').value;
        const rating = document.querySelector('input[name="editRating"]:checked')?.value;
        const title = document.getElementById('editReviewTitle').value;
        const content = document.getElementById('editReviewContent').value;

        if (!rating) {
            this.showNotification('Please select a rating', 'error');
            return;
        }

        const reviewData = {
            rating: parseInt(rating),
            title,
            content
        };

        try {
            const updatedReview = window.GameHubDB.reviews.updateReview(reviewId, reviewData, this.currentUser.id);
            this.hideModal('editReviewModal');
            this.showNotification('Review updated successfully!', 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'review_edited', 
                { reviewId: updatedReview.id }
            );
            
            // Refresh reviews page if active
            if (this.currentPage === 'reviews') {
                this.loadReviews();
            }
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Delete review function
    deleteReview(reviewId) {
        const review = window.GameHubDB.reviews.getReviewById(reviewId);
        if (!review) {
            this.showNotification('Review not found', 'error');
            return;
        }

        // Check permissions
        if (!this.currentUser || (this.currentUser.id !== review.userId && this.currentUser.role !== 'admin')) {
            this.showNotification('You can only delete your own reviews', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const isAdmin = this.currentUser.role === 'admin';
            window.GameHubDB.reviews.deleteReview(reviewId, this.currentUser.id, isAdmin);
            this.showNotification('Review deleted successfully!', 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'review_deleted', 
                { reviewId }
            );
            
            // Refresh reviews page if active
            if (this.currentPage === 'reviews') {
                this.loadReviews();
            }
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleAddUser() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.showNotification('Admin access required', 'error');
            return;
        }

        const userData = {
            username: document.getElementById('userName').value.trim(),
            email: document.getElementById('userEmail').value.trim(),
            displayName: document.getElementById('userDisplayName').value.trim(),
            role: document.getElementById('userRole').value
        };

        try {
            const user = window.GameHubDB.users.createUser(userData);
            this.hideModal('addUserModal');
            this.showNotification(`User "${user.displayName}" created successfully!`, 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'user_created', 
                { newUserId: user.id, username: user.username }
            );
            
            // Refresh users page if active
            if (this.currentPage === 'users') {
                this.loadUsers();
            }
            
            // Reset form
            document.getElementById('addUserForm').reset();
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleAddTag() {
        if (!this.currentUser) {
            this.showNotification('Please login to add tags', 'error');
            return;
        }

        const tagData = {
            name: document.getElementById('tagName').value.trim(),
            type: document.getElementById('tagType').value,
            color: document.getElementById('tagColor').value,
            description: document.getElementById('tagDescription').value.trim(),
            createdBy: this.currentUser.id
        };

        try {
            const tag = window.GameHubDB.tags.createTag(tagData);
            this.hideModal('addTagModal');
            this.showNotification(`Tag "${tag.name}" created successfully!`, 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'tag_created', 
                { tagId: tag.id, tagName: tag.name }
            );
            
            // Refresh tags page if active
            if (this.currentPage === 'tags') {
                this.loadTags();
            }
            
            // Reset form
            document.getElementById('addTagForm').reset();
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Filter methods
    async filterGames() {
        const searchTerm = document.getElementById('gamesSearch').value.toLowerCase();
        const genreFilter = document.getElementById('gamesGenreFilter').value;
        const platformFilter = document.getElementById('gamesPlatformFilter').value;

        let games = await window.GameHubDB.games.getAllGames();

        if (searchTerm) {
            games = games.filter(game => 
                game.title.toLowerCase().includes(searchTerm) ||
                game.description.toLowerCase().includes(searchTerm) ||
                game.developer.toLowerCase().includes(searchTerm)
            );
        }

        if (genreFilter) {
            games = games.filter(game => game.genre.includes(genreFilter));
        }

        if (platformFilter) {
            games = games.filter(game => game.platform.includes(platformFilter));
        }

        this.renderGames(games);
    }

    async filterReviews() {
        const searchTerm = document.getElementById('reviewsSearch').value.toLowerCase();
        const gameFilter = document.getElementById('reviewsGameFilter').value;
        const ratingFilter = document.getElementById('reviewsRatingFilter').value;

        const allReviews = await window.GameHubDB.reviews.getAllReviews();
        let reviews = allReviews.filter(r => r.moderationStatus === 'approved');

        if (searchTerm) {
            reviews = reviews.filter(review => 
                (review.title && review.title.toLowerCase().includes(searchTerm)) ||
                (review.content && review.content.toLowerCase().includes(searchTerm))
            );
        }

        if (gameFilter) {
            reviews = reviews.filter(review => review.gameId === gameFilter);
        }

        if (ratingFilter) {
            reviews = reviews.filter(review => review.rating === parseInt(ratingFilter));
        }

        this.renderReviews(reviews);
    }

    async filterUsers() {
        const searchTerm = document.getElementById('usersSearch').value.toLowerCase();
        const roleFilter = document.getElementById('usersRoleFilter').value;
        const statusFilter = document.getElementById('usersStatusFilter').value;

        let users = await window.GameHubDB.users.getAllUsers();

        if (searchTerm) {
            users = users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.displayName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );
        }

        if (roleFilter) {
            users = users.filter(user => user.role === roleFilter);
        }

        if (statusFilter) {
            const isActive = statusFilter === 'active';
            users = users.filter(user => user.isActive === isActive);
        }

        this.renderUsers(users);
    }

    filterTags() {
        const searchTerm = document.getElementById('tagsSearch').value.toLowerCase();
        const typeFilter = document.getElementById('tagsTypeFilter').value;

        let tags = window.GameHubDB.tags.getActiveTags();

        if (searchTerm) {
            tags = tags.filter(tag => 
                tag.name.toLowerCase().includes(searchTerm) ||
                (tag.description && tag.description.toLowerCase().includes(searchTerm))
            );
        }

        if (typeFilter) {
            tags = tags.filter(tag => tag.type === typeFilter);
        }

        this.renderTags(tags);
    }

    applyFilters() {
        switch (this.currentPage) {
            case 'games':
                this.filterGames();
                break;
            case 'reviews':
                this.filterReviews();
                break;
            case 'users':
                this.filterUsers();
                break;
            case 'tags':
                this.filterTags();
                break;
        }
    }

    // Action methods
    async generateRecommendations() {
        if (!this.currentUser) {
            this.showNotification('Please login to generate recommendations', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const recommendations = window.GameHubDB.recommendations.generateRecommendations(this.currentUser.id);
            this.showNotification('Recommendations generated successfully!', 'success');
            
            // Log action
            window.GameHubDB.moderationLogs.logUserAction(
                this.currentUser.id, 
                'recommendations_generated', 
                { recommendationId: recommendations.id }
            );
            
            if (this.currentPage === 'recommendations') {
                this.loadRecommendations();
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async searchGamesAPI() {
        const query = prompt('Enter a game name to search for:');
        if (!query) return;

        try {
            this.showLoading(true);
            const results = await window.GameHubDB.gameApi.searchGames(query, 1, 12);
            
            if (results.results && results.results.length > 0) {
                this.showAPIGameResults(results.results, `Search Results for "${query}"`);
            } else {
                this.showNotification('No games found', 'warning');
            }
        } catch (error) {
            this.showNotification('Error searching games: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async browsePopularGames() {
        try {
            this.showLoading(true);
            const results = await window.GameHubDB.gameApi.getPopularGames(1, 12);
            
            if (results.results && results.results.length > 0) {
                this.showAPIGameResults(results.results, 'Popular Games');
            } else {
                this.showNotification('No games found', 'warning');
            }
        } catch (error) {
            this.showNotification('Error loading popular games: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async browseByGenre() {
        // CheapShark is store-based, so we'll browse by popular stores instead
        const stores = [
            { id: 1, name: 'Steam', icon: '🎮' },
            { id: 25, name: 'Epic Games Store', icon: '🎯' },
            { id: 2, name: 'GamersGate', icon: '🕹️' },
            { id: 3, name: 'Amazon', icon: '📦' },
            { id: 7, name: 'GoG', icon: '🏆' },
            { id: 8, name: 'Origin', icon: '🎲' },
            { id: 11, name: 'Humble Store', icon: '🤝' },
            { id: 13, name: 'Uplay', icon: '🎪' },
            { id: 15, name: 'Fanatical', icon: '⚡' },
            { id: 21, name: 'WinGameStore', icon: '🏪' },
            { id: 23, name: 'GameBillet', icon: '🎫' },
            { id: 24, name: 'Voidu', icon: '💎' }
        ];

        // Create store selection modal
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Browse Games by Store</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        Select a gaming store to discover current deals:
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem;">
                        ${stores.map(store => `
                            <button class="btn btn-secondary" 
                                    onclick="app.loadGamesByStore(${store.id}, '${store.name}'); this.closest('.modal').remove();"
                                    style="padding: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2em;">${store.icon}</span>
                                ${store.name}
                            </button>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <small style="color: var(--text-muted);">
                            Browse games by store - all games from CheapShark API with real pricing data!
                        </small>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async loadGamesByStore(storeId, storeName) {
        try {
            this.showLoading(true);
            
            // Use CheapShark API to get games by store
            const games = await window.GameHubDB.gameApi.getGamesByStore(storeId, 1, 12);
            
            if (games && games.length > 0) {
                this.showAPIGameResults(games, `${storeName} Store Games`);
            } else {
                this.showNotification(`No games found for ${storeName}`, 'warning');
            }
        } catch (error) {
            this.showNotification('Error loading games by store: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadGamesByGenre(genre) {
        // Kept for backward compatibility - redirects to store-based browsing
        const storeId = genre === 'steam' ? 1 : genre === 'epic' ? 25 : 1;
        return this.loadGamesByStore(storeId, genre === 'epic' ? 'Epic Games' : 'Steam');
    }

    showAPIGameResults(games, title) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="games-grid" style="max-height: 70vh; overflow-y: auto; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                        ${games.map(game => `
                            <div class="game-card" style="cursor: pointer; transition: transform 0.2s ease;" 
                                 onclick="app.addGameFromAPI(${JSON.stringify(game).replace(/"/g, '&quot;')})"
                                 onmouseover="this.style.transform='scale(1.02)'" 
                                 onmouseout="this.style.transform='scale(1)'">
                                <div class="game-image" style="height: 150px;">
                                    ${game.background_image ? 
                                        `<img src="${game.background_image}" alt="${game.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px 8px 0 0;">` : 
                                        `<i class="fas fa-gamepad" style="font-size: 2rem; color: var(--text-muted);"></i>`
                                    }
                                </div>
                                <div class="game-content" style="padding: 1rem;">
                                    <h3 class="game-title" style="font-size: 1rem; margin-bottom: 0.5rem; line-height: 1.3;">${game.name}</h3>
                                    <div class="game-meta" style="margin-bottom: 0.5rem;">
                                        <div class="game-rating">
                                            <i class="fas fa-star"></i>
                                            <span>${game.rating || 'N/A'}</span>
                                        </div>
                                        ${game.released ? `<span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(game.released).getFullYear()}</span>` : ''}
                                    </div>
                                    <p class="game-description" style="font-size: 0.75rem; line-height: 1.4; color: var(--text-secondary); margin-bottom: 1rem;">
                                        ${(game.description_raw || game.description || 'No description available.').substring(0, 80)}...
                                    </p>
                                    <button class="btn btn-primary" style="width: 100%; font-size: 0.875rem; padding: 0.5rem;">
                                        <i class="fas fa-plus"></i> Add to Library
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <small style="color: var(--text-muted);">
                            Real PC game deals from CheapShark API
                        </small>
                        <br><small style="color: var(--success-color);">✓ All games sourced from Steam and other PC gaming platforms!</small>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async addGameFromAPI(apiGame) {
        if (!this.currentUser) {
            this.showNotification('Please login to add games', 'error');
            return;
        }

        try {
            const gameData = window.GameHubDB.games.mapApiGameToLocal(apiGame);
            const game = await window.GameHubDB.games.addGame(gameData);
            
            this.showNotification(`"${game.title}" added to your library!`, 'success');
            
            // Close modal
            document.querySelector('.modal').remove();
            
            // Refresh games if on games page
            if (this.currentPage === 'games') {
                this.loadGames();
            }
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Delete game function
    deleteGame(gameId) {
        console.log('Delete game called with ID:', gameId);
        
        if (!gameId) {
            this.showNotification('Invalid game ID', 'error');
            return;
        }

        // Check if GameHubDB is available
        if (!window.GameHubDB || !window.GameHubDB.games) {
            console.error('GameHubDB not available');
            this.showNotification('Database not available', 'error');
            return;
        }

        // Get the game details before deletion
        const game = window.GameHubDB.games.getGameById(gameId);
        if (!game) {
            console.error('Game not found in database:', gameId);
            this.showNotification('Game not found', 'error');
            return;
        }

        console.log('Found game to delete:', game);

        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${game.title}" from your library? This will also remove all associated reviews and data.`)) {
            return;
        }

        try {
            // Remove from database
            const deleted = window.GameHubDB.games.deleteGame(gameId);
            console.log('Database deletion result:', deleted);
            
            if (deleted) {
                // Remove from UI immediately
                const gameCard = document.querySelector(`[data-game-id="${gameId}"]`);
                console.log('Found game card element:', gameCard);
                
                if (gameCard) {
                    gameCard.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        gameCard.remove();
                        // Update stats after removal
                        this.loadDashboard(); // Use existing method to refresh dashboard
                        console.log('Game card removed from UI');
                    }, 300);
                } else {
                    // If no card found, try to refresh the current page
                    console.log('No game card found, refreshing page content');
                    this.showPage(this.currentPage);
                }

                // Remove associated reviews
                if (window.GameHubDB.reviews && window.GameHubDB.reviews.getReviewsByGame) {
                    const reviews = window.GameHubDB.reviews.getReviewsByGame(gameId);
                    reviews.forEach(review => {
                        window.GameHubDB.reviews.deleteReview(review.id);
                    });
                    console.log('Removed associated reviews:', reviews.length);
                }

                // Remove from recommendations
                if (window.GameHubDB.recommendations) {
                    const allRecommendations = window.GameHubDB.recommendations.getAllRecommendations();
                    let removedCount = 0;
                    
                    allRecommendations.forEach(recSet => {
                        // Check if this recommendation set contains the game
                        const hasGame = recSet.recommendations.some(rec => rec.gameId === gameId);
                        if (hasGame) {
                            // Remove the specific game from the recommendations array
                            recSet.recommendations = recSet.recommendations.filter(rec => rec.gameId !== gameId);
                            
                            // Update the recommendation set
                            if (recSet.recommendations.length > 0) {
                                window.GameHubDB.recommendations.updateRecommendation(recSet.id, {
                                    recommendations: recSet.recommendations
                                });
                            } else {
                                // If no recommendations left, delete the entire set
                                window.GameHubDB.recommendations.deleteRecommendation(recSet.id);
                            }
                            removedCount++;
                        }
                    });
                    
                    console.log('Removed from recommendations:', removedCount);
                }

                // Log the deletion
                if (this.currentUser && window.GameHubDB.moderationLogs) {
                    window.GameHubDB.moderationLogs.logUserAction(
                        this.currentUser.id,
                        'game_deleted',
                        { gameId, gameName: game.title }
                    );
                }

                this.showNotification(`"${game.title}" has been removed from your library`, 'success');
                
                // Update dashboard stats
                this.updateGameStats();
                
                console.log('Game deleted successfully:', gameId);
            } else {
                this.showNotification('Failed to delete game from database', 'error');
            }
        } catch (error) {
            console.error('Delete game error:', error);
            this.showNotification('An error occurred while deleting the game: ' + error.message, 'error');
        }
    }

    // Update game statistics on dashboard
    updateGameStats() {
        const totalGames = window.GameHubDB.games.getAllGames().length;
        const gameStatsElement = document.querySelector('.stat-card .stat-number');
        if (gameStatsElement) {
            gameStatsElement.textContent = totalGames;
        }
    }

    updateUserInterface() {
        const userInfo = document.getElementById('userInfo');
        const userName = userInfo.querySelector('.user-name');
        const loginBtn = document.getElementById('loginBtn');

        if (this.currentUser) {
            userName.textContent = this.currentUser.displayName;
            loginBtn.textContent = 'Logout';
            loginBtn.classList.remove('btn-login');
            loginBtn.classList.add('btn', 'btn-secondary');
        } else {
            userName.textContent = 'Guest';
            loginBtn.textContent = 'Login';
            loginBtn.classList.remove('btn', 'btn-secondary');
            loginBtn.classList.add('btn-login');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        modal.style.display = 'flex';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Load tab-specific content
        switch (tabName) {
            case 'sentiment':
                this.loadSentimentAnalysis();
                break;
            case 'logs':
                this.loadActivityLogs();
                break;
            case 'flagged':
                this.loadFlaggedContent();
                break;
        }
    }

    loadSentimentAnalysis() {
        const trends = window.GameHubDB.moderationLogs.getSentimentTrends(30);
        const sentimentDashboard = document.querySelector('.sentiment-dashboard');
        
        const total = trends.total || 1; // Avoid division by zero
        
        sentimentDashboard.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-color);">
                        <i class="fas fa-smile"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${trends.positive}</h3>
                        <p>Positive (${((trends.positive / total) * 100).toFixed(1)}%)</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--warning-color);">
                        <i class="fas fa-meh"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${trends.neutral}</h3>
                        <p>Neutral (${((trends.neutral / total) * 100).toFixed(1)}%)</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--error-color);">
                        <i class="fas fa-frown"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${trends.negative}</h3>
                        <p>Negative (${((trends.negative / total) * 100).toFixed(1)}%)</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-color);">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${total}</h3>
                        <p>Total Analyzed</p>
                    </div>
                </div>
            </div>
        `;
    }

    loadActivityLogs() {
        const logs = window.GameHubDB.moderationLogs.getRecentActivity(50);
        const logsList = document.getElementById('logsList');
        
        if (logs.length === 0) {
            logsList.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No activity logs found</p>';
            return;
        }

        logsList.innerHTML = logs.map(log => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${this.getActivityIconColor(log.type)}">
                    <i class="fas ${this.getActivityIcon(log.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${this.formatActivityMessage(log)}</p>
                    <small>
                        ${this.timeAgo(new Date(log.createdAt))} • 
                        ${log.automated ? 'Automated' : 'Manual'} • 
                        Severity: ${log.severity}
                    </small>
                </div>
            </div>
        `).join('');
    }

    loadFlaggedContent() {
        const flagged = window.GameHubDB.moderationLogs.getFlaggedContent();
        const flaggedContent = document.getElementById('flaggedContent');
        
        if (flagged.length === 0) {
            flaggedContent.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No flagged content</p>';
            return;
        }

        flaggedContent.innerHTML = flagged.map(log => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-info">
                        <h3>Flagged ${log.targetType}</h3>
                        <div class="review-meta">
                            <span>Target ID: ${log.targetId}</span>
                            <span>•</span>
                            <span>Reason: ${log.reason}</span>
                            <span>•</span>
                            <span>${this.formatDate(log.createdAt)}</span>
                        </div>
                    </div>
                    <div class="review-rating">
                        <span class="status-badge ${log.severity === 'high' ? 'inactive' : 'active'}">
                            ${log.severity}
                        </span>
                    </div>
                </div>
                <div class="review-content">
                    ${JSON.stringify(log.details, null, 2)}
                </div>
                <div class="review-actions">
                    <button class="btn-icon" onclick="app.resolveFlag('${log.id}')">
                        <i class="fas fa-check"></i> Resolve
                    </button>
                </div>
            </div>
        `).join('');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            box-shadow: var(--shadow-lg);
        `;

        // Set background color based on type
        const colors = {
            success: 'var(--success-color)',
            error: 'var(--error-color)',
            warning: 'var(--warning-color)',
            info: 'var(--primary-color)'
        };
        notification.style.background = colors[type] || colors.info;
        
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Helper methods
    timeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getActivityIcon(type) {
        const icons = {
            user_action: 'fa-user',
            sentiment_analysis: 'fa-brain',
            review_moderation: 'fa-shield-alt',
            system_event: 'fa-cog'
        };
        return icons[type] || 'fa-info';
    }

    getActivityIconColor(type) {
        const colors = {
            user_action: 'var(--primary-color)',
            sentiment_analysis: 'var(--secondary-color)',
            review_moderation: 'var(--warning-color)',
            system_event: 'var(--success-color)'
        };
        return colors[type] || 'var(--primary-color)';
    }

    formatActivityMessage(log) {
        const user = log.moderatorId ? window.GameHubDB.users.getUserById(log.moderatorId) : null;
        const userName = user ? user.displayName : 'System';
        
        const messages = {
            user_action: `${userName} performed action: ${log.action}`,
            sentiment_analysis: `Sentiment analysis completed for ${log.targetType}`,
            review_moderation: `${userName} moderated ${log.targetType}: ${log.action}`,
            system_event: `System event: ${log.action}`
        };
        
        return messages[log.type] || `${log.type}: ${log.action}`;
    }

    // Additional action methods
    markReviewHelpful(reviewId, isHelpful) {
        try {
            window.GameHubDB.reviews.markReviewHelpful(reviewId, isHelpful);
            this.showNotification('Feedback recorded', 'success');
            
            if (this.currentPage === 'reviews') {
                this.loadReviews();
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    rateRecommendation(recommendationId, gameId, rating) {
        try {
            window.GameHubDB.recommendations.rateRecommendation(recommendationId, gameId, rating);
            this.showNotification('Recommendation rated', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    resolveFlag(logId) {
        try {
            window.GameHubDB.moderationLogs.resolveLog(logId, 'Resolved by admin');
            this.showNotification('Flag resolved', 'success');
            this.loadFlaggedContent();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    cleanOldLogs() {
        try {
            const deletedCount = window.GameHubDB.moderationLogs.cleanOldLogs(30);
            this.showNotification(`Cleaned ${deletedCount} old logs`, 'success');
            if (this.currentPage === 'moderation') {
                this.loadActivityLogs();
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Helper method to add sample data to empty tables
    async addSampleDataToEmptyTables() {
        try {
            // Check if we need to add sample reviews
            const reviews = window.GameHubDB.reviews.getAllReviews();
            const games = window.GameHubDB.games.getAllGames();
            const users = window.GameHubDB.users.getAllUsers();

            if (reviews.length === 0 && games.length > 0 && users.length > 0) {
                const demoUser = users.find(u => u.username === 'demo');
                const adminUser = users.find(u => u.username === 'admin');

                // Add multiple sample reviews
                const sampleReviews = [
                    {
                        gameId: games[0].id,
                        userId: demoUser?.id || users[0].id,
                        rating: 5,
                        title: "Outstanding Gaming Experience!",
                        content: "This game exceeded all my expectations. The graphics are stunning, gameplay is smooth, and the story keeps you engaged for hours. Definitely worth every penny!",
                        moderationStatus: 'approved',
                        helpful: 10,
                        notHelpful: 1
                    },
                    {
                        gameId: games[1]?.id || games[0].id,
                        userId: adminUser?.id || users[0].id,
                        rating: 4,
                        title: "Solid Game with Great Replay Value",
                        content: "Really enjoyed this one. Great mechanics and plenty of content to keep you busy. A few minor bugs here and there, but overall a fantastic experience.",
                        moderationStatus: 'approved',
                        helpful: 7,
                        notHelpful: 0
                    }
                ];

                if (games.length > 2) {
                    sampleReviews.push({
                        gameId: games[2].id,
                        userId: demoUser?.id || users[0].id,
                        rating: 5,
                        title: "Perfect in Every Way",
                        content: "This is gaming perfection. Amazing art style, incredible sound design, and gameplay that's both challenging and rewarding. A true masterpiece!",
                        moderationStatus: 'approved',
                        helpful: 12,
                        notHelpful: 0
                    });
                }

                for (const reviewData of sampleReviews) {
                    const review = window.GameHubDB.reviews.createReview(reviewData);
                    console.log('Sample review added:', review.id);
                    
                    // Log sentiment analysis
                    window.GameHubDB.moderationLogs.logReviewSentiment(review.id, reviewData.content);
                }
            }

            // Check if we need to generate recommendations
            const recommendations = window.GameHubDB.recommendations.getAllRecommendations();
            
            if (recommendations.length === 0 && games.length > 1 && users.length > 0) {
                const demoUser = users.find(u => u.username === 'demo');
                const adminUser = users.find(u => u.username === 'admin');

                // Generate recommendations for demo user
                if (demoUser) {
                    try {
                        const demoRecs = window.GameHubDB.recommendations.generateRecommendations(demoUser.id);
                        console.log('Demo user recommendations generated:', demoRecs.id);
                    } catch (error) {
                        console.log('Could not generate demo recommendations:', error.message);
                    }
                }

                // Create manual recommendations for admin user
                if (adminUser && games.length >= 2) {
                    const adminRecommendationData = {
                        userId: adminUser.id,
                        algorithm: 'content_based',
                        recommendations: [
                            {
                                gameId: games[0].id,
                                score: 0.95,
                                reasons: [
                                    'Highly rated by users with similar preferences',
                                    'Excellent reviews and ratings',
                                    'Matches your gaming history'
                                ]
                            },
                            {
                                gameId: games[1].id,
                                score: 0.87,
                                reasons: [
                                    'Popular choice among admin users',
                                    'Great replay value',
                                    'Recommended by the community'
                                ]
                            }
                        ]
                    };
                    
                    try {
                        const adminRecs = window.GameHubDB.recommendations.createRecommendation(adminRecommendationData);
                        console.log('Admin user recommendations created:', adminRecs.id);
                    } catch (error) {
                        console.log('Could not create admin recommendations:', error.message);
                    }
                }
            }

            // Refresh current page if we're viewing these sections
            if (this.currentPage === 'reviews' || this.currentPage === 'recommendations' || this.currentPage === 'dashboard') {
                this.loadPageData(this.currentPage);
            }

            this.showNotification('Sample data added to empty tables! Check Reviews and Recommendations sections.', 'success');
            
        } catch (error) {
            console.error('Error adding sample data:', error);
            this.showNotification('Error adding sample data: ' + error.message, 'error');
        }
    }
}

// Global helper functions
function showModal(modalId) {
    app.showModal(modalId);
}

function hideModal(modalId) {
    app.hideModal(modalId);
}

function generateRecommendations() {
    app.generateRecommendations();
}

function searchGamesAPI() {
    app.searchGamesAPI();
}

function browsePopularGames() {
    app.browsePopularGames();
}

// Add styles for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GameHubApp();
});

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        e.target.style.display = 'none';
    }
});

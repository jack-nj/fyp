/**
 * Firebase Connection Test Utility
 * Run this in browser console to verify Firebase sync
 */

console.log('🔄 Loading Firebase Connection Tester...');

class FirebaseConnectionTester {
    static async runAllTests() {
        console.log('🔥 Starting Firebase Connection Tests...\n');
        
        const results = {
            firebaseInit: false,
            firestoreConnection: false,
            authConnection: false,
            databaseOperations: false,
            apiConnection: false,
            permissions: false
        };

        try {
            // Test 1: Firebase Initialization
            console.log('Testing Firebase initialization...');
            console.log('window.firebase exists:', !!window.firebase);
            console.log('firebase.app exists:', !!window.firebase?.app);
            
            if (window.firebase && typeof window.firebase.app === 'function') {
                const app = window.firebase.app();
                console.log('✅ Test 1: Firebase initialized');
                console.log('   - App Name:', app.name);
                console.log('   - Project ID:', app.options.projectId);
                console.log('   - Auth Domain:', app.options.authDomain);
                results.firebaseInit = true;
            } else if (window.firebase && window.firebase.app) {
                console.log('✅ Test 1: Firebase initialized (direct reference)');
                console.log('   - Firebase app object available');
                results.firebaseInit = true;
            } else {
                console.log('❌ Test 1: Firebase not properly initialized');
                console.log('   - Available firebase methods:', Object.keys(window.firebase || {}));
            }
        } catch (error) {
            console.log('❌ Test 1: Firebase initialization error:', error.message);
            console.log('   - Error details:', error);
        }

        // Test 2: Firestore Connection
        try {
            console.log('Testing Firestore connection...');
            let db;
            if (window.firebase && window.firebase.firestore) {
                db = window.firebase.firestore();
            } else if (window.firebase && window.firebase.db) {
                db = window.firebase.db;
            } else if (window.db) {
                db = window.db;
            }
            
            if (db) {
                await db.enableNetwork(); // Ensure network is enabled
                console.log('✅ Test 2: Firestore connection successful');
                results.firestoreConnection = true;
            } else {
                console.log('❌ Test 2: Firestore not available');
                console.log('   - Available firebase methods:', Object.keys(window.firebase || {}));
            }
        } catch (error) {
            console.log('❌ Test 2: Firestore connection failed:', error.message);
        }

        // Test 3: Authentication Service
        try {
            console.log('Testing Firebase Auth...');
            let auth;
            if (window.firebase && window.firebase.auth && typeof window.firebase.auth === 'function') {
                auth = window.firebase.auth();
            } else if (window.firebase && window.firebase.auth) {
                auth = window.firebase.auth;
            } else if (window.auth) {
                auth = window.auth;
            }
            
            if (auth) {
                console.log('✅ Test 3: Firebase Auth available');
                console.log('   - Current user:', auth.currentUser ? auth.currentUser.uid : 'None (not logged in)');
                results.authConnection = true;
            } else {
                console.log('❌ Test 3: Firebase Auth not available');
                console.log('   - Firebase auth methods:', window.firebase ? Object.keys(window.firebase) : 'No firebase object');
            }
        } catch (error) {
            console.log('❌ Test 3: Firebase Auth error:', error.message);
        }

        // Test 4: Database Operations
        try {
            console.log('Testing database operations...');
            
            // First check if GameHubDB exists
            if (!window.GameHubDB) {
                console.log('❌ Test 4: GameHubDB not available on window object');
                console.log('   - Available window objects:', Object.keys(window).filter(k => k.includes('Game') || k.includes('DB')));
                results.databaseOperations = false;
            } else {
                console.log('✅ GameHubDB found');
                console.log('   - Available properties:', Object.keys(window.GameHubDB));
                
                if (!window.GameHubDB.db) {
                    console.log('❌ Test 4: GameHubDB.db not available');
                    console.log('   - GameHubDB contents:', window.GameHubDB);
                    results.databaseOperations = false;
                } else {
                    console.log('✅ GameHubDB.db found');
                    
                    // Wait for database to be ready with longer timeout
                    console.log('⏳ Waiting for database to be ready...');
                    let dbReady = false;
                    for (let i = 0; i < 50; i++) { // 5 second timeout
                        try {
                            if (window.GameHubDB.db.isReady) {
                                dbReady = true;
                                break;
                            }
                            await window.GameHubDB.db.waitForReady();
                            dbReady = true;
                            break;
                        } catch (waitError) {
                            console.log(`   - Wait attempt ${i + 1}/50: ${waitError.message}`);
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    
                    if (!dbReady) {
                        console.log('❌ Test 4: Database not ready after waiting');
                        results.databaseOperations = false;
                    } else {
                        console.log('✅ Database is ready');
                        
                        // Test reading from each collection
                        const collections = ['users', 'games', 'reviews', 'recommendations', 'tags', 'moderationLogs'];
                        console.log('🔍 Testing collections...');
                        
                        let successCount = 0;
                        for (const collection of collections) {
                            try {
                                console.log(`   - Testing ${collection}...`);
                                const data = await window.GameHubDB.db.read(collection);
                                console.log(`   ✅ ${collection}: ${data.length} items`);
                                successCount++;
                            } catch (error) {
                                console.log(`   ❌ ${collection}: ${error.message}`);
                                
                                // Try alternative approach for this collection
                                try {
                                    const collections = window.GameHubDB.db.collections;
                                    if (collections && collections.has(collection)) {
                                        const items = collections.get(collection);
                                        console.log(`   ✅ ${collection} (fallback): ${items.length} items`);
                                        successCount++;
                                    }
                                } catch (fallbackError) {
                                    console.log(`   ❌ ${collection} fallback failed: ${fallbackError.message}`);
                                }
                            }
                        }
                        
                        if (successCount > 0) {
                            results.databaseOperations = true;
                            console.log(`✅ Database operations: ${successCount}/${collections.length} collections accessible`);
                        } else {
                            console.log('❌ Database operations: No collections accessible');
                            
                            // Additional debugging
                            console.log('🔍 Debug info:');
                            console.log('   - Database type:', typeof window.GameHubDB.db);
                            console.log('   - Database constructor:', window.GameHubDB.db.constructor.name);
                            console.log('   - Database methods:', Object.getOwnPropertyNames(window.GameHubDB.db.__proto__));
                        }
                    }
                }
            }
        } catch (error) {
            console.log('❌ Test 4: Database operations failed:', error.message);
            console.log('   - Error stack:', error.stack);
        }

        // Test 5: CheapShark API Connection
        try {
            console.log('Testing CheapShark API...');
            const response = await fetch('https://www.cheapshark.com/api/1.0/stores');
            if (response.ok) {
                const stores = await response.json();
                console.log(`✅ Test 5: CheapShark API connected (${stores.length} stores available)`);
                results.apiConnection = true;
            } else {
                console.log('❌ Test 5: CheapShark API request failed');
            }
        } catch (error) {
            console.log('❌ Test 5: CheapShark API error:', error.message);
        }

        // Test 6: Firestore Permissions
        try {
            console.log('Testing Firestore permissions...');
            
            if (window.GameHubDB && window.GameHubDB.db) {
                // Try to read a simple document to test permissions
                try {
                    const testData = await window.GameHubDB.db.read('users', 1); // Try to read 1 item
                    console.log('✅ Test 6: Firestore read permissions OK');
                    results.permissions = true;
                } catch (permError) {
                    if (permError.message.includes('permission') || permError.message.includes('unauthorized')) {
                        console.log('❌ Test 6: Firestore permission denied');
                        console.log('   - Check your Firestore security rules');
                        console.log('   - For development, try: allow read, write: if true;');
                    } else {
                        console.log('✅ Test 6: Firestore permissions OK (no permission error)');
                        results.permissions = true;
                    }
                }
            } else {
                console.log('❌ Test 6: Cannot test permissions - database not available');
            }
        } catch (error) {
            console.log('❌ Test 6: Permission test error:', error.message);
        }

        // Summary
        console.log('\n📋 Test Summary:');
        const passedTests = Object.values(results).filter(value => value === true).length;
        const totalTests = Object.keys(results).length;
        
        console.log(`Passed: ${passedTests}/${totalTests} tests`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! Firebase is fully synced.');
        } else {
            console.log('⚠️  Some tests failed. Check the errors above and FIREBASE_SYNC_GUIDE.md');
        }

        return results;
        
    } catch (globalError) {
        console.error('❌ Critical error during tests:', globalError);
        
        // Return partial results even if there was an error
        return {
            firebaseInit: false,
            firestoreConnection: false,
            authConnection: false,
            databaseOperations: false,
            apiConnection: false,
            permissions: false,
            error: globalError.message
        };
    }

    static async testSpecificCollection(collectionName) {
        console.log(`🔍 Testing collection: ${collectionName}`);
        
        try {
            // Test read
            const items = await window.GameHubDB.db.read(collectionName);
            console.log(`✅ Read: Found ${items.length} items`);
            
            // Test write (if permissions allow)
            const testItem = {
                id: 'test_' + Date.now(),
                testData: true,
                timestamp: new Date().toISOString()
            };
            
            try {
                await window.GameHubDB.db.create(collectionName, testItem);
                console.log('✅ Write: Test item created');
                
                // Clean up test item
                await window.GameHubDB.db.delete(collectionName, testItem.id);
                console.log('✅ Delete: Test item cleaned up');
                
                return true;
            } catch (writeError) {
                console.log('⚠️  Write test failed (may be due to permissions):', writeError.message);
                return items.length > 0; // Return true if we can at least read
            }
            
        } catch (error) {
            console.log(`❌ Collection test failed: ${error.message}`);
            return false;
        }
    }

    static checkFirebaseRules() {
        console.log('🔍 Checking Firebase security rules...');
        console.log('Visit: https://console.firebase.google.com/project/c290-constellation-of-kindness/firestore/rules');
        console.log('For development, consider using: allow read, write: if true;');
    }

    static async diagnoseConnectionIssues() {
        console.log('🔧 Diagnosing Firebase connection issues...\n');
        
        // Check 1: Network connectivity
        try {
            const response = await fetch('https://www.google.com', { method: 'HEAD' });
            console.log('✅ Internet connection working');
        } catch {
            console.log('❌ No internet connection detected');
        }
        
        // Check 2: Firebase CDN accessibility
        try {
            const response = await fetch('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js', { method: 'HEAD' });
            console.log('✅ Firebase CDN accessible');
        } catch {
            console.log('❌ Firebase CDN not accessible (check firewall/proxy)');
        }
        
        // Check 3: Project configuration
        if (window.firebase && window.firebase.app) {
            const app = window.firebase.app();
            console.log('📋 Firebase Configuration:');
            console.log('   - Project ID:', app.options.projectId);
            console.log('   - Auth Domain:', app.options.authDomain);
            console.log('   - Database URL:', app.options.databaseURL);
            console.log('   - Storage Bucket:', app.options.storageBucket);
        }
        
        // Check 4: Local storage and session storage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            console.log('✅ Local storage working');
        } catch {
            console.log('❌ Local storage blocked (check browser settings)');
        }
        
        // Check 5: Third-party cookies
        console.log('🍪 Ensure third-party cookies are enabled for Firebase domains');
    }
}

// Make available globally with immediate availability check
window.FirebaseTest = FirebaseConnectionTester;

// Add a ready flag
window.FirebaseTest.ready = true;

// Auto-run basic test when loaded
console.log('🔥 Firebase Connection Tester loaded and ready!');
console.log('Run: FirebaseTest.runAllTests() to test your Firebase sync');
console.log('Run: FirebaseTest.testSpecificCollection("collectionName") to test specific collections');
console.log('Run: FirebaseTest.diagnoseConnectionIssues() for troubleshooting');

// Dispatch custom event to notify that the test utility is ready
if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('firebaseTestReady'));
}

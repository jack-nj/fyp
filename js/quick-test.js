/**
 * Quick Database Test - Runs immediately when loaded
 * This helps verify the database connection before modules initialize
 */

console.log('🔄 Quick database test starting...');

// Test 1: Check if database exists
setTimeout(async () => {
    try {
        if (window.GameHubDB && window.GameHubDB.db) {
            console.log('✅ GameHubDB.db exists');
            
            // Test 2: Check if database is ready
            await window.GameHubDB.db.waitForReady();
            console.log('✅ Database is ready');
            
            // Test 3: Try to read a collection
            try {
                const users = await window.GameHubDB.db.read('users');
                console.log('✅ Database read test successful:', users.length, 'users');
            } catch (readError) {
                console.log('⚠️ Database read test failed:', readError.message);
            }
            
        } else {
            console.log('❌ GameHubDB.db not found');
        }
    } catch (error) {
        console.log('❌ Quick database test failed:', error.message);
    }
}, 1000);

// Test Firebase components
setTimeout(() => {
    console.log('🔍 Firebase components check:');
    console.log('   - window.firebase:', !!window.firebase);
    console.log('   - window.firebase.db:', !!window.firebase?.db);
    console.log('   - window.firebase.auth:', !!window.firebase?.auth);
    console.log('   - window.FIREBASE_ENABLED:', window.FIREBASE_ENABLED);
    console.log('   - window.GameHubDB:', !!window.GameHubDB);
}, 500);

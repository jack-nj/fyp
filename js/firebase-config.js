/**
 * Firebase Configuration - FIREBASE-ONLY MODE
 * GameHub Local now requires Firebase - no localStorage fallback
 */

// Firebase project configuration for C290 Constellation of Kindness
const firebaseConfig = {
    apiKey: "AIzaSyDs85pi4hcRqtFUg-mrNgci9aWPV1pUI_M",
    authDomain: "c290-constellation-of-kindness.firebaseapp.com",
    projectId: "c290-constellation-of-kindness",
    storageBucket: "c290-constellation-of-kindness.firebasestorage.app",
    messagingSenderId: "908459397825",
    appId: "1:908459397825:web:8aced5a815a902aac5fa40"
};

// Initialize Firebase
let app, db, auth;

try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    
    console.log('✅ Firebase initialized successfully (CLOUD-ONLY MODE)');
    console.log('📋 Project:', firebaseConfig.projectId);
    console.log('🌐 Auth Domain:', firebaseConfig.authDomain);
    
    // Configure Firestore settings
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true
    });
    
    // Enable Firestore offline persistence
    db.enablePersistence({ 
        synchronizeTabs: true
    })
        .then(() => {
            console.log('✅ Firestore offline persistence enabled');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
                // Try without synchronizeTabs if it fails
                return db.enablePersistence();
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ The current browser does not support persistence.');
            } else {
                console.warn('⚠️ Persistence error:', err);
            }
        });
    
    // Test connection immediately
    db.collection('connectionTest').limit(1).get()
        .then(() => {
            console.log('✅ Firestore connection verified');
        })
        .catch((error) => {
            console.warn('⚠️ Firestore connection test failed:', error.message);
            if (error.code === 'permission-denied') {
                console.warn('📋 Check Firestore security rules in Firebase Console');
            }
        });
        
    // Flag to indicate Firebase is required and available
    window.FIREBASE_ENABLED = true;
    
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.error('💥 CRITICAL: Firebase is required but failed to initialize');
    console.error('🔧 Please check your Firebase configuration and internet connection');
    console.error('📋 Project ID:', firebaseConfig.projectId);
    console.error('🌐 Auth Domain:', firebaseConfig.authDomain);
    
    // Show user-friendly error
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1 style="color: #dc3545;">🔥 Firebase Connection Required</h1>
                <p style="font-size: 18px; color: #6c757d;">
                    GameHub Local requires a Firebase connection to work.<br>
                    Please check your internet connection and Firebase configuration.
                </p>
                <div style="background: #f8f9fa; padding: 20px; margin: 20px; border-radius: 8px; text-align: left;">
                    <strong>Configuration Details:</strong><br>
                    Project ID: ${firebaseConfig.projectId}<br>
                    Auth Domain: ${firebaseConfig.authDomain}<br>
                    <br>
                    <strong>Error:</strong> ${error.message}
                </div>
                <div style="margin: 20px;">
                    <button onclick="location.reload()" style="
                        background: #007bff; color: white; border: none; 
                        padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 5px;
                    ">Retry Connection</button>
                    <button onclick="window.open('https://console.firebase.google.com/project/${firebaseConfig.projectId}')" style="
                        background: #28a745; color: white; border: none; 
                        padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 5px;
                    ">Open Firebase Console</button>
                </div>
                <div style="background: #fff3cd; padding: 15px; margin: 20px; border-radius: 8px; border: 1px solid #ffeaa7;">
                    <strong>Quick Fixes:</strong><br>
                    1. Check your internet connection<br>
                    2. Verify Firestore security rules allow read/write<br>
                    3. Ensure the project exists in Firebase Console<br>
                    4. Check browser console for detailed errors
                </div>
            </div>
        `;
    });
    
    // Disable Firebase flag
    window.FIREBASE_ENABLED = false;
}

// Export Firebase services to global scope properly  
if (!window.firebase) {
    window.firebase = {};
}

window.firebase.app = app;
window.firebase.db = db;
window.firebase.auth = auth;
window.firebase.firestore = firebase.firestore;
window.firebase.FieldValue = firebase.firestore.FieldValue;
window.firebase.Timestamp = firebase.firestore.Timestamp;

// Also make individual services available globally for easier access
window.db = db;
window.auth = auth;
window.app = app;

console.log('🔗 Firebase services exported to global scope');
console.log('   - window.firebase.app:', !!window.firebase.app);
console.log('   - window.firebase.db:', !!window.firebase.db);
console.log('   - window.firebase.auth:', !!window.firebase.auth);

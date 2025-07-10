# GameHub Local - Firebase CRUD

A modern web application for managing a game library with Firebase integration, built with vanilla HTML, CSS, and JavaScript.

## 🎮 Features

- **Dashboard**: Overview of all collections with live statistics
- **Games Management**: Add, edit, and delete games with CheapShark API integration
- **Reviews System**: User reviews with ratings and recommendations
- **Recommendations Engine**: AI-powered game recommendations
- **Tags & Categories**: Organize games with custom tags
- **Moderation Tools**: Content moderation and logging system
- **User Management**: Complete user profile and role management

## 🚀 Live Demo

Visit the live application: [GameHub Local](https://your-username.github.io/gamehub-local/)

## 📋 Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account and project
- CheapShark API (free, no key required)

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gamehub-local.git
   cd gamehub-local
   ```

2. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Update the Firebase configuration in `js/firebase-config.js` (or keep the existing config for demo)

3. Open `index.html` in your web browser or serve it using a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using Live Server extension in VS Code
   ```

## 🏗️ Project Structure

```
gamehub-local/
├── index.html              # Main application file
├── css/
│   └── styles.css          # All styling and responsive design
├── js/
│   ├── app.js              # Main application logic (legacy)
│   ├── database.js         # Database operations (legacy)
│   ├── firebase-config.js  # Firebase configuration
│   └── crud-modules/       # Individual CRUD modules (legacy)
│       ├── games.js
│       ├── reviews.js
│       ├── recommendations.js
│       ├── tags.js
│       ├── users.js
│       └── moderationLogs.js
├── README.md
└── .gitignore
```

## 🔧 Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Firestore Database
4. Create the following collections:
   - `users`
   - `games`
   - `reviews`
   - `recommendations`
   - `tags`
   - `moderationLogs`

5. Update the Firebase config in the HTML file:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

### Firestore Rules

Set up basic security rules for Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For demo purposes - use proper auth in production
    }
  }
}
```

## 🎯 Usage

1. **Dashboard**: View statistics and overview of all collections
2. **Games**: 
   - Add games manually or browse from CheapShark API
   - Edit game details
   - Delete games
3. **Reviews**: Create and manage game reviews with ratings
4. **Recommendations**: View and manage game recommendations
5. **Tags**: Create and organize tags for categorizing games
6. **Moderation**: Log and track moderation actions
7. **Users**: Manage user accounts and permissions

## 🔌 API Integration

### CheapShark API

The application integrates with the CheapShark API to browse and add games:
- Browse popular games
- Search for specific titles
- Import game data directly into Firebase

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Modern dark theme with colorful accents
- **Interactive Dashboard**: Live statistics with 3x3 grid layout
- **Form Validation**: Client-side validation for all forms
- **Loading States**: Visual feedback during data operations
- **Error Handling**: User-friendly error messages

## 🔒 Security Notes

- The current configuration is for demo purposes
- In production, implement proper Firebase Authentication
- Set up appropriate Firestore security rules
- Consider environment variables for sensitive config

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for backend services
- [CheapShark API](https://apidocs.cheapshark.com/) for game data
- [Font Awesome](https://fontawesome.com/) for icons
- [CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) for responsive layout

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/your-username/gamehub-local/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your setup and the issue

## 🚀 Future Enhancements

- [ ] User authentication system
- [ ] Real-time notifications
- [ ] Advanced search and filtering
- [ ] Game recommendation algorithms
- [ ] Social features (friends, sharing)
- [ ] Mobile app version
- [ ] Admin dashboard
- [ ] Analytics and reporting

---

**Built with ❤️ using Firebase and modern web technologies**

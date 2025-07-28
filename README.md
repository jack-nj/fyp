# GameHub - Final Year Project

A comprehensive gaming platform that combines AI-powered game idea generation, eye tracking technology, and community-driven content with integrated game discovery features.

## 🚀 Features

### Core Features
- **AI-Powered Game Idea Generation**: Create unique game concepts with AI-generated moodboards using Google Gemini 2.0 Flash
- **Eye Tracking System**: Real-time eye tracking and blink monitoring for enhanced user interaction
- **Community Voting**: Rate and vote on community-generated game ideas
- **Leaderboard System**: Track top-rated game concepts and user contributions
- **Object-Based Game Recommendations**: Discover games based on object recognition
- **Game Deals Integration**: Find the best game deals through CheapShark API integration

### Technical Features
- **Firebase Integration**: Real-time database for user data and content storage
- **Computer Vision**: Advanced face mesh detection and eye tracking using OpenCV and cvzone
- **RESTful API**: Comprehensive API documentation with Swagger/OpenAPI 3.0
- **Responsive Web Interface**: Modern, mobile-friendly design with intuitive navigation

## 🛠️ Technology Stack

### Backend
- **Python**: Core application logic
- **Flask**: Web framework (implied from app.py structure)
- **Firebase Admin SDK**: Database and authentication
- **OpenCV**: Computer vision and image processing
- **cvzone**: Computer vision helper functions

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript**: Interactive client-side functionality
- **Firebase Web SDK**: Real-time data synchronization
- **Font Awesome**: Icon library

### APIs & Services
- **Google Gemini 2.0 Flash**: AI-powered content generation
- **Firebase Firestore**: NoSQL database
- **CheapShark API**: Game deals and pricing data

## 📁 Project Structure

```
fyp/
├── app.py                          # Main Python application with eye tracking
├── index.html                      # Main web interface
├── swagger.yaml                    # API documentation
├── c290-constellation-of-kindness-firebase-adminsdk-fbsvc-2da1aded82.json # Firebase config
├── css/
│   └── styles.css                  # Application styling
└── js/
    ├── app.js                      # Main JavaScript application logic
    ├── database.js                 # Database interaction functions
    ├── firebase-config.js          # Firebase configuration
    └── validation.js               # Input validation utilities
```

## 🚀 Getting Started

### Prerequisites
- Python 3.7+
- Node.js (for package management)
- Firebase account and project
- Webcam (for eye tracking features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fyp
   ```

2. **Install Python dependencies**
   ```bash
   pip install opencv-python cvzone firebase-admin
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Generate a service account key
   - Replace the Firebase configuration file with your credentials
   - Update `js/firebase-config.js` with your Firebase web config

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the web interface**
   - Open `index.html` in a web browser
   - Or serve it through a local web server for full functionality

### Configuration

#### Firebase Configuration
Update the Firebase service account key file and ensure your Firebase project has:
- Firestore database enabled
- Authentication configured (if using user accounts)
- Proper security rules for data access

#### API Keys
- Configure Google Gemini API key for AI features
- Set up CheapShark API access for game deals

## 📖 API Documentation

The project includes comprehensive API documentation in `swagger.yaml`. Key endpoints include:

- **Game Ideas**: CRUD operations for game concepts
- **Voting System**: Rate and vote on content
- **Leaderboard**: Access top-rated games and users
- **Eye Tracking**: Store and retrieve tracking data
- **Recommendations**: Get personalized game suggestions

View the full API documentation by importing `swagger.yaml` into Swagger UI or similar tools.

## 🎮 Usage

### Eye Tracking System
1. Launch `app.py`
2. Enter your name when prompted
3. Allow camera access
4. The system will track eye movements and blink patterns
5. Data is automatically saved to Firebase

### Web Interface
1. Open the web application
2. Navigate through different sections:
   - **Dashboard**: Overview of your activity
   - **Game Ideas**: Browse and create game concepts
   - **Object Finder**: Discover games based on objects
   - **Leaderboard**: View top contributors and content

### Game Idea Generation
1. Navigate to the Game Ideas section
2. Create new game concepts
3. AI will generate relevant moodboards
4. Share with the community for voting

## 🤝 Contributing

This is a Final Year Project (FYP). If you're interested in contributing or have suggestions:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Submit a pull request

## 📄 License

This project is developed as part of an academic Final Year Project. Please respect academic integrity guidelines when referencing or using this code.

## 👥 Support

For questions or support related to this FYP project, please contact the development team or refer to the project documentation.

## 🔄 Future Enhancements

- Machine learning models for better game recommendations
- Advanced eye tracking analytics
- Mobile app development
- Enhanced AI integration
- Multiplayer features
- Social sharing capabilities

---

**Note**: This project demonstrates the integration of modern web technologies, AI services, computer vision, and real-time databases in a gaming context. It showcases full-stack development skills and innovative use of emerging technologies.
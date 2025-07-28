import cv2 # OpenCV library for computer vision tasks like video processing.
import cvzone # cvzone library provides helper functions for computer vision projects.
from cvzone.FaceMeshModule import FaceMeshDetector # Imports FaceMeshDetector for face and landmark detection.
from cvzone.PlotModule import LivePlot # Imports LivePlot for real-time data visualization.
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import time
import os
import tkinter as tk
from tkinter import simpledialog, messagebox

# Initialize Firebase
try:
    # Check if Firebase is already initialized
    if not firebase_admin._apps:
        # Path to your Firebase service account key file
        key_path = "c290-constellation-of-kindness-firebase-adminsdk-fbsvc-2da1aded82.json"
        
        if os.path.exists(key_path):
            # Initialize Firebase with the service account key file
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized with service account key")
        else:
            print("⚠️ Firebase key file not found. Creating template...")
            print("Please update firebase-key.json with your actual Firebase credentials")
            # Initialize without Firebase for testing
            db = None
    
    # Get Firestore client
    if firebase_admin._apps:
        db = firestore.client()
        print("✅ Firestore client initialized")
    else:
        db = None
        
except Exception as e:
    print(f"⚠️ Firebase initialization failed: {e}")
    print("Running in offline mode - data will not be saved")
    db = None

# Get user name
root = tk.Tk()
root.withdraw()  # Hide the main window

userName = simpledialog.askstring("User Input", "Please enter your name:", initialvalue="")
if not userName or userName.strip() == "":
    userName = "Anonymous"
userName = userName.strip()

root.destroy()  # Clean up the tkinter window

print(f"Hello {userName}! Starting blink detection...")
messagebox.showinfo("Instructions", 
    f"Welcome {userName}!\n\n" +
    "Eye Blink Detection Started\n" +
    "Healthy blink rate: 12-20 blinks per minute\n\n" +
    "• Look at the camera\n" +
    "• Blink naturally\n" +
    "• Press 'Q' to quit\n" +
    "• Your data will be saved automatically")

# Optometry guidelines for healthy blinking
HEALTHY_BLINK_RATE_MIN = 12  # blinks per minute (minimum)
HEALTHY_BLINK_RATE_MAX = 20  # blinks per minute (maximum)
OPTIMAL_BLINK_RATE = 16      # optimal blinks per minute

# Session tracking variables
sessionStartTime = time.time()
lastMinuteCheck = time.time()
blinksInLastMinute = []
currentMinuteBlinks = 0

def getBlinkHealthStatus(blinksPerMinute):
    """Determine health status based on blink rate"""
    if blinksPerMinute < HEALTHY_BLINK_RATE_MIN:
        return "TOO LOW - Increase blinking!", (0, 0, 255)  # Red
    elif blinksPerMinute > HEALTHY_BLINK_RATE_MAX:
        return "TOO HIGH - Relax your eyes", (0, 165, 255)  # Orange
    else:
        return "HEALTHY RATE - Keep it up!", (0, 255, 0)  # Green

def saveBlinkDataToFirebase(userName, blinksPerMinute, status, totalBlinks, sessionDuration):
    """Save blink data to Firebase - same structure as GameHub"""
    if db is None:
        print("⚠️ Firebase not connected - data not saved")
        return False
    
    try:
        # Create document data matching GameHub structure exactly
        blinkData = {
            'userName': userName,
            'blinksPerMinute': blinksPerMinute,
            'healthStatus': status,
            'totalBlinks': totalBlinks,
            'sessionDurationMinutes': round(sessionDuration / 60, 2),
            'optimalRate': OPTIMAL_BLINK_RATE,
            'type': 'blink_monitoring',
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat(),
            'timestamp': datetime.now().isoformat()
        }
        
        # Add to Firestore collection (same as GameHub pattern)
        docRef = db.collection('blink_monitoring').add(blinkData)
        docId = docRef[1].id
        print(f"✅ Data saved to Firebase Cloud for {userName}")
        print(f"📄 Document ID: {docId}")
        print(f"📊 Blinks: {blinksPerMinute}/min | Status: {status}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving to Firebase Cloud: {e}")
        print("💡 Make sure your firebase-key.json is properly configured")
        return False

# Initialize video capture.
# To use an external camera, replace '0' with the appropriate camera index.
# '0' typically refers to the default webcam, '1' or higher for external cameras.
cap = cv2.VideoCapture(0) # Changed to 0 for default/external camera input

detector = FaceMeshDetector(maxFaces=1)
plotY = LivePlot(640, 360, [20,50], invert=True)

idList = [22,23,24,26,110,157,158,159,160,161,130,243]
ratioList = []
blinkCounter = 0
counter = 0
color = (255,0,255)

while True:
    
    # If using a video file, this part would loop it.
    # For live camera feed, this check is not strictly necessary but harmless.
    # if cap.get(cv2.CAP_PROP_POS_FRAMES) == cap.get(cv2.CAP_PROP_FRAME_COUNT):
    #     cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    success, img = cap.read()
    
    if not success:
        print("Failed to read camera frame. Exiting program.") # Changed message for camera
        break

    img, faces = detector.findFaceMesh(img, draw=False)
    
    # Calculate current blink rate (per minute)
    currentTime = time.time()
    
    # Check if a minute has passed to calculate blink rate
    if currentTime - lastMinuteCheck >= 60:
        sessionDuration = currentTime - sessionStartTime
        blinksPerMinute = currentMinuteBlinks  # Use actual blinks in this minute
        
        # Get health status
        healthStatus, healthColor = getBlinkHealthStatus(blinksPerMinute)
        
        # Save to Firebase every minute
        saveBlinkDataToFirebase(userName, blinksPerMinute, healthStatus, blinkCounter, sessionDuration)
        
        # Reset for next minute
        lastMinuteCheck = currentTime
        currentMinuteBlinks = 0
        
        print(f"📊 {userName}: {blinksPerMinute} blinks/min - {healthStatus}")
    
    if faces : 
        face = faces[0]
        
        for id in idList :
            cv2.circle(img, face[id], 5, color, cv2.FILLED)
            
            
        leftUp = face[159]
        leftDown = face[23]
        
        leftLeft = face[130]
        leftRight = face[243]
        
        lenghtVer, _ = detector.findDistance(leftUp, leftDown)
        lenghtHor, _ = detector.findDistance(leftLeft, leftRight)
        
        cv2.line(img, leftUp, leftDown, (0,200,0), 3)
        cv2.line(img, leftLeft, leftRight, (0,200,0), 3)
        
        ratio = int((lenghtVer/lenghtHor) * 100)
        ratioList.append(ratio)
        
        if len(ratioList) > 3 :
            ratioList.pop(0)
        ratioAvg = sum(ratioList) / len(ratioList)
        
        if ratioAvg < 35 and counter == 0:
            blinkCounter += 1
            currentMinuteBlinks += 1
            counter = 1
            color = (0,200,0)
            
        if counter != 0 :
            counter += 1
            if counter > 10 :
                counter = 0
                color = (255,0,255)
        
        # Calculate current blink rate estimate
        sessionDuration = currentTime - sessionStartTime
        if sessionDuration >= 30:  # More accurate after 30 seconds
            estimatedBlinksPerMinute = int((blinkCounter / (sessionDuration / 60)))
        else:
            estimatedBlinksPerMinute = int((blinkCounter / max(sessionDuration / 60, 0.5)) * 0.5)  # Conservative estimate for first 30 seconds
        healthStatus, healthColor = getBlinkHealthStatus(estimatedBlinksPerMinute)
        
        # Display information on screen - organized layout that doesn't cover face
        # Left side information panel
        cvzone.putTextRect(img, f'User: {userName}', (10, 30), scale=1, thickness=2, colorR=(255,255,255))
        cvzone.putTextRect(img, f'Blink Count: {blinkCounter}', (10, 70), scale=1.2, thickness=2, colorR=color)
        cvzone.putTextRect(img, f'Rate: {estimatedBlinksPerMinute}/min', (10, 110), scale=1.2, thickness=2, colorR=healthColor)
        
        # Bottom information panel
        cvzone.putTextRect(img, f'Status: {healthStatus}', (10, 300), scale=1, thickness=2, colorR=healthColor)
        cvzone.putTextRect(img, f'Healthy Rate: {HEALTHY_BLINK_RATE_MIN}-{HEALTHY_BLINK_RATE_MAX} blinks/min', (10, 330), scale=0.8, thickness=1, colorR=(255,255,255))
        
        # Session info (top right)
        sessionMinutes = int(sessionDuration / 60)
        sessionSeconds = int(sessionDuration % 60)
        cvzone.putTextRect(img, f'Session: {sessionMinutes}m {sessionSeconds}s', (400, 30), scale=0.8, thickness=1, colorR=(255,255,255))
        
        imgPlot = plotY.update(ratioAvg, color)
        
        img = cv2.resize(img, (640, 360))
        imgStack = cvzone.stackImages([img, imgPlot], 2, 1)
        
    else : 
        # Display message when no face is detected
        img = cv2.resize(img, (640, 360))
        cvzone.putTextRect(img, f'User: {userName}', (10, 30), scale=1, thickness=2, colorR=(255,255,255))
        cvzone.putTextRect(img, 'No Face Detected', (10, 70), scale=1.2, thickness=2, colorR=(0,0,255))
        cvzone.putTextRect(img, 'Please position yourself in camera view', (10, 110), scale=0.8, thickness=1, colorR=(255,255,255))
        cvzone.putTextRect(img, f'Total Blinks: {blinkCounter}', (10, 300), scale=1, thickness=2, colorR=(255,255,255))
        cvzone.putTextRect(img, f'Healthy Rate: {HEALTHY_BLINK_RATE_MIN}-{HEALTHY_BLINK_RATE_MAX} blinks/min', (10, 330), scale=0.8, thickness=1, colorR=(255,255,255))
        
        # Create a default plot when no face is detected
        imgPlot = plotY.update(0, (255,0,255))
        imgStack = cvzone.stackImages([img, imgPlot], 2, 1) 
        
    cv2.imshow("Image", imgStack)
    
    if cv2.waitKey(25) & 0xFF == ord('q'):
        # Save final session data before exiting
        finalSessionDuration = time.time() - sessionStartTime
        finalBlinksPerMinute = int((blinkCounter / max(finalSessionDuration / 60, 0.1)))
        finalHealthStatus, _ = getBlinkHealthStatus(finalBlinksPerMinute)
        saveBlinkDataToFirebase(userName, finalBlinksPerMinute, finalHealthStatus, blinkCounter, finalSessionDuration)
        print(f"👋 Session ended for {userName}. Final stats: {blinkCounter} total blinks, {finalBlinksPerMinute} blinks/min")
        break

cap.release()
cv2.destroyAllWindows()
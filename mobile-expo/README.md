# Mobile Application

React Native mobile application built with Expo, featuring native OMR scanner and full LMS functionality.

## Features

- Course browsing and enrollment
- Quiz participation
- Native OMR (Optical Mark Recognition) scanner
- Camera integration for answer sheet scanning
- Real-time answer detection
- Offline support
- Push notifications
- User profile management

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Context API
- **Camera**: Expo Camera
- **Image Processing**: React Native OpenCV (for OMR)
- **API**: Axios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API endpoint:
Edit the API base URL in `src/services/api.js` to point to your backend.

3. Start Expo development server:
```bash
npx expo start
```

4. Run on device or emulator:
- **iOS**: Press `i` or scan QR code with Expo Go app
- **Android**: Press `a` or scan QR code with Expo Go app
- **Web**: Press `w` (limited functionality)

## Build for Production

### Android APK:
```bash
npx expo build:android
```

### iOS IPA:
```bash
npx expo build:ios
```

## Project Structure

- `/src/screens` - Screen components
- `/src/components` - Reusable components (including OMR scanner)
- `/src/navigation` - Navigation structure
- `/src/services` - API services
- `/src/context` - State management

## Key Features

### OMR Scanner
The integrated OMR scanner (`src/components/LocalOMRScanner.js`) provides:
- Live camera preview
- Automatic paper edge detection
- Perspective correction
- Bubble detection for 10-question sheets
- Confidence scoring for each answer
- Visual feedback during scanning

### User Roles
- **Student**: Browse courses, take quizzes, scan answer sheets
- **Instructor**: View course analytics (mobile view)
- **Admin**: Limited admin functions

## Network Configuration

When testing on physical device:
1. Ensure device and development machine are on same network
2. Update API URL with your machine's IP address
3. For school/restricted networks, consider using ngrok tunnel

## Troubleshooting

- **Camera not working**: Check app permissions in device settings
- **API errors**: Verify backend URL and network connectivity
- **OMR not detecting**: Ensure good lighting and paper contrast

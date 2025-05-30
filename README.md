# StoreApp 🛍️

A modern React Native e-commerce application built as part of the Eurisko Academy assignment. This app provides a complete shopping experience with product browsing, cart management, user authentication, and more.

## 📱 Features

### Core Features

- **Product Management**: Browse, search, and filter products
- **Shopping Cart**: Add/remove items, quantity management, persistent cart
- **User Authentication**: Sign up, login, OTP verification, password reset
- **User Profile**: Profile management with image upload
- **Product Search**: Real-time product search functionality
- **Categories & Filters**: Filter products by category, price, stock status
- **Responsive Design**: Optimized for both iOS and Android

### Advanced Features

- **Push Notifications**: Real-time notifications using Notifee
- **Deep Linking**: Navigate directly to specific products/screens
- **Offline Support**: Persistent cart and user data
- **Error Tracking**: Firebase Crashlytics integration
- **Analytics**: Firebase Analytics for user behavior tracking
- **Image Handling**: Camera roll integration and image picker
- **Maps Integration**: Location services and maps
- **State Management**: Zustand for efficient state management
- **API Integration**: React Query for data fetching and caching

## 🛠️ Tech Stack

- **Framework**: React Native 0.79.2
- **Language**: TypeScript
- **State Management**: Zustand with persistence
- **Data Fetching**: TanStack React Query (v5)
- **Navigation**: React Navigation v7
- **UI Components**: React Native Vector Icons, Heroicons
- **Forms**: React Hook Form with Zod validation
- **Storage**: AsyncStorage
- **Notifications**: Notifee
- **Firebase**: Analytics, Crashlytics
- **Maps**: React Native Maps
- **Camera**: React Native Vision Camera
- **Testing**: Jest, React Native Testing Library

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 18.0.0
- **React Native CLI**: Latest version
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **CocoaPods**: For iOS dependencies
- **Java Development Kit (JDK)**: Version 17

> **Note**: Make sure you have completed the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd StoreApp
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# For iOS only - Install CocoaPods dependencies
cd ios && bundle install && bundle exec pod install && cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory and add your configuration:

```env
API_BASE_URL=your_api_base_url
FIREBASE_API_KEY=your_firebase_api_key
# Add other environment variables as needed
```

### 4. Start Metro Bundler

```bash
npm start
```

### 5. Run the Application

#### For Android:

```bash
npm run android
```

#### For iOS:

```bash
npm run ios
```

## 📁 Project Structure

```
StoreApp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Application screens
│   ├── navigation/         # Navigation configuration
│   ├── store/             # Zustand stores
│   │   ├── authStore.ts   # Authentication state
│   │   ├── cartStore.ts   # Shopping cart state
│   │   └── productStore.ts # Product management state
│   ├── services/          # External services
│   │   ├── notificationService.ts
│   │   └── deepLinkService.ts
│   ├── utils/             # Utility functions and API
│   │   └── api/           # API services and configuration
│   ├── context/           # React contexts
│   └── config/            # App configuration
├── android/               # Android-specific code
├── ios/                   # iOS-specific code
├── __tests__/            # Test files
└── docs/                 # Additional documentation
```

## 🔧 Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## 🧪 Testing

The app includes comprehensive testing setup:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📱 Key Features Implementation

### Authentication Flow

- Email/password registration and login
- OTP verification for new accounts
- Password reset functionality
- Persistent authentication state

### Shopping Cart

- Add/remove products
- Quantity management
- Price calculation
- Persistent cart across app sessions

### Product Management

- Product listing with pagination
- Search and filtering
- Category-based browsing
- Product details view

### Notifications

- Push notifications setup
- Local notifications
- Deep link handling from notifications

## 🔥 Firebase Integration

The app integrates with Firebase for:

- **Analytics**: Track user behavior and app usage
- **Crashlytics**: Monitor and track app crashes
- **Performance**: Monitor app performance metrics

## 🚀 Deployment

### Android

1. Generate a signed APK or AAB
2. Follow the [React Native Android deployment guide](https://reactnative.dev/docs/signed-apk-android)

### iOS

1. Archive the project in Xcode
2. Follow the [React Native iOS deployment guide](https://reactnative.dev/docs/publishing-to-app-store)

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **iOS build issues**: Clean build folder and reinstall pods
3. **Android build issues**: Clean project with `cd android && ./gradlew clean`

### Debug Mode

- **Android**: Shake device or press `Ctrl + M` (Windows/Linux) / `Cmd + M` (macOS)
- **iOS**: Shake device or press `Cmd + D` in simulator

## 📚 Additional Documentation

- [App Icon Guide](./APP_ICON_GUIDE.md)
- [Build & Release Guide](./BUILD_RELEASE.md)
- [Firebase Crashlytics Setup](./FIREBASE_CRASHLYTICS_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Eurisko Academy React Native assignment.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [React Native documentation](https://reactnative.dev/docs/getting-started)
3. Check existing issues in the repository
4. Create a new issue with detailed information

---

**Happy Coding! 🚀**

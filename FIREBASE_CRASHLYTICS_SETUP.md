# Firebase Crashlytics Setup Guide

This guide will help you complete the Firebase Crashlytics integration for your React Native Android app.

## 🚀 What's Already Done

✅ **Packages Installed**

- `@react-native-firebase/app`
- `@react-native-firebase/crashlytics`

✅ **Android Configuration**

- Updated `android/build.gradle` with Firebase plugins
- Updated `android/app/build.gradle` with Firebase dependencies
- Added Firebase BoM for version management

✅ **React Native Code**

- Firebase service configuration (`src/config/firebase.ts`)
- Custom Crashlytics hook (`src/hooks/useCrashlytics.ts`)
- Error boundary component (`src/components/ErrorBoundary.tsx`)
- Test screen for Crashlytics (`src/screens/CrashlyticsTestScreen.tsx`)
- App.tsx updated with Firebase initialization

## 🔧 What You Need to Do

### 1. Create Firebase Project & Download Configuration

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create a new project** or select an existing one
3. **Add Android app**:
   - Click "Add app" → Select Android
   - Package name: `com.storeapp`
   - App nickname: `StoreApp` (optional)
   - Debug signing certificate SHA-1: Leave empty for now
4. **Download `google-services.json`**
5. **Replace the example file**:

   ```bash
   # Delete the example file
   rm android/app/google-services.json.example

   # Place your downloaded google-services.json in android/app/
   # The file should be at: android/app/google-services.json
   ```

### 2. Enable Crashlytics in Firebase Console

1. In your Firebase project, go to **Crashlytics** in the left sidebar
2. Click **"Get started"**
3. Follow the setup wizard (most steps are already done)
4. **Enable Crashlytics** for your Android app

### 3. Build and Test

1. **Clean and rebuild**:

   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. **Test Crashlytics**:
   - Navigate to the `CrashlyticsTestScreen` in your app
   - Use the test buttons to verify functionality
   - Check Firebase Console → Crashlytics for reports

## 📱 How to Use Crashlytics in Your App

### Using the Custom Hook

```typescript
import {useCrashlytics} from '../hooks/useCrashlytics';

const MyComponent = () => {
  const {logMessage, recordError, setUserId} = useCrashlytics();

  const handleError = (error: Error) => {
    recordError(error, 'Custom Error Context');
  };

  const handleUserLogin = (userId: string) => {
    setUserId(userId);
  };

  // ... rest of component
};
```

### Using the Firebase Service Directly

```typescript
import firebaseService from '../config/firebase';

// Log a message
firebaseService.logMessage('User performed action X');

// Record an error
firebaseService.recordError(new Error('Something went wrong'), 'API Error');

// Set user attributes
firebaseService.setAttribute('user_type', 'premium');
```

### Error Boundary

The `ErrorBoundary` component is already wrapping your app in `App.tsx`. It will automatically catch and report React errors to Crashlytics.

## 🔍 Testing Crashlytics

### Test Screen Features

The `CrashlyticsTestScreen` includes buttons to test:

- **Log Message**: Send custom messages to Crashlytics
- **Set User ID**: Associate crashes with specific users
- **Set Attributes**: Add custom key-value pairs to crash reports
- **Record Non-Fatal Error**: Log errors without crashing
- **Test Crashes**: Force crashes for testing (use carefully!)

### Viewing Reports

1. Go to Firebase Console → Your Project → Crashlytics
2. Reports may take 5-10 minutes to appear
3. You'll see:
   - Crash-free users percentage
   - Individual crash reports
   - Custom logs and attributes
   - User information

## 🛠️ Advanced Configuration

### Production vs Development

The Firebase service automatically:

- **Disables** Crashlytics in development (`__DEV__ = true`)
- **Enables** Crashlytics in production builds

### Custom Error Handling

```typescript
// In your API service or error handlers
try {
  await apiCall();
} catch (error) {
  // Log to Crashlytics
  firebaseService.recordError(error as Error, 'API Call Failed');

  // Handle error in UI
  showErrorMessage('Something went wrong');
}
```

### User Context

```typescript
// When user logs in
firebaseService.setUserId(user.id);
firebaseService.setAttribute('user_plan', user.plan);
firebaseService.setAttribute('app_version', '1.0.0');
```

## 🚨 Important Notes

1. **google-services.json**: This file contains sensitive information. Never commit it to public repositories.

2. **Testing**: Crashes in development mode won't be reported. Test with release builds for accurate results.

3. **Privacy**: Ensure you comply with privacy laws when collecting crash data.

4. **Performance**: Crashlytics has minimal performance impact, but avoid excessive logging.

## 🔧 Troubleshooting

### Build Issues

If you encounter build issues:

```bash
# Clean everything
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npx react-native run-android
```

### No Reports in Console

- Ensure `google-services.json` is in the correct location
- Check that Crashlytics is enabled in Firebase Console
- Wait 5-10 minutes for reports to appear
- Test with a release build, not debug

### ProGuard Issues (Release Builds)

If using ProGuard, add to `android/app/proguard-rules.pro`:

```
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
```

## 📚 Additional Resources

- [Firebase Crashlytics Documentation](https://firebase.google.com/docs/crashlytics)
- [React Native Firebase Crashlytics](https://rnfirebase.io/crashlytics/usage)
- [Firebase Console](https://console.firebase.google.com/)

---

**Next Steps**: After completing the setup, you'll have real-time crash monitoring and detailed error reports to help improve your app's stability and user experience!

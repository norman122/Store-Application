# Building StoreApp for Release

This guide explains how to build the StoreApp for release distribution, covering both AAB (Android App Bundle) for Google Play Store submission and APK files for testing.

## Prerequisites

Before building for release, ensure you have:

- ✅ Android development environment set up
- ✅ Java Development Kit (JDK) installed
- ✅ Android SDK and build tools
- ✅ A signing keystore file (for production releases)

## 🔐 Setting Up App Signing

### 1. Generate a Keystore (One-time setup)

If you don't have a keystore file yet, generate one:

**Windows:**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**macOS/Linux:**

```bash
sudo keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

⚠️ **Important:**

- Remember your keystore password, key alias, and key password
- Store the keystore file securely - you'll need it for all future app updates
- Never commit the keystore file to version control

### 2. Place Keystore File

Move your `my-upload-key.keystore` file to:

```
android/app/my-upload-key.keystore
```

### 3. Configure Gradle Properties

Edit `android/gradle.properties` and add your signing configuration:

```properties
# Signing configuration for release builds
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=your-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your-keystore-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
```

Replace the placeholder values with your actual:

- `your-key-alias`: The alias you used when creating the keystore
- `your-keystore-password`: The password for the keystore file
- `your-key-password`: The password for the specific key

## 📦 Building AAB (Android App Bundle)

AAB files are used for Google Play Store distribution. Google Play automatically generates optimized APKs from the AAB.

### Build AAB Command

```bash
npx react-native build-android --mode=release
```

### Output Location

The generated AAB file will be located at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

### File Size

Typical AAB size: ~50MB

### Usage

- Upload this file to Google Play Console
- Google Play will generate optimized APKs for different device configurations
- Supports App Signing by Google Play

## 📱 Building APK (Android Package)

APK files can be installed directly on Android devices and emulators for testing.

### Build APK Command

```bash
cd android
./gradlew assembleRelease
```

### Output Location

The generated APK file will be located at:

```
android/app/build/outputs/apk/release/app-release.apk
```

### File Size

Typical APK size: ~75MB (larger than AAB because it contains all architectures)

## 🧪 Testing Release Builds

### Install APK on Emulator/Device

**Using ADB:**

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Alternative methods:**

- Drag and drop APK file onto emulator window
- Use device file manager to install APK
- Transfer APK to physical device via USB/cloud storage

### Test Release Build with React Native CLI

```bash
npx react-native run-android --mode=release
```

Note: This requires proper signing configuration to work.

## 🏗️ Build Architecture Options

By default, the build includes all CPU architectures. To optimize for specific architectures:

### Split APKs by Architecture

Edit `android/app/build.gradle`:

```gradle
android {
    splits {
        abi {
            reset()
            enable true
            universalApk false  // Set to true for universal APK
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
}
```

This generates separate APKs for each architecture, reducing individual file sizes.

## 🚀 Deployment Checklist

### Before Building for Production:

- [ ] Update version code and version name in `android/app/build.gradle`
- [ ] Test the app thoroughly in release mode
- [ ] Verify all API keys and configurations are correct
- [ ] Ensure signing configuration is properly set up
- [ ] Test on multiple devices/emulators

### Version Management

Update version in `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 2        // Increment for each release
        versionName "1.1.0"  // Semantic versioning
    }
}
```

## 🔧 Troubleshooting

### Common Issues:

**1. Keystore password incorrect:**

```
Failed to read key my-key-alias from store: keystore password was incorrect
```

- Verify passwords in `gradle.properties`
- Check that the key alias exists in the keystore

**2. Build fails with signing errors:**

- Ensure keystore file is in `android/app/` directory
- Verify all signing variables are set in `gradle.properties`

**3. APK/AAB not generated:**

- Check build logs for errors
- Ensure all dependencies are properly installed
- Try cleaning the build: `cd android && ./gradlew clean`

### Clean Build

If you encounter issues, try a clean build:

```bash
cd android
./gradlew clean
cd ..
npx react-native build-android --mode=release
```

## 📋 File Structure

After successful builds, your output structure should look like:

```
android/app/build/outputs/
├── bundle/release/
│   └── app-release.aab          # For Google Play Store
└── apk/release/
    ├── app-release.apk          # For testing/sideloading
    └── output-metadata.json     # Build metadata
```

## 🔒 Security Notes

- Never commit keystore files to version control
- Store keystore passwords securely (consider using environment variables for CI/CD)
- Keep backup copies of your keystore file in secure locations
- For production apps, consider using Google Play App Signing

## 📚 Additional Resources

- [React Native Android Release Documentation](https://reactnative.dev/docs/signed-apk-android)
- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

---

**Last Updated:** May 30, 2025  
**React Native Version:** 0.79+

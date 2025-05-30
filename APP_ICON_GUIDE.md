# Custom App Icon Setup Guide

## 🎨 Creating Custom App Icons for StoreApp

This guide will help you replace the default React Native app icons with custom branded icons for your StoreApp.

## 📋 Required Icon Sizes for Android

You need to create icons in the following sizes:

| Density | Size (px) | Directory         |
| ------- | --------- | ----------------- |
| ldpi    | 36x36     | `mipmap-ldpi/`    |
| mdpi    | 48x48     | `mipmap-mdpi/`    |
| hdpi    | 72x72     | `mipmap-hdpi/`    |
| xhdpi   | 96x96     | `mipmap-xhdpi/`   |
| xxhdpi  | 144x144   | `mipmap-xxhdpi/`  |
| xxxhdpi | 192x192   | `mipmap-xxxhdpi/` |

## 🔧 Current Issue: Missing Round Icons

**Problem**: Your project is missing round icon files (`ic_launcher_round.png`) and the `mipmap-ldpi` directory.

**Solution**: Follow the steps below to fix this.

## 🛠️ Method 1: Online Icon Generator (Recommended)

### Using Android Asset Studio:

1. **Go to**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. **Upload your logo**: Choose a high-resolution PNG (1024x1024 recommended)
3. **Configure settings**:
   - Name: `ic_launcher`
   - Shape: Choose **both square and round** options
   - Background: Set your brand color or transparent
   - **Important**: Make sure to generate both regular and round variants
4. **Download**: Get the generated ZIP file
5. **Extract and copy**: Copy all the `mipmap-*` folders to `android/app/src/main/res/`

### Using App Icon Generator:

1. **Go to**: https://appicon.co/
2. **Upload**: Your 1024x1024 PNG logo
3. **Select**: Android platform
4. **Make sure**: Both regular and round icons are generated
5. **Download**: The generated icons
6. **Copy**: Replace the existing icons in your project

## 🎨 Method 2: Manual Creation

If you have design software (Photoshop, Figma, etc.):

1. **Create your base icon**: 1024x1024px PNG with transparent background
2. **Create two versions**:
   - **Square version**: For `ic_launcher.png`
   - **Round version**: For `ic_launcher_round.png` (circular crop)
3. **Resize for each density**: Create both versions for all sizes
4. **Place in directories**: Copy to respective `mipmap-*` folders

## 📁 Fixed File Structure

After adding custom icons, your structure should look like:

```
android/app/src/main/res/
├── mipmap-ldpi/          ← CREATE THIS DIRECTORY
│   ├── ic_launcher.png (36x36)
│   └── ic_launcher_round.png (36x36)    ← ADD THIS FILE
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)    ← ADD THIS FILE
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)    ← ADD THIS FILE
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)    ← ADD THIS FILE
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)  ← ADD THIS FILE
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)  ← ADD THIS FILE
```

## 🚨 Quick Fix Steps

### Step 1: Create Missing Directory

```bash
mkdir android/app/src/main/res/mipmap-ldpi
```

### Step 2: Generate Icons Online

1. Go to https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload your logo
3. **Important**: Check both "Legacy" and "Round" options
4. Download the ZIP file
5. Extract and copy ALL folders to `android/app/src/main/res/`

### Step 3: Verify Structure

Make sure you have both files in each directory:

- `ic_launcher.png` (square/legacy icon)
- `ic_launcher_round.png` (round icon for Android 7.1+)

## 🔧 Adaptive Icons (Android 8.0+)

For modern Android versions, you can also create adaptive icons:

1. **Create directory**: `mipmap-anydpi-v26/`
2. **Create files**:
   - `ic_launcher.xml`
   - `ic_launcher_round.xml`

Example adaptive icon configuration:

**ic_launcher.xml:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

**ic_launcher_round.xml:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

## ✅ Testing Your Icons

After adding custom icons:

1. **Clean build**:

   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Rebuild app**:

   ```bash
   npx react-native run-android
   ```

3. **Check**: Your custom icon should appear in the app launcher
4. **Test round icons**: On devices with round icon support, verify the round version appears

## 🎨 Design Tips

- **Keep it simple**: Icons should be recognizable at small sizes
- **Use your brand colors**: Maintain consistency with your app's theme
- **Test on different backgrounds**: Ensure visibility on light and dark launchers
- **Consider the safe zone**: Keep important elements within the center 66% of the icon
- **Round icon design**: Make sure your logo works well in a circular crop

## 🚀 Quick Setup with Placeholder

If you need a quick custom icon for testing, you can:

1. **Use your logo.png**: The one in your project root
2. **Resize it**: Using online tools or image editors
3. **Create round version**: Crop to circle for round icons
4. **Replace**: Both `ic_launcher.png` and `ic_launcher_round.png` files

## 📱 Verification

To verify your icons are working:

1. **Build release APK**: Follow the build guide
2. **Install on device**: Check the app launcher
3. **Test different launchers**: Some Android launchers display icons differently
4. **Check round icons**: Test on devices that support round icons (Android 7.1+)

## 🔍 Troubleshooting

**Missing round icons error?**

- Make sure `ic_launcher_round.png` exists in all mipmap directories
- Verify the `mipmap-ldpi` directory exists

**Icons not updating?**

- Clean and rebuild the project
- Clear app data on the device
- Uninstall and reinstall the app

---

**Next Step**: After setting up custom icons, proceed to generate your APK file using the build instructions in `BUILD_RELEASE.md`.

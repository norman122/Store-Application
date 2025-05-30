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

## 🛠️ Method 1: Online Icon Generator (Recommended)

### Using Android Asset Studio:

1. **Go to**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. **Upload your logo**: Choose a high-resolution PNG (1024x1024 recommended)
3. **Configure settings**:
   - Name: `ic_launcher`
   - Shape: Choose your preferred shape (circle, square, etc.)
   - Background: Set your brand color or transparent
4. **Download**: Get the generated ZIP file
5. **Extract and copy**: Copy all the `mipmap-*` folders to `android/app/src/main/res/`

### Using App Icon Generator:

1. **Go to**: https://appicon.co/
2. **Upload**: Your 1024x1024 PNG logo
3. **Select**: Android platform
4. **Download**: The generated icons
5. **Copy**: Replace the existing icons in your project

## 🎨 Method 2: Manual Creation

If you have design software (Photoshop, Figma, etc.):

1. **Create your base icon**: 1024x1024px PNG with transparent background
2. **Resize for each density**:
   - Save as `ic_launcher.png` for each size
   - Save as `ic_launcher_round.png` for round variants
3. **Place in directories**: Copy to respective `mipmap-*` folders

## 📁 File Structure

After adding custom icons, your structure should look like:

```
android/app/src/main/res/
├── mipmap-ldpi/
│   ├── ic_launcher.png (36x36)
│   └── ic_launcher_round.png (36x36)
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)
```

## 🔧 Adaptive Icons (Android 8.0+)

For modern Android versions, you can also create adaptive icons:

1. **Create**: `ic_launcher_background.xml` and `ic_launcher_foreground.xml`
2. **Or use**: PNG files for background and foreground layers
3. **Configure**: In `mipmap-anydpi-v26/ic_launcher.xml`

Example adaptive icon configuration:

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

## 🎨 Design Tips

- **Keep it simple**: Icons should be recognizable at small sizes
- **Use your brand colors**: Maintain consistency with your app's theme
- **Test on different backgrounds**: Ensure visibility on light and dark launchers
- **Consider the safe zone**: Keep important elements within the center 66% of the icon

## 🚀 Quick Setup with Placeholder

If you need a quick custom icon for testing, you can:

1. **Use your logo.png**: The one in your project root
2. **Resize it**: Using online tools or image editors
3. **Replace**: The existing `ic_launcher.png` files

## 📱 Verification

To verify your icons are working:

1. **Build release APK**: Follow the build guide
2. **Install on device**: Check the app launcher
3. **Test different launchers**: Some Android launchers display icons differently

---

**Next Step**: After setting up custom icons, proceed to generate your APK file using the build instructions in `BUILD_RELEASE.md`.

# Deep Link Testing Commands

## Android Testing

### Test custom scheme deep links:

```bash
# Test product deep link
adb shell am start -W -a android.intent.action.VIEW -d "storeapp://product/123" com.storeapp

# Test home deep link
adb shell am start -W -a android.intent.action.VIEW -d "storeapp://home" com.storeapp

# Test add product deep link
adb shell am start -W -a android.intent.action.VIEW -d "storeapp://add-product" com.storeapp
```

### Test web URL deep links:

```bash
# Test web product link
adb shell am start -W -a android.intent.action.VIEW -d "https://storeapp.com/product/123" com.storeapp

# Test web edit product link
adb shell am start -W -a android.intent.action.VIEW -d "https://storeapp.com/edit-product/123" com.storeapp
```

## iOS Testing

### Test custom scheme deep links:

```bash
# Test product deep link
xcrun simctl openurl booted "storeapp://product/123"

# Test home deep link
xcrun simctl openurl booted "storeapp://home"

# Test add product deep link
xcrun simctl openurl booted "storeapp://add-product"
```

### Test web URL deep links:

```bash
# Test web product link
xcrun simctl openurl booted "https://storeapp.com/product/123"

# Test web edit product link
xcrun simctl openurl booted "https://storeapp.com/edit-product/123"
```

## Testing Notifications

1. Add a new product in the app
2. Check if notification appears
3. Tap the notification to test deep linking
4. Update an existing product
5. Check if update notification appears
6. Tap the notification to test deep linking

## Debugging

- Check React Native logs for deep link handling messages
- Verify notification permissions are granted
- Ensure the app is properly configured for deep linking
- Test both foreground and background notification handling

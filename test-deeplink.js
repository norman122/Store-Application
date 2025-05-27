const { execSync } = require('child_process');

// Test deep link URLs
const testUrls = [
  'storeapp://product/68355173c2649451e2c548a6',
  'storeapp://home',
  'storeapp://add-product',
  'storeapp://cart'
];

console.log('Testing deep links for StoreApp...\n');

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}: ${url}`);
  
  try {
    // Test with uri-scheme (if available)
    console.log('Testing with uri-scheme...');
    execSync(`npx uri-scheme open "${url}" --android`, { stdio: 'inherit' });
    console.log('✅ Success with uri-scheme\n');
  } catch (error) {
    console.log('❌ uri-scheme failed, trying adb...');
    
    try {
      // Fallback to adb
      const adbCommand = `adb shell am start -W -a android.intent.action.VIEW -d "${url}" com.storeapp`;
      console.log(`Running: ${adbCommand}`);
      execSync(adbCommand, { stdio: 'inherit' });
      console.log('✅ Success with adb\n');
    } catch (adbError) {
      console.log('❌ Both methods failed');
      console.log('Make sure you have:');
      console.log('1. Android device/emulator connected');
      console.log('2. StoreApp installed');
      console.log('3. ADB in your PATH\n');
    }
  }
});

console.log('Deep link testing completed!'); 
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useCrashlytics } from '../hooks/useCrashlytics';
import crashlytics from '@react-native-firebase/crashlytics';

const CrashlyticsTestScreen: React.FC = () => {
  // Create a single instance to avoid repeated calls
  const crashlyticsInstance = useMemo(() => crashlytics(), []);
  
  const {
    logMessage,
    setUserId,
    setAttribute,
    recordError,
    logEvent,
    setUserProperties,
  } = useCrashlytics();

  const handleTestCrashlyticsStatus = () => {
    console.log('🔥 [DEBUG] Testing Crashlytics Status...');
    
    try {
      const isEnabled = crashlyticsInstance.isCrashlyticsCollectionEnabled;
      console.log('🔥 [DEBUG] Crashlytics enabled:', isEnabled);
      
      // Log multiple test messages
      const timestamp = new Date().toISOString();
      crashlyticsInstance.log(`Test log 1 - ${timestamp}`);
      crashlyticsInstance.log(`Test log 2 - ${timestamp}`);
      crashlyticsInstance.log(`Test log 3 - ${timestamp}`);
      
      // Set test attributes
      crashlyticsInstance.setAttribute('test_timestamp', timestamp);
      crashlyticsInstance.setAttribute('test_screen', 'CrashlyticsTestScreen');
      
      // Set user ID
      crashlyticsInstance.setUserId(`test_user_${Date.now()}`);
      
      // Record a test error
      const testError = new Error(`Test error recorded at ${timestamp}`);
      crashlyticsInstance.recordError(testError, 'TestError');
      
      console.log('🔥 [DEBUG] All Crashlytics operations completed');
      
      Alert.alert(
        'Crashlytics Test Complete',
        `Status: ${isEnabled ? 'ENABLED' : 'DISABLED'}\n\n` +
        'Operations performed:\n' +
        '✓ 3 log messages\n' +
        '✓ 2 custom attributes\n' +
        '✓ User ID set\n' +
        '✓ Non-fatal error recorded\n\n' +
        'Check Firebase Console in 5-15 minutes.\n' +
        'Data appears under Crashlytics section.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('🔥 [DEBUG] Error in Crashlytics test:', error);
      Alert.alert('Error', `Crashlytics test failed: ${error}`);
    }
  };

  const handleLogMessage = () => {
    console.log('🔥 [DEBUG] handleLogMessage called');
    
    // Check if Crashlytics is enabled
    const isEnabled = crashlyticsInstance.isCrashlyticsCollectionEnabled;
    console.log('🔥 [DEBUG] Crashlytics collection enabled:', isEnabled);
    
    const message = 'Test message logged to Crashlytics';
    console.log('🔥 [DEBUG] About to log message:', message);
    
    try {
      logMessage(message);
      console.log('🔥 [DEBUG] Message logged successfully via hook');
      
      // Also try direct logging
      crashlyticsInstance.log(message + ' (direct call)');
      console.log('🔥 [DEBUG] Message logged successfully via direct call');
      
      Alert.alert('Success', `Message logged to Crashlytics\nEnabled: ${isEnabled}`);
    } catch (error) {
      console.error('🔥 [DEBUG] Error logging message:', error);
      Alert.alert('Error', 'Failed to log message: ' + error);
    }
  };

  const handleSetUserId = () => {
    console.log('🔥 [DEBUG] handleSetUserId called');
    const userId = `user_${Date.now()}`;
    console.log('🔥 [DEBUG] About to set user ID:', userId);
    setUserId(userId);
    console.log('🔥 [DEBUG] User ID set successfully');
    Alert.alert('Success', `User ID set to: ${userId}`);
  };

  const handleSetAttribute = () => {
    console.log('🔥 [DEBUG] handleSetAttribute called');
    console.log('🔥 [DEBUG] About to set attribute: test_attribute = test_value');
    setAttribute('test_attribute', 'test_value');
    console.log('🔥 [DEBUG] Attribute set successfully');
    Alert.alert('Success', 'Custom attribute set');
  };

  const handleRecordError = () => {
    console.log('🔥 [DEBUG] handleRecordError called');
    const testError = new Error('This is a test non-fatal error');
    console.log('🔥 [DEBUG] About to record error:', testError.message);
    recordError(testError, 'Test Error');
    console.log('🔥 [DEBUG] Error recorded successfully');
    Alert.alert('Success', 'Non-fatal error recorded');
  };

  const handleLogEvent = () => {
    console.log('🔥 [DEBUG] handleLogEvent called');
    const eventData = { 
      screen: 'CrashlyticsTestScreen',
      timestamp: new Date().toISOString(),
      test_parameter: 'test_value'
    };
    console.log('🔥 [DEBUG] About to log event with data:', eventData);
    logEvent('test_event', eventData);
    console.log('🔥 [DEBUG] Event logged successfully');
    Alert.alert('Success', 'Event logged to Firebase Analytics\n\nCheck Analytics > Events in Firebase Console');
  };

  const handleSetUserProperties = () => {
    console.log('🔥 [DEBUG] handleSetUserProperties called');
    const properties = {
      user_type: 'tester',
      app_version: '1.0.0',
      test_mode: 'true',
      last_test: new Date().toISOString()
    };
    console.log('🔥 [DEBUG] About to set user properties:', properties);
    setUserProperties(properties);
    console.log('🔥 [DEBUG] User properties set successfully');
    Alert.alert(
      'Success', 
      'User properties set in Firebase Analytics\n\n' +
      'Properties set:\n' +
      '• user_type: tester\n' +
      '• app_version: 1.0.0\n' +
      '• test_mode: true\n' +
      '• last_test: ' + new Date().toLocaleTimeString() + '\n\n' +
      'Check Analytics > Audiences > User Properties in Firebase Console'
    );
  };

  const handleJavaScriptCrash = () => {
    Alert.alert(
      'Warning',
      'This will cause a JavaScript crash. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Crash',
          style: 'destructive',
          onPress: () => {
            throw new Error('Test JavaScript crash from Crashlytics test screen');
          },
        },
      ]
    );
  };

  const handleNativeCrash = () => {
    Alert.alert(
      'Warning',
      'This will cause a native crash and close the app. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Crash',
          style: 'destructive',
          onPress: () => {
            crashlyticsInstance.crash();
          },
        },
      ]
    );
  };

  const TestButton: React.FC<{
    title: string;
    onPress: () => void;
    color?: string;
  }> = ({ title, onPress, color = '#007AFF' }) => (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crashlytics Test Screen</Text>
      <Text style={styles.subtitle}>
        Use these buttons to test Firebase Crashlytics functionality
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logging & Attributes</Text>
        
        <TestButton
          title="🔥 Test Crashlytics Status"
          onPress={handleTestCrashlyticsStatus}
          color="#34C759"
        />
        
        <TestButton
          title="Log Message"
          onPress={handleLogMessage}
        />
        
        <TestButton
          title="Set User ID"
          onPress={handleSetUserId}
        />
        
        <TestButton
          title="Set Custom Attribute"
          onPress={handleSetAttribute}
        />
        
        <TestButton
          title="Set User Properties"
          onPress={handleSetUserProperties}
        />
        
        <TestButton
          title="Log Event"
          onPress={handleLogEvent}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Reporting</Text>
        
        <TestButton
          title="Record Non-Fatal Error"
          onPress={handleRecordError}
          color="#FF9500"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crash Testing (Use with Caution)</Text>
        
        <TestButton
          title="Test JavaScript Crash"
          onPress={handleJavaScriptCrash}
          color="#FF3B30"
        />
        
        <TestButton
          title="Test Native Crash"
          onPress={handleNativeCrash}
          color="#FF3B30"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          📝 Note: Crashes and errors will appear in the Firebase Console under Crashlytics.
          It may take a few minutes for data to appear.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  info: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

export default CrashlyticsTestScreen; 
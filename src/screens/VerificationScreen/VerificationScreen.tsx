import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../../context/ThemeContext';
import { UnauthStackParamList } from '../../navigation/stacks/UnauthenticatedStack';
import { useAuth } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';

type VerificationScreenRouteProp = RouteProp<UnauthStackParamList, 'Verification'>;
type VerificationScreenNavigationProp = NativeStackNavigationProp<UnauthStackParamList, 'Verification'>;

const VerificationScreen: React.FC = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const navigation = useNavigation<VerificationScreenNavigationProp>();
  const route = useRoute<VerificationScreenRouteProp>();
  const { theme } = useTheme();
  const { verify, resendOtp, loading, error } = useAuth();
  
  const { email } = route.params;
  
  useEffect(() => {
    // Focus first input when screen loads
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Start countdown for resend
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleCodeChange = (text: string, index: number) => {
    // Update the code array
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Move to next input if value is entered
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Submit if all fields are filled
    if (index === 5 && text.length === 1) {
      handleSubmit();
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleSubmit = async () => {
    // Check if all digits are filled, but don't show an error alert
    if (code.some(digit => !digit)) {
      // Just return without showing an error alert
      return;
    }
    
    setIsSubmitting(true);
    const verificationCode = code.join('');
    
    const success = await verify(email, verificationCode);
    
    setIsSubmitting(false);
    
    if (success) {
      // After successful verification, login to redirect to products
      // This will trigger navigation to the authenticated stack with products
      try {
        // Store that the user has been verified
        await AsyncStorage.setItem('isVerified', 'true');
        
        // Set the login status to true to trigger navigation to products
        useAuthStore.getState().setIsLoggedIn(true);
        
        // Alert success message
        Alert.alert('Success', 'Your account has been verified. Redirecting to products...');
      } catch (error) {
        console.error('Error setting auth state:', error);
      }
    } else if (error) {
      Alert.alert('Verification Failed', error);
    }
  };
  
  const handleResendCode = async () => {
    if (!canResend) return;
    
    const success = await resendOtp(email);
    
    if (success) {
      // Reset timer and disable resend button
      setTimer(60);
      setCanResend(false);
      
      // Start countdown again
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      
      Alert.alert('Code Sent', 'A new verification code has been sent to your email');
    } else if (error) {
      Alert.alert('Failed to Resend', error);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeftIcon size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Enter the 6-digit code we sent to {email}
        </Text>
        
        <View style={styles.codeContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                { 
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                  color: theme.text 
                },
                code[index] ? styles.filledInput : {},
              ]}
              value={code[index]}
              onChangeText={(text) => handleCodeChange(text.replace(/[^0-9]/g, ''), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.primary },
            (isSubmitting || loading || code.some(digit => !digit)) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || loading || code.some(digit => !digit)}
        >
          {isSubmitting || loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.text }]}>
            Didn't receive the code?
          </Text>
          <TouchableOpacity 
            onPress={handleResendCode}
            disabled={!canResend}
          >
            <Text 
              style={[
                styles.resendLink, 
                { 
                  color: canResend ? theme.primary : theme.secondary,
                  opacity: canResend ? 1 : 0.5 
                }
              ]}
            >
              {canResend ? 'Resend Code' : `Resend in ${timer}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filledInput: {
    borderWidth: 2,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 16,
    marginRight: 4,
  },
  resendLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerificationScreen; 
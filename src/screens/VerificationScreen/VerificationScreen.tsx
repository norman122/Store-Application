import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Button from '../../components/atoms/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { UnauthStackParamList } from '../../navigation/stacks/UnauthStack';
import { VerificationFormData, verificationSchema } from '../../utils/validationSchema';

type VerificationRouteProp = RouteProp<UnauthStackParamList, 'Verification'>;
type VerificationNavigationProp = NativeStackNavigationProp<UnauthStackParamList, 'Verification'>;

const VerificationScreen: React.FC = () => {
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigation = useNavigation<VerificationNavigationProp>();
  const route = useRoute<VerificationRouteProp>();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { verify } = useAuth();

  const { email } = route.params;
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  // Timer for resending OTP
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numbers
    if (/^[0-9]?$/.test(text)) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = text;
      setOtpValues(newOtpValues);

      // Set value for the form validation
      setValue('otp', newOtpValues.join(''));

      // Auto-focus next input
      if (text && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = (data: VerificationFormData) => {
    Keyboard.dismiss();
    setLoading(true);

    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      
      // Verify using the code
      const isVerified = verify(email, otpValues.join(''));
      
      if (!isVerified) {
        Alert.alert('Verification Failed', 'Incorrect verification code. Please try again.');
      }
      // Success case is handled by the Navigator component
    }, 1500);
  };

  const resendOtp = () => {
    if (timer === 0) {
      // Reset timer
      setTimer(60);
      // Simulate resending OTP
      // In a real app, you would call an API here
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Verification</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          We've sent a verification code to
        </Text>
        <Text style={[styles.email, { color: theme.text }]}>{email}</Text>

        <View style={styles.otpContainer}>
          {otpValues.map((value, index) => (
            <TextInput
              key={index}
              ref={(input) => {
                inputRefs.current[index] = input;
              }}
              style={[
                styles.otpInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.cardBackground,
                },
              ]}
              value={value}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        {errors.otp && (
          <Text style={styles.error}>{errors.otp.message}</Text>
        )}

        <Button
          title="Verify"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        />

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: theme.text }]}>
            Didn't receive code?{' '}
          </Text>
          <TouchableOpacity
            onPress={resendOtp}
            disabled={timer > 0}>
            <Text
              style={[
                styles.resendText,
                {
                  color: timer > 0 ? theme.text + '80' : theme.primary,
                },
              ]}>
              {timer > 0 ? `Resend in ${timer}s` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dark Mode Toggle */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: theme.cardBackground }]}
        onPress={toggleTheme}>
        <Text style={{ color: theme.text }}>
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 40,
    textAlign: 'center',
  },
  demoNote: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 40,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  timerText: {
    fontSize: 16,
  },
  resendText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoCodeButton: {
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
  },
  demoCodeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  themeToggle: {
    padding: 10,
    borderRadius: 8,
    position: 'absolute',
    top: 50,
    right: 20,
  },
});

export default VerificationScreen; 
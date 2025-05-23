import React, { useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../../context/ThemeContext';
import { UnauthStackParamList } from '../../navigation/stacks/UnauthenticatedStack';
import { useForgotPassword } from '../../utils/api';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<UnauthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { theme } = useTheme();
  
  const forgotPasswordMutation = useForgotPassword();
  
  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to process forgot password request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNavigateBack = () => {
    navigation.goBack();
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
          onPress={handleNavigateBack}
        >
          <ChevronLeftIcon size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>
          Forgot Password
        </Text>
        
        {emailSent ? (
          <View style={styles.successContainer}>
            <Text style={[styles.successText, { color: theme.text }]}>
              We've sent password reset instructions to your email.
            </Text>
            <Text style={[styles.instructionsText, { color: theme.text }]}>
              Please check your inbox and follow the link to reset your password.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleNavigateBack}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.subtitle, { color: theme.text }]}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.secondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Instructions</Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 40,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen; 
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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EyeIcon, EyeSlashIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../../context/ThemeContext';
import { UnauthStackParamList } from '../../navigation/stacks/UnauthenticatedStack';
import { useAuth } from '../../store/authStore';

type LoginScreenNavigationProp = NativeStackNavigationProp<UnauthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme } = useTheme();
  const { login, loading, error } = useAuth();
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const success = await login(email, password);
    
    if (!success && error) {
      Alert.alert('Login Failed', error);
    }
  };
  
  const handleNavigateToSignup = () => {
    navigation.navigate('Signup');
  };
  
  const handleNavigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={[styles.appName, { color: theme.primary }]}>Store App</Text>
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Sign in to continue
        </Text>
        
        <View style={styles.form}>
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
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeButton}>
                {showPassword ? (
                  <EyeSlashIcon size={20} color={theme.text} />
                ) : (
                  <EyeIcon size={20} color={theme.text} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleNavigateToForgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.primary },
              loading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.noAccountText, { color: theme.text }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={handleNavigateToSignup}>
            <Text style={[styles.signupText, { color: theme.primary }]}>
              Sign Up
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
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
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: 24,
  },
  noAccountText: {
    fontSize: 16,
    marginRight: 4,
  },
  signupText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen; 
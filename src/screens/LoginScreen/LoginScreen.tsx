import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LoginFormData, loginSchema } from '../../utils/validationSchema';
import { UnauthStackParamList } from '../../navigation/stacks/UnauthStack';

type LoginScreenNavigationProp = NativeStackNavigationProp<UnauthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Watch the email field value
  const emailValue = watch('email');

  const handleLogin = async () => {
    // Use form validation for all emails
    const isValid = await trigger();
    if (isValid) {
      handleSubmit(onSubmit)();
    }
  };

  const onSubmit = (data: LoginFormData) => {
    setLoading(true);
    
    setTimeout(() => {
      const loginSuccessful = login(data.email, data.password);
      
      setLoading(false);
      
      if (!loginSuccessful) {
        Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
      } else {
        // Explicitly navigate to verification screen
        navigation.navigate('Verification', { email: data.email });
      }
    }, 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Sign in to continue
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          control={control}
          name="email"
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email?.message}
        />

        <Input
          control={control}
          name="password"
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          error={errors.password?.message}
        />

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
        />

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: theme.text }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.signupLink, { color: theme.primary }]}>
              Sign Up
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
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    marginBottom: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
  },
  signupLink: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 10,
    borderRadius: 8,
    position: 'absolute',
    top: 50,
    right: 20,
  },
});

export default LoginScreen; 
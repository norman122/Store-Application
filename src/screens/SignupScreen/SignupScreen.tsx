import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SignupFormData, signupSchema } from '../../utils/validationSchema';
import { UnauthStackParamList } from '../../navigation/stacks/UnauthStack';

type SignupScreenNavigationProp = NativeStackNavigationProp<UnauthStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { setPendingVerification, setCurrentEmail } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
    },
  });

  const onSubmit = (data: SignupFormData) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      // Set the current email and mark as pending verification
      setCurrentEmail(data.email);
      setPendingVerification(true);
      
      // Navigate to verification with email
      navigation.navigate('Verification', { email: data.email });
    }, 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Sign up to get started
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            control={control}
            name="name"
            label="Full Name"
            placeholder="Enter your full name"
            autoCapitalize="words"
            error={errors.name?.message}
          />

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
            placeholder="Create a password"
            secureTextEntry
            error={errors.password?.message}
          />

          <Input
            control={control}
            name="phoneNumber"
            label="Phone Number"
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            error={errors.phoneNumber?.message}
          />

          <Button
            title="Sign Up"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.text }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
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

export default SignupScreen; 
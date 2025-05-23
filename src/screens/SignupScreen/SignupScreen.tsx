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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EyeIcon, EyeSlashIcon, ChevronLeftIcon, CameraIcon, XMarkIcon, PhotoIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../../context/ThemeContext';
import { UnauthStackParamList } from '../../navigation/stacks/UnauthenticatedStack';
import { useAuth } from '../../store/authStore';
import * as ImagePicker from 'react-native-image-picker';

type SignupScreenNavigationProp = NativeStackNavigationProp<UnauthStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<any>(null);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { theme } = useTheme();
  const { signup, loading, error } = useAuth();
  
  const handleSignup = async () => {
    // Validate form
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    const success = await signup(email, password, firstName, lastName, profileImage);
    
    if (success) {
      navigation.navigate('Verification', { email });
    } else if (error) {
      Alert.alert('Signup Failed', error);
    }
  };
  
  const handleSelectProfileImage = () => {
    setShowImageSourceModal(true);
  };

  const selectFromGallery = () => {
    setShowImageSourceModal(false);
    
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 1,
    };
    
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets.length > 0) {
        // Format the image as JPG
        const asset = response.assets[0];
        setProfileImage({
          ...asset,
          fileName: 'profile.jpg',
          type: 'image/jpeg'
        });
      }
    });
  };

  const takePhoto = () => {
    setShowImageSourceModal(false);
    
    const options: ImagePicker.CameraOptions = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 1,
      saveToPhotos: true,
    };
    
    ImagePicker.launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to take photo');
      } else if (response.assets && response.assets.length > 0) {
        // Format the image as JPG
        const asset = response.assets[0];
        setProfileImage({
          ...asset,
          fileName: 'profile.jpg',
          type: 'image/jpeg'
        });
      }
    });
  };
  
  const handleRemoveProfileImage = () => {
    setProfileImage(null);
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
        
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Join our community today
        </Text>
        
        <View style={styles.profileImageSection}>
          <TouchableOpacity
            style={[styles.profileImageContainer, { borderColor: theme.border }]}
            onPress={handleSelectProfileImage}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage.uri }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary + '20' }]}>
                <CameraIcon size={40} color={theme.primary} />
              </View>
            )}
          </TouchableOpacity>
          
          {profileImage ? (
            <TouchableOpacity
              style={[styles.removeImageButton, { backgroundColor: theme.error || '#FF3B30' }]}
              onPress={handleRemoveProfileImage}
            >
              <XMarkIcon size={16} color="#FFFFFF" />
              <Text style={styles.removeImageButtonText}>Remove Photo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addProfileButton, { backgroundColor: theme.primary }]}
              onPress={handleSelectProfileImage}
            >
              <Text style={styles.addProfileButtonText}>Add Profile Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Image Source Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showImageSourceModal}
          onRequestClose={() => setShowImageSourceModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowImageSourceModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Photo</Text>
              
              <TouchableOpacity
                style={[styles.modalOption, { borderBottomColor: theme.border }]}
                onPress={takePhoto}
              >
                <CameraIcon size={24} color={theme.primary} />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={selectFromGallery}
              >
                <PhotoIcon size={24} color={theme.primary} />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.border }]}
                onPress={() => setShowImageSourceModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>First Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="First Name"
                placeholderTextColor={theme.secondary}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Last Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Last Name"
                placeholderTextColor={theme.secondary}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>
          
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
                placeholder="Choose a password"
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
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm Password</Text>
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
                placeholder="Confirm your password"
                placeholderTextColor={theme.secondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={toggleShowConfirmPassword} style={styles.eyeButton}>
                {showConfirmPassword ? (
                  <EyeSlashIcon size={20} color={theme.text} />
                ) : (
                  <EyeIcon size={20} color={theme.text} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.signupButton,
              { backgroundColor: theme.primary },
              loading && styles.disabledButton,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.haveAccountText, { color: theme.text }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginText, { color: theme.primary }]}>
              Sign In
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
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    marginBottom: 8,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfInput: {
    width: '48%',
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
  signupButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonText: {
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
  haveAccountText: {
    fontSize: 16,
    marginRight: 4,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  removeImageButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  addProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  addProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupScreen; 
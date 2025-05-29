import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { launchImageLibrary, ImageLibraryOptions, launchCamera, CameraOptions, PhotoQuality } from 'react-native-image-picker';
import { PencilIcon, CameraIcon, PhotoIcon, XMarkIcon, TrashIcon, WrenchScrewdriverIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../context/ThemeContext';
import { useAuth, useAuthStore } from '../../store/authStore';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import { ProfileUpdateFormData, profileUpdateSchema } from '../../utils/validationSchema';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';

type ProfileScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'TabNavigator'>;

// Function to handle both relative and absolute URLs
const getImageUrl = (relativeUrl: string) => {
  if (!relativeUrl) return '';
  
  // Check if the URL is already absolute (starts with http or https)
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  // Otherwise, prepend the base URL
  return `https://backend-practice.eurisko.me${relativeUrl}`;
};

// Default placeholder image
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150';

// Define an interface for the local user data
interface LocalUserData {
  firstName: string;
  lastName: string;
  profileImage: { url: string } | null | undefined;
}

const ProfileScreen: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState<any>(null);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const { theme } = useTheme();
  const { user, updateProfile, loading, error } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });

  const [localUserData, setLocalUserData] = useState<LocalUserData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    profileImage: user?.profileImage
  });

  // Add a useEffect to refresh user data when component mounts
  useEffect(() => {
    if (user) {
      setLocalUserData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profileImage: user.profileImage
      });
    }
  }, [user]);

  const handleImagePicker = async () => {
    // Show the image source modal instead of directly launching the gallery
    setShowImageSourceModal(true);
  };

  // Function to handle image selection - works for both camera and gallery
  const handleImageSelection = (result: any) => {
    if (result.didCancel) {
      return;
    }
    
    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Something went wrong');
      return;
    }
    
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Format the image data for upload
      const formattedImage = {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri?.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      };
      
      console.log('New profile image to upload:', formattedImage);
      setNewProfileImage(formattedImage);
    }
  };

  const selectFromGallery = async () => {
    setShowImageSourceModal(false);
    
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 1,
    };

    try {
      const result = await launchImageLibrary(options);
      handleImageSelection(result);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with the image picker');
    }
  };

  const takePhoto = async () => {
    setShowImageSourceModal(false);
    
    const options: CameraOptions = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 1 as PhotoQuality,
      saveToPhotos: true,
    };

    try {
      const result = await launchCamera(options);
      handleImageSelection(result);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with the camera');
    }
  };

  const handleRemoveProfileImage = () => {
    setShowImageSourceModal(false);
    // Use null to indicate profile image removal
    setNewProfileImage(null);
    console.log('Profile image marked for removal with null value');
  };

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      const imageStatus = newProfileImage === null 
        ? 'Removing profile image' 
        : newProfileImage 
          ? 'Adding new profile image' 
          : 'No change to profile image';
          
      console.log('Updating profile with:', {
        firstName: data.firstName,
        lastName: data.lastName,
        imageStatus,
      });
      
      // Create a clean payload for the profile update
      let imagePayload;
      
      // If newProfileImage is null, we want to remove the image
      if (newProfileImage === null) {
        // For image removal, we'll use a special 'REMOVE' flag that the API understands
        imagePayload = 'REMOVE'; 
      } 
      // If newProfileImage exists with uri, it's a new image
      else if (newProfileImage && newProfileImage.uri) {
        imagePayload = newProfileImage; // Send the image data
      } 
      // Otherwise, undefined means keep existing image
      else {
        imagePayload = undefined; // Don't change the image
      }
      
      // Call the updateProfile API with the appropriate payload
      const success = await updateProfile(
        data.firstName,
        data.lastName,
        imagePayload
      );
      
      if (success) {
        console.log('Profile updated successfully, API response indicates success');
        
        // After successful update, fetch the latest user data from the store
        const updatedUser = useAuthStore.getState().user;
        console.log('Updated user data from auth store:', updatedUser);
        
        // Update local state with the latest data
        setLocalUserData({
          firstName: data.firstName,
          lastName: data.lastName,
          profileImage: updatedUser?.profileImage 
        });
        
        // Log for debugging
        console.log('Updated profile image state:', updatedUser?.profileImage || null);
        
        // Reset edit state
        setIsEditing(false);
        
        if(imagePayload === 'REMOVE'){
          setNewProfileImage(null); // Reset to undefined (not null, to avoid confusion)
        }
        else{
          setNewProfileImage(undefined);
        }
        
        // Show confirmation to the user
        Alert.alert(
          'Success', 
          newProfileImage === null
            ? 'Profile updated and picture removed successfully.'
            : 'Profile updated successfully.'
        );
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Update Failed', 'There was a problem updating your profile. Please try again.');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setNewProfileImage(null);
    // Reset form to current user data
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  // Use local user data for display when available
  const displayUser = {
    ...user,
    firstName: localUserData.firstName || user?.firstName || '',
    lastName: localUserData.lastName || user?.lastName || '',
    profileImage: localUserData.profileImage !== undefined ? localUserData.profileImage : user?.profileImage
  };

  // Get initials safely
  const getInitials = () => {
    const first = displayUser.firstName.charAt(0) || '';
    const last = displayUser.lastName.charAt(0) || '';
    return first + last;
  };

  useEffect(() => {
    // Log the current display user for debugging
    console.log('Current display user:', {
      name: `${displayUser.firstName} ${displayUser.lastName}`,
      hasProfileImage: !!displayUser.profileImage?.url,
      profileImageUrl: displayUser.profileImage?.url,
    });
  }, [displayUser]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>Change Profile Picture</Text>
              
              <TouchableOpacity
                style={[styles.modalOption, { borderBottomColor: theme.border }]}
                onPress={takePhoto}
              >
                <CameraIcon size={24} color={theme.primary} />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalOption, { borderBottomColor: theme.border }]}
                onPress={selectFromGallery}
              >
                <PhotoIcon size={24} color={theme.primary} />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              {(displayUser.profileImage?.url || newProfileImage) && (
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: theme.border }]}
                  onPress={handleRemoveProfileImage}
                >
                  <TrashIcon size={24} color={theme.error || '#FF3B30'} />
                  <Text style={[styles.modalOptionText, { color: theme.error || '#FF3B30' }]}>Remove Photo</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: theme.border }]}
                onPress={() => setShowImageSourceModal(false)}
              >
                <Text style={[styles.modalCancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        <View style={styles.profileHeader}>
          <View style={styles.profileImageSection}>
            <TouchableOpacity 
              style={[styles.profileImageContainer, { borderColor: theme.border }]}
              onPress={isEditing ? handleImagePicker : undefined}
              disabled={!isEditing}
            >
              {/* Show new image if selected */}
              {newProfileImage && newProfileImage.uri ? (
                <Image 
                  source={{ uri: newProfileImage.uri }}
                  style={styles.profileImage} 
                  resizeMode="cover"
                />
              ) 
              /* Show initials if image marked for removal */
              : newProfileImage === null ? (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.profileInitials, { color: theme.text }]}>
                    {getInitials()}
                  </Text>
                </View>
              ) 
              /* Show existing image if available */
              : displayUser.profileImage?.url ? (
                <Image 
                  source={{ uri: getImageUrl(displayUser.profileImage.url) }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                  onError={(e) => {
                    console.error('Image loading error:', e.nativeEvent.error);
                  }}
                />
              ) 
              /* Show initials if no image */
              : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.profileInitials, { color: theme.text }]}>
                    {getInitials()}
                  </Text>
                </View>
              )}
              
              {/* Show camera icon in edit mode */}
              {isEditing && (
                <View style={[styles.cameraIconContainer, { backgroundColor: theme.primary }]}>
                  <CameraIcon size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            {!isEditing ? (
              <>
                <Text style={[styles.userName, { color: theme.text }]}>
                  {displayUser.firstName} {displayUser.lastName}
                </Text>
                <Text style={[styles.userEmail, { color: theme.text + '80' }]}>
                  {displayUser.email}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.editButton, { backgroundColor: theme.primary + '20' }]}
                  onPress={() => setIsEditing(true)}
                >
                  <PencilIcon size={16} color={theme.primary} />
                  <Text style={[styles.editButtonText, { color: theme.primary }]}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.form}>
                <Input
                  control={control}
                  name="firstName"
                  label="First Name"
                  placeholder="Enter your first name"
                  error={errors.firstName?.message}
                />
                
                <Input
                  control={control}
                  name="lastName"
                  label="Last Name"
                  placeholder="Enter your last name"
                  error={errors.lastName?.message}
                />
                
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, { borderColor: theme.border }]}
                    onPress={cancelEdit}
                    disabled={loading}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <Button
                    title="Save Changes"
                    onPress={handleSubmit(onSubmit)}
                    loading={loading}
                    style={styles.saveButton}
                    variant="primary"
                    size="large"
                  />
                </View>
              </View>
            )}
          </View>
        </View>
        
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>
            Account Information
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text + '80' }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{displayUser.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text + '80' }]}>Email Verified</Text>
            <Text 
              style={[
                styles.infoValue, 
                { color: displayUser.isEmailVerified ? '#4CAF50' : '#F44336' }
              ]}
            >
              {displayUser.isEmailVerified ? 'Yes' : 'No'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text + '80' }]}>Account ID</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{displayUser.id}</Text>
          </View>
        </View>
        
        {/* Developer Tools Section - Only visible in development */}
        {__DEV__ && (
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>Developer Tools</Text>
            
            <TouchableOpacity
              style={[styles.developerButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => navigation.navigate('CrashlyticsTest')}
            >
              <WrenchScrewdriverIcon size={20} color={theme.primary} />
              <Text style={[styles.developerButtonText, { color: theme.primary }]}>
                Crashlytics Test Screen
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.developerNote, { color: theme.text + '60' }]}>
              This section is only visible in development mode
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  profileHeader: {
    marginBottom: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 16,
    marginRight: 10,
    width: '40%',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    width: '60%',
    textAlign: 'right',
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
  modalCancelButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  developerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  developerButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  developerNote: {
    fontSize: 12,
    color: '#666',
  },
});

export default ProfileScreen; 
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput as RNTextInput,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { PlusCircleIcon, XCircleIcon, MapPinIcon, CameraIcon } from 'react-native-heroicons/outline';

import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import { productSchema, ProductFormData } from '../../utils/validationSchema';
import { productApi } from '../../utils/api';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';

// Import map component but handle possible import errors
// Define a mock Region type if import fails
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Mock locations for easy selection
const MOCK_LOCATIONS = [
  { name: 'Beirut, Lebanon', latitude: 33.8938, longitude: 35.5018 },
  { name: 'Tripoli, Lebanon', latitude: 34.4409, longitude: 35.8433 },
  { name: 'Tyre, Lebanon', latitude: 33.2704, longitude: 35.2037 },
  { name: 'Byblos, Lebanon', latitude: 34.1232, longitude: 35.6512 },
  { name: 'Sidon, Lebanon', latitude: 33.5571, longitude: 35.3729 },
];

type AddProductNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const AddProductScreen: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [locationName, setLocationName] = useState(MOCK_LOCATIONS[0].name);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: MOCK_LOCATIONS[0].latitude,
    longitude: MOCK_LOCATIONS[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const { theme } = useTheme();
  const navigation = useNavigation<AddProductNavigationProp>();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      location: {
        name: MOCK_LOCATIONS[0].name,
        latitude: MOCK_LOCATIONS[0].latitude,
        longitude: MOCK_LOCATIONS[0].longitude,
      },
    },
  });

  // Watch the location for display
  const location = watch('location');

  // Add animated value for the modal animation
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const handleImagePicker = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }

    const options: ImageLibraryOptions = {
      mediaType: 'photo' as const,
      includeBase64: false,
      selectionLimit: 1,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    try {
      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Something went wrong with the image picker');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with the image picker');
    }
  };

  const handleCameraCapture = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }

    const options: CameraOptions = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      saveToPhotos: true,
    };

    try {
      const result = await launchCamera(options);
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Something went wrong with the camera');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with the camera');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Modified function to handle modal animation
  const openLocationModal = () => {
    setMapVisible(true);
    // Reset the animation value
    slideAnimation.setValue(Dimensions.get('window').height);
    modalOpacity.setValue(0);
    
    // Start the animation with longer duration (800ms instead of default ~300ms)
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 800, // Longer animation duration
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 800, // Match the slide animation duration
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const closeLocationModal = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: Dimensions.get('window').height,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      // After animation completes, hide the modal
      setMapVisible(false);
    });
  };

  // Replace handleSelectLocation with openLocationModal
  const handleSelectLocation = () => {
    openLocationModal();
  };
  
  // Update coordinates from user input
  const handleLocationSelect = (latitude: number, longitude: number) => {
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
  };
  
  // Modify saveLocation to close with animation
  const saveLocation = () => {
    if (!locationName.trim()) {
      Alert.alert('Location Name Required', 'Please enter a name for this location');
      return;
    }
    
    setValue('location', {
      name: locationName,
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    });
    
    closeLocationModal();
  };

  // Select a mock location
  const selectMockLocation = (location: typeof MOCK_LOCATIONS[0]) => {
    setLocationName(location.name);
    setMapRegion({
      ...mapRegion,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image for your product');
      return;
    }

    try {
      setLoading(true);
      const response = await productApi.createProduct(data, images);
      
      Alert.alert(
        'Success', 
        'Your product has been listed successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset form and images
              reset();
              setImages([]);
              // Navigate to TabNavigator first, which will show the Home tab by default
              navigation.navigate('TabNavigator');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.imagesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Product Images
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.text + '80' }]}>
              Add up to 5 images of your product
            </Text>
            
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.productImage} />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: theme.background }]}
                    onPress={() => removeImage(index)}
                  >
                    <XCircleIcon size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {images.length < 5 && (
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.imageButton, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
                    onPress={handleImagePicker}
                  >
                    <PlusCircleIcon size={24} color={theme.primary} />
                    <Text style={[styles.imageButtonText, { color: theme.primary }]}>
                      Gallery
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.imageButton, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
                    onPress={handleCameraCapture}
                  >
                    <CameraIcon size={24} color={theme.primary} />
                    <Text style={[styles.imageButtonText, { color: theme.primary }]}>
                      Camera
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Product Details
            </Text>
            
            <Input
              control={control}
              name="title"
              label="Title"
              placeholder="Enter product title"
              error={errors.title?.message}
            />
            
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.textAreaContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                  <RNTextInput
                    style={[
                      styles.textArea,
                      { 
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.cardBackground
                      }
                    ]}
                    placeholder="Describe your product..."
                    placeholderTextColor={theme.text + '50'}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  {errors.description && (
                    <Text style={styles.errorText}>{errors.description.message}</Text>
                  )}
                </View>
              )}
            />
            
            <Input
              control={control}
              name="price"
              label="Price ($)"
              placeholder="Enter price"
              keyboardType="numeric"
              error={errors.price?.message}
              valueAsNumber={true}
            />
            
            <View style={styles.locationContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Location</Text>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.cardBackground
                  }
                ]}
                onPress={handleSelectLocation}
              >
                <MapPinIcon size={20} color={theme.primary} />
                <Text style={[styles.locationButtonText, { color: theme.text }]}>
                  {location.name || 'Select Location'}
                </Text>
              </TouchableOpacity>
              {errors.location?.name && (
                <Text style={styles.errorText}>{errors.location.name.message}</Text>
              )}
              
              {/* Show current location details if set */}
              {location && location.name && (
                <View style={[styles.locationDetailsContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <View style={styles.locationDetailRow}>
                    <Text style={[styles.locationDetailLabel, { color: theme.text + '80' }]}>Name:</Text>
                    <Text style={[styles.locationDetailValue, { color: theme.text }]}>
                      {location.name}
                    </Text>
                  </View>
                  <View style={styles.locationDetailRow}>
                    <Text style={[styles.locationDetailLabel, { color: theme.text + '80' }]}>Coordinates:</Text>
                    <Text style={[styles.locationDetailValue, { color: theme.text }]}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          
          <Button
            title="List Product"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
        </View>
      </ScrollView>
      
      {/* Custom Animated Modal */}
      <Modal
        visible={mapVisible}
        transparent={true}
        onRequestClose={closeLocationModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            { 
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: modalOpacity
            }
          ]}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              { 
                backgroundColor: theme.background,
                transform: [{ translateY: slideAnimation }]
              }
            ]}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeLocationModal}
                >
                  <XCircleIcon size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Set Location</Text>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={saveLocation}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                {/* Location name input */}
                <View style={styles.locationInputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Location Name</Text>
                  <RNTextInput
                    style={[styles.locationInput, { 
                      borderColor: theme.border, 
                      backgroundColor: theme.cardBackground,
                      color: theme.text 
                    }]}
                    placeholder="Enter a descriptive name (e.g. Downtown Beirut)"
                    placeholderTextColor={theme.text + '50'}
                    value={locationName}
                    onChangeText={setLocationName}
                  />
                </View>
                
                {/* Coordinates input */}
                <View style={styles.coordinatesContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Coordinates</Text>
                  
                  <View style={styles.coordRow}>
                    <Text style={[styles.coordLabel, { color: theme.text }]}>Latitude:</Text>
                    <RNTextInput
                      style={[styles.coordInput, { 
                        borderColor: theme.border, 
                        backgroundColor: theme.cardBackground,
                        color: theme.text 
                      }]}
                      placeholder="e.g. 33.8938"
                      placeholderTextColor={theme.text + '50'}
                      keyboardType="numeric"
                      value={String(mapRegion.latitude)}
                      onChangeText={(text) => {
                        const lat = parseFloat(text);
                        if (!isNaN(lat)) {
                          setMapRegion({...mapRegion, latitude: lat});
                        }
                      }}
                    />
                  </View>
                  
                  <View style={styles.coordRow}>
                    <Text style={[styles.coordLabel, { color: theme.text }]}>Longitude:</Text>
                    <RNTextInput
                      style={[styles.coordInput, { 
                        borderColor: theme.border, 
                        backgroundColor: theme.cardBackground,
                        color: theme.text 
                      }]}
                      placeholder="e.g. 35.5018"
                      placeholderTextColor={theme.text + '50'}
                      keyboardType="numeric"
                      value={String(mapRegion.longitude)}
                      onChangeText={(text) => {
                        const lng = parseFloat(text);
                        if (!isNaN(lng)) {
                          setMapRegion({...mapRegion, longitude: lng});
                        }
                      }}
                    />
                  </View>
                </View>
                
                {/* Predefined locations */}
                <View style={styles.predefinedLocations}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Select a Location</Text>
                  
                  {MOCK_LOCATIONS.map((mockLocation, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.predefinedLocationItem,
                        { 
                          backgroundColor: theme.cardBackground,
                          borderWidth: locationName === mockLocation.name ? 2 : 1,
                          borderColor: locationName === mockLocation.name ? theme.primary : theme.border,
                        }
                      ]}
                      onPress={() => selectMockLocation(mockLocation)}
                    >
                      <Text style={[styles.predefinedLocationName, { color: theme.text }]}>
                        {mockLocation.name}
                      </Text>
                      <Text style={[styles.predefinedLocationCoords, { color: theme.text + '70' }]}>
                        {mockLocation.latitude.toFixed(4)}, {mockLocation.longitude.toFixed(4)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  imagesSection: {
    marginBottom: 24,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  imageWrapper: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 5,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 12,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  imageButton: {
    width: '45%',
    aspectRatio: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    flexDirection: 'row',
    padding: 10,
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  locationButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  locationDetailsContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  locationDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  locationDetailLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '500',
  },
  locationDetailValue: {
    flex: 1,
    fontSize: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeButton: {
    padding: 4,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationInputContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  locationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  coordinatesContainer: {
    padding: 16,
    paddingTop: 0,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coordLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
  },
  coordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  predefinedLocations: {
    padding: 16,
    paddingTop: 0,
    marginBottom: 20,
  },
  predefinedLocationItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  predefinedLocationName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  predefinedLocationCoords: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});

export default AddProductScreen; 
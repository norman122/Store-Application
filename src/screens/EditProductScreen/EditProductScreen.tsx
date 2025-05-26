import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, ImageLibraryOptions, launchCamera, ImagePickerResponse, Asset, PhotoQuality } from 'react-native-image-picker';
import { PlusCircleIcon, XCircleIcon, MapPinIcon, CurrencyDollarIcon, CameraIcon } from 'react-native-heroicons/outline';

import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import { productSchema, ProductFormData } from '../../utils/validationSchema';
import { productApi } from '../../utils/api/services/productService';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';
import MapWithFallback from '../../components/MapWithFallback';
import { notificationService } from '../../services/notificationService';

// Base URL for image paths
const BASE_URL = 'https://backend-practice.eurisko.me';

type EditProductRouteProp = RouteProp<AuthStackParamList, 'EditProduct'>;
type EditProductNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Define Region type here
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Simple validation function
const isValidCoordinate = (lat?: number, lng?: number): boolean => {
  return (
    lat !== undefined && 
    lng !== undefined && 
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat !== 0 && 
    lng !== 0 && 
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  );
};

const EditProductScreen: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 33.8938, // Default to Beirut
    longitude: 35.5018,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [locationName, setLocationName] = useState('');
  
  const { theme } = useTheme();
  const navigation = useNavigation<EditProductNavigationProp>();
  const route = useRoute<EditProductRouteProp>();
  const { productId } = route.params;

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
        name: '',
        latitude: 0,
        longitude: 0,
      },
    },
  });

  // Watch the location for display
  const location = watch('location');

  // Add animated value for the modal animation
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setInitialLoading(true);
        const response = await productApi.getProductById(productId);
        const productData = response.data;
        
        setProduct(productData);
        
        // Set form values
        reset({
          title: productData.title,
          description: productData.description,
          price: productData.price,
          location: productData.location,
        });
        
        // Initialize map region if location exists
        if (productData.location && productData.location.latitude && productData.location.longitude) {
          setMapRegion({
            latitude: productData.location.latitude,
            longitude: productData.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setLocationName(productData.location.name || '');
        }
        
        // Set existing images
        if (productData.images && productData.images.length > 0) {
          // Transform the images to ensure they have _id property
          const processedImages = productData.images.map(img => {
            // Make sure each image has an _id property
            const image = img as any;
            return {
              _id: image._id || image.id,
              url: image.url,
              uri: `${BASE_URL}${image.url}`,
              type: 'image/jpeg',
              name: `image-${image._id || image.id}.jpg`,
              fileName: `image-${image._id || image.id}.jpg`,
              id: image._id || image.id, // Add id property for consistency
            };
          });
          
          setExistingImages(processedImages);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load product details');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, reset, navigation]);

  const selectImage = async (useCamera: boolean) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 1 as PhotoQuality,
      maxWidth: 1200,
      maxHeight: 1200,
    };

    try {
      const result: ImagePickerResponse = useCamera
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.didCancel || result.errorCode) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => {
          // Generate a unique ID for each new image
          const uniqueId = `new-image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          return {
            uri: asset.uri!,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `image-${uniqueId}.jpg`,
            id: uniqueId // Add an ID for each new image
          };
        });

        if (images.length + newImages.length > 5) {
          Alert.alert('Error', 'You can only add up to 5 images');
          return;
        }

        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const removeNewImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeExistingImage = (index: number) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
  };

  // Modified function to handle modal animation
  const openLocationModal = () => {
    try {
      // If location already exists in form, use that data
      if (location?.latitude && location?.longitude && isValidCoordinate(location.latitude, location.longitude)) {
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setLocationName(location.name || '');
      }
      
      // Set the modal to visible
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
    } catch (error) {
      console.error('Error in openLocationModal:', error);
      Alert.alert('Error', 'Could not open the location selector. Please try again.');
    }
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

  // Handle location selection from map
  const handleLocationSelect = (latitude: number, longitude: number) => {
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
  };

  // Updated save location function
  const saveLocation = () => {
    if (!isValidCoordinate(mapRegion.latitude, mapRegion.longitude)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude values');
      return;
    }
    
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

  const handleImagePicker = () => {
    const totalImages = images.length + existingImages.length;
    if (totalImages >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }
    
    // Call selectImage with false for gallery
    selectImage(false);
  };

  const handleCameraCapture = () => {
    const totalImages = images.length + existingImages.length;
    if (totalImages >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }
    
    // Call selectImage with true for camera
    selectImage(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    const totalImages = images.length + existingImages.length;
    if (totalImages === 0) {
      Alert.alert('Error', 'Please add at least one image for your product');
      return;
    }

    try {
      setLoading(true);
      
      // Combine existing and new images into a single array
      // This array contains both the existing images the user KEPT (didn't remove)
      // as well as any new images they added
      const allImages = [...existingImages, ...images];
      
      console.log(`Total images to send: ${allImages.length} (${existingImages.length} existing, ${images.length} new)`);
      
      // Call the API with the combined images array
      const response = await productApi.updateProduct(
        productId, 
        data, 
        allImages
      );
      
      // Show notification for successful product update
      await notificationService.showProductUpdatedNotification(
        data.title,
        productId
      );
      
      // Show success message based on platform
      if (Platform.OS === 'android') {
        ToastAndroid.show('Product updated successfully', ToastAndroid.SHORT);
      } else {
        // For iOS, use a simple alert that will be dismissed when navigation happens
        Alert.alert(
          'Success',
          'Product updated successfully'
        );
      }

      // Brief delay before navigation to allow the user to see the success message
      setTimeout(() => {
        // Navigate back to details and refresh
        navigation.navigate('ProductDetails', { 
          productId,
          refresh: true, // Pass a refresh flag to trigger data reload
          timestamp: Date.now() // Add timestamp to force React Navigation to detect a param change
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await productApi.deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully');
              navigation.navigate('TabNavigator');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete product');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              {/* All images (existing and new) */}
              {[...existingImages, ...images].map((image, index) => (
                <View key={`image-${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.productImage} />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: theme.background }]}
                    onPress={() => {
                      // Determine if this is an existing or new image and call the appropriate handler
                      if (index < existingImages.length) {
                        removeExistingImage(index);
                      } else {
                        removeNewImage(index - existingImages.length);
                      }
                    }}
                  >
                    <XCircleIcon size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {existingImages.length + images.length < 5 && (
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
            
            <View style={styles.priceContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Price ($)</Text>
              <View style={[styles.priceInputContainer, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}>
                <CurrencyDollarIcon size={24} color={theme.primary} style={styles.currencyIcon} />
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <RNTextInput
                      style={[styles.priceInput, { color: theme.text }]}
                      placeholder="Enter price"
                      placeholderTextColor={theme.text + '50'}
                      keyboardType="numeric"
                      value={value === 0 ? '' : value?.toString()}
                      onChangeText={(text) => {
                        // Remove any non-numeric characters except decimal point
                        const numericText = text.replace(/[^0-9.]/g, '');
                        const numValue = numericText === '' ? 0 : parseFloat(numericText);
                        onChange(numValue);
                      }}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
              {errors.price && (
                <Text style={styles.errorText}>{errors.price.message}</Text>
              )}
            </View>
            
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
              
              {/* Show location details if location is selected */}
              {isValidCoordinate(location.latitude, location.longitude) && (
                <View style={styles.locationDetailsContainer}>
                  <View style={styles.locationDetailRow}>
                    <Text style={[styles.locationDetailLabel, { color: theme.text + '80' }]}>
                      Name:
                    </Text>
                    <Text style={[styles.locationDetailValue, { color: theme.text }]}>
                      {location.name || 'Unknown location'}
                    </Text>
                  </View>
                  
                  <View style={styles.locationDetailRow}>
                    <Text style={[styles.locationDetailLabel, { color: theme.text + '80' }]}>
                      Coordinates:
                    </Text>
                    <Text style={[styles.locationDetailValue, { color: theme.text }]}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Update Product"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
            />
            
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: '#F44336' }]}
              onPress={handleDelete}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>Delete Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Location Input Modal with Map - Animated version */}
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
              
              <View style={styles.mapContainer}>
                <Text style={[styles.inputLabel, { color: theme.text, paddingHorizontal: 16 }]}>
                  Tap on the map to select location
                </Text>
                
                {/* Map component with fallback UI */}
                <MapWithFallback
                  initialRegion={mapRegion}
                  onRegionChange={region => setMapRegion(region)}
                  onLocationSelect={handleLocationSelect}
                  style={styles.mapWrapper}
                />
              </View>
              
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
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
  priceContainer: {
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  currencyIcon: {
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
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
  buttonContainer: {
    marginBottom: 20,
  },
  deleteButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapPreviewContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  mapLocation: {
    padding: 8,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
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
  locationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  mapInstructions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 14,
  },
  fullMap: {
    flex: 1,
  },
  mapErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  mapErrorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  mapErrorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  manualCoordinatesContainer: {
    width: '100%',
    padding: 16,
  },
  coordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coordLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  coordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  locationDetailsContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  locationDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  coordinatesContainer: {
    padding: 16,
    marginTop: 8,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationHelpContainer: {
    padding: 16,
    marginTop: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  exampleCoords: {
    marginTop: 16,
  },
  exampleCoordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exampleCoordName: {
    fontSize: 14,
    fontWeight: '500',
  },
  exampleCoordValue: {
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    marginTop: 12,
  },
  mapWrapper: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
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

export default EditProductScreen; 
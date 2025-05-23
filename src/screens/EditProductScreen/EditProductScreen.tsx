import React, { useState, useEffect } from 'react';
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

// Base URL for image paths
const BASE_URL = 'https://backend-practice.eurisko.me';

type EditProductRouteProp = RouteProp<AuthStackParamList, 'EditProduct'>;
type EditProductNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const EditProductScreen: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  
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

  const handleSelectLocation = () => {
    // Use mock location data
    const mockLocation = {
      name: 'Beirut, Lebanon',
      latitude: 33.8938,
      longitude: 35.5018,
    };
    
    setValue('location', mockLocation);
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
});

export default EditProductScreen; 
import React, { useState } from 'react';
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

type AddProductNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const AddProductScreen: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
        name: '',
        latitude: 0,
        longitude: 0,
      },
    },
  });

  // Watch the location for display
  const location = watch('location');

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

  const handleSelectLocation = () => {
    // Use mock location data
    const mockLocation = {
      name: 'Beirut, Lebanon',
      latitude: 33.8938,
      longitude: 35.5018,
    };
    
    setValue('location', mockLocation);
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
            </View>
          </View>
          
          <Button
            title="List Product"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
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
});

export default AddProductScreen; 
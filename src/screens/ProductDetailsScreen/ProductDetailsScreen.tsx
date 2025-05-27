import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Linking,
  Platform,
  FlatList,
  Modal,
  Pressable,
  ToastAndroid,
  PermissionsAndroid,
} from 'react-native';
import { RouteProp, useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  ShareIcon, 
  MapPinIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  MinusIcon,
} from 'react-native-heroicons/outline';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';
import Button from '../../components/atoms/Button';
import { useProduct } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../store/authStore';
import { User } from '../../utils/api/services/userService';
import RNFS from 'react-native-fs';
import { Share as RNShare } from 'react-native';
import Share from 'react-native-share';
import ShareUtils from '../../utils/shareUtils';
// Temporarily disabled animations due to Reanimated worklet configuration issue
// import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

type ProductDetailsRouteProp = RouteProp<AuthStackParamList, 'ProductDetails'>;
type ProductDetailsNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function to get full image URL
const getImageUrl = (relativeUrl: string) => {
  // Check if the URL is already absolute (starts with http or https)
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  // Otherwise, prepend the base URL
  return `https://backend-practice.eurisko.me${relativeUrl}`;
};

// Add a more flexible owner type definition that includes _id
interface ProductOwner extends Partial<User> {
  _id?: string;
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: {
    url: string;
  };
}

const ProductDetailsScreen: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  
  const route = useRoute<ProductDetailsRouteProp>();
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { addToCart, getItemQuantity, updateQuantity } = useCartStore();
  const { productId } = route.params;
  
  // Add debug logs
  console.log('[ProductDetailsScreen] Received productId:', productId);
  
  const flatListRef = useRef<FlatList>(null);

  // Use the product hook from the store
  const { product, isLoading, isError, error, refetch } = useProduct(productId);
  
  // Get cart quantity for this product
  const cartQuantity = product ? getItemQuantity(product._id) : 0;
  
  // Refresh product when coming back from edit screen
  useEffect(() => {
    if (route.params.refresh) {
      console.log('[ProductDetailsScreen] Refresh flag detected, reloading product');
      refetch();
    }
  }, [route.params.refresh, route.params.timestamp, refetch]);
  
  // Function to retry loading the product
  const handleRetry = () => {
    console.log('[ProductDetailsScreen] Retrying product load');
    // Call the refetch function from the query
    refetch();
  };
  
  // Add debug logs for product loading
  useEffect(() => {
    console.log('[ProductDetailsScreen] Loading status:', isLoading);
    console.log('[ProductDetailsScreen] Error status:', isError);
    if (isError) {
      console.log('[ProductDetailsScreen] Error details:', error);
    }
    console.log('[ProductDetailsScreen] Product data:', product);
    if (product && user) {
      console.log('[ProductDetailsScreen] Product owner:', product.owner);
      console.log('[ProductDetailsScreen] Current user:', user);
    }

    // Log navigation object to debug
    console.log('[ProductDetailsScreen] Navigation available methods:', 
      Object.keys(navigation).join(', '));
  }, [product, isLoading, isError, error, user, navigation]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    await ShareUtils.shareProduct(product);
  }, [product]);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart(product);
    
    if (Platform.OS === 'android') {
      ToastAndroid.show('Added to cart!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', 'Product added to cart!');
    }
  }, [product, addToCart]);

  // Handle quantity update
  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (!product) return;
    updateQuantity(product._id, newQuantity);
  }, [product, updateQuantity]);

  const handleSendEmail = () => {
    // Access email from product.owner.email or product.user.email
    const ownerEmail = product?.owner?.email || product?.user?.email;
    const ownerFirstName = product?.owner?.firstName || 'Seller';
    
    if (!ownerEmail) {
      Alert.alert('Error', 'Seller email is not available');
      return;
    }
    
    const subject = `Inquiry about: ${product.title}`;
    const body = `Hi ${ownerFirstName},\n\nI'm interested in your product "${product.title}" listed for $${product.price}.\n\nCould you please provide more information?\n\nThanks!`;
    
    Linking.openURL(`mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleEdit = () => {
    console.log('[ProductDetailsScreen] Edit button pressed for product:', productId);
    
    // Ensure productId is a string and valid
    const id = String(productId || '');
    
    if (!id) {
      console.error('[ProductDetailsScreen] Cannot edit: No product ID available');
      Alert.alert('Error', 'Unable to edit product: No product ID');
      return;
    }
    
    // Log the navigation attempt
    console.log('[ProductDetailsScreen] Attempting to navigate to EditProduct with ID:', id);
    
    // Try multiple navigation approaches
    try {
      // Use the more explicit navigation approach
      navigation.dispatch(
        CommonActions.navigate({
          name: 'EditProduct',
          params: { productId: id },
        })
      );
      console.log('[ProductDetailsScreen] Navigation dispatched');
    } catch (error) {
      console.error('[ProductDetailsScreen] Navigation error:', error);
      Alert.alert('Error', 'Unable to open edit screen. Please try again.');
    }
  };

  const scrollToImage = (index: number) => {
    setCurrentImageIndex(index);
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API 33+), we need different permissions
        if (Platform.Version >= 33) {
          // For Android 13+, we need to use WRITE_EXTERNAL_STORAGE as READ_MEDIA_IMAGES
          // might not be available in the standard PermissionsAndroid API
          const granted = await PermissionsAndroid.request(
            'android.permission.READ_MEDIA_IMAGES',
            {
              title: 'Media Images Permission',
              message: 'This app needs access to your media to save images.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // For older Android versions
          const permission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );

          if (permission) {
            return true;
          }

          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to storage to save images.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );

          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }

    // iOS doesn't need permission for saving to photo library with RNFS
    return true;
  };

  const saveImageToCameraRoll = async (imageUri: string) => {
    try {
      setDownloadInProgress(true);
      
      // Check and request permissions
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to save images. Please enable it in your device settings.'
        );
        setDownloadInProgress(false);
        return;
      }
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filename = `product_image_${timestamp}.jpg`;
      
      // For Android, save to Downloads folder which is more reliable
      const downloadPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${filename}`
          : `${RNFS.DocumentDirectoryPath}/${filename}`;
          
      console.log('Saving image to:', downloadPath);
      console.log('Image URL:', imageUri);
      
      // Download the image
      const downloadResult = await RNFS.downloadFile({
        fromUrl: imageUri,
        toFile: downloadPath,
        progressDivider: 1,
        begin: res => {
          console.log('Download started:', res);
        },
        progress: res => {
          console.log('Download progress:', res);
        },
      }).promise;
      
      console.log('Download result:', downloadResult);
      
      if (downloadResult.statusCode === 200) {
        // Verify the file was created
        const fileExists = await RNFS.exists(downloadPath);
        console.log('File exists after download:', fileExists);
        
        if (fileExists) {
          const fileStats = await RNFS.stat(downloadPath);
          console.log('File stats:', fileStats);
          
          setDownloadInProgress(false);
          
          setTimeout(() => {
            Alert.alert(
              'Success!',
              `Image saved to ${
                Platform.OS === 'android' ? 'Downloads' : 'device'
              } folder.`
            );
          }, 500);
          setShowImagePopup(false);
        } else {
          throw new Error('File was not created');
        }
      } else {
        throw new Error(
          `Download failed with status: ${downloadResult.statusCode}`
        );
      }
    } catch (error: any) {
      console.error('Error saving image:', error);
      setDownloadInProgress(false);
      
      setTimeout(() => {
        Alert.alert(
          'Error',
          `Failed to save image: ${error.message}. Please try again.`
        );
      }, 500);
    }
  };

  const shareImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    
    try {
      setIsSaving(true);
      await ShareUtils.shareImage(imageUrl, product || undefined);
    } catch (error) {
      console.error('Error sharing image:', error);
    } finally {
      setIsSaving(false);
      setShowImagePopup(false);
    }
  };

  const handleImageLongPress = async (imageUrl: string, event?: any) => {
    setSelectedImageUrl(imageUrl);

    // Get touch position for popup placement
    if (event && event.nativeEvent) {
      const {pageX, pageY} = event.nativeEvent;
      setPopupPosition({
        x: pageX - 80, // Center the popup
        y: pageY - 60, // Position above touch point
      });
    } else {
      // Fallback to center of screen
      setPopupPosition({
        x: SCREEN_WIDTH / 2 - 80,
        y: 200,
      });
    }

    setShowImagePopup(true);
  };

  // Fix the isOwner check to handle different id field locations
  // The issue might be that product.owner.id doesn't match user.id format
  const isOwner = React.useMemo(() => {
    if (!product || !user) return false;
    
    // Check if product has owner with id
    if (product.owner && product.owner.id) {
      console.log('[ProductDetailsScreen] Comparing owner.id and user.id:', 
        product.owner.id, user.id);
      return product.owner.id === user.id;
    }
    
    // Check if product has owner with _id - safe access with type cast
    if (product.owner && (product.owner as ProductOwner)._id) {
      console.log('[ProductDetailsScreen] Comparing owner._id and user.id:', 
        (product.owner as ProductOwner)._id, user.id);
      return (product.owner as ProductOwner)._id === user.id;
    }
    
    // Check if product has user with id or _id
    if ((product as any).user) {
      const productUser = (product as any).user;
      if (productUser.id) {
        console.log('[ProductDetailsScreen] Comparing user.id and user.id:', 
          productUser.id, user.id);
        return productUser.id === user.id;
      }
      if (productUser._id) {
        console.log('[ProductDetailsScreen] Comparing user._id and user.id:', 
          productUser._id, user.id);
        return productUser._id === user.id;
      }
    }
    
    // If we can't determine ownership, return false
    console.log('[ProductDetailsScreen] Could not determine ownership');
    return false;
  }, [product, user]);

  const renderImageItem = ({ item, index }: { item: { url: string; _id: string }, index: number }) => {
    // Get full image URL
    const imageUrl = getImageUrl(item.url);
    
    console.log('[ProductDetailsScreen] Rendering image with URL:', imageUrl);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => handleImagePress(imageUrl)}
        onLongPress={() => {
          console.log('[ProductDetailsScreen] Long press detected on image');
          // Use shareImage instead of saveImageToCameraRoll
          handleImageLongPress(imageUrl);
        }}
        delayLongPress={300}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.carouselImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Failed to load product details
        </Text>
        <TouchableOpacity
          style={[{ marginTop: 20, padding: 10, backgroundColor: theme.primary, borderRadius: 8 }]}
          onPress={handleRetry}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safety check - if product is somehow empty but we didn't catch it above
  if (!product.title || !product.price) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Product data is incomplete
        </Text>
        <TouchableOpacity
          style={[{ marginTop: 20, padding: 10, backgroundColor: theme.primary, borderRadius: 8 }]}
          onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}>
      {/* Images Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={product.images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item._id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentImageIndex(newIndex);
          }}
        />

        {/* Pagination Indicators */}
        {product.images.length > 1 && (
          <View style={styles.paginationContainer}>
            {product.images.map((_: any, index: number) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && { backgroundColor: theme.primary },
                  index !== currentImageIndex && { backgroundColor: theme.text + '40' }
                ]}
                onPress={() => scrollToImage(index)}
              />
            ))}
          </View>
        )}

        {/* Side Navigation Arrows */}
        {currentImageIndex > 0 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navArrowLeft, { backgroundColor: theme.background + 'CC' }]}
            onPress={() => scrollToImage(currentImageIndex - 1)}
          >
            <ChevronLeftIcon size={24} color={theme.text} />
          </TouchableOpacity>
        )}

        {currentImageIndex < product.images.length - 1 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navArrowRight, { backgroundColor: theme.background + 'CC' }]}
            onPress={() => scrollToImage(currentImageIndex + 1)}
          >
            <ChevronRightIcon size={24} color={theme.text} />
          </TouchableOpacity>
        )}
        
        {/* Save hint */}
        <View style={[styles.saveHint, { backgroundColor: theme.background + 'CC' }]}>
          <TouchableOpacity 
            onPress={() => {
              if (product.images[currentImageIndex]) {
                const imageUrl = getImageUrl(product.images[currentImageIndex].url);
                handleImageLongPress(imageUrl);
              }
            }}
            style={styles.saveButton}
          >
            <ArrowDownTrayIcon size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Product title and price in a card */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {product.title}
          </Text>
          
          <View style={styles.priceContainer}>
            <CurrencyDollarIcon size={30} color={theme.primary} />
            <Text style={[styles.price, { color: theme.primary }]}>
              {product.price.toLocaleString()}
            </Text>
          </View>
          
          {/* Description */}
          <Text style={[styles.description, { color: theme.text }]}>
            {product.description}
          </Text>
        </View>

        {/* Location card */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.locationHeader}>
            <MapPinIcon size={30} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Location
            </Text>
          </View>
          <Text style={[styles.locationText, { color: theme.text }]}>
            {product.location.name}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actions}>
            {isOwner ? (
              /* Edit Button for Owner */
              <TouchableOpacity
                style={[styles.editButtonContainer, { backgroundColor: theme.primary }]}
                onPress={handleEdit}
                activeOpacity={0.8}
              >
                <PencilSquareIcon size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Product</Text>
              </TouchableOpacity>
            ) : (
              /* Contact Seller Button */
              <Button
                title="Contact Seller"
                onPress={handleSendEmail}
                icon={<EnvelopeIcon size={20} color="#FFFFFF" />}
                style={styles.contactButton}
              />
            )}
            
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={handleShare}>
              <ShareIcon size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {/* Add to Cart Section */}
          {!isOwner && (
            <View style={styles.cartSection}>
              {cartQuantity > 0 ? (
                <View style={[styles.quantityContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <View style={styles.quantityHeader}>
                    <ShoppingCartIcon size={20} color={theme.primary} />
                    <Text style={[styles.quantityLabel, { color: theme.text }]}>In Cart</Text>
                    
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[styles.quantityButton, styles.quantityButtonMinus, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
                      onPress={() => handleQuantityChange(cartQuantity - 1)}
                    >
                      <MinusIcon size={18} color={theme.primary} />
                    </TouchableOpacity>
                    
                    <View style={[styles.quantityDisplay, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}>
                      <Text style={[styles.quantityText, { color: theme.primary }]}>
                        {cartQuantity}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.quantityButton, styles.quantityButtonPlus, { backgroundColor: theme.primary }]}
                      onPress={() => handleQuantityChange(cartQuantity + 1)}
                    >
                      <PlusIcon size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.quantitySubtext, { color: theme.text + '80' }]}>
                    Tap + or - to adjust quantity
                  </Text>
                </View>
              ) : (
                <Button
                  title="Add to Cart"
                  onPress={handleAddToCart}
                  icon={<ShoppingCartIcon size={20} color="#FFFFFF" />}
                  style={styles.cartButton}
                />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable 
            style={styles.modalCloseArea}
            onPress={() => setShowImageModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: 'black' }]}>
              <Image
                source={{ uri: getImageUrl(selectedImageUrl) }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              
              <TouchableOpacity 
                style={styles.saveImageButton} 
                onPress={() => {
                  handleImageLongPress(selectedImageUrl);
                  setShowImageModal(false);
                }}
                disabled={downloadInProgress}
              >
                {downloadInProgress ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ShareIcon size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Image Popup Menu */}
      {showImagePopup && (
        <Modal
          visible={showImagePopup}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImagePopup(false)}>
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={() => setShowImagePopup(false)}>
            <View
              style={[
                styles.imagePopup,
                {
                  left: Math.max(
                    10,
                    Math.min(popupPosition.x, SCREEN_WIDTH - 170),
                  ),
                  top: Math.max(
                    50,
                    Math.min(popupPosition.y, SCREEN_HEIGHT - 150),
                  ),
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}>
              {/* Save Option */}
              <TouchableOpacity
                style={[styles.popupOption, isSaving && styles.disabledOption]}
                onPress={() => saveImageToCameraRoll(selectedImageUrl)}
                disabled={isSaving}>
                <View style={styles.popupIcon}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <ArrowDownTrayIcon size={20} color={theme.primary} />
                  )}
                </View>
                <Text style={[styles.popupText, { color: theme.text }]}>
                  {isSaving ? 'Saving...' : 'Save Image'}
                </Text>
              </TouchableOpacity>

              {/* Share Option */}
              <TouchableOpacity
                style={[styles.popupOption, isSaving && styles.disabledOption]}
                onPress={() => shareImage(selectedImageUrl)}
                disabled={isSaving}>
                <View style={styles.popupIcon}>
                  <ShareIcon size={20} color={theme.text} />
                </View>
                <Text style={[styles.popupText, { color: theme.text }]}>Share Image</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  errorSubText: {
    fontSize: 16,
  },
  carouselContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowLeft: {
    left: 10,
  },
  navArrowRight: {
    right: 10,
  },
  saveHint: {
    position: 'absolute',
    bottom: 60,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveHintText: {
    fontSize: 12,
    marginLeft: 6,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 30,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  ownerImage: {
    width: '100%',
    height: '100%',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listingDate: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    height: 50,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  contactButton: {
    flex: 1,
    marginRight: 10,
  },
  editButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 10,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cartButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50', // Green color for the cart button
  },
  shareButton: {
    height: 50,
    width: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  saveImageButton: {
    position: 'absolute',
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emailHint: {
    fontSize: 14,
    fontWeight: 'normal',
    marginTop: 4,
  },
  ownerPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imagePopup: {
    position: 'absolute',
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  popupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  popupIcon: {
    marginRight: 12,
    width: 20,
    alignItems: 'center',
  },
  popupText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledOption: {
    opacity: 0.6,
  },
  cartSection: {
    marginTop: 12,
  },
  quantityContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  quantityBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quantityBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quantityButtonMinus: {
    borderWidth: 2,
  },
  quantityButtonPlus: {
    // Plus button uses primary background, no additional styles needed
  },
  quantityDisplay: {
    minWidth: 60,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 2,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantitySubtext: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProductDetailsScreen; 
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
  Platform,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { MapPinIcon, ShareIcon } from 'react-native-heroicons/outline';
// Temporarily disabled animations due to Reanimated worklet configuration issue
// import Animated, { 
//   useSharedValue, 
//   useAnimatedStyle, 
//   withSpring, 
//   withTiming,
//   runOnJS,
//   interpolate,
// } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Product } from '../../utils/api/services/productService';
// Removed cart functionality as requested
// import { useCartStore } from '../../store/cartStore';

export interface ProductCardProps {
  product: Product;
  onPress: () => void;
  style?: ViewStyle;
}

// Calculate dimensions for the card
const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 36) / 2; // 36 = padding (12*2) + gap between cards (12)

// Function to handle both relative and absolute URLs
const getImageUrl = (relativeUrl: string) => {
  // Check if the URL is already absolute (starts with http or https)
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  // Otherwise, prepend the base URL
  return `https://backend-practice.eurisko.me${relativeUrl}`;
};

// Default placeholder image
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150';

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
  const { theme } = useTheme();
  
  // Use the first image as the main image or a placeholder
  // And handle relative URLs properly
  let mainImage = PLACEHOLDER_IMAGE;
  if (product.images && product.images.length > 0 && product.images[0].url) {
    mainImage = getImageUrl(product.images[0].url);
    console.log('[Image URL]', mainImage);
  }

  // Safely handle location - it might be missing in some responses
  const locationName = product.location?.name || 'Unknown location';

  // Handle card press
  const handleCardPress = useCallback(() => {
    onPress();
  }, [onPress]);

  // Handle share with error handling
  const handleShare = useCallback(async (e: any) => {
    e.stopPropagation();
    
    try {
      const shareUrl = `storeapp://product/${product._id}`;
      const shareOptions = {
        title: product.title,
        message: `Check out this product: ${product.title} - ${shareUrl}`,
        url: shareUrl,
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.log('Share error:', error);
      // Fallback: You could show an alert or copy to clipboard
      // Alert.alert('Share', 'Sharing is not available on this device');
    }
  }, [product]);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.container,
          { 
            backgroundColor: theme.cardBackground, 
            borderColor: theme.border,
            width: cardWidth,
          },
          style,
        ]}
        onPress={handleCardPress}
        activeOpacity={0.9}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Share button overlay */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.cardBackground }]}
            onPress={handleShare}
          >
            <ShareIcon size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.contentContainer}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={2}
          >
            {product.title}
          </Text>
          
          <Text style={[styles.price, { color: theme.primary }]}>
            ${product.price.toLocaleString()}
          </Text>
          
          <View style={styles.locationContainer}>
            <MapPinIcon size={14} color={theme.secondary} />
            <Text
              style={[styles.location, { color: theme.secondary }]}
              numberOfLines={1}
            >
              {locationName}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shareButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    height: 40,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 10,
    marginLeft: 4,
    flex: 1,
  },
});

export default ProductCard; 
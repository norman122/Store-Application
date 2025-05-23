import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
  Platform,
  Dimensions,
} from 'react-native';
import { MapPinIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../../context/ThemeContext';
import { Product } from '../../utils/api/services/productService';

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

  return (
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
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: mainImage }}
          style={styles.image}
          resizeMode="cover"
        />
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 12, // Reduced font size
    fontWeight: '600',
    marginBottom: 8,
    height: 40, // Fixed height for 2 lines of text
  },
  price: {
    fontSize: 14, // Reduced font size
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 10, // Reduced font size
    marginLeft: 4,
    flex: 1,
  },
});

export default ProductCard; 
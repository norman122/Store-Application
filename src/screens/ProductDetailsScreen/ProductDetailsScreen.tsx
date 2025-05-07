import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';
import Button from '../../components/atoms/Button';

// Import products data
import productsData from '../../assets/Products.json';

type ProductDetailsRouteProp = RouteProp<AuthStackParamList, 'ProductDetails'>;

type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: { url: string; _id: string }[];
};

const ShareIcon = () => {
  return (
    <View style={styles.shareIconContainer}>
      <Text style={[styles.shareIconArrow, { color: '#000000' }]}>↑</Text>
      <View style={styles.shareIconBox}></View>
    </View>
  );
};

const ProductDetailsScreen: React.FC = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute<ProductDetailsRouteProp>();
  const { theme } = useTheme();
  const { productId } = route.params;

  useEffect(() => {
    // Simulate fetching product details
    setTimeout(() => {
      const foundProduct = productsData.data.find(
        (p) => p._id === productId
      );
      if (foundProduct) {
        setProduct(foundProduct);
      }
      setLoading(false);
    }, 500);
  }, [productId]);

  const handleShare = async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `Check out this amazing product: ${product.title} - ${product.description}`,
        title: product.title,
      });
    } catch (error) {
      console.error('Error sharing product:', error);
    }
  };

  const handleAddToCart = () => {
    // This would typically add the product to a cart context or make an API call
    // For now, we'll just show a console log
    console.log('Added to cart:', product?.title);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Product not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: product.images[0].url }}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {product.title}
          </Text>
          <Text style={[styles.price, { color: theme.primary }]}>
            ${product.price.toLocaleString()}
          </Text>
        </View>

        <Text style={[styles.description, { color: theme.text }]}>
          {product.description}
        </Text>

        <View style={styles.actions}>
          <View style={styles.buttonContainer}>
            <Button
              title="Add to Cart"
              onPress={handleAddToCart}
              buttonStyle={styles.addToCartButton}
            />
          </View>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: '#F5F5F5' }]}
            onPress={handleShare}>
            <Text style={[styles.shareButtonText, { color: '#000000' }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    height: 50,
  },
  buttonContainer: {
    flex: 1,
    marginRight: 8,
    height: 50,
  },
  addToCartButton: {
    flex: 1,
    marginVertical: 0,
    height: 50,
  },
  shareButton: {
    height: 50,
    width: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  shareIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconArrow: {
    fontSize: 20,
    lineHeight: 20,
  },
  shareIconBox: {
    width: 12,
    height: 8,
    borderWidth: 1,
    borderColor: '#000',
    marginTop: -4,
  },
});

export default ProductDetailsScreen; 
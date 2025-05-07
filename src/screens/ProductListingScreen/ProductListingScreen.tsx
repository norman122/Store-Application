import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ProductCard from '../../components/molecules/ProductCard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';

// Import products data
import productsData from '../../assets/Products.json';

type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: { url: string; _id: string }[];
};

type ProductListingNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ProductListing'>;

const ProductListingScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<ProductListingNavigationProp>();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout } = useAuth();

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setProducts(productsData.data);
      setLoading(false);
    }, 800);
  }, []);

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard
      id={item._id}
      title={item.title}
      price={item.price}
      imageUrl={item.images[0].url}
      onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.text }]}>
          Discover Latest Products
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});

export default ProductListingScreen; 
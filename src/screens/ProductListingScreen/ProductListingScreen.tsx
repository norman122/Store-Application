import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, ArrowsUpDownIcon } from 'react-native-heroicons/outline';
import { XMarkIcon, CheckIcon, ArrowPathIcon } from 'react-native-heroicons/solid';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ProductCard from '../../components/molecules/ProductCard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../store/authStore';
import { productApi, useGetProducts } from '../../utils/api/services/productService';
import { useApiUtils } from '../../utils/useApiUtils';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';
import { Product as ApiProduct } from '../../utils/api/services/productService';

type Product = ApiProduct;

type SortOption = {
  label: string;
  value: string;
  order: 'asc' | 'desc';
};

type ProductListingNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const ProductListingScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSortOption, setSelectedSortOption] = useState<SortOption>({
    label: 'Newest First',
    value: 'createdAt',
    order: 'desc',
  });
  const [searchLoading, setSearchLoading] = useState(false);

  const navigation = useNavigation<ProductListingNavigationProp>();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout, isLoggedIn, checkTokens, refreshTokenManually } = useAuth();
  const { queryClient } = useApiUtils();

  // Use React Query to fetch products
  const {
    data: productData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useGetProducts(page, 10, {
    sortBy: selectedSortOption.value,
    order: selectedSortOption.order
  });

  // Update local state when product data changes
  useEffect(() => {
    if (productData) {
      if (page === 1) {
        setProducts(productData.data || []);
      } else {
        setProducts(prev => [...prev, ...(productData.data || [])]);
      }
      
      if (productData.pagination) {
        setTotalPages(productData.pagination.totalPages);
      }
    }
  }, [productData, page]);

  // Update loading states
  useEffect(() => {
    setLoading(isProductsLoading && page === 1 && !refreshing);
    setLoadingMore(isProductsLoading && page > 1);
    
    if (isProductsError && productsError) {
      setError(productsError.message || 'Failed to fetch products');
    } else {
      setError(null);
    }
  }, [isProductsLoading, isProductsError, productsError, page, refreshing]);

  // Refresh products when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[ProductListingScreen] Screen focused, refreshing products');
      refetchProducts();
    }, [refetchProducts])
  );

  // Fetch products when authentication state changes
  useEffect(() => {
    if (isLoggedIn) {
      console.log('[ProductListingScreen] Logged in, fetching products');
      setPage(1);
      refetchProducts();
    }
  }, [isLoggedIn, refetchProducts]);

  const sortOptions: SortOption[] = [
    { label: 'Newest First', value: 'createdAt', order: 'desc' },
    { label: 'Oldest First', value: 'createdAt', order: 'asc' },
    { label: 'Price: Low to High', value: 'price', order: 'asc' },
    { label: 'Price: High to Low', value: 'price', order: 'desc' },
    { label: 'Title: A-Z', value: 'title', order: 'asc' },
    { label: 'Title: Z-A', value: 'title', order: 'desc' },
  ];

  const fetchProducts = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      // Clear previous error state
      setError(null);
      
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Check if we have valid tokens before making the request
      const tokenStatus = await checkTokens();
      if (!tokenStatus.isValid) {
        console.log('Token validation failed before product fetch:', tokenStatus);
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('Fetching products with params:', { 
        isSearchActive, 
        searchQuery, 
        pageNum, 
        sortBy: selectedSortOption.value,
        order: selectedSortOption.order 
      });

      // If search is active, use search endpoint, otherwise use normal products endpoint
      let response;
      if (searchQuery && isSearchActive) {
        console.log('Making search request with query:', searchQuery);
        response = await productApi.searchProducts(searchQuery);
        console.log('Search response received:', response);

        // Check if response data is empty or invalid
        if (!response || !response.data || response.data.length === 0) {
          console.log('Search returned no results');
        }
      } else {
        console.log('Making regular products request');
        response = await productApi.getProducts(
          pageNum,
          10,
          {
            sortBy: selectedSortOption.value,
            order: selectedSortOption.order
          }
        );
        console.log('Regular products response received');
      }

      const { data, pagination } = response;
      
      if (pageNum === 1 || refresh) {
        setProducts(data || []);
      } else {
        setProducts((prevProducts) => [...prevProducts, ...(data || [])]);
      }

      if (pagination) {
        setTotalPages(pagination.totalPages);
      } else {
        // If no pagination info is available, assume this is the only page
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error in fetchProducts:', error);
      
      // Handle token-related errors specifically
      if (error.message?.includes('refresh token') || error.message?.includes('Authentication required')) {
        setError('Your session has expired. Please log in again.');
        
        // If the error is related to authentication, clear any products
        setProducts([]);
        
        // Show an alert to the user
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            { 
              text: 'OK', 
              onPress: async () => {
                // Log the user out
                await logout();
              }
            }
          ]
        );
        
        return;
      }
      
      // Set a user-friendly error message for other errors
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your internet connection.');
      } else if (!error.response) {
        setError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else if (error.response?.status === 521) {
        setError('Server is currently unavailable. Please try again later.');
      } else if (error.response?.status === 404 && isSearchActive) {
        setError('Search endpoint not found. The search feature may not be available.');
      } else if (error.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else {
        setError(error.message || 'An unexpected error occurred.');
      }
      
      // Keep any existing products when pagination fails
      if (pageNum > 1) {
        // Don't clear existing products on pagination error
      } else if (!refresh) {
        // Only clear products on initial load, not on refresh
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [searchQuery, isSearchActive, selectedSortOption, logout, checkTokens]);

  useEffect(() => {
    // Fetch data when the component first mounts only
    setPage(1);
    fetchProducts(1);
  }, []); // Empty dependency array means this only runs once on mount

  // Add a separate effect for handling sort option changes that doesn't trigger fetching
  useEffect(() => {
    // Don't fetch on sort option changes - this is handled manually now
  }, [selectedSortOption]);

  // Keep pagination - loading more when scrolling to the bottom
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      console.log('[App] Search activated with query:', searchQuery.trim());
      Keyboard.dismiss();
      setSearchLoading(true);
      setIsSearchActive(true);
      setPage(1);
      
      // Make sure we're using the trimmed search query
      const trimmedQuery = searchQuery.trim();
      setSearchQuery(trimmedQuery);
      
      // Use a slight delay to ensure the keyboard is dismissed properly
      // on physical devices before making the API call
      setTimeout(() => {
        fetchProducts(1).finally(() => {
          setSearchLoading(false);
        });
      }, 300);
    } else {
      console.log('[App] Empty search query, not activating search');
    }
  }, [searchQuery, fetchProducts]);

  // Perform search when user submits the search field
  const handleSearchSubmit = () => {
    handleSearch();
  };

  const clearSearch = () => {
    console.log('Clearing search');
    setSearchQuery('');
    setIsSearchActive(false);
    setPage(1);
    fetchProducts(1);
  };

  const toggleSortModal = () => {
    setSortModalVisible(!sortModalVisible);
  };

  const selectSortOption = (option: SortOption) => {
    setSelectedSortOption(option);
    setSortModalVisible(false);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.text }]}>
        {isSearchActive
          ? `No products found for "${searchQuery}"`
          : 'No products available'}
      </Text>
    </View>
  );

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: theme.text }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={() => fetchProducts(1)}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const handleRefresh = useCallback(() => {
    console.log('[ProductListingScreen] Pull-to-refresh triggered');
    setRefreshing(true);
    setPage(1);
    
    if (isSearchActive && searchQuery) {
      handleSearch();
    } else {
      refetchProducts().finally(() => {
        setRefreshing(false);
      });
    }
  }, [isSearchActive, searchQuery, refetchProducts]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.text }]}>
          Discover Latest Products
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        {searchLoading ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
        ) : (
          <TouchableOpacity onPress={handleSearch}>
            <MagnifyingGlassIcon size={20} color={theme.text} />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search products..."
          placeholderTextColor={theme.text + '80'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <XMarkIcon size={20} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Filter Options */}
      <View style={styles.filterContainer}>
        <View style={styles.filterLeft}>
          {isSearchActive && (
            <View style={[styles.activeFilterPill, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.activeFilterText, { color: theme.primary }]}>
                Search: {searchQuery}
              </Text>
              <TouchableOpacity onPress={clearSearch}>
                <XMarkIcon size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.sortButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={toggleSortModal}
        >
          <ArrowsUpDownIcon size={16} color={theme.text} />
          <Text style={[styles.sortButtonText, { color: theme.text }]}>
            {selectedSortOption.label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error && products.length === 0 ? (
          renderErrorView()
        ) : (
          <FlatList
            data={products}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            initialNumToRender={6}
            maxToRenderPerBatch={10}
            windowSize={5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            ListFooterComponent={error && loadingMore ? renderErrorView() : renderFooter()}
            ListEmptyComponent={renderEmptyList}
          />
        )}
      </View>

      {/* Sort Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={toggleSortModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Sort By</Text>
              <TouchableOpacity onPress={toggleSortModal}>
                <XMarkIcon size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={`${option.value}-${option.order}`}
                style={[
                  styles.sortOption,
                  selectedSortOption.value === option.value && 
                  selectedSortOption.order === option.order && 
                  { backgroundColor: theme.primary + '10' }
                ]}
                onPress={() => selectSortOption(option)}
              >
                <Text style={[styles.sortOptionText, { color: theme.text }]}>
                  {option.label}
                </Text>
                {selectedSortOption.value === option.value && 
                 selectedSortOption.order === option.order && (
                  <CheckIcon size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 22,
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
  listContainer: {
    flex: 1,
    width: '100%',
  },
  productList: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: '100%',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterText: {
    marginRight: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  sortOptionText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  refreshTokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshTokenText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default ProductListingScreen; 
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, ShoppingCartIcon } from 'react-native-heroicons/outline';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../../context/ThemeContext';
import { useProductList, useProductSearch, useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { usePerformanceProfiler } from '../../hooks/usePerformanceProfiler';
import { ProductFilters } from '../../utils/api/services/productService';
import ProductCard from '../../components/molecules/ProductCard';
import ProductSkeleton from '../../components/atoms/ProductSkeleton';
import FilterBar from '../../components/atoms/FilterBar';
import { AuthStackParamList, TabNavigatorParamList } from '../../navigation/stacks/AuthenticatedStack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

type ProductListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabNavigatorParamList, 'Home'>,
  NativeStackNavigationProp<AuthStackParamList>
>;

// Simple SearchBar component since we don't have the import
const SearchBar = React.memo(({ value, onChangeText, placeholder }: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) => {
  const { theme } = useTheme();
  return (
    <Animated.View 
      entering={FadeInDown.delay(100).springify()}
      style={[
        styles.searchBarContainer,
        { backgroundColor: theme.cardBackground, borderColor: theme.border }
      ]}
    >
      <MagnifyingGlassIcon size={20} color={theme.secondary} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondary}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <XMarkIcon size={20} color={theme.secondary} />
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
});

const ProductListScreen: React.FC = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation<ProductListScreenNavigationProp>();
  const { logMetrics } = usePerformanceProfiler('ProductListScreen');
  
  // State from store
  const { searchQuery, filters } = useProductStore();
  const { totalItems } = useCartStore();
  const { 
    setSearchQuery, 
    setFilters,
  } = useProductStore();
  
  // Use custom hooks from productStore for data fetching
  const { 
    products, 
    pagination, 
    isLoading, 
    refetch,
  } = useProductList(filters);
  
  const { 
    searchResults, 
    isSearchLoading 
  } = useProductSearch(searchQuery);
  
  // Memoized data for display
  const displayProducts = useMemo(() => {
    return isSearchActive ? searchResults || [] : products || [];
  }, [isSearchActive, searchResults, products]);
  
  // Memoized loading state
  const isDataLoading = useMemo(() => {
    return isSearchActive ? isSearchLoading : isLoading;
  }, [isSearchActive, isSearchLoading, isLoading]);
  
  // Handle reaching the end of the list
  const handleEndReached = useCallback(() => {
    if (pagination?.hasNextPage && !isLoading && !isSearchActive) {
      setFilters({
        ...filters,
        page: (filters.page || 1) + 1
      });
    }
  }, [pagination?.hasNextPage, isLoading, isSearchActive, filters, setFilters]);
  
  // Render footer with loading indicator or "no more items" message
  const renderFooter = useCallback(() => {
    if (isLoading && filters.page && filters.page > 1) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      );
    }
    
    if (!pagination?.hasNextPage && displayProducts.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.secondary }]}>
            No more products to show
          </Text>
        </View>
      );
    }
    
    return null;
  }, [isLoading, filters.page, pagination?.hasNextPage, displayProducts.length, theme]);
  
  // Handle refreshing the list
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  
  // Navigate to product details
  const handleProductPress = useCallback((productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  }, [navigation]);
  
  // Handle search submission
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setIsSearchActive(!!text);
  }, [setSearchQuery]);
  
  // Handle applying filters
  const handleApplyFilters = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
    setIsSearchActive(false);
  }, [setFilters]);
  
  // Navigate to add product screen
  const handleAddProduct = useCallback(() => {
    navigation.navigate('TabNavigator');
  }, [navigation]);
  
  // Render product item with animation
  const renderProductItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item._id)}
      />
    </Animated.View>
  ), [handleProductPress]);
  
  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (isDataLoading && displayProducts.length === 0) {
      return <ProductSkeleton count={6} />;
    }
    
    const message = isSearchActive 
      ? `No products found for "${searchQuery}"`
      : 'No products found';
    
    return (
      <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.text }]}>{message}</Text>
        {!isSearchActive && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddProduct}
          >
            <PlusIcon size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }, [isDataLoading, displayProducts.length, isSearchActive, searchQuery, theme, handleAddProduct]);

  // Memoized refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={isLoading && filters.page === 1}
      onRefresh={handleRefresh}
      colors={[theme.primary]}
      tintColor={theme.primary}
    />
  ), [isLoading, filters.page, handleRefresh, theme.primary]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Products</Text>
        
        {/* Cart button */}
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Cart')}
        >
          <ShoppingCartIcon size={24} color="#FFFFFF" />
          {totalItems > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: theme.error || '#FF3B30' }]}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <View style={styles.searchFilterContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search products..."
        />
        
        <FilterBar
          filters={filters}
          onApplyFilters={handleApplyFilters}
        />
      </View>
      
      {isDataLoading && displayProducts.length === 0 ? (
        <ProductSkeleton count={6} />
      ) : (
        <FlatList
          data={displayProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={6}
        />
      )}
      
      <Animated.View entering={FadeInUp.delay(300).springify()}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={handleAddProduct}
        >
          <PlusIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  productList: {
    padding: 8,
    paddingBottom: 80, // Space for FAB
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ProductListScreen; 
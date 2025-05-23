import React, { useState } from 'react';
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
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from 'react-native-heroicons/outline';

import { useTheme } from '../../context/ThemeContext';
import { useProductList, useProductSearch, useProductStore } from '../../store/productStore';
import { ProductFilters } from '../../utils/api/services/productService';
import ProductCard from '../../components/molecules/ProductCard';
import FilterBar from '../../components/atoms/FilterBar';
import { AuthStackParamList } from '../../navigation/stacks/AuthenticatedStack';

type ProductListScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Simple SearchBar component since we don't have the import
const SearchBar = ({ value, onChangeText, placeholder }: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) => {
  const { theme } = useTheme();
  return (
    <View style={[
      styles.searchBarContainer,
      { backgroundColor: theme.cardBackground, borderColor: theme.border }
    ]}>
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
    </View>
  );
};

const ProductListScreen: React.FC = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation<ProductListScreenNavigationProp>();
  
  // State from store
  const { searchQuery, filters } = useProductStore();
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
  
  // Combined data for display
  const displayProducts = isSearchActive ? 
    searchResults || [] : 
    products || [];
  
  // Handle reaching the end of the list
  const handleEndReached = () => {
    if (pagination?.hasNextPage && !isLoading && !isSearchActive) {
      setFilters({
        ...filters,
        page: (filters.page || 1) + 1
      });
    }
  };
  
  // Render footer with loading indicator or "no more items" message
  const renderFooter = () => {
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
  };
  
  // Handle refreshing the list
  const handleRefresh = () => {
    refetch();
  };
  
  // Navigate to product details
  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };
  
  // Handle search submission
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setIsSearchActive(!!text);
  };
  
  // Handle applying filters
  const handleApplyFilters = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setIsSearchActive(false);
  };
  
  // Navigate to add product screen
  const handleAddProduct = () => {
    navigation.navigate('TabNavigator');
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (isLoading || isSearchLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }
    
    const message = isSearchActive 
      ? `No products found for "${searchQuery}"`
      : 'No products found';
    
    return (
      <View style={styles.emptyContainer}>
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
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Products</Text>
      </View>
      
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
      
      <FlatList
        data={displayProducts}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item._id)}
          />
        )}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && filters.page === 1}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />
      
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={handleAddProduct}
      >
        <PlusIcon size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
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
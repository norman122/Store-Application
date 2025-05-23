import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { AdjustmentsHorizontalIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../../context/ThemeContext';
import { ProductFilters } from '../../utils/api/services/productService';

interface FilterBarProps {
  filters: ProductFilters;
  onApplyFilters: (filters: ProductFilters) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onApplyFilters,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<ProductFilters>({ ...filters });
  const { theme } = useTheme();

  const handleApplyFilters = () => {
    onApplyFilters(tempFilters);
    setModalVisible(false);
  };

  const handleCancelFilters = () => {
    setTempFilters({ ...filters });
    setModalVisible(false);
  };

  const handleReset = () => {
    const resetFilters: ProductFilters = {
      category: '',
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'createdAt',
      order: 'desc',
    };
    setTempFilters(resetFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.sortBy !== 'createdAt' || filters.order !== 'desc') count++;
    return count;
  };

  const renderPriceInputs = () => (
    <View style={styles.priceContainer}>
      <View style={styles.priceInputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Min Price</Text>
        <TextInput
          style={[
            styles.priceInput,
            { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              color: theme.text,
            }
          ]}
          value={tempFilters.minPrice !== undefined ? tempFilters.minPrice.toString() : ''}
          onChangeText={(text) => {
            const value = text === '' ? undefined : Number(text);
            setTempFilters({ ...tempFilters, minPrice: value });
          }}
          placeholder="0"
          placeholderTextColor={theme.secondary}
          keyboardType="number-pad"
        />
      </View>
      
      <View style={styles.priceInputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Max Price</Text>
        <TextInput
          style={[
            styles.priceInput,
            { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              color: theme.text,
            }
          ]}
          value={tempFilters.maxPrice !== undefined ? tempFilters.maxPrice.toString() : ''}
          onChangeText={(text) => {
            const value = text === '' ? undefined : Number(text);
            setTempFilters({ ...tempFilters, maxPrice: value });
          }}
          placeholder="1000"
          placeholderTextColor={theme.secondary}
          keyboardType="number-pad"
        />
      </View>
    </View>
  );

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports',
    'Toys',
    'Books',
    'Automotive',
    'Other',
  ];

  const sortOptions = [
    { value: 'createdAt:desc', label: 'Date (Newest)' },
    { value: 'createdAt:asc', label: 'Date (Oldest)' },
    { value: 'price:desc', label: 'Price (Highest)' },
    { value: 'price:asc', label: 'Price (Lowest)' },
  ];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.filterButton,
          { backgroundColor: theme.cardBackground, borderColor: theme.border }
        ]}
        onPress={() => setModalVisible(true)}
      >
        <AdjustmentsHorizontalIcon size={20} color={theme.primary} />
        <Text style={[styles.filterText, { color: theme.text }]}>
          Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filters</Text>
              <TouchableOpacity onPress={handleCancelFilters}>
                <XMarkIcon size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      { 
                        backgroundColor: tempFilters.category === category
                          ? theme.primary
                          : theme.cardBackground,
                        borderColor: theme.border
                      }
                    ]}
                    onPress={() => setTempFilters({
                      ...tempFilters,
                      category: tempFilters.category === category ? '' : category
                    })}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { 
                          color: tempFilters.category === category
                            ? '#FFFFFF'
                            : theme.text
                        }
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Price Range</Text>
              {renderPriceInputs()}

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sort By</Text>
              <View style={styles.sortContainer}>
                {sortOptions.map((option) => {
                  const [sortBy, order] = option.value.split(':');
                  const isActive = 
                    tempFilters.sortBy === sortBy && 
                    tempFilters.order === order;
                  
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortChip,
                        { 
                          backgroundColor: isActive 
                            ? theme.primary 
                            : theme.cardBackground,
                          borderColor: theme.border
                        }
                      ]}
                      onPress={() => setTempFilters({
                        ...tempFilters,
                        sortBy,
                        order: order as 'asc' | 'desc',
                      })}
                    >
                      <Text
                        style={[
                          styles.sortText,
                          { color: isActive ? '#FFFFFF' : theme.text }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.resetButton, { borderColor: theme.border }]}
                onPress={handleReset}
              >
                <Text style={[styles.resetButtonText, { color: theme.text }]}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.primary }]}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  filterText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInputContainer: {
    width: '48%',
  },
  label: {
    marginBottom: 8,
  },
  priceInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  resetButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  resetButtonText: {
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default FilterBar; 
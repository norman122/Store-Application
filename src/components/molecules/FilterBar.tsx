import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ProductFilters } from '../../utils/api/services/productService';
import Button from '../atoms/Button';

interface FilterBarProps {
  initialFilters: ProductFilters;
  onApplyFilters: (filters: ProductFilters) => void;
  onCancel: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  initialFilters,
  onApplyFilters,
  onCancel,
}) => {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const { theme } = useTheme();

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleInStockChange = (inStock: boolean) => {
    setFilters(prev => ({ ...prev, inStock }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleReset = () => {
    setFilters({
      sortBy: 'createdAt',
      order: 'desc',
      inStock: false,
      category: 'all',
      minPrice: 0,
      maxPrice: 1000,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sort By</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.sortBy === 'createdAt' && [styles.selectedOption, { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleSortChange('createdAt')}
            >
              <Text
                style={[
                  styles.optionText,
                  filters.sortBy === 'createdAt' ? styles.selectedOptionText : { color: theme.text },
                ]}
              >
                Newest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.sortBy === 'price' && [styles.selectedOption, { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleSortChange('price')}
            >
              <Text
                style={[
                  styles.optionText,
                  filters.sortBy === 'price' ? styles.selectedOptionText : { color: theme.text },
                ]}
              >
                Price
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.sortBy === 'title' && [styles.selectedOption, { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleSortChange('title')}
            >
              <Text
                style={[
                  styles.optionText,
                  filters.sortBy === 'title' ? styles.selectedOptionText : { color: theme.text },
                ]}
              >
                Name
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Category</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.category === 'all' && [styles.selectedOption, { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleCategoryChange('all')}
            >
              <Text
                style={[
                  styles.optionText,
                  filters.category === 'all' ? styles.selectedOptionText : { color: theme.text },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.category === 'electronics' && [styles.selectedOption, { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleCategoryChange('electronics')}
            >
              <Text
                style={[
                  styles.optionText,
                  filters.category === 'electronics' ? styles.selectedOptionText : { color: theme.text },
                ]}
              >
                Electronics
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                filters.category === 'clothing' && [styles.selectedOption, { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleCategoryChange('clothing')}
            >
              <Text
                style={[
                  styles.optionText,
                  filters.category === 'clothing' ? styles.selectedOptionText : { color: theme.text },
                ]}
              >
                Clothing
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>In Stock Only</Text>
          <Switch
            value={filters.inStock}
            onValueChange={handleInStockChange}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <Button
          title="Reset"
          onPress={handleReset}
          variant="secondary"
          style={styles.resetButton}
        />
        <Button
          title="Apply Filters"
          onPress={() => onApplyFilters(filters)}
          style={styles.applyButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    flex: 2,
  },
});

export default FilterBar; 
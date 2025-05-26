import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 36) / 2;

interface ProductSkeletonProps {
  count?: number;
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 6 }) => {
  const { theme } = useTheme();

  const renderSkeletonCard = (index: number) => (
    <SkeletonPlaceholder
      key={index}
      backgroundColor={theme.cardBackground}
      highlightColor={theme.border}
      speed={1200}
    >
      <View style={[styles.container, { width: cardWidth }]}>
        <View style={styles.image} />
        <View style={styles.content}>
          <View style={styles.title} />
          <View style={styles.titleSecond} />
          <View style={styles.price} />
          <View style={styles.location} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );

  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }, (_, index) => renderSkeletonCard(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  container: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
  },
  content: {
    padding: 12,
  },
  title: {
    width: '80%',
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  titleSecond: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  price: {
    width: '50%',
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
  },
  location: {
    width: '70%',
    height: 14,
    borderRadius: 4,
  },
});

export default ProductSkeleton; 
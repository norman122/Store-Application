import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  ShoppingBagIcon,
  ArrowLeftIcon 
} from 'react-native-heroicons/outline';

import { useTheme } from '../../context/ThemeContext';
import { useCartStore, CartItem } from '../../store/cartStore';
import { AuthStackParamList, TabNavigatorParamList } from '../../navigation/stacks/AuthenticatedStack';

type CartScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabNavigatorParamList, 'Cart'>,
  NativeStackNavigationProp<AuthStackParamList>
>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

// Function to handle both relative and absolute URLs
const getImageUrl = (relativeUrl: string) => {
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  return `https://backend-practice.eurisko.me${relativeUrl}`;
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150';

interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItemComponent: React.FC<CartItemComponentProps> = React.memo(({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}) => {
  const { theme } = useTheme();
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [showDeleteButton, setShowDeleteButton] = React.useState(false);
  
  let mainImage = PLACEHOLDER_IMAGE;
  if (item.product.images && item.product.images.length > 0 && item.product.images[0].url) {
    mainImage = getImageUrl(item.product.images[0].url);
  }

  const handleRemove = useCallback(() => {
    onRemove(item.product._id);
  }, [item.product._id, onRemove]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
        },
        onPanResponderMove: (evt, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(gestureState.dx);
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (gestureState.dx < -SWIPE_THRESHOLD) {
            setShowDeleteButton(true);
            Animated.spring(translateX, {
              toValue: -SWIPE_THRESHOLD,
              useNativeDriver: true,
            }).start();
          } else {
            setShowDeleteButton(false);
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateX]
  );

  const handleDeletePress = useCallback(() => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      handleRemove();
    });
  }, [translateX, handleRemove]);

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete Action Background */}
      {showDeleteButton && (
        <View style={styles.deleteAction}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.error || '#FF3B30' }]}
            onPress={handleDeletePress}
          >
            <TrashIcon size={24} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Cart Item */}
      <Animated.View
        style={[
          styles.cartItemContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View 
          style={[styles.cartItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        >
          <Image source={{ uri: mainImage }} style={styles.productImage} />
          
          <View style={styles.productInfo}>
            <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
              {item.product.title}
            </Text>
            <Text style={[styles.productPrice, { color: theme.primary }]}>
              ${item.product.price.toLocaleString()}
            </Text>
            <Text style={[styles.productLocation, { color: theme.secondary }]}>
              {item.product.location?.name || 'Unknown location'}
            </Text>
          </View>
          
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: theme.primary }]}
              onPress={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
            >
              <MinusIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={[styles.quantityText, { color: theme.text }]}>
              {item.quantity}
            </Text>
            
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: theme.primary }]}
              onPress={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
            >
              <PlusIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.itemTotal}>
            <Text style={[styles.itemTotalText, { color: theme.text }]}>
              ${(item.product.price * item.quantity).toLocaleString()}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

const CartScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCartStore();

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((productId: string) => {
    removeFromCart(productId);
  }, [removeFromCart]);

  const handleClearCart = useCallback(() => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart },
      ]
    );
  }, [clearCart]);

  const handleCheckout = useCallback(() => {
    Alert.alert(
      'Checkout',
      `Proceed to checkout with ${totalItems} items for $${totalPrice.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Checkout', 
          onPress: () => {
            // Here you would implement actual checkout logic
            Alert.alert('Success', 'Order placed successfully!', [
              { text: 'OK', onPress: () => {
                clearCart();
                navigation.navigate('TabNavigator');
              }}
            ]);
          }
        },
      ]
    );
  }, [totalItems, totalPrice, clearCart, navigation]);

  const renderCartItem = useCallback(({ item }: { item: CartItem }) => (
    <CartItemComponent
      item={item}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemoveItem}
    />
  ), [handleUpdateQuantity, handleRemoveItem]);

  const renderEmptyCart = useCallback(() => (
    <View style={styles.emptyContainer}>
      <ShoppingBagIcon size={80} color={theme.secondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Your cart is empty
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.secondary }]}>
        Add some products to get started
      </Text>
      <TouchableOpacity
        style={[styles.shopButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  ), [theme, navigation]);

  const cartSummary = useMemo(() => (
    <View 
      style={[styles.summaryContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
    >      
      <View style={styles.summaryRow}>
        <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
        <Text style={[styles.totalValue, { color: theme.primary }]}>
          ${totalPrice.toLocaleString()}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
        onPress={handleCheckout}
      >
        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
      </TouchableOpacity>
    </View>
  ), [theme, totalItems, totalPrice, handleCheckout]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Shopping Cart ({totalItems})
        </Text>
        
        {items.length > 0 && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: theme.error || '#FF3B30' }]}
            onPress={handleClearCart}
          >
            <TrashIcon size={18} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product._id}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />
          {cartSummary}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cartList: {
    padding: 16,
    paddingBottom: 120, // Space for summary
  },
  swipeableContainer: {
    marginBottom: 12,
  },
  cartItemContainer: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productLocation: {
    fontSize: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen; 
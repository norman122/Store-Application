import { renderHook, act } from '@testing-library/react-native';
import { useCartStore } from '../src/store/cartStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock product data
const mockProduct = {
  _id: '1',
  title: 'Test Product',
  price: 100,
  description: 'Test description',
  images: [{ url: 'test.jpg', _id: 'img1' }],
  location: { 
    name: 'Test Location',
    latitude: 40.7128,
    longitude: -74.0060
  },
  owner: { 
    id: 'owner1', 
    email: 'owner@test.com',
    firstName: 'John', 
    lastName: 'Doe' 
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addToCart(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product._id).toBe('1');
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(100);
  });

  it('should increment quantity when adding existing item', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.addToCart(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(200);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.removeFromCart('1');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.updateQuantity('1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalPrice).toBe(500);
  });

  it('should remove item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.updateQuantity('1', 0);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('should clear all items from cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.addToCart({ ...mockProduct, _id: '2' });
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('should get item quantity', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.updateQuantity('1', 3);
    });

    expect(result.current.getItemQuantity('1')).toBe(3);
    expect(result.current.getItemQuantity('nonexistent')).toBe(0);
  });
}); 
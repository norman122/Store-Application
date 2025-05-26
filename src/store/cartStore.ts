import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../utils/api/services/productService';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addToCart: (product: Product) => {
        const { items } = get();
        const existingItem = items.find(item => item.product._id === product._id);

        if (existingItem) {
          // If item exists, increment quantity
          set(state => {
            const updatedItems = state.items.map(item =>
              item.product._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
            return {
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              totalPrice: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
            };
          });
        } else {
          // If item doesn't exist, add new item
          set(state => {
            const newItem: CartItem = {
              product,
              quantity: 1,
              addedAt: new Date(),
            };
            const updatedItems = [...state.items, newItem];
            return {
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              totalPrice: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
            };
          });
        }
      },

      removeFromCart: (productId: string) => {
        set(state => {
          const updatedItems = state.items.filter(item => item.product._id !== productId);
          return {
            items: updatedItems,
            totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
          };
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set(state => {
          const updatedItems = state.items.map(item =>
            item.product._id === productId
              ? { ...item, quantity }
              : item
          );
          return {
            items: updatedItems,
            totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },

      getItemQuantity: (productId: string) => {
        const { items } = get();
        const item = items.find(item => item.product._id === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 
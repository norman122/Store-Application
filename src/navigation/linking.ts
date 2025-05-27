import { LinkingOptions } from '@react-navigation/native';

// Create a more flexible linking configuration that works for both stacks
const linking: LinkingOptions<any> = {
  prefixes: ['storeapp://'],
  config: {
    screens: {
      // Authenticated Stack screens
      TabNavigator: {
        screens: {
          Home: 'home',
          AddProduct: 'add-product',
          Cart: 'cart',
          Profile: 'profile',
        },
      },
      ProductDetails: {
        path: 'product/:productId',
        parse: {
          productId: (productId: string) => productId,
        },
      },
      EditProduct: {
        path: 'edit-product/:productId',
        parse: {
          productId: (productId: string) => productId,
        },
      },
      // Unauthenticated Stack screens
      Login: 'login',
      Signup: 'signup',
      Verification: 'verification',
      ForgotPassword: 'forgot-password',
    },
  },
};

export default linking; 
import { LinkingOptions } from '@react-navigation/native';
import { AuthStackParamList } from './stacks/AuthenticatedStack';

const linking: LinkingOptions<AuthStackParamList> = {
  prefixes: ['storeapp://', 'https://storeapp.com'],
  config: {
    screens: {
      TabNavigator: {
        screens: {
          Home: 'home',
          AddProduct: 'add-product',
          Cart: 'cart',
          Profile: 'profile',
        },
      },
      ProductDetails: {
        path: '/product/:productId',
        parse: {
          productId: (productId: string) => productId,
        },
      },
      EditProduct: {
        path: '/edit-product/:productId',
        parse: {
          productId: (productId: string) => productId,
        },
      },
    },
  },
};

export default linking; 
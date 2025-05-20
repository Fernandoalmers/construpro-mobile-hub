
import { Address } from '@/services/addressService';
import { CartItem } from '@/types/cart';

export type PaymentMethod = 'credit' | 'debit' | 'money' | 'pix';

export interface StoreGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
}

export interface CheckoutState {
  cart: any[];
  cartItems: CartItem[];
  addresses: Address[];
  selectedAddress: Address | null;
  selectAddress: (address: Address) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  changeAmount: string;
  setChangeAmount: (amount: string) => void;
  showAddressModal: boolean;
  setShowAddressModal: (show: boolean) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  subtotal: number;
  shipping: number;
  total: number;
  totalPoints: number;
  storeGroups: StoreGroup[];
  handlePlaceOrder: () => Promise<void>;
  processError: string | null;
  orderAttempts: number;
  handleRetry: () => void;
  isOnline: boolean;
}

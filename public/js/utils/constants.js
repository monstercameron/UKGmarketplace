// Color constants
export const DARK_TEAL = '#003087';
export const LIGHT_TEAL = '#66A3D2';
export const SUBTLE_GREY = '#CCCCCC';
export const WHITE = '#FFFFFF';
export const DARK_BG = '#111827';  // dark:bg-gray-900

// Local storage keys
export const GUIDELINES_HIDE_KEY = 'guidelines_hidden_until';

// Payment method icons (using Material Icons)
export const PAYMENT_METHODS = {
  cash: { icon: 'payments', label: 'Cash' },
  venmo: { icon: 'account_balance', label: 'Venmo' },
  paypal: { icon: 'payment', label: 'PayPal' },
  zelle: { icon: 'swap_horiz', label: 'Zelle' }
};

export const DEFAULT_ITEM_IMAGE = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1452&q=80';

export const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1452&q=80',
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
];

export const SHIPPING_OPTIONS = {
  local: { icon: 'location_on', label: 'Local Pickup' },
  office: { icon: 'business', label: 'Office to Office' },
  anywhere: { icon: 'local_shipping', label: 'Ships Anywhere' }
}; 
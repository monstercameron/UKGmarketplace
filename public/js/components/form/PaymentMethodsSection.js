import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';
import { Popover } from './Popover.js';

export const PaymentMethodsSection = ({ 
  darkMode, 
  html, 
  selectedMethods = {
    cash: true,
    apple_cash: false,
    cash_app: false,
    zelle: false,
    venmo: false,
    paypal: false,
    other: false
  }, 
  onMethodToggle = () => {}
}) => {
  // Payment methods with descriptions
  const paymentMethods = [
    {
      key: 'cash',
      icon: 'payments',
      label: 'Cash',
      description: 'Traditional cash payment, exchanged in person. Safe and immediate.'
    },
    {
      key: 'apple_cash',
      icon: 'phone_iphone',
      label: 'Apple Cash',
      description: 'Send money instantly through Apple\'s payment service. Requires both parties to have Apple devices.'
    },
    {
      key: 'cash_app',
      icon: 'attach_money',
      label: 'Cash App',
      description: 'Fast and secure mobile payment through Cash App. Easy to track transactions.'
    },
    {
      key: 'zelle',
      icon: 'swap_horiz',
      label: 'Zelle',
      description: 'Direct bank-to-bank transfers. Fast, secure, and usually free with participating banks.'
    },
    {
      key: 'venmo',
      icon: 'account_balance',
      label: 'Venmo',
      description: 'Popular mobile payment service. Easy to use with transaction history and social features.'
    },
    {
      key: 'paypal',
      icon: 'payment',
      label: 'PayPal',
      description: 'Secure online payment platform. Offers buyer and seller protection for eligible transactions.'
    },
    {
      key: 'other',
      icon: 'more_horiz',
      label: 'Other',
      description: 'Alternative payment methods can be discussed and agreed upon between buyer and seller.'
    }
  ];

  // Payment method button component
  const PaymentMethodButton = ({ method }) => {
    const isSelected = selectedMethods[method.key];
    const [showPopover, setShowPopover] = React.useState(false);
    
    return html`
      <div className="relative">
        <button
          key=${method.key}
          type="button"
          onClick=${() => onMethodToggle(method.key)}
          onMouseEnter=${() => setShowPopover(true)}
          onMouseLeave=${() => setShowPopover(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 w-full"
          style=${{
            backgroundColor: isSelected 
              ? (darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(102, 163, 210, 0.2)') 
              : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'),
            border: '1px solid ' + (isSelected 
              ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
              : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')),
            color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)',
            height: '40px'
          }}
        >
          <span 
            className="material-icons text-base"
            style=${{ 
              color: isSelected 
                ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
                : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')
            }}
          >${method.icon}</span>
          <span className="text-sm font-medium flex-1 text-center">${method.label}</span>
        </button>
        <${Popover}
          darkMode=${darkMode}
          html=${html}
          content=${method.description}
          show=${showPopover}
          position="top"
        />
      </div>
    `;
  };

  return html`
    <div className="mb-6">
      <label 
        className="block text-sm font-medium mb-2"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
      >
        Payment Methods <span style=${{ color: '#EF4444' }}>*</span>
      </label>
      <p
        className="text-sm mb-3"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        Select all payment methods you accept
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
        ${paymentMethods.map(method => html`
          <${PaymentMethodButton} method=${method} />
        `)}
      </div>
    </div>
  `;
}; 
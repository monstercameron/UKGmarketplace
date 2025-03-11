import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG, PAYMENT_METHODS } from '../../utils/constants.js';
import { Checkbox } from '../ui/Checkbox.js';

export const PaymentMethodsSelector = ({ 
  selectedMethods = {
    cash: true,
    apple_cash: false,
    cash_app: false,
    zelle: false,
    venmo: false,
    paypal: false,
    other: false
  },
  onToggle,
  darkMode = false,
  html
}) => {
  return html`
    <div className="space-y-4">
      <h3 
        className="text-lg font-semibold"
        style=${{ 
          color: darkMode ? WHITE : DARK_TEAL
        }}
      >
        Payment Methods
      </h3>
      
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg"
        style=${{ 
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
        }}
      >
        ${Object.entries(PAYMENT_METHODS).map(([key, label]) => html`
          <${Checkbox}
            key=${key}
            id=${`payment-${key}`}
            name=${`payment-${key}`}
            label=${label}
            checked=${selectedMethods[key] || false}
            onChange=${() => onToggle(key)}
            darkMode=${darkMode}
            html=${html}
          />
        `)}
      </div>
      
      <p 
        className="text-sm"
        style=${{ 
          color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
        }}
      >
        Select all payment methods you're willing to accept.
      </p>
    </div>
  `;
}; 
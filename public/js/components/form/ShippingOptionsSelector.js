import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG, SHIPPING_OPTIONS } from '../../utils/constants.js';
import { Checkbox } from '../ui/Checkbox.js';

export const ShippingOptionsSelector = ({ 
  selectedOptions = {
    local: true,
    office: false,
    anywhere: false
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
        Delivery Options
      </h3>
      
      <div 
        className="grid grid-cols-1 gap-3 p-4 rounded-lg"
        style=${{ 
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
        }}
      >
        ${Object.entries(SHIPPING_OPTIONS).map(([key, label]) => html`
          <${Checkbox}
            key=${key}
            id=${`shipping-${key}`}
            name=${`shipping-${key}`}
            label=${label}
            checked=${selectedOptions[key] || false}
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
        Select all delivery options you're willing to provide.
      </p>
    </div>
  `;
}; 
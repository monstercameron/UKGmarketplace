import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';
import { Popover } from './Popover.js';

export const ShippingOptionsSection = ({ 
  darkMode, 
  html, 
  selectedOptions = {
    local: true,
    office: false,
    anywhere: false
  }, 
  onOptionToggle = () => {}
}) => {
  // Shipping options with descriptions
  const shippingOptions = [
    {
      key: 'local',
      icon: 'place',
      label: 'Local Pickup',
      description: 'Buyer picks up the item from your specified location. Best for large or fragile items.'
    },
    {
      key: 'office',
      icon: 'business',
      label: 'Office Delivery',
      description: 'You deliver to the buyer\'s office or a mutually agreed location on campus. Good for medium-sized items.'
    },
    {
      key: 'anywhere',
      icon: 'local_shipping',
      label: 'Ship Anywhere',
      description: 'You\'re willing to ship the item. Buyer typically pays shipping costs. Best for small, easily shippable items.'
    }
  ];

  // Shipping option button component
  const ShippingOptionButton = ({ option }) => {
    const isSelected = selectedOptions[option.key];
    const [showPopover, setShowPopover] = React.useState(false);
    
    return html`
      <div className="relative">
        <button
          key=${option.key}
          type="button"
          onClick=${() => onOptionToggle(option.key)}
          onMouseEnter=${() => setShowPopover(true)}
          onMouseLeave=${() => setShowPopover(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300"
          style=${{
            backgroundColor: isSelected 
              ? (darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(102, 163, 210, 0.2)') 
              : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'),
            border: '1px solid ' + (isSelected 
              ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
              : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')),
            color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)'
          }}
        >
          <span 
            className="material-icons text-base"
            style=${{ 
              color: isSelected 
                ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
                : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')
            }}
          >${option.icon}</span>
          <span className="text-sm font-medium">${option.label}</span>
        </button>
        <${Popover}
          darkMode=${darkMode}
          html=${html}
          content=${option.description}
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
        Shipping Options <span style=${{ color: '#EF4444' }}>*</span>
      </label>
      <p
        className="text-sm mb-3"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        Select all shipping options you offer
      </p>
      
      <div className="flex flex-wrap gap-2">
        ${shippingOptions.map(option => html`
          <${ShippingOptionButton} option=${option} />
        `)}
      </div>
    </div>
  `;
}; 
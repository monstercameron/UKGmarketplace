import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const ConditionSelectionSection = ({ 
  darkMode, 
  html, 
  selectedCondition = 'new',
  onConditionSelect = () => {}
}) => {
  // Condition options with SVG icons and descriptions
  const conditionOptions = [
    { 
      value: 'new', 
      label: 'New', 
      description: 'Brand new, unused, unopened',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-6 4 3 7-7-4-7 4 3-7-6-4h7l3-7z"/></svg>`
    },
    { 
      value: 'like_new', 
      label: 'Like New', 
      description: 'Used once or twice, perfect condition',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 5.5h5.5l-4.5 4.5 2.5 5.5-6-3.5-6 3.5 2.5-5.5L4 7.5h5.5L12 2z"/></svg>`
    },
    { 
      value: 'good', 
      label: 'Good', 
      description: 'Minor wear, fully functional',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
    },
    { 
      value: 'fair', 
      label: 'Fair', 
      description: 'Moderate wear, works well',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
    },
    { 
      value: 'poor', 
      label: 'Poor', 
      description: 'Heavy wear, may have issues',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
    }
  ];
  
  // Condition button component
  const ConditionButton = ({ value, label, description, svg }) => {
    const isSelected = selectedCondition === value;
    const iconColor = isSelected 
      ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
      : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)');
    
    const [showPopover, setShowPopover] = React.useState(false);
    
    return html`
      <div className="relative">
        <button
          key=${value}
          type="button"
          onClick=${() => onConditionSelect(value)}
          onMouseEnter=${() => setShowPopover(true)}
          onMouseLeave=${() => setShowPopover(false)}
          className="flex items-center px-3 py-2 rounded-lg transition-all duration-300 w-full"
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
            className="mr-2 flex-shrink-0"
            style=${{ 
              color: iconColor
            }}
            dangerouslySetInnerHTML=${{ __html: svg.replace('currentColor', iconColor) }}
          ></span>
          <span className="text-sm font-medium truncate text-center flex-1">${label}</span>
        </button>
        ${showPopover && html`
          <div 
            className="absolute z-10 w-48 p-2 text-sm rounded-lg shadow-lg transform -translate-x-1/4 -translate-y-full -top-2"
            style=${{
              backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)',
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="relative">
              <p className="text-center">${description}</p>
              <div 
                className="absolute w-3 h-3 transform rotate-45 left-1/3 translate-x-1/2"
                style=${{
                  backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  borderRight: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  bottom: '-1.5rem'
                }}
              ></div>
            </div>
          </div>
        `}
      </div>
    `;
  };

  return html`
    <div className="mb-6">
      <label 
        className="block text-sm font-medium mb-2"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
      >
        Condition <span style=${{ color: '#EF4444' }}>*</span>
      </label>
      <p
        className="text-sm mb-3"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        Select the condition of your item
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
        ${conditionOptions.map(option => html`
          <${ConditionButton} 
            value=${option.value} 
            label=${option.label} 
            description=${option.description}
            svg=${option.svg}
          />
        `)}
      </div>
    </div>
  `;
}; 
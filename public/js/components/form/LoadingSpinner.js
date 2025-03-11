import { LIGHT_TEAL } from '../../utils/constants.js';

export const LoadingSpinner = ({ 
  darkMode, 
  size = 'medium',
  html 
}) => {
  const sizeMap = {
    small: 'h-5 w-5 border-2',
    medium: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4'
  };

  return html`
    <div className="flex justify-center">
      <div 
        className="animate-spin rounded-full ${sizeMap[size]}" 
        style=${{ 
          borderColor: darkMode ? LIGHT_TEAL : LIGHT_TEAL,
          borderTopColor: 'transparent'
        }}
      ></div>
    </div>
  `;
}; 
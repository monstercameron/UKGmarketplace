import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const Spinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  darkMode = false,
  html
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return '1rem';
      case 'md':
        return '1.5rem';
      case 'lg':
        return '2rem';
      case 'xl':
        return '3rem';
      default:
        return '1.5rem';
    }
  };

  const getColor = () => {
    switch (color) {
      case 'primary':
        return LIGHT_TEAL;
      case 'white':
        return WHITE;
      case 'dark':
        return DARK_TEAL;
      default:
        return LIGHT_TEAL;
    }
  };

  const spinnerSize = getSize();
  const spinnerColor = getColor();

  return html`
    <div 
      className=${`inline-block animate-spin ${className}`}
      style=${{
        width: spinnerSize,
        height: spinnerSize,
        borderRadius: '50%',
        border: `2px solid ${spinnerColor}`,
        borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
        '@keyframes spin': {
          to: {
            transform: 'rotate(360deg)'
          }
        }
      }}
      aria-label="Loading"
    ></div>
  `;
}; 
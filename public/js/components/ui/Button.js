import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  fullWidth = false, 
  icon = null,
  iconPosition = 'left',
  className = '',
  darkMode = false,
  html
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: darkMode ? LIGHT_TEAL : DARK_TEAL,
          hoverBg: darkMode ? '#4fd1c5' : '#2c7a7b',
          text: WHITE,
          border: 'none'
        };
      case 'secondary':
        return {
          bg: 'transparent',
          hoverBg: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          text: darkMode ? WHITE : DARK_TEAL,
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
        };
      case 'danger':
        return {
          bg: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
          hoverBg: darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
          text: '#EF4444',
          border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
        };
      default:
        return {
          bg: darkMode ? LIGHT_TEAL : DARK_TEAL,
          hoverBg: darkMode ? '#4fd1c5' : '#2c7a7b',
          text: WHITE,
          border: 'none'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.875rem',
          borderRadius: '0.375rem'
        };
      case 'md':
        return {
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          borderRadius: '0.5rem'
        };
      case 'lg':
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1.125rem',
          borderRadius: '0.5rem'
        };
      default:
        return {
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          borderRadius: '0.5rem'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return html`
    <button
      type=${type}
      onClick=${onClick}
      disabled=${disabled}
      className=${`flex items-center justify-center font-medium transition-colors duration-200 ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style=${{
        backgroundColor: variantStyles.bg,
        color: variantStyles.text,
        border: variantStyles.border,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        borderRadius: sizeStyles.borderRadius,
        ':hover': {
          backgroundColor: !disabled ? variantStyles.hoverBg : undefined
        }
      }}
    >
      ${icon && iconPosition === 'left' ? html`
        <span className="material-icons text-base mr-2">${icon}</span>
      ` : null}
      ${children}
      ${icon && iconPosition === 'right' ? html`
        <span className="material-icons text-base ml-2">${icon}</span>
      ` : null}
    </button>
  `;
}; 
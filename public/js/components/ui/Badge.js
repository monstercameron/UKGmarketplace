import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  icon = null,
  className = '',
  darkMode = false,
  html
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: darkMode ? 'rgba(56, 178, 172, 0.2)' : 'rgba(56, 178, 172, 0.1)',
          text: LIGHT_TEAL
        };
      case 'success':
        return {
          bg: darkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
          text: '#22C55E'
        };
      case 'warning':
        return {
          bg: darkMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.1)',
          text: '#EAB308'
        };
      case 'error':
        return {
          bg: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
          text: '#EF4444'
        };
      case 'info':
        return {
          bg: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          text: '#3B82F6'
        };
      default:
        return {
          bg: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          text: darkMode ? WHITE : DARK_TEAL
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.125rem 0.5rem',
          fontSize: '0.75rem',
          borderRadius: '0.25rem'
        };
      case 'md':
        return {
          padding: '0.25rem 0.75rem',
          fontSize: '0.875rem',
          borderRadius: '0.375rem'
        };
      case 'lg':
        return {
          padding: '0.375rem 1rem',
          fontSize: '1rem',
          borderRadius: '0.5rem'
        };
      default:
        return {
          padding: '0.25rem 0.75rem',
          fontSize: '0.875rem',
          borderRadius: '0.375rem'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return html`
    <span
      className=${`inline-flex items-center ${className}`}
      style=${{
        backgroundColor: variantStyles.bg,
        color: variantStyles.text,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        borderRadius: sizeStyles.borderRadius,
        fontWeight: 500
      }}
    >
      ${icon ? html`
        <span className="material-icons text-base mr-1" style=${{ fontSize: sizeStyles.fontSize }}>${icon}</span>
      ` : null}
      ${children}
    </span>
  `;
}; 
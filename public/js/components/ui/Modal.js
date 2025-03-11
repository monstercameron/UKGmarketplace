import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  darkMode = false,
  html
}) => {
  // Close modal when Escape key is pressed
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Prevent scrolling of the body when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-lg';
    }
  };
  
  return html`
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick=${(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className=${`w-full ${getSizeClass()} rounded-xl shadow-xl overflow-hidden animate-fadeIn`}
        style=${{
          backgroundColor: darkMode ? DARK_BG : WHITE,
          animation: 'fadeIn 0.2s ease-out forwards',
          '@keyframes fadeIn': {
            from: {
              opacity: 0,
              transform: 'scale(0.95)'
            },
            to: {
              opacity: 1,
              transform: 'scale(1)'
            }
          }
        }}
      >
        <div 
          className="flex items-center justify-between p-4 border-b"
          style=${{ 
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            color: darkMode ? WHITE : DARK_TEAL
          }}
        >
          <h3 className="text-lg font-semibold">${title}</h3>
          <button
            onClick=${onClose}
            className="p-1 rounded-full transition-colors duration-200 hover:bg-black hover:bg-opacity-5"
            aria-label="Close modal"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="p-4">
          ${children}
        </div>
      </div>
    </div>
  `;
}; 
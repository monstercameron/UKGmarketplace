import { WHITE, DARK_TEAL, DARK_BG } from '../../utils/constants.js';

export const Toast = ({ message, type = 'error', onClose, darkMode, html }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return 'error_outline';
      case 'success':
        return 'check_circle_outline';
      case 'warning':
        return 'warning_amber';
      default:
        return 'info_outline';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          bg: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          border: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
          text: '#EF4444',
        };
      case 'success':
        return {
          bg: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
          border: darkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
          text: '#22C55E',
        };
      case 'warning':
        return {
          bg: darkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
          border: darkMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.1)',
          text: '#EAB308',
        };
      default:
        return {
          bg: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          border: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          text: '#3B82F6',
        };
    }
  };

  const colors = getColors();

  return html`
    <div 
      className="fixed bottom-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl shadow-lg backdrop-blur-md animate-slideIn"
      style=${{
        backgroundColor: colors.bg,
        border: '1px solid ' + colors.border,
        maxWidth: 'calc(100vw - 2rem)',
        animation: 'slideIn 0.3s ease-out forwards',
        '@keyframes slideIn': {
          from: {
            transform: 'translateX(100%)',
            opacity: 0
          },
          to: {
            transform: 'translateX(0)',
            opacity: 1
          }
        }
      }}
    >
      <span 
        className="material-icons text-2xl"
        style=${{ color: colors.text }}
      >${getIcon()}</span>
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium"
          style=${{ 
            color: darkMode ? WHITE : DARK_TEAL
          }}
        >${message}</p>
      </div>
      <button
        onClick=${onClose}
        className="p-1 rounded-lg transition-colors duration-200 hover:bg-black hover:bg-opacity-5"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
        aria-label="Dismiss notification"
      >
        <span className="material-icons text-base">close</span>
      </button>
    </div>
  `;
}; 
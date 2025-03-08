import { WHITE } from '../../utils/constants.js';

export const Popover = ({ 
  darkMode, 
  html, 
  content,
  show,
  position = 'top' // can be 'top', 'bottom', 'left', 'right'
}) => {
  if (!show) return null;

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-8px)',
          arrow: {
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)'
          }
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(8px)',
          arrow: {
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)'
          }
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(-8px)',
          arrow: {
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)'
          }
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(8px)',
          arrow: {
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)'
          }
        };
      default:
        return {};
    }
  };

  const positionStyles = getPositionStyles();

  return html`
    <div 
      className="absolute z-50 p-3 text-sm rounded-lg shadow-lg"
      style=${{
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)',
        border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
        backdropFilter: 'blur(8px)',
        minWidth: '160px',
        maxWidth: '240px',
        width: 'max-content',
        ...positionStyles
      }}
    >
      <div className="relative">
        <p className="text-center leading-relaxed">${content}</p>
        <div 
          className="absolute w-3 h-3"
          style=${{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
            borderTop: position === 'bottom' ? '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') : 'none',
            borderLeft: position === 'right' ? '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') : 'none',
            ...positionStyles.arrow
          }}
        ></div>
      </div>
    </div>
  `;
}; 
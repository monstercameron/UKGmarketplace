import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const Card = ({ 
  children, 
  title = null, 
  footer = null, 
  className = '', 
  darkMode = false,
  html
}) => {
  return html`
    <div 
      className=${`rounded-xl overflow-hidden shadow-md ${className}`}
      style=${{ 
        backgroundColor: darkMode ? DARK_BG : WHITE,
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        color: darkMode ? WHITE : DARK_TEAL
      }}
    >
      ${title ? html`
        <div 
          className="px-4 py-3 border-b"
          style=${{ 
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }}
        >
          <h3 className="text-lg font-semibold">${title}</h3>
        </div>
      ` : null}
      
      <div className="p-4">
        ${children}
      </div>
      
      ${footer ? html`
        <div 
          className="px-4 py-3 border-t"
          style=${{ 
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }}
        >
          ${footer}
        </div>
      ` : null}
    </div>
  `;
}; 
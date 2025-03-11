import { DARK_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';
import { Breadcrumbs } from '../Breadcrumbs.js';

export const FormHeader = ({ 
  darkMode, 
  onBack, 
  html 
}) => {
  return html`
    <div 
      className="sticky top-0 z-10 -mx-4 px-4 py-4 mb-6 transition-all duration-300"
      style=${{
        backgroundColor: darkMode ? `${DARK_BG}CC` : `${WHITE}CC`,
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
      }}
    >
      <div className="flex items-center justify-between">
        <${Breadcrumbs} 
          darkMode=${darkMode} 
          html=${html}
          items=${[
            { text: 'Home', link: true, onClick: onBack },
            { text: 'Edit Item' }
          ]} 
        />
        <button
          onClick=${onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:-translate-x-1"
          style=${{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
            color: darkMode ? WHITE : DARK_TEAL
          }}
        >
          <span className="material-icons">arrow_back</span>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  `;
}; 
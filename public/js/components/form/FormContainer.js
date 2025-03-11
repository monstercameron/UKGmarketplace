import { DARK_TEAL, WHITE } from '../../utils/constants.js';

export const FormContainer = ({ 
  darkMode, 
  title,
  children,
  html 
}) => {
  return html`
    <div 
      className="rounded-xl shadow-lg p-6 backdrop-blur-sm mb-8"
      style=${{
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
      }}
    >
      <h1 
        className="text-2xl font-bold mb-6 flex items-center gap-2"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >
        <span className="material-icons">edit</span>
        ${title}
      </h1>
      ${children}
    </div>
  `;
}; 
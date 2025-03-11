import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const SubmitButton = ({ 
  darkMode, 
  loading, 
  disabled, 
  html 
}) => {
  return html`
    <div className="flex justify-end mt-8">
      <button
        type="submit"
        disabled=${loading || disabled}
        className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
        style=${{
          backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
          color: WHITE,
          opacity: (loading || disabled) ? 0.7 : 1,
          cursor: (loading || disabled) ? 'not-allowed' : 'pointer'
        }}
      >
        ${loading ? html`
          <div 
            className="animate-spin rounded-full h-5 w-5 border-2" 
            style=${{ 
              borderColor: `${WHITE}`,
              borderTopColor: 'transparent'
            }}
          ></div>
          <span>Updating...</span>
        ` : html`
          <span className="material-icons">save</span>
          <span>Update Item</span>
        `}
      </button>
    </div>
  `;
}; 
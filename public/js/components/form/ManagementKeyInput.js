import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const ManagementKeyInput = ({ 
  darkMode, 
  managementKey, 
  setManagementKey, 
  onConfirm,
  html 
}) => {
  return html`
    <div 
      className="mb-6 p-4 rounded-lg"
      style=${{ 
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)',
        border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
      }}
    >
      <h3
        className="text-lg font-semibold mb-2"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >Enter Management Key</h3>
      <p
        className="mb-4"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        Please enter the management key you received when you created this listing.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value=${managementKey}
          onChange=${(e) => setManagementKey(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
          style=${{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            color: darkMode ? WHITE : DARK_TEAL,
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
          }}
          placeholder="Enter management key"
        />
        <button
          onClick=${onConfirm}
          className="px-4 py-2 rounded-lg transition-all duration-300"
          style=${{
            backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
            color: WHITE
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  `;
}; 
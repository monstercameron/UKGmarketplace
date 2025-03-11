import { DARK_TEAL, WHITE } from '../../utils/constants.js';

export const LocationSection = ({ 
  darkMode, 
  location, 
  setLocation, 
  html 
}) => {
  return html`
    <div className="mb-6">
      <label 
        className="block mb-2 text-sm font-medium"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        Location <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value=${location}
        onChange=${(e) => setLocation(e.target.value)}
        className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
        style=${{
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          color: darkMode ? WHITE : DARK_TEAL,
          border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
        }}
        placeholder="Enter location (e.g., Building 3, Floor 2)"
        required
      />
    </div>
  `;
}; 
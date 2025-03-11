import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const PriceNegotiableSection = ({ 
  darkMode, 
  price, 
  setPrice, 
  negotiable, 
  setNegotiable, 
  html 
}) => {
  return html`
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label 
          className="block mb-2 text-sm font-medium"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Price <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-medium"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
          >$</span>
          <input
            type="number"
            value=${price}
            onChange=${(e) => setPrice(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
            style=${{
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: darkMode ? WHITE : DARK_TEAL,
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
            }}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="negotiable"
          checked=${negotiable}
          onChange=${() => setNegotiable(!negotiable)}
          className="w-5 h-5 rounded"
          style=${{
            accentColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
          }}
        />
        <label
          htmlFor="negotiable"
          className="ml-2 text-sm font-medium"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Price is negotiable
        </label>
      </div>
    </div>
  `;
}; 
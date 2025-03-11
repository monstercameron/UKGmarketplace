import { DARK_TEAL, WHITE } from '../../utils/constants.js';

export const ContactInfoSection = ({ 
  darkMode, 
  email, 
  setEmail, 
  phone, 
  setPhone, 
  teamsLink, 
  setTeamsLink, 
  html 
}) => {
  return html`
    <div className="mb-6">
      <h3 
        className="text-lg font-medium mb-4"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >
        Contact Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label 
            className="block mb-2 text-sm font-medium"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value=${email}
            onChange=${(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
            style=${{
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: darkMode ? WHITE : DARK_TEAL,
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
            }}
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label 
            className="block mb-2 text-sm font-medium"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
          >
            Phone (optional)
          </label>
          <input
            type="tel"
            value=${phone}
            onChange=${(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
            style=${{
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: darkMode ? WHITE : DARK_TEAL,
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
            }}
            placeholder="Enter your phone number"
          />
        </div>
      </div>
      <div className="mt-4">
        <label 
          className="block mb-2 text-sm font-medium"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Teams Link (optional)
        </label>
        <input
          type="url"
          value=${teamsLink}
          onChange=${(e) => setTeamsLink(e.target.value)}
          className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
          style=${{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            color: darkMode ? WHITE : DARK_TEAL,
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
          }}
          placeholder="Enter Teams chat link"
        />
      </div>
    </div>
  `;
}; 
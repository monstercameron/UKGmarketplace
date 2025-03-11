import { DARK_TEAL, WHITE } from '../../utils/constants.js';

export const TitleDescriptionSection = ({ 
  darkMode, 
  title, 
  setTitle, 
  description, 
  setDescription, 
  html 
}) => {
  return html`
    <div>
      <!-- Title -->
      <div className="mb-6">
        <label 
          className="block mb-2 text-sm font-medium"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value=${title}
          onChange=${(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
          style=${{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            color: darkMode ? WHITE : DARK_TEAL,
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
          }}
          placeholder="Enter item title"
          required
        />
      </div>

      <!-- Description -->
      <div className="mb-6">
        <label 
          className="block mb-2 text-sm font-medium"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value=${description}
          onChange=${e => setDescription(e.target.value)}
          rows="4"
          className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
            color: darkMode ? WHITE : DARK_TEAL,
            minHeight: '150px'
          }}
          placeholder="Describe your item (Markdown supported)"
          required
        ></textarea>
        <p 
          className="mt-1 text-xs"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
        >
          Markdown formatting supported. You can use **bold**, *italic*, [links](url), and more.
        </p>
      </div>
    </div>
  `;
}; 
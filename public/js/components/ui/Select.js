import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const Select = ({ 
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = null,
  helperText = null,
  required = false,
  disabled = false,
  fullWidth = true,
  darkMode = false,
  html
}) => {
  const inputId = id || name;
  
  return html`
    <div className=${fullWidth ? 'w-full' : ''}>
      ${label ? html`
        <label 
          htmlFor=${inputId}
          className="block mb-1 text-sm font-medium"
          style=${{ 
            color: darkMode ? WHITE : DARK_TEAL
          }}
        >
          ${label} ${required ? html`<span className="text-red-500">*</span>` : null}
        </label>
      ` : null}
      
      <div className="relative">
        <select
          id=${inputId}
          name=${name}
          value=${value}
          onChange=${onChange}
          disabled=${disabled}
          className="w-full px-3 py-2 rounded-lg appearance-none transition-colors duration-200"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : WHITE,
            border: `1px solid ${error 
              ? '#EF4444' 
              : darkMode 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.1)'
            }`,
            color: darkMode ? WHITE : DARK_TEAL,
            ':focus': {
              borderColor: error ? '#EF4444' : LIGHT_TEAL,
              outline: 'none'
            }
          }}
        >
          <option value="" disabled>${placeholder}</option>
          ${options.map(option => html`
            <option 
              key=${option.value} 
              value=${option.value}
              style=${{ 
                backgroundColor: darkMode ? DARK_BG : WHITE,
                color: darkMode ? WHITE : DARK_TEAL
              }}
            >
              ${option.label}
            </option>
          `)}
        </select>
        
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
          style=${{ 
            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <span className="material-icons text-lg">expand_more</span>
        </div>
      </div>
      
      ${error ? html`
        <p className="mt-1 text-sm text-red-500">${error}</p>
      ` : helperText ? html`
        <p 
          className="mt-1 text-sm"
          style=${{ 
            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
          }}
        >${helperText}</p>
      ` : null}
    </div>
  `;
}; 
import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const TextField = ({ 
  id,
  name,
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error = null,
  helperText = null,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 3,
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
      
      ${multiline ? html`
        <textarea
          id=${inputId}
          name=${name}
          value=${value}
          onChange=${onChange}
          placeholder=${placeholder}
          disabled=${disabled}
          rows=${rows}
          className="w-full px-3 py-2 rounded-lg transition-colors duration-200"
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
        />
      ` : html`
        <input
          id=${inputId}
          name=${name}
          type=${type}
          value=${value}
          onChange=${onChange}
          placeholder=${placeholder}
          disabled=${disabled}
          className="w-full px-3 py-2 rounded-lg transition-colors duration-200"
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
        />
      `}
      
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
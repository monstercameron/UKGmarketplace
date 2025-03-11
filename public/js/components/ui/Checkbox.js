import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const Checkbox = ({ 
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  darkMode = false,
  html
}) => {
  const inputId = id || name;
  
  return html`
    <div className="flex items-center">
      <input
        id=${inputId}
        name=${name}
        type="checkbox"
        checked=${checked}
        onChange=${onChange}
        disabled=${disabled}
        className="w-4 h-4 rounded"
        style=${{ 
          accentColor: LIGHT_TEAL,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
      />
      ${label ? html`
        <label
          htmlFor=${inputId}
          className="ml-2 text-sm font-medium"
          style=${{ 
            color: darkMode ? WHITE : DARK_TEAL,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        >
          ${label}
        </label>
      ` : null}
    </div>
  `;
}; 
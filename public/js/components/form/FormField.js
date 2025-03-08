import { WHITE } from '../../utils/constants.js';
import { Popover } from './Popover.js';

export const FormField = ({ 
  darkMode, 
  html, 
  id, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  options = [],
  rows = 5,
  helpText = null,
  description = null,
  className = ''
}) => {
  const [showPopover, setShowPopover] = React.useState(false);

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return html`
          <div className="relative">
            <textarea
              id=${id}
              value=${value}
              onChange=${onChange}
              className="w-full px-4 py-2 rounded-lg"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)'
              }}
              rows=${rows}
              placeholder=${placeholder}
              required=${required}
              onMouseEnter=${() => setShowPopover(true)}
              onMouseLeave=${() => setShowPopover(false)}
            ></textarea>
            ${description && html`
              <${Popover}
                darkMode=${darkMode}
                html=${html}
                content=${description}
                show=${showPopover}
                position="top"
              />
            `}
          </div>
        `;
      case 'select':
        return html`
          <div className="relative">
            <select
              id=${id}
              value=${value}
              onChange=${onChange}
              className="w-full px-4 py-2 rounded-lg"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)'
              }}
              required=${required}
              onMouseEnter=${() => setShowPopover(true)}
              onMouseLeave=${() => setShowPopover(false)}
            >
              <option value="">Select an option</option>
              ${options.map(option => html`
                <option key=${option.value} value=${option.value}>${option.label}</option>
              `)}
            </select>
            ${description && html`
              <${Popover}
                darkMode=${darkMode}
                html=${html}
                content=${description}
                show=${showPopover}
                position="top"
              />
            `}
          </div>
        `;
      case 'number':
        return html`
          <div className="relative">
            <input
              id=${id}
              type=${type}
              value=${value}
              onChange=${onChange}
              className="w-full px-4 py-2 rounded-lg"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)'
              }}
              placeholder=${placeholder}
              required=${required}
              min="0"
              step="0.01"
              onMouseEnter=${() => setShowPopover(true)}
              onMouseLeave=${() => setShowPopover(false)}
            />
            ${description && html`
              <${Popover}
                darkMode=${darkMode}
                html=${html}
                content=${description}
                show=${showPopover}
                position="top"
              />
            `}
          </div>
        `;
      default:
        return html`
          <div className="relative">
            <input
              type=${type}
              id=${id}
              value=${value}
              onChange=${onChange}
              className="w-full px-4 py-2 rounded-lg"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)'
              }}
              placeholder=${placeholder}
              required=${required}
              onMouseEnter=${() => setShowPopover(true)}
              onMouseLeave=${() => setShowPopover(false)}
            />
            ${description && html`
              <${Popover}
                darkMode=${darkMode}
                html=${html}
                content=${description}
                show=${showPopover}
                position="top"
              />
            `}
          </div>
        `;
    }
  };

  return html`
    <div className=${`mb-4 ${className}`}>
      <label 
        className="block mb-2 text-sm font-medium"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
      >
        ${label} ${required && html`<span style=${{ color: '#EF4444' }}>*</span>`}
      </label>
      ${renderInput()}
      ${helpText && html`
        <p 
          className="mt-1 text-xs"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
        >${helpText}</p>
      `}
    </div>
  `;
}; 
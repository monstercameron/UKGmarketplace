import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';
import { ImageUploader } from '../ImageUploader.js';
import { Toast } from '../Toast.js';

export const SuccessScreen = ({ 
  darkMode, 
  html, 
  managementKey, 
  itemId,
  images = [],
  onImagesChange = () => {},
  onReset = () => {},
  toast = { show: false, message: '', type: 'error' },
  onToastClose = () => {}
}) => {
  const [copyFeedback, setCopyFeedback] = React.useState('');
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(managementKey);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return html`
    <div 
      className="rounded-xl shadow-lg p-8 backdrop-blur-sm fade-in-up"
      style=${{
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
      }}
    >
      ${toast.show && html`
        <${Toast}
          message=${toast.message}
          type=${toast.type}
          onClose=${onToastClose}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      
      <div className="text-center mb-6">
        <span 
          className="material-icons text-6xl mb-4"
          style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}
        >check_circle</span>
        <h2 
          className="text-2xl font-bold mb-2"
          style=${{ color: darkMode ? WHITE : DARK_TEAL }}
        >Item Listed Successfully!</h2>
        <p
          className="text-lg mb-6"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >Your item has been listed on the marketplace.</p>
        
        <div 
          className="mb-8 p-6 rounded-lg"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)',
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
          }}
        >
          <h3
            className="text-lg font-semibold mb-2"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >Management Key</h3>
          <p
            className="mb-4"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
          >
            Save this key to edit or remove your listing later. This key will not be shown again.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value=${managementKey}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                color: darkMode ? WHITE : DARK_TEAL,
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              }}
            />
            <button
              onClick=${copyToClipboard}
              className="px-4 py-2 rounded-lg transition-all duration-300"
              style=${{
                backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                color: WHITE
              }}
            >
              ${copyFeedback || 'Copy'}
            </button>
          </div>
        </div>
        
        <${ImageUploader}
          darkMode=${darkMode}
          html=${html}
          itemId=${itemId}
          managementKey=${managementKey}
          images=${images}
          onImagesChange=${onImagesChange}
        />
        
        <button
          onClick=${onReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 mx-auto mt-6"
          style=${{
            backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
            color: WHITE
          }}
        >
          <span className="material-icons">add_circle</span>
          <span>List Another Item</span>
        </button>
      </div>
    </div>
  `;
}; 
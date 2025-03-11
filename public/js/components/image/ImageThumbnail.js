import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const ImageThumbnail = ({ 
  src, 
  alt = 'Image', 
  onDelete = null, 
  onSetPrimary = null, 
  isPrimary = false, 
  isUploading = false, 
  uploadProgress = 0,
  darkMode = false,
  html
}) => {
  return html`
    <div 
      className="relative group rounded-lg overflow-hidden"
      style=${{ 
        width: '100px',
        height: '100px',
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
      }}
    >
      ${isUploading ? html`
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div 
            className="w-8 h-8 mb-2 rounded-full border-2 border-t-transparent animate-spin"
            style=${{ 
              borderColor: `${LIGHT_TEAL} transparent transparent transparent`
            }}
          ></div>
          <span 
            className="text-xs font-medium"
            style=${{ 
              color: darkMode ? WHITE : DARK_TEAL
            }}
          >${uploadProgress}%</span>
        </div>
      ` : html`
        <img 
          src=${src} 
          alt=${alt} 
          className="w-full h-full object-cover"
        />
        
        ${isPrimary ? html`
          <div 
            className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium"
            style=${{ 
              backgroundColor: LIGHT_TEAL,
              color: WHITE
            }}
          >Primary</div>
        ` : null}
        
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <div className="flex gap-1">
            ${onSetPrimary && !isPrimary ? html`
              <button
                onClick=${onSetPrimary}
                className="p-1.5 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-colors duration-200"
                title="Set as primary image"
              >
                <span className="material-icons text-sm" style=${{ color: DARK_TEAL }}>star</span>
              </button>
            ` : null}
            
            ${onDelete ? html`
              <button
                onClick=${onDelete}
                className="p-1.5 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-colors duration-200"
                title="Delete image"
              >
                <span className="material-icons text-sm" style=${{ color: '#EF4444' }}>delete</span>
              </button>
            ` : null}
          </div>
        </div>
      `}
    </div>
  `;
}; 
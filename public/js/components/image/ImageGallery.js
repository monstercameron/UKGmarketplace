import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';
import { ImageThumbnail } from './ImageThumbnail.js';

export const ImageGallery = ({ 
  images = [], 
  onDeleteImage = null, 
  onSetPrimaryImage = null, 
  uploadingImages = [], 
  darkMode = false,
  html
}) => {
  return html`
    <div className="w-full">
      ${images.length === 0 && uploadingImages.length === 0 ? html`
        <div 
          className="flex flex-col items-center justify-center p-6 rounded-lg"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <span className="material-icons text-3xl mb-2">image_not_supported</span>
          <p className="text-center">No images available</p>
        </div>
      ` : html`
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          ${images.map((image, index) => html`
            <${ImageThumbnail}
              key=${image.id || index}
              src=${image.url || image}
              alt=${`Image ${index + 1}`}
              isPrimary=${image.isPrimary || index === 0}
              onDelete=${onDeleteImage ? () => onDeleteImage(image.id || index) : null}
              onSetPrimary=${onSetPrimaryImage ? () => onSetPrimaryImage(image.id || index) : null}
              darkMode=${darkMode}
              html=${html}
            />
          `)}
          
          ${uploadingImages.map((image, index) => html`
            <${ImageThumbnail}
              key=${`uploading-${index}`}
              isUploading=${true}
              uploadProgress=${image.progress || 0}
              darkMode=${darkMode}
              html=${html}
            />
          `)}
        </div>
      `}
    </div>
  `;
}; 
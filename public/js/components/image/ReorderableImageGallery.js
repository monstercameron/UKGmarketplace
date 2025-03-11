import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';
import { ImageThumbnail } from './ImageThumbnail.js';

export const ReorderableImageGallery = ({ 
  images = [], 
  onReorder, 
  onDeleteImage = null, 
  onSetPrimaryImage = null, 
  darkMode = false,
  html
}) => {
  const [draggedImageIndex, setDraggedImageIndex] = React.useState(null);
  
  const handleDragStart = (index) => {
    setDraggedImageIndex(index);
  };
  
  const handleDragOver = (index) => {
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    
    // Create a new array with the reordered images
    const newImages = [...images];
    const draggedImage = newImages[draggedImageIndex];
    
    // Remove the dragged image from its original position
    newImages.splice(draggedImageIndex, 1);
    
    // Insert the dragged image at the new position
    newImages.splice(index, 0, draggedImage);
    
    // Update the dragged image index
    setDraggedImageIndex(index);
    
    // Call the onReorder callback with the new order
    onReorder(newImages);
  };
  
  const handleDragEnd = () => {
    setDraggedImageIndex(null);
  };
  
  return html`
    <div className="w-full">
      ${images.length === 0 ? html`
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
            <div
              key=${image.id || index}
              draggable=${true}
              onDragStart=${() => handleDragStart(index)}
              onDragOver=${(e) => {
                e.preventDefault();
                handleDragOver(index);
              }}
              onDragEnd=${handleDragEnd}
              className=${`relative cursor-move transition-transform duration-200 ${draggedImageIndex === index ? 'opacity-50 scale-95' : ''}`}
            >
              <${ImageThumbnail}
                src=${image.url || image}
                alt=${`Image ${index + 1}`}
                isPrimary=${image.isPrimary || index === 0}
                onDelete=${onDeleteImage ? () => onDeleteImage(image.id || index) : null}
                onSetPrimary=${onSetPrimaryImage ? () => onSetPrimaryImage(image.id || index) : null}
                darkMode=${darkMode}
                html=${html}
              />
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full"
                style=${{ 
                  backgroundColor: darkMode ? DARK_BG : WHITE,
                  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  color: darkMode ? WHITE : DARK_TEAL
                }}
              >
                <span className="text-xs font-medium">${index + 1}</span>
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}; 
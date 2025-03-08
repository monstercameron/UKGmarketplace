import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const ImageUploadSection = ({ 
  darkMode, 
  html, 
  uploadedFiles = [], 
  onFilesChange = () => {},
  maxImages = 8
}) => {
  // State for drag and drop reordering
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const [reorderMode, setReorderMode] = React.useState(false);
  const [imageDataUrls, setImageDataUrls] = React.useState([]);

  // Update data URLs when files change
  React.useEffect(() => {
    const generateDataUrls = async () => {
      const urls = await Promise.all(
        uploadedFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        })
      );
      setImageDataUrls(urls);
    };

    if (uploadedFiles.length > 0) {
      generateDataUrls();
    } else {
      setImageDataUrls([]);
    }
  }, [uploadedFiles]);

  // Handle file selection for the form
  const handleFileSelection = (files) => {
    // Limit to max 8 images
    const newFiles = [...uploadedFiles];
    
    for (let i = 0; i < files.length; i++) {
      if (newFiles.length >= maxImages) break;
      
      // Only add image files
      if (files[i].type.startsWith('image/')) {
        newFiles.push(files[i]);
      }
    }
    
    onFilesChange(newFiles);
  };
  
  // Handle drag events for the dropzone
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle drop event for the dropzone
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };
  
  // Remove a specific image from the selection
  const handleRemoveImage = (index) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  // Toggle reorder mode
  const toggleReorderMode = () => {
    setReorderMode(!reorderMode);
  };

  // Handle drag start for reordering
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  // Handle drag over for reordering
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Reorder the images
    const newFiles = [...uploadedFiles];
    const draggedItem = newFiles[draggedIndex];
    
    // Remove the dragged item
    newFiles.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newFiles.splice(index, 0, draggedItem);
    
    // Update the dragged index
    setDraggedIndex(index);
    
    // Update the files
    onFilesChange(newFiles);
  };

  // Handle drag end for reordering
  const handleDragEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedIndex(null);
  };

  return html`
    <div className="mb-8">
      <h3 
        className="text-lg font-medium mb-2"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >
        Images <span className="text-sm font-normal" style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>(Optional)</span>
      </h3>
      <p
        className="text-sm mb-4"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        Add up to ${maxImages} images of your item. You can also add images after creating your listing.
      </p>
      
      <div 
        className="border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200"
        style=${{
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 48, 135, 0.3)',
          borderOpacity: uploadedFiles.length > 0 ? '1' : '0.5',
          backgroundColor: uploadedFiles.length > 0 
            ? (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)') 
            : 'transparent'
        }}
        onClick=${() => !reorderMode && document.getElementById('file-input').click()}
        onDragOver=${handleDrag}
        onDragEnter=${handleDrag}
        onDragLeave=${handleDrag}
        onDrop=${handleDrop}
      >
        <input
          id="file-input"
          type="file"
          onChange=${(e) => handleFileSelection(Array.from(e.target.files))}
          accept="image/*"
          multiple
          className="hidden"
        />
        
        ${uploadedFiles.length === 0 ? html`
          <div className="flex flex-col items-center">
            <span 
              className="material-icons text-4xl mb-2"
              style=${{ 
                color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 48, 135, 0.5)'
              }}
            >
              add_photo_alternate
            </span>
            
            <p 
              className="text-sm mb-1"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
            >
              Click to select images or drag and drop
            </p>
            
            <p 
              className="text-xs"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              You can select up to ${maxImages} images
            </p>
          </div>
        ` : html`
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            ${uploadedFiles.map((file, index) => html`
              <div 
                key=${index}
                className="relative rounded-lg overflow-hidden group cursor-move"
                style=${{
                  aspectRatio: '1/1',
                  backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  transform: draggedIndex === index ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                  border: reorderMode ? `2px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}` : 'none'
                }}
                draggable=${reorderMode}
                onDragStart=${(e) => reorderMode && handleDragStart(e, index)}
                onDragOver=${(e) => reorderMode && handleDragOver(e, index)}
                onDragEnd=${(e) => reorderMode && handleDragEnd(e)}
              >
                ${imageDataUrls[index] ? html`
                  <img 
                    src=${imageDataUrls[index]}
                    alt=${file.name}
                    className="w-full h-full object-cover"
                  />
                ` : html`
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-icons animate-spin">refresh</span>
                  </div>
                `}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <button
                    type="button"
                    onClick=${(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
                    style=${{ color: WHITE }}
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </div>
                ${index === 0 && html`
                  <div 
                    className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs"
                    style=${{ 
                      backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                      color: WHITE
                    }}
                  >
                    Primary
                  </div>
                `}
              </div>
            `)}
            
            ${uploadedFiles.length < maxImages && html`
              <div 
                className="relative rounded-lg overflow-hidden flex items-center justify-center cursor-pointer"
                style=${{
                  aspectRatio: '1/1',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  border: `2px dashed ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`
                }}
                onClick=${(e) => {
                  e.stopPropagation();
                  document.getElementById('file-input').click();
                }}
              >
                <span 
                  className="material-icons text-3xl"
                  style=${{ 
                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                  }}
                >
                  add_photo_alternate
                </span>
              </div>
            `}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p 
              className="text-xs"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              ${uploadedFiles.length} of ${maxImages} images selected. The first image will be used as the primary image.
            </p>
            <div className="flex gap-2">
              ${uploadedFiles.length > 1 && html`
                <button
                  type="button"
                  onClick=${(e) => {
                    e.stopPropagation();
                    toggleReorderMode();
                  }}
                  className="text-sm flex items-center gap-1 px-3 py-1 rounded-md transition-colors duration-200"
                  style=${{ 
                    backgroundColor: reorderMode 
                      ? (darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(102, 163, 210, 0.2)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                    color: reorderMode
                      ? (darkMode ? LIGHT_TEAL : DARK_TEAL)
                      : (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                    border: `1px solid ${reorderMode 
                      ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
                      : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`
                  }}
                >
                  <span className="material-icons text-sm">${reorderMode ? 'done' : 'reorder'}</span>
                  <span>${reorderMode ? 'Done Reordering' : 'Reorder Images'}</span>
                </button>
              `}
              <button
                type="button"
                onClick=${(e) => {
                  e.stopPropagation();
                  onFilesChange([]);
                  setReorderMode(false);
                }}
                className="text-sm flex items-center gap-1 px-3 py-1 rounded-md transition-colors duration-200"
                style=${{ 
                  backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444'
                }}
              >
                <span className="material-icons text-sm">delete</span>
                <span>Clear all</span>
              </button>
            </div>
          </div>
        `}
      </div>
      
      ${reorderMode && uploadedFiles.length > 1 && html`
        <div 
          className="mt-3 p-3 rounded-md"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(102, 163, 210, 0.1)' : 'rgba(102, 163, 210, 0.1)',
            border: `1px solid ${darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(102, 163, 210, 0.2)'}`
          }}
        >
          <p 
            className="text-sm flex items-center gap-2"
            style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}
          >
            <span className="material-icons">info</span>
            <span>Drag and drop images to reorder. The first image will be used as the primary image.</span>
          </p>
        </div>
      `}
    </div>
  `;
}; 
import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const ReorderableImageGallery = ({ 
  darkMode, 
  html, 
  itemId,
  managementKey,
  initialImages = [],
  onImagesChange = () => {},
  maxImages = 8,
  disableUpload = false
}) => {
  // State for images and UI
  const [images, setImages] = React.useState(initialImages);
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const [reorderMode, setReorderMode] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [newFiles, setNewFiles] = React.useState([]);
  const [newFileDataUrls, setNewFileDataUrls] = React.useState([]);
  
  // Update data URLs when new files change
  React.useEffect(() => {
    const generateDataUrls = async () => {
      const urls = await Promise.all(
        newFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        })
      );
      setNewFileDataUrls(urls);
    };

    if (newFiles.length > 0) {
      generateDataUrls();
    } else {
      setNewFileDataUrls([]);
    }
  }, [newFiles]);

  // Handle file selection
  const handleFileSelection = (files) => {
    if (disableUpload) return; // Don't handle file selection if upload is disabled
    
    // Limit to max images
    const filesToAdd = [...newFiles];
    
    for (let i = 0; i < files.length; i++) {
      if (images.length + filesToAdd.length >= maxImages) break;
      
      // Only add image files
      if (files[i].type.startsWith('image/')) {
        filesToAdd.push(files[i]);
      }
    }
    
    setNewFiles(filesToAdd);
  };
  
  // Handle drag events for the dropzone
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle drop event for the dropzone
  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null) return;
    
    // The reordering has already been done in handleDragOver
    // Just update the server with the new order
    updateImageOrder();
    
    // Reset dragged index
    setDraggedIndex(null);
  };
  
  // Upload new images
  const handleUploadImages = async () => {
    if (disableUpload || newFiles.length === 0) return; // Don't upload if disabled
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      newFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('managementKey', managementKey);
      
      const response = await fetch(`/api/v1/images/${itemId}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload images');
      }
      
      const uploadedImagesData = await response.json();
      console.log('Uploaded images:', uploadedImagesData);
      
      // Fetch updated images
      await fetchItemImages();
      
      // Clear new files
      setNewFiles([]);
      setNewFileDataUrls([]);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };
  
  // Fetch images from the API
  const fetchItemImages = async () => {
    try {
      const response = await fetch(`/api/v1/images/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform the image data to the format needed
        if (Array.isArray(data) && data.length > 0) {
          const formattedImages = data.map(img => ({
            id: img.id,
            url: `/images/${img.hash_filename}`,
            isPrimary: img.is_primary === 1
          }));
          setImages(formattedImages);
          onImagesChange(formattedImages);
        } else {
          setImages([]);
          onImagesChange([]);
        }
      } else {
        console.error('Failed to fetch images:', response.status);
        setImages([]);
        onImagesChange([]);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setImages([]);
      onImagesChange([]);
    }
  };
  
  // Remove an image
  const handleRemoveImage = async (index, imageId) => {
    // If it's a new file (not yet uploaded)
    if (!imageId) {
      const newFilesArray = [...newFiles];
      newFilesArray.splice(index - images.length, 1);
      setNewFiles(newFilesArray);
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/items/${itemId}/images/${imageId}?managementKey=${encodeURIComponent(managementKey)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      // Fetch updated images
      await fetchItemImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.message);
    }
  };
  
  // Set an image as primary
  const handleSetPrimary = async (index, imageId) => {
    try {
      const response = await fetch(`/api/v1/items/${itemId}/images/${imageId}/primary?managementKey=${encodeURIComponent(managementKey)}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to set image as primary');
      }
      
      // Fetch updated images
      await fetchItemImages();
    } catch (err) {
      console.error('Error setting primary image:', err);
      setError(err.message);
    }
  };

  // Toggle reorder mode
  const toggleReorderMode = () => {
    setReorderMode(!reorderMode);
    // Reset dragged index when toggling reorder mode
    setDraggedIndex(null);
  };

  // Handle drag start for reordering
  const handleDragStart = (e, index) => {
    // Set the drag data for Firefox compatibility
    e.dataTransfer.setData('text/plain', index);
    // Set effectAllowed to move to indicate a move operation
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a small delay to allow the browser to render the drag image
    setTimeout(() => {
      setDraggedIndex(index);
    }, 0);
  };

  // Handle drag over for reordering
  const handleDragOver = (e, index) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.stopPropagation();
    
    // Set dropEffect to move to indicate a move operation
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Reorder the images
    const newImagesArray = [...images];
    const draggedItem = newImagesArray[draggedIndex];
    
    // Remove the dragged item
    newImagesArray.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newImagesArray.splice(index, 0, draggedItem);
    
    // Update the dragged index
    setDraggedIndex(index);
    
    // Update the images
    setImages(newImagesArray);
    onImagesChange(newImagesArray);
  };

  // Handle drag enter for visual feedback
  const handleDragEnter = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    // We don't need to do anything here, but this prevents
    // the default behavior which can interfere with dragging
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If we have a valid drag operation that ended, update the server
    if (draggedIndex !== null) {
      updateImageOrder();
    }
    
    // Reset dragged index
    setDraggedIndex(null);
  };
  
  // Update image order on the server
  const updateImageOrder = async () => {
    try {
      // Create an array of image IDs in the current order
      const imageIds = images.map(img => img.id);
      
      // Send the order to the server
      const response = await fetch(`/api/v1/items/${itemId}/images/reorder?managementKey=${encodeURIComponent(managementKey)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds })
      });
      
      if (!response.ok) {
        console.error('Failed to update image order:', response.status);
        // We don't throw an error here to avoid disrupting the user experience
        // The images will still appear in the correct order in the UI
      }
    } catch (err) {
      console.error('Error updating image order:', err);
    }
  };

  // Handle file drop for uploading
  const handleFilesDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (reorderMode || disableUpload) return; // Don't handle file drops in reorder mode or if upload is disabled
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };
  
  // Handle drag events for the dropzone
  const handleDragEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return html`
    <div className="space-y-4">
      <h3 
        className="text-lg font-semibold"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >
        ${disableUpload ? 'Item Images' : 'Upload Images'}
      </h3>
      
      ${error && html`
        <div 
          className="p-3 rounded-md mb-4"
          style=${{ backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.2)' }}
        >
          <p className="text-sm" style=${{ color: '#dc3545' }}>${error}</p>
        </div>
      `}
      
      <div className="mb-8">
        <h3 
          className="text-lg font-medium mb-2"
          style=${{ color: darkMode ? WHITE : DARK_TEAL }}
        >
          ${disableUpload ? 'Item Images' : 'Images'} 
          ${!disableUpload && html`
            <span className="text-sm font-normal" style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>(Optional)</span>
          `}
        </h3>
        
        ${!disableUpload && html`
          <p
            className="text-sm mb-4"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
          >
            Add up to ${maxImages} images of your item. The first image will be the primary image shown in listings.
          </p>
        `}
        
        ${error && html`
          <div 
            className="mb-4 p-3 rounded-lg text-sm"
            style=${{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'rgb(239, 68, 68)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            ${error}
          </div>
        `}
        
        <div 
          className=${`
            relative 
            min-h-[200px] 
            rounded-lg 
            transition-all 
            duration-300 
            ${images.length === 0 && newFiles.length === 0 ? 'flex items-center justify-center' : ''}
          `}
          style=${{
            border: '2px dashed ' + (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
            padding: images.length > 0 || newFiles.length > 0 ? '1rem' : '2rem',
            backgroundColor: 
              reorderMode 
                ? darkMode ? 'rgba(102, 163, 210, 0.1)' : 'rgba(102, 163, 210, 0.05)'
                : 'transparent'
          }}
          onClick=${(e) => {
            // Only open file picker if there are no images or we're not in reorder mode
            // and upload is not disabled
            if (!disableUpload && 
                ((images.length === 0 && newFiles.length === 0) || 
                 (!reorderMode && e.target === e.currentTarget))) {
              document.getElementById('file-input').click();
            }
          }}
          onDragOver=${handleDragEvent}
          onDragEnter=${handleDragEvent}
          onDragLeave=${handleDragEvent}
          onDrop=${handleFilesDrop}
        >
          <input
            id="file-input"
            type="file"
            onChange=${(e) => handleFileSelection(Array.from(e.target.files))}
            accept="image/*"
            multiple
            className="hidden"
          />
          
          ${images.length === 0 && newFiles.length === 0 ? html`
            <div className="flex flex-col items-center">
              <span 
                className="material-icons text-4xl mb-2"
                style=${{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 48, 135, 0.5)'
                }}
              >
                ${disableUpload ? 'photo_library' : 'add_photo_alternate'}
              </span>
              
              <p 
                className="text-sm mb-1"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
              >
                ${disableUpload ? 'No images available' : 'Click to select images or drag and drop'}
              </p>
              
              ${!disableUpload && html`
                <p 
                  className="text-xs"
                  style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                >
                  You can select up to ${maxImages} images
                </p>
              `}
            </div>
          ` : html`
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              ${images.map((image, index) => html`
                <div 
                  key=${image.id}
                  className="relative rounded-lg overflow-hidden group ${reorderMode ? 'cursor-move' : 'cursor-default'}"
                  style=${{
                    aspectRatio: '1/1',
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    opacity: draggedIndex === index ? 0.5 : 1,
                    transform: draggedIndex === index ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.2s ease-in-out',
                    border: reorderMode ? `2px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}` : 'none',
                    boxShadow: reorderMode ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  draggable=${reorderMode}
                  onDragStart=${(e) => reorderMode && handleDragStart(e, index)}
                  onDragOver=${(e) => reorderMode && handleDragOver(e, index)}
                  onDragEnter=${(e) => reorderMode && handleDragEnter(e, index)}
                  onDrop=${(e) => reorderMode && handleDrop(e, index)}
                  onDragEnd=${(e) => reorderMode && handleDragEnd(e)}
                  onClick=${(e) => {
                    // Prevent click from bubbling up to parent container
                    e.stopPropagation();
                  }}
                >
                  <img 
                    src=${image.url}
                    alt="Item image"
                    className="w-full h-full object-cover"
                    draggable="false"
                    style=${{
                      pointerEvents: reorderMode ? 'none' : 'auto' // Prevent image drag events in reorder mode
                    }}
                  />
                  
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                    style=${{
                      pointerEvents: reorderMode ? 'none' : 'auto' // Prevent interaction with overlay in reorder mode
                    }}
                  >
                    ${!reorderMode && html`
                      <div className="flex gap-2">
                        ${!image.isPrimary && html`
                          <button
                            type="button"
                            onClick=${(e) => {
                              e.stopPropagation();
                              handleSetPrimary(index, image.id);
                            }}
                            className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
                            style=${{ color: WHITE }}
                          >
                            <span className="material-icons">star</span>
                          </button>
                        `}
                        <button
                          type="button"
                          onClick=${(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index, image.id);
                          }}
                          className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
                          style=${{ color: WHITE }}
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    `}
                  </div>
                  
                  ${image.isPrimary && html`
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
                  
                  ${reorderMode && html`
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20"
                      style=${{
                        opacity: draggedIndex === index ? 0 : 0.3
                      }}
                    >
                      <span className="material-icons text-white text-2xl">drag_indicator</span>
                    </div>
                  `}
                </div>
              `)}
              
              ${newFiles.map((file, index) => html`
                <div 
                  key=${`new-${index}`}
                  className="relative rounded-lg overflow-hidden group"
                  style=${{
                    aspectRatio: '1/1',
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'
                  }}
                  onClick=${(e) => {
                    // Prevent click from bubbling up to parent container
                    e.stopPropagation();
                  }}
                >
                  ${newFileDataUrls[index] ? html`
                    <img 
                      src=${newFileDataUrls[index]}
                      alt=${file.name}
                      className="w-full h-full object-cover"
                      draggable="false"
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
                        const newFilesArray = [...newFiles];
                        newFilesArray.splice(index, 1);
                        setNewFiles(newFilesArray);
                      }}
                      className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
                      style=${{ color: WHITE }}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                  
                  <div 
                    className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs"
                    style=${{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.8)',
                      color: WHITE
                    }}
                  >
                    New
                  </div>
                </div>
              `)}
              
              ${images.length + newFiles.length < maxImages && !reorderMode && html`
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
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                  >
                    add_photo_alternate
                  </span>
                </div>
              `}
            </div>
          `}
        </div>
        
        <div className="mt-4 flex flex-wrap justify-between items-center">
          <p 
            className="text-xs"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
          >
            ${images.length + newFiles.length} of ${maxImages} images selected. The first image will be used as the primary image.
          </p>
          
          <div className="flex gap-2 mt-2 sm:mt-0">
            ${images.length > 1 && html`
              <button
                type="button"
                onClick=${toggleReorderMode}
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
            
            ${newFiles.length > 0 && !disableUpload && html`
              <button
                type="button"
                onClick=${handleUploadImages}
                disabled=${uploading}
                className="text-sm flex items-center gap-1 px-3 py-1 rounded-md transition-colors duration-200"
                style=${{
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  color: WHITE,
                  opacity: uploading ? 0.7 : 1,
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                ${uploading ? html`
                  <span className="material-icons text-sm animate-spin">refresh</span>
                  <span>Uploading...</span>
                ` : html`
                  <span className="material-icons text-sm">cloud_upload</span>
                  <span>Upload ${newFiles.length} Image${newFiles.length > 1 ? 's' : ''}</span>
                `}
              </button>
            `}
            
            ${(images.length > 0 || newFiles.length > 0) && html`
              <button
                type="button"
                onClick=${async () => {
                  // Clear all images
                  if (images.length > 0) {
                    // Confirm before deleting all images
                    if (confirm('Are you sure you want to delete all images? This cannot be undone.')) {
                      // Delete all images from the server
                      for (const image of images) {
                        await handleRemoveImage(0, image.id);
                      }
                    }
                  }
                  // Clear new files
                  setNewFiles([]);
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
            `}
          </div>
        </div>
        
        ${reorderMode && images.length > 1 && html`
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Reorder Images
            </h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick=${updateImageOrder}
                className="px-3 py-1 text-sm rounded-md"
                style=${{
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  color: WHITE
                }}
              >
                Save Order
              </button>
              <button
                type="button"
                onClick=${toggleReorderMode}
                className="px-3 py-1 text-sm rounded-md"
                style=${{
                  backgroundColor: 'transparent',
                  color: darkMode ? WHITE : DARK_TEAL,
                  border: `1px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}`
                }}
              >
                Done
              </button>
            </div>
          </div>
          
          <div 
            className="mt-3 mb-4 p-3 rounded-md"
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
    </div>
  `;
};
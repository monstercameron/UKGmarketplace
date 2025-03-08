import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../utils/constants.js';
import { Toast } from './Toast.js';

export const ImageUploader = ({ 
  darkMode, 
  html, 
  itemId = null, 
  managementKey = null,
  images = [],
  onImagesChange = () => {},
  maxImages = 8
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });
  const [reordering, setReordering] = React.useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = React.useState(null);
  
  const fileInputRef = React.useRef(null);
  
  // Handle file selection from the file input
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    await uploadFiles(files);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await uploadFiles(files);
    }
  };
  
  // Handle click on the dropzone
  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Upload files to the server
  const uploadFiles = async (files) => {
    if (!itemId || !managementKey) {
      setToast({
        show: true,
        message: 'Item must be created before uploading images',
        type: 'error'
      });
      return;
    }
    
    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      setToast({
        show: true,
        message: `Maximum ${maxImages} images allowed. You can upload ${maxImages - images.length} more.`,
        type: 'error'
      });
      return;
    }
    
    // Filter out non-image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setToast({
        show: true,
        message: 'Please select image files only',
        type: 'error'
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('managementKey', managementKey);
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // Handle response
      xhr.onload = () => {
        if (xhr.status === 201) {
          const newImages = JSON.parse(xhr.responseText);
          const updatedImages = [...images, ...newImages];
          onImagesChange(updatedImages);
          
          setToast({
            show: true,
            message: `Successfully uploaded ${newImages.length} image${newImages.length !== 1 ? 's' : ''}`,
            type: 'success'
          });
        } else {
          let errorMessage = 'Failed to upload images';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.error || errorMessage;
          } catch (e) {
            // Ignore parsing error
          }
          
          setToast({
            show: true,
            message: errorMessage,
            type: 'error'
          });
        }
        setUploading(false);
        setUploadProgress(0);
      };
      
      // Handle error
      xhr.onerror = () => {
        setToast({
          show: true,
          message: 'Network error occurred while uploading images',
          type: 'error'
        });
        setUploading(false);
        setUploadProgress(0);
      };
      
      // Send the request
      xhr.open('POST', `/api/v1/images/${itemId}`);
      xhr.send(formData);
    } catch (err) {
      console.error('Error uploading images:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Delete an image
  const handleDeleteImage = async (imageId) => {
    if (!itemId || !managementKey) {
      setToast({
        show: true,
        message: 'Cannot delete image without item ID and management key',
        type: 'error'
      });
      return;
    }
    
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/images/${itemId}/${imageId}?management_key=${encodeURIComponent(managementKey)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove the image from the list
        const updatedImages = images.filter(img => img.id !== imageId);
        onImagesChange(updatedImages);
        
        setToast({
          show: true,
          message: 'Image deleted successfully',
          type: 'success'
        });
      } else {
        let errorMessage = 'Failed to delete image';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // Ignore parsing error
        }
        
        setToast({
          show: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    }
  };
  
  // Set an image as primary
  const handleSetPrimary = async (imageId) => {
    if (!itemId || !managementKey) {
      setToast({
        show: true,
        message: 'Cannot set primary image without item ID and management key',
        type: 'error'
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/images/${itemId}/primary/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managementKey })
      });
      
      if (response.ok) {
        // Update the images list to reflect the new primary image
        const updatedImages = images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }));
        onImagesChange(updatedImages);
        
        setToast({
          show: true,
          message: 'Primary image set successfully',
          type: 'success'
        });
      } else {
        let errorMessage = 'Failed to set primary image';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // Ignore parsing error
        }
        
        setToast({
          show: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    }
  };
  
  // Toggle reordering mode
  const toggleReordering = () => {
    setReordering(!reordering);
  };
  
  // Handle drag start for reordering
  const handleDragStart = (index) => {
    setDraggedImageIndex(index);
  };
  
  // Handle drag over for reordering
  const handleDragOver = (index) => {
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    
    // Reorder the images
    const newImages = [...images];
    const draggedImage = newImages[draggedImageIndex];
    
    // Remove the dragged image
    newImages.splice(draggedImageIndex, 1);
    
    // Insert it at the new position
    newImages.splice(index, 0, draggedImage);
    
    // Update the dragged image index
    setDraggedImageIndex(index);
    
    // Update the images
    onImagesChange(newImages);
  };
  
  // Handle drag end for reordering
  const handleDragEnd = async () => {
    setDraggedImageIndex(null);
    
    // Save the new order to the server
    if (!itemId || !managementKey) return;
    
    try {
      const orderUpdates = images.map((img, index) => ({
        id: img.id,
        order: index
      }));
      
      const response = await fetch(`/api/v1/images/${itemId}/order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          managementKey,
          orderUpdates
        })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to save image order';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // Ignore parsing error
        }
        
        setToast({
          show: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error saving image order:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    }
  };
  
  return html`
    <div>
      ${toast.show && html`
        <${Toast}
          message=${toast.message}
          type=${toast.type}
          onClose=${() => setToast({ ...toast, show: false })}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="text-lg font-medium"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >
            Images (${images.length}/${maxImages})
          </h3>
          
          ${images.length > 1 && html`
            <button
              type="button"
              onClick=${toggleReordering}
              className="flex items-center gap-1 px-3 py-1 rounded-lg transition-all duration-200"
              style=${{
                backgroundColor: reordering 
                  ? (darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(102, 163, 210, 0.2)') 
                  : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)'),
                color: darkMode ? WHITE : DARK_TEAL,
                border: '1px solid ' + (reordering 
                  ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
                  : 'transparent')
              }}
            >
              <span className="material-icons text-sm">
                ${reordering ? 'done' : 'reorder'}
              </span>
              <span className="text-sm">
                ${reordering ? 'Done Reordering' : 'Reorder Images'}
              </span>
            </button>
          `}
        </div>
        
        ${images.length > 0 ? html`
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            ${images.map((image, index) => html`
              <div 
                key=${image.id || index}
                className="relative group rounded-lg overflow-hidden"
                style=${{
                  border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  aspectRatio: '1/1',
                  cursor: reordering ? 'grab' : 'default'
                }}
                draggable=${reordering}
                onDragStart=${() => reordering && handleDragStart(index)}
                onDragOver=${() => reordering && handleDragOver(index)}
                onDragEnd=${() => reordering && handleDragEnd()}
              >
                <img 
                  src=${image.url}
                  alt=${image.filename || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                ${image.is_primary && html`
                  <div 
                    className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium"
                    style=${{
                      backgroundColor: 'rgba(16, 185, 129, 0.8)',
                      color: WHITE
                    }}
                  >
                    Primary
                  </div>
                `}
                
                ${!reordering && html`
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <div className="flex gap-2">
                      ${!image.is_primary && html`
                        <button
                          type="button"
                          onClick=${() => handleSetPrimary(image.id)}
                          className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                          style=${{
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                            color: WHITE
                          }}
                          title="Set as primary image"
                        >
                          <span className="material-icons">star</span>
                        </button>
                      `}
                      
                      <button
                        type="button"
                        onClick=${() => handleDeleteImage(image.id)}
                        className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                        style=${{
                          backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          color: WHITE
                        }}
                        title="Delete image"
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </div>
                `}
                
                ${reordering && html`
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style=${{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <span 
                      className="material-icons text-4xl"
                      style=${{ color: WHITE }}
                    >drag_indicator</span>
                  </div>
                `}
              </div>
            `)}
          </div>
        ` : null}
        
        ${images.length < maxImages && !reordering && html`
          <div 
            className=${`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${dragActive ? 'border-opacity-100' : 'border-opacity-50'}`}
            style=${{
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 48, 135, 0.3)',
              backgroundColor: dragActive 
                ? (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)') 
                : 'transparent'
            }}
            onDragEnter=${handleDrag}
            onDragOver=${handleDrag}
            onDragLeave=${handleDrag}
            onDrop=${handleDrop}
            onClick=${handleDropzoneClick}
          >
            <input
              type="file"
              ref=${fileInputRef}
              onChange=${handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
              disabled=${uploading}
            />
            
            <div className="flex flex-col items-center">
              <span 
                className="material-icons text-4xl mb-2"
                style=${{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 48, 135, 0.5)'
                }}
              >
                ${uploading ? 'cloud_upload' : 'add_photo_alternate'}
              </span>
              
              ${uploading ? html`
                <div className="w-full max-w-xs mb-2">
                  <div 
                    className="w-full h-2 rounded-full overflow-hidden"
                    style=${{ backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                  >
                    <div 
                      className="h-full transition-all duration-300"
                      style=${{ 
                        width: `${uploadProgress}%`,
                        backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL
                      }}
                    ></div>
                  </div>
                  <p 
                    className="text-xs mt-1 text-center"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                  >
                    Uploading... ${uploadProgress}%
                  </p>
                </div>
              ` : html`
                <p 
                  className="text-sm mb-1"
                  style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
                >
                  Drag & drop images here or click to browse
                </p>
                <p 
                  className="text-xs"
                  style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                >
                  You can upload up to ${maxImages - images.length} more image${maxImages - images.length !== 1 ? 's' : ''}
                </p>
              `}
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}; 
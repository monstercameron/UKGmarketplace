import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';
import { DropZone } from './DropZone.js';
import { ImageGallery } from './ImageGallery.js';
import { ReorderableImageGallery } from './ReorderableImageGallery.js';
import { Button } from '../ui/Button.js';
import { Toast } from '../ui/Toast.js';

export const ImageUploader = ({ 
  darkMode = false, 
  html, 
  itemId = null, 
  managementKey = null,
  images = [],
  onImagesChange = () => {},
  maxImages = 8
}) => {
  const [uploading, setUploading] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState([]);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });
  const [reordering, setReordering] = React.useState(false);
  
  // Handle file selection from the DropZone
  const handleFilesSelected = async (files) => {
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
    
    await uploadFiles(imageFiles);
  };
  
  // Upload files to the server
  const uploadFiles = async (files) => {
    setUploading(true);
    
    // Create temporary objects for each uploading image
    const tempUploadingImages = files.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file,
      progress: 0
    }));
    
    setUploadingImages(tempUploadingImages);
    
    try {
      // Upload each file
      const uploadPromises = tempUploadingImages.map(async (tempImage, index) => {
        const formData = new FormData();
        formData.append('image', tempImage.file);
        formData.append('managementKey', managementKey);
        
        try {
          const response = await fetch(`/api/v1/images/${itemId}`, {
            method: 'POST',
            body: formData,
            // This would be used if the server supports upload progress
            // onUploadProgress: (progressEvent) => {
            //   const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            //   updateUploadProgress(tempImage.id, progress);
            // }
          });
          
          // Simulate upload progress
          const simulateProgress = () => {
            let progress = 0;
            const interval = setInterval(() => {
              progress += 10;
              updateUploadProgress(tempImage.id, progress);
              if (progress >= 100) clearInterval(interval);
            }, 200);
            
            return interval;
          };
          
          const progressInterval = simulateProgress();
          
          if (response.ok) {
            const data = await response.json();
            clearInterval(progressInterval);
            updateUploadProgress(tempImage.id, 100);
            
            // Wait a bit to show 100% before removing from uploading list
            setTimeout(() => {
              setUploadingImages(prev => prev.filter(img => img.id !== tempImage.id));
              
              // Add the new image to the images list
              const newImage = {
                id: data.id,
                url: `/images/${data.hash_filename}`,
                isPrimary: data.is_primary
              };
              
              onImagesChange([...images, newImage]);
            }, 500);
            
            return data;
          } else {
            clearInterval(progressInterval);
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }
        } catch (err) {
          setUploadingImages(prev => prev.filter(img => img.id !== tempImage.id));
          throw err;
        }
      });
      
      await Promise.all(uploadPromises);
      
      setToast({
        show: true,
        message: 'Images uploaded successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error uploading images:', err);
      setToast({
        show: true,
        message: err.message || 'Failed to upload images',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Update the progress of an uploading image
  const updateUploadProgress = (id, progress) => {
    setUploadingImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, progress } : img
      )
    );
  };
  
  // Handle deleting an image
  const handleDeleteImage = async (imageId) => {
    if (!itemId || !managementKey) {
      setToast({
        show: true,
        message: 'Cannot delete image without item ID and management key',
        type: 'error'
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/images/${itemId}/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managementKey })
      });
      
      if (response.ok) {
        // Remove the deleted image from the images list
        const updatedImages = images.filter(img => img.id !== imageId);
        onImagesChange(updatedImages);
        
        setToast({
          show: true,
          message: 'Image deleted successfully',
          type: 'success'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setToast({
        show: true,
        message: err.message || 'Failed to delete image',
        type: 'error'
      });
    }
  };
  
  // Handle setting an image as primary
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
      const response = await fetch(`/api/v1/images/${itemId}/${imageId}/primary`, {
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
          isPrimary: img.id === imageId
        }));
        
        onImagesChange(updatedImages);
        
        setToast({
          show: true,
          message: 'Primary image updated successfully',
          type: 'success'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update primary image');
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
      setToast({
        show: true,
        message: err.message || 'Failed to update primary image',
        type: 'error'
      });
    }
  };
  
  // Toggle reordering mode
  const toggleReordering = () => {
    setReordering(prev => !prev);
  };
  
  // Handle reordering images
  const handleReorderImages = async (newOrder) => {
    if (!itemId || !managementKey) {
      setToast({
        show: true,
        message: 'Cannot reorder images without item ID and management key',
        type: 'error'
      });
      return;
    }
    
    // Update the local state immediately for a responsive UI
    onImagesChange(newOrder);
    
    try {
      // Prepare the order updates
      const orderUpdates = newOrder.map((image, index) => ({
        id: image.id,
        display_order: index
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update image order');
      }
    } catch (err) {
      console.error('Error reordering images:', err);
      setToast({
        show: true,
        message: err.message || 'Failed to update image order',
        type: 'error'
      });
    }
  };
  
  // Close the toast
  const closeToast = () => {
    setToast({ ...toast, show: false });
  };
  
  return html`
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 
          className="text-lg font-semibold"
          style=${{ 
            color: darkMode ? WHITE : DARK_TEAL
          }}
        >
          Images (${images.length}/${maxImages})
        </h3>
        
        ${images.length > 1 ? html`
          <${Button}
            onClick=${toggleReordering}
            variant="secondary"
            size="sm"
            icon=${reordering ? 'check' : 'reorder'}
            darkMode=${darkMode}
            html=${html}
          >
            ${reordering ? 'Done' : 'Reorder'}
          </${Button}>
        ` : null}
      </div>
      
      ${!reordering ? html`
        <${DropZone}
          onFilesSelected=${handleFilesSelected}
          maxFiles=${maxImages}
          darkMode=${darkMode}
          html=${html}
        />
        
        <${ImageGallery}
          images=${images}
          onDeleteImage=${handleDeleteImage}
          onSetPrimaryImage=${handleSetPrimary}
          uploadingImages=${uploadingImages}
          darkMode=${darkMode}
          html=${html}
        />
      ` : html`
        <${ReorderableImageGallery}
          images=${images}
          onReorder=${handleReorderImages}
          onDeleteImage=${handleDeleteImage}
          onSetPrimaryImage=${handleSetPrimary}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      
      ${toast.show ? html`
        <${Toast}
          message=${toast.message}
          type=${toast.type}
          onClose=${closeToast}
          darkMode=${darkMode}
          html=${html}
        />
      ` : null}
    </div>
  `;
}; 
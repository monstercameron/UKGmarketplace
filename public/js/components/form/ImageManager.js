import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const ImageManager = ({ 
  darkMode, 
  html, 
  // For new items (file upload)
  uploadedFiles = [], 
  onFilesChange = () => {},
  // New prop for new files in reorder mode
  onNewFilesChange = () => {},
  // For existing items (image reordering)
  itemId = null,
  managementKey = null,
  existingImages = [],
  onImagesChange = () => {},
  // Common props
  maxImages = 8,
  mode = 'upload', // 'upload' or 'reorder'
  allowUploads = true, // Allow uploads in both modes
  showUploadButton = true // Show the upload button for new files
}) => {
  console.log(`ImageManager initialized in ${mode} mode:`, {
    uploadedFiles: uploadedFiles.length,
    existingImages: existingImages.length,
    itemId,
    managementKey: managementKey ? `${managementKey.substring(0, 5)}...` : 'none',
    allowUploads,
    showUploadButton
  });
  
  // State for drag and drop reordering
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const [imageDataUrls, setImageDataUrls] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [newFiles, setNewFiles] = React.useState([]);
  const [newFileDataUrls, setNewFileDataUrls] = React.useState([]);
  const [imagesToDelete, setImagesToDelete] = React.useState([]);
  
  // Add state for pending operations
  const [pendingImageDeletes, setPendingImageDeletes] = React.useState([]);
  const [pendingOrderChange, setPendingOrderChange] = React.useState(false);
  
  const isReorderMode = mode === 'reorder';
  const isUploadMode = mode === 'upload';
  const canUpload = allowUploads;
  
  // Update data URLs when files change (for upload mode)
  React.useEffect(() => {
    if (!isUploadMode) return;
    
    const generateDataUrls = async () => {
      try {
        const urls = await Promise.all(
          uploadedFiles.map(file => {
            // Skip undefined files
            if (!file) {
              console.warn('Skipping undefined file in generateDataUrls');
              return null;
            }
            
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = () => {
                console.error('Error reading file');
                resolve(null);
              };
              reader.readAsDataURL(file);
            });
          }).filter(Boolean) // Filter out null promises
        );
        
        // Filter out null results
        const validUrls = urls.filter(url => url !== null);
        setImageDataUrls(validUrls);
        console.log(`Generated ${validUrls.length} data URLs from ${uploadedFiles.length} files`);
      } catch (error) {
        console.error('Error generating data URLs:', error);
      }
    };

    if (uploadedFiles.length > 0) {
      generateDataUrls();
    } else {
      setImageDataUrls([]);
    }
  }, [uploadedFiles, isUploadMode]);
  
  // Generate data URLs for new files
  React.useEffect(() => {
    const generateDataUrls = async () => {
      try {
        // Clear existing data URLs first to prevent stale data
        setNewFileDataUrls([]);
        
        // Only proceed if we have files
        if (newFiles.length === 0) return;
        
        console.log('Generating data URLs for new files:', newFiles.length);
        
        const urls = await Promise.all(
          newFiles.map(file => {
            // Skip undefined files
            if (!file) {
              console.warn('Skipping undefined file in generateDataUrls for new files');
              return null;
            }
            
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = () => {
                console.error('Error reading new file');
                resolve(null);
              };
              reader.readAsDataURL(file);
            });
          }).filter(Boolean) // Filter out null promises
        );
        
        // Filter out null results
        const validUrls = urls.filter(url => url !== null);
        setNewFileDataUrls(validUrls);
        console.log(`Generated ${validUrls.length} data URLs from ${newFiles.length} new files`);
      } catch (error) {
        console.error('Error generating data URLs for new files:', error);
      }
    };

    // Always regenerate data URLs when newFiles changes
    generateDataUrls();
  }, [newFiles]);
  
  // Handle file selection
  const handleFileSelection = (files) => {
    if (!canUpload) return;
    
    // Limit to max images
    const currentCount = isUploadMode ? uploadedFiles.length : existingImages.length;
    const maxNewFiles = maxImages - currentCount;
    
    if (maxNewFiles <= 0) {
      console.log('Cannot add more files: maximum reached');
      return;
    }
    
    // Create a new array by filtering duplicates
    const newFilesToAdd = [];
    
    for (let i = 0; i < files.length; i++) {
      if (newFilesToAdd.length >= maxNewFiles) break;
      
      const file = files[i];
      
      // Only add image files
      if (!file.type.startsWith('image/')) continue;
      
      // In upload mode, we're replacing files rather than adding to them
      // In reorder mode, we need to check for duplicates
      if (isUploadMode) {
        newFilesToAdd.push(file);
      } else {
        // Check if file already exists in newFiles by comparing name and size
        const isDuplicate = newFiles.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
        );
        
        if (!isDuplicate) {
          newFilesToAdd.push(file);
        } else {
          console.log(`Skipping duplicate file: ${file.name}`);
        }
      }
    }
    
    if (newFilesToAdd.length === 0) {
      console.log('No new files to add after filtering');
      return;
    }
    
    console.log(`Adding ${newFilesToAdd.length} new files`);
    
    // In upload mode, replace newFiles entirely (and clear uploadedFiles via callback)
    // In reorder mode, add to existing newFiles
    if (isUploadMode) {
      // In upload mode, we should append to existing files, not replace them
      // Get existing files from either uploadedFiles or newFiles
      const existingFiles = uploadedFiles.length > 0 ? [...uploadedFiles] : [...newFiles];
      
      // Combine with new files
      const updatedFiles = [...existingFiles, ...newFilesToAdd];
      
      // Update the local state
      setNewFiles(newFilesToAdd); // Still only store new files in local state
      
      // Call the callback to update the parent component with combined files
      if (onFilesChange) {
        console.log('Calling onFilesChange with files:', updatedFiles.length);
        onFilesChange(updatedFiles);
      }
    } else {
      // In reorder mode, we append to existing newFiles
      const updatedFiles = [...newFiles, ...newFilesToAdd];
      setNewFiles(updatedFiles);
      
      // Call the callback to update the parent component
      if (onNewFilesChange) {
        console.log('Calling onNewFilesChange with files:', updatedFiles.length);
        onNewFilesChange(updatedFiles);
      }
    }
  };
  
  // Handle drag events for the dropzone
  const handleDragEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle file drop for uploading
  const handleFilesDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isReorderMode || !canUpload) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };
  
  // Handle drag start for reordering
  const handleDragStart = (e, index) => {
    // Log the event for debugging
    console.log('Drag start event:', e.type, { index, mode });
    
    try {
      // Set the data transfer
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'move';
      
      // Set the dragged index immediately
      setDraggedIndex(index);
      
      // Simple visual feedback
      e.currentTarget.style.opacity = '0.4';
      
      console.log('Drag start successful');
    } catch (error) {
      console.error('Error in drag start:', error);
    }
  };
  
  // Handle drag over for reordering
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set the drop effect
    e.dataTransfer.dropEffect = 'move';
    
    // Don't do anything if we're dragging over the same item or no item is being dragged
    if (draggedIndex === null || draggedIndex === index) return;
    
    console.log(`Dragging from index ${draggedIndex} to index ${index}`);
    
    // Check if we're dragging from the new files section to the existing images section
    if (draggedIndex >= existingImages.length && index < existingImages.length) {
      console.log('Dragging from new files to existing images is not supported');
      return;
    }
    
    // Determine if we're dealing with uploaded files or existing images
    if (isUploadMode) {
      // Make a deep copy of the files array
      const newFiles = [...uploadedFiles];
      
      // Get the dragged item
      const draggedItem = newFiles[draggedIndex];
      
      // Log the dragged item for debugging
      console.log('Dragged item:', draggedItem);
      
      // Only proceed if we have a valid item
      if (draggedItem) {
        // Remove the dragged item
        newFiles.splice(draggedIndex, 1);
        
        // Insert it at the new position
        newFiles.splice(index, 0, draggedItem);
        
        // Update the dragged index
        setDraggedIndex(index);
        
        // Update the files
        onFilesChange(newFiles);
        console.log('Files reordered in upload mode:', newFiles);
      } else {
        console.error('Dragged item is undefined, cannot reorder');
      }
    } else if (isReorderMode) {
      // Make a deep copy of the images array
      const newImages = [...existingImages];
      
      // Get the dragged item
      const draggedItem = newImages[draggedIndex];
      
      // Log the dragged item for debugging
      console.log('Dragged item:', draggedItem);
      
      // Only proceed if we have a valid item
      if (draggedItem) {
        // Remove the dragged item
        newImages.splice(draggedIndex, 1);
        
        // Insert it at the new position
        newImages.splice(index, 0, draggedItem);
        
        // Update the dragged index
        setDraggedIndex(index);
        
        // Update the images
        onImagesChange(newImages);
        
        // Mark that the order has changed so we know to update it on the server
        setPendingOrderChange(true);
        
        console.log('Images reordered in reorder mode:', newImages);
        console.log('Order change is now pending...');
      } else {
        console.error('Dragged item is undefined, cannot reorder');
      }
    }
  };
  
  // Handle drag enter for highlighting drop targets
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drag leave for removing highlight from drop targets
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle drag end
  const handleDragEnd = (e) => {
    // Log the event for debugging
    console.log('Drag end event:', e.type, { draggedIndex });
    
    try {
      e.preventDefault();
      e.stopPropagation();
      
      // Reset opacity
      e.currentTarget.style.opacity = '1';
      
      // Reset dragged index
      setDraggedIndex(null);
      
      // We used to update the server here with updateImageOrder(),
      // but now we just mark the change as pending and handle it during form submission
      if (isReorderMode && itemId && managementKey) {
        console.log('Image reordering complete - changes will be applied when form is saved');
      }
      
      console.log('Drag end successful');
    } catch (error) {
      console.error('Error in drag end:', error);
    }
  };
  
  // Handle removing an image
  const handleRemoveImage = (index) => {
    if (isUploadMode) {
      const newFiles = [...uploadedFiles];
      newFiles.splice(index, 1);
      onFilesChange(newFiles);
    } else if (isReorderMode) {
      // For existing items, we'll mark the image for deletion
      const imageToRemove = existingImages[index];
      
      // Make sure the image exists at this index
      if (!imageToRemove) {
        console.error('No image found at index', index);
        return;
      }
      
      if (!imageToRemove.id) {
        console.error('Image has no ID:', imageToRemove);
        return;
      }
      
      // Add to pending deletes list
      setPendingImageDeletes(prev => [...prev, imageToRemove.id]);
      
      // Remove from the visible list without calling the API yet
      const newImages = [...existingImages];
      newImages.splice(index, 1);
      onImagesChange(newImages);
      
      // Mark order as changed since we removed an image
      setPendingOrderChange(true);
      
      console.log(`Image ${imageToRemove.id} marked for deletion. Will be deleted when form is saved.`);
    }
  };
  
  // Remove an existing image from the server - now used during form submission
  const removeExistingImage = async (imageId) => {
    try {
      console.log(`Deleting image ID ${imageId} for item ${itemId}`);
      
      // The correct URL format includes both itemId and imageId
      const response = await fetch(`/api/v1/images/${itemId}/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managementKey })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.status}`);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
      return false;
    }
  };
  
  // Update image order on the server
  const updateImageOrder = async () => {
    try {
      if (existingImages.length === 0) return true;
      
      console.log('Updating image order...');
      
      // Create an array of orderUpdates objects as expected by the API
      const orderUpdates = existingImages.map((img, index) => ({
        id: img.id,
        order: index
      }));
      
      // Send the order to the server using the correct endpoint
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
        throw new Error(`Failed to update image order: ${response.status}`);
      }
      
      // Reset the pending order change flag
      setPendingOrderChange(false);
      return true;
    } catch (err) {
      console.error('Error updating image order:', err);
      setError('Failed to update image order');
      return false;
    }
  };
  
  // Apply all pending changes - to be called by parent component on form submit
  const applyPendingChanges = async () => {
    setUploading(true);
    let success = true;
    
    try {
      // Step 1: Update image order if needed
      if (pendingOrderChange) {
        const orderResult = await updateImageOrder();
        if (!orderResult) success = false;
      }
      
      // Step 2: Process deletions after order is updated
      if (pendingImageDeletes.length > 0) {
        console.log(`Processing ${pendingImageDeletes.length} pending image deletions...`);
        
        for (const imageId of pendingImageDeletes) {
          const deleteResult = await removeExistingImage(imageId);
          if (!deleteResult) success = false;
        }
        
        // Clear the pending deletes list regardless of success
        setPendingImageDeletes([]);
      }
      
      return success;
    } catch (err) {
      console.error('Error applying pending changes:', err);
      return false;
    } finally {
      setUploading(false);
    }
  };
  
  // Expose the applyPendingChanges function to the parent component
  React.useEffect(() => {
    if (isReorderMode && itemId && managementKey) {
      // Share the applyPendingChanges function with the parent
      if (typeof onImagesChange === 'function') {
        // Simple marker to prevent infinite rerenders
        if (!window._imageManagerApplyFuncSet) {
          window._imageManagerApplyFuncSet = true;
          window.applyImageChanges = applyPendingChanges;
        }
      }
    }
    
    return () => {
      // Clean up on unmount
      window._imageManagerApplyFuncSet = false;
      window.applyImageChanges = null;
    };
  }, [isReorderMode, itemId, managementKey, pendingImageDeletes.length, pendingOrderChange]);
  
  // Set an image as primary
  const handleSetPrimary = async (index) => {
    if (!isReorderMode) return;
    
    try {
      // Make sure the image exists at this index
      if (!existingImages[index]) {
        console.error('No image found at index', index);
        return;
      }
      
      const imageId = existingImages[index].id;
      
      if (!imageId) {
        console.error('Image has no ID:', existingImages[index]);
        return;
      }
      
      const response = await fetch(`/api/v1/images/${imageId}/primary?managementKey=${encodeURIComponent(managementKey)}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to set primary image');
      }
      
      // Update the existingImages array
      const newImages = existingImages.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      
      onImagesChange(newImages);
    } catch (err) {
      console.error('Error setting primary image:', err);
      setError('Failed to set primary image');
    }
  };
  
  // Upload new images
  const handleUploadImages = async () => {
    if (newFiles.length === 0 || !itemId || !managementKey) return;
    
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
  
  // Fetch images from the server
  const fetchItemImages = async () => {
    if (!itemId) return;
    
    try {
      const response = await fetch(`/api/v1/images/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched images from API:', data);
        
        // Transform the image data
        if (Array.isArray(data) && data.length > 0) {
          const formattedImages = data.map(img => ({
            id: img.id,
            url: `/images/${img.hash_filename}`,
            isPrimary: img.is_primary === 1
          }));
          console.log('Formatted images:', formattedImages);
          onImagesChange(formattedImages);
        } else {
          onImagesChange([]);
        }
      } else {
        console.error('Failed to fetch images:', response.status);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };
  
  // Determine which images to display
  const imagesToDisplay = isUploadMode ? imageDataUrls : existingImages.map(img => img.url);
  const hasImages = isUploadMode ? uploadedFiles.length > 0 : existingImages.length > 0;
  const hasNewFiles = newFiles.length > 0;
  const totalImages = (isUploadMode ? uploadedFiles.length : existingImages.length) + newFiles.length;
  
  // Initialize component and handle uploadedFiles changes
  React.useEffect(() => {
    if (!isUploadMode) return;
    
    // Only log on initial mount or when key dependencies change
    console.log(`ImageManager props updated in ${mode} mode:`, {
      uploadedFiles: uploadedFiles.length,
      existingImages: existingImages.length,
      newFiles: newFiles.length,
      hasImages: uploadedFiles.length > 0 || existingImages.length > 0,
      hasNewFiles: newFiles.length > 0,
      itemId: itemId || 'null',
      managementKey: managementKey ? `${managementKey.substring(0, 5)}...` : 'none',
      allowUploads,
      showUploadButton
    });
    
    // In upload mode, we should use either uploadedFiles or newFiles, not both
    // Only update if newFiles needs to be cleared to prevent re-render loop
    if (uploadedFiles.length > 0 && newFiles.length > 0) {
      console.log('Using uploadedFiles as source of truth, clearing newFiles');
      setNewFiles([]); // Clear newFiles to avoid duplication
    }
  // Include newFiles in dependencies to prevent continuous re-renders
  }, [isUploadMode, uploadedFiles, newFiles, mode, existingImages.length, itemId, managementKey, allowUploads, showUploadButton]);
  
  // Log when reorderMode changes - only need to run on mount and mode changes
  React.useEffect(() => {
    console.log('Reorder mode changed:', { isReorderMode, isUploadMode });
  }, [isReorderMode, isUploadMode]);
  
  // Replace constant re-render logging with a memoized log that runs only when dependencies change
  const currentState = React.useMemo(() => {
    const state = {
      draggedIndex,
      isUploadMode,
      isReorderMode,
      hasImages,
      hasNewFiles,
      imageDataUrls: imageDataUrls.length,
      newFileDataUrls: newFileDataUrls.length,
      uploadedFiles: uploadedFiles.length,
      newFiles: newFiles.length,
      existingImages: existingImages.length
    };
    
    console.log('ImageManager render state:', state);
    return state;
  }, [
    draggedIndex, 
    isUploadMode, 
    isReorderMode, 
    hasImages, 
    hasNewFiles, 
    imageDataUrls.length, 
    newFileDataUrls.length, 
    uploadedFiles.length, 
    newFiles.length, 
    existingImages.length
  ]);
  
  // Ensure draggable functionality works in all browsers - optimized to prevent re-renders
  React.useEffect(() => {
    // Skip if no images to make draggable
    if (!hasImages && !hasNewFiles) return;
    
    // Add event listeners to make sure draggable works
    const makeElementsDraggable = () => {
      const draggableElements = document.querySelectorAll('[draggable="true"]');
      
      // Skip if no elements found
      if (draggableElements.length === 0) return;
      
      draggableElements.forEach(el => {
        // Only process elements that haven't been made draggable yet
        if (el.classList.contains('draggable-item')) return;
        
        // Ensure the element has the correct attributes
        el.setAttribute('draggable', 'true');
        
        // Add a class to indicate draggability
        el.classList.add('draggable-item');
        
        // Add inline styles to ensure cursor is correct
        el.style.cursor = 'grab';
        
        console.log('Made element draggable:', el);
      });
    };
    
    // Run after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(makeElementsDraggable, 500);
    
    // Clean up timeout on unmount
    return () => clearTimeout(timeoutId);
  }, [hasImages, hasNewFiles, imagesToDisplay.length, newFileDataUrls.length]);
  
  // Handle drag over for reordering new files
  const handleNewFilesDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add a class to indicate this is a drop target
    e.currentTarget.classList.add('drop-target');
    
    // Set the drop effect
    e.dataTransfer.dropEffect = 'move';
    
    // Calculate the actual index within newFiles
    const actualIndex = index;
    
    // Don't do anything if we're dragging over the same item or no item is being dragged
    if (draggedIndex === null || draggedIndex === existingImages.length + actualIndex) return;
    
    console.log(`Dragging new file from index ${draggedIndex} to index ${existingImages.length + actualIndex}`);
    
    // Check if we're dragging from the new files section
    if (draggedIndex >= existingImages.length) {
      // We're reordering within the new files section
      const newFilesList = [...newFiles];
      
      // Calculate the indices within the newFiles array
      const fromIndex = draggedIndex - existingImages.length;
      const toIndex = index;
      
      // Get the dragged item
      const draggedItem = newFilesList[fromIndex];
      
      // Log the dragged item for debugging
      console.log('Dragged new file:', draggedItem);
      
      // Only proceed if we have a valid item
      if (draggedItem) {
        // Remove the dragged item
        newFilesList.splice(fromIndex, 1);
        
        // Insert it at the new position
        newFilesList.splice(toIndex, 0, draggedItem);
        
        // Update the dragged index
        setDraggedIndex(existingImages.length + toIndex);
        
        // Update the new files
        setNewFiles(newFilesList);
        
        // If we're in reorder mode, also mark the order as changed
        if (isReorderMode) {
          setPendingOrderChange(true);
          console.log('New files reordered, order change pending...');
        }
        
        console.log('New files reordered:', newFilesList);
      } else {
        console.error('Dragged new file is undefined, cannot reorder');
      }
    } else {
      // We're dragging from the existing images section to the new files section
      console.log('Dragging from existing images to new files is not supported');
    }
  };
  
  return html`
    <div className="mb-8">
      <style>
        .image-grid {
          min-height: 150px;
        }
      </style>
      
      <h3 
        className="text-lg font-medium mb-2"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >
        Images 
        ${isUploadMode ? html`
          <span className="text-sm font-normal" style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>(Optional)</span>
        ` : null}
      </h3>
      
      <p
        className="text-sm mb-4"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
      >
        ${isUploadMode 
          ? `Add up to ${maxImages} images of your item. The first image will be used as the primary image.`
          : `Manage your item's images. You can reorder them by dragging and dropping.`
        }
      </p>
      
      ${error && html`
        <div 
          className="mt-3 p-3 rounded-md"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}
        >
          <p 
            className="text-sm"
            style=${{ color: '#EF4444' }}
          >
            ${error}
          </p>
        </div>
      `}
      
      <div 
        className="border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer"
        style=${{
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 48, 135, 0.3)',
          borderOpacity: hasImages || hasNewFiles ? '1' : '0.5',
          backgroundColor: 
            isReorderMode 
              ? darkMode ? 'rgba(102, 163, 210, 0.1)' : 'rgba(102, 163, 210, 0.05)'
              : 'transparent',
          padding: hasImages || hasNewFiles ? '1rem' : '2rem',
        }}
        onClick=${(e) => {
          // Only open file picker if clicking directly on the container (not on images)
          if (e.target === e.currentTarget && canUpload) {
            document.getElementById('file-input').click();
          }
        }}
        onDragOver=${handleDragEvent}
        onDragEnter=${handleDragEvent}
        onDragLeave=${handleDragEvent}
        onDrop=${handleFilesDrop}
      >
        ${canUpload ? html`
          <input
            id="file-input"
            type="file"
            onChange=${(e) => { handleFileSelection(Array.from(e.target.files)); e.target.value = ''; }}
            accept="image/*"
            multiple
            className="hidden"
          />
        ` : null}
        
        ${!hasImages && !hasNewFiles ? html`
          <div className="flex flex-col items-center">
            <span 
              className="material-icons text-4xl mb-2"
              style=${{ 
                color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 48, 135, 0.5)'
              }}
            >
              ${canUpload ? 'add_photo_alternate' : 'photo_library'}
            </span>
            
            <p 
              className="text-sm mb-1"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
            >
              ${canUpload 
                ? 'Click to select images or drag and drop' 
                : 'No images available'
              }
            </p>
            
            ${canUpload ? html`
              <p 
                className="text-xs"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
              >
                You can select up to ${maxImages} images
              </p>
            ` : null}
          </div>
        ` : html`
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 image-grid">
            ${imagesToDisplay.map((src, index) => {
              // Determine if this is a primary image based on the mode
              const isPrimary = isReorderMode 
                ? (existingImages[index] && existingImages[index].isPrimary) 
                : index === 0;
              
              return html`
                <div 
                  key=${index}
                  className="relative rounded-lg overflow-hidden group hover:shadow-lg"
                  style=${{
                    aspectRatio: '1/1',
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    opacity: draggedIndex === index ? 0.5 : 1,
                    transform: draggedIndex === index ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.2s ease-in-out',
                    border: draggedIndex === index ? `2px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}` : '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    cursor: 'grab'
                  }}
                  draggable="true"
                  onDragStart=${(e) => handleDragStart(e, index)}
                  onDragOver=${(e) => handleDragOver(e, index)}
                  onDragEnd=${(e) => handleDragEnd(e)}
                  onDragEnter=${(e) => e.preventDefault()}
                  onDrop=${(e) => e.preventDefault()}
                  onClick=${(e) => e.stopPropagation()}
                >
                  <img 
                    src=${src} 
                    alt="Item image" 
                    className="w-full h-full object-cover"
                    style=${{ pointerEvents: 'none' }}
                    draggable={false}
                  />
                  
                  <!-- Drag indicator in the corner -->
                  <div 
                    className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1.5 shadow-md"
                    style=${{ 
                      color: darkMode ? DARK_TEAL : DARK_TEAL,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <span className="material-icons">drag_indicator</span>
                  </div>
                  
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center"
                  >
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      ${isReorderMode ? html`
                        <button
                          type="button"
                          onClick=${(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="p-1 rounded-full bg-white text-gray-800 hover:bg-gray-200 transition-colors duration-200"
                          title="Remove image"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick=${(e) => {
                            e.stopPropagation();
                            handleSetPrimary(index);
                          }}
                          className="p-1 rounded-full bg-white text-gray-800 hover:bg-gray-200 transition-colors duration-200"
                          title="Set as primary image"
                          disabled=${isPrimary}
                          style=${{ opacity: isPrimary ? 0.5 : 1 }}
                        >
                          <span className="material-icons text-sm">star</span>
                        </button>
                      ` : null}
                    </div>
                  </div>
                  
                  ${isPrimary ? html`
                    <div 
                      className="absolute top-1 left-1 bg-white bg-opacity-80 rounded-full p-0.5"
                      title="Primary image"
                    >
                      <span className="material-icons text-sm" style=${{ color: DARK_TEAL }}>star</span>
                    </div>
                  ` : null}
                </div>
              `;
            })}
            
            ${hasNewFiles ? newFileDataUrls.map((src, index) => html`
              <div 
                key=${`new-${index}`}
                className="relative rounded-lg overflow-hidden group hover:shadow-lg"
                style=${{
                  aspectRatio: '1/1',
                  backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                  opacity: draggedIndex === (existingImages.length + index) ? 0.5 : 1,
                  transform: draggedIndex === (existingImages.length + index) ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                  border: draggedIndex === (existingImages.length + index) ? `2px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}` : '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  cursor: 'grab'
                }}
                draggable="true"
                onDragStart=${(e) => handleDragStart(e, existingImages.length + index)}
                onDragOver=${(e) => handleNewFilesDragOver(e, index)}
                onDragEnd=${(e) => handleDragEnd(e)}
                onDragEnter=${(e) => e.preventDefault()}
                onDrop=${(e) => e.preventDefault()}
                onClick=${(e) => e.stopPropagation()}
              >
                <img 
                  src=${src}
                  alt="New image"
                  className="w-full h-full object-cover"
                  style=${{ pointerEvents: 'none' }}
                  draggable={false}
                />
                
                <!-- Drag indicator in the corner -->
                <div 
                  className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1.5 shadow-md"
                  style=${{ 
                    color: darkMode ? DARK_TEAL : DARK_TEAL,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <span className="material-icons">drag_indicator</span>
                </div>
                
                <!-- New indicator -->
                <div 
                  className="absolute top-2 left-2 bg-white rounded-full p-1"
                  style=${{ 
                    color: darkMode ? DARK_TEAL : DARK_TEAL,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="material-icons text-sm">new_releases</span>
                </div>
                
                <!-- Delete button overlay -->
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center"
                >
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick=${(e) => {
                        e.stopPropagation();
                        const newFilesList = [...newFiles];
                        newFilesList.splice(index, 1);
                        setNewFiles(newFilesList);
                      }}
                      className="p-1 rounded-full bg-white text-gray-800 hover:bg-gray-200 transition-colors duration-200"
                      title="Remove image"
                    >
                      <span className="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            `) : null}
            
            ${canUpload && totalImages < maxImages ? html`
              <div 
                className="relative rounded-md overflow-hidden flex items-center justify-center cursor-pointer"
                style=${{
                  aspectRatio: '1/1',
                  border: `2px dashed ${darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }}
                onClick=${(e) => {
                  e.stopPropagation();
                  document.getElementById('file-input').click();
                }}
              >
                <div className="flex flex-col items-center">
                  <span 
                    className="material-icons text-3xl mb-1"
                    style=${{ 
                      color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 48, 135, 0.5)'
                    }}
                  >
                    add_photo_alternate
                  </span>
                  <p 
                    className="text-xs"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
                  >
                    Add more
                  </p>
                </div>
              </div>
            ` : null}
          </div>
        `}
      </div>
      
      ${hasImages || hasNewFiles ? html`
        <div className="mt-4 flex justify-between items-center">
          <p 
            className="text-xs"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
          >
            ${isUploadMode 
              ? `${uploadedFiles.length} of ${maxImages} images selected. The first image will be used as the primary image.`
              : `${existingImages.length} images. The first image will be used as the primary image.`
            }
            ${hasNewFiles ? ` (${newFiles.length} new)` : ''}
          </p>
          <div className="flex gap-2">
            ${hasNewFiles && isReorderMode && showUploadButton ? html`
              <button
                type="button"
                onClick=${(e) => {
                  e.stopPropagation();
                  handleUploadImages();
                }}
                disabled=${uploading}
                className="text-sm flex items-center gap-1 px-3 py-1 rounded-md transition-colors duration-200"
                style=${{ 
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  color: WHITE,
                  opacity: uploading ? 0.7 : 1
                }}
              >
                ${uploading ? html`
                  <span className="material-icons text-sm animate-spin">refresh</span>
                  <span>Uploading...</span>
                ` : html`
                  <span className="material-icons text-sm">cloud_upload</span>
                  <span>Upload New Images</span>
                `}
              </button>
            ` : null}
          </div>
        </div>
      ` : null}
      
      ${isReorderMode && (uploadedFiles.length > 1 || existingImages.length > 1) ? html`
        <div 
          className="mt-3 p-3 rounded-md"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(102, 163, 210, 0.1)' : 'rgba(102, 163, 210, 0.1)',
            border: `1px solid ${darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(102, 163, 210, 0.2)'}`
          }}
        >
          <p 
            className="text-sm"
            style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}
          >
            Drag and drop images to reorder them. The first image will be used as the primary image.
          </p>
        </div>
      ` : null}
    </div>
  `;
}; 
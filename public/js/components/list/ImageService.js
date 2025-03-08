// Service for fetching and managing item images
export const useImageService = (React) => {
  const [itemImages, setItemImages] = React.useState({});
  
  // Function to fetch images for an item
  const fetchItemImage = async (itemId) => {
    // Skip if we already have images for this item
    if (itemImages[itemId] !== undefined) return itemImages[itemId];
    
    try {
      const response = await fetch(`/api/v1/images/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          // Store the first image URL (primary image)
          const imageUrl = `/images/${data[0].hash_filename}`;
          setItemImages(prev => ({
            ...prev,
            [itemId]: imageUrl
          }));
          return imageUrl;
        } else {
          // No images found, set to null to indicate we've checked
          setItemImages(prev => ({
            ...prev,
            [itemId]: null
          }));
          return null;
        }
      } else {
        console.error(`Failed to fetch images for item ${itemId}:`, response.status);
        setItemImages(prev => ({
          ...prev,
          [itemId]: null
        }));
        return null;
      }
    } catch (err) {
      console.error(`Error fetching images for item ${itemId}:`, err);
      setItemImages(prev => ({
        ...prev,
        [itemId]: null
      }));
      return null;
    }
  };
  
  // Function to fetch images for multiple items
  const fetchItemImages = async (itemIds) => {
    if (!itemIds || itemIds.length === 0) return;
    
    // Filter out items we already have images for
    const itemsToFetch = itemIds.filter(id => itemImages[id] === undefined);
    
    // Fetch images for each item
    await Promise.all(itemsToFetch.map(fetchItemImage));
  };
  
  // Function to fetch images for an item and return all image URLs directly
  const fetchItemImagesDirectly = async (itemId) => {
    try {
      const response = await fetch(`/api/v1/images/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          // Return all image URLs
          return data.map(img => `/images/${img.hash_filename}`);
        }
      }
      
      // Return empty array if no images or error
      return [];
    } catch (err) {
      console.error(`Error fetching images for item ${itemId}:`, err);
      return [];
    }
  };
  
  // Function to get an image URL for an item
  const getItemImageUrl = (itemId) => {
    return itemImages[itemId];
  };
  
  // Function to clear image cache
  const clearImageCache = () => {
    setItemImages({});
  };
  
  return {
    itemImages,
    fetchItemImage,
    fetchItemImages,
    fetchItemImagesDirectly,
    getItemImageUrl,
    clearImageCache
  };
}; 
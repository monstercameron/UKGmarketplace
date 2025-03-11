import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG, PAYMENT_METHODS, SHIPPING_OPTIONS } from '../utils/constants.js';
import { Toast } from './Toast.js';
import { ImageManager } from './form/ImageManager.js';
import { ConditionSelectionSection } from './form/ConditionSelectionSection.js';
import { CategorySelectionSection } from './form/CategorySelectionSection.js';
import { PaymentMethodsSection } from './form/PaymentMethodsSection.js';
import { ShippingOptionsSection } from './form/ShippingOptionsSection.js';
import { FormHeader } from './form/FormHeader.js';
import { FormContainer } from './form/FormContainer.js';
import { ManagementKeyInput } from './form/ManagementKeyInput.js';
import { TitleDescriptionSection } from './form/TitleDescriptionSection.js';
import { PriceNegotiableSection } from './form/PriceNegotiableSection.js';
import { LocationSection } from './form/LocationSection.js';
import { ContactInfoSection } from './form/ContactInfoSection.js';
import { SubmitButton } from './form/SubmitButton.js';
import { LoadingSpinner } from './form/LoadingSpinner.js';

export const EditItemForm = ({ item, managementKey: initialManagementKey, darkMode, onBack, html }) => {
  // Form state initialized with item data
  const [title, setTitle] = React.useState(item?.title || '');
  const [description, setDescription] = React.useState(item?.description || '');
  const [price, setPrice] = React.useState(item?.price || '');
  const [condition, setCondition] = React.useState(item?.condition || 'new');
  const [location, setLocation] = React.useState(item?.location || '');
  const [categoryId, setCategoryId] = React.useState(item?.category_id ? String(item?.category_id) : '');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = React.useState({
    cash: item?.paymentMethods?.includes('cash') ?? true,
    apple_cash: item?.paymentMethods?.includes('apple_cash') ?? false,
    cash_app: item?.paymentMethods?.includes('cash_app') ?? false,
    zelle: item?.paymentMethods?.includes('zelle') ?? false,
    venmo: item?.paymentMethods?.includes('venmo') ?? false,
    paypal: item?.paymentMethods?.includes('paypal') ?? false,
    other: item?.paymentMethods?.includes('other') ?? false
  });
  const [selectedShippingOptions, setSelectedShippingOptions] = React.useState({
    local: item?.shipping?.includes('local') ?? true,
    office: item?.shipping?.includes('office') ?? false,
    anywhere: item?.shipping?.includes('anywhere') ?? false
  });
  const [negotiable, setNegotiable] = React.useState(item?.negotiable || false);
  const [email, setEmail] = React.useState(item?.email || '');
  const [phone, setPhone] = React.useState(item?.phone || '');
  const [teamsLink, setTeamsLink] = React.useState(item?.teams_link || '');
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });
  const [copyFeedback, setCopyFeedback] = React.useState('');
  const [managementKey, setManagementKey] = React.useState(initialManagementKey || '');
  const [showManagementKeyInput, setShowManagementKeyInput] = React.useState(!initialManagementKey);
  const [itemImages, setItemImages] = React.useState([]);
  const [newFiles, setNewFiles] = React.useState([]);
  const [loadingImages, setLoadingImages] = React.useState(true);

  // Default categories to use as fallback
  const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Computers & Laptops', slug: 'computers-laptops' },
    { id: 2, name: 'Smartphones', slug: 'smartphones' },
    { id: 3, name: 'TVs & Monitors', slug: 'tvs-monitors' },
    { id: 4, name: 'Audio Equipment', slug: 'audio-equipment' },
    { id: 5, name: 'Gaming', slug: 'gaming' },
    { id: 6, name: 'Furniture', slug: 'furniture' },
    { id: 7, name: 'Home Appliances', slug: 'home-appliances' },
    { id: 8, name: 'Housing Rentals', slug: 'housing-rentals' },
    { id: 9, name: 'Cars & Trucks', slug: 'cars-trucks' },
    { id: 10, name: 'Clothing & Apparel', slug: 'clothing' },
    { id: 11, name: 'Books & Magazines', slug: 'books' },
    { id: 12, name: 'Sports Equipment', slug: 'sports-equipment' },
    { id: 13, name: 'Event Tickets', slug: 'event-tickets' },
    { id: 14, name: 'Other', slug: 'other' }
  ];

  // Add keyframe animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInLeft {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideInRight {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeInUp {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .slide-in-left {
        animation: slideInLeft 0.3s ease-out forwards;
      }
      .slide-in-right {
        animation: slideInRight 0.3s ease-out forwards;
      }
      .fade-in-up {
        animation: fadeInUp 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch categories on component mount
  React.useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch images for the item when component mounts
  React.useEffect(() => {
    if (item) {
      fetchItemImages(item.id);
    }
  }, [item]);
  
  // Add debugging for props
  React.useEffect(() => {
    console.log('EditItemForm props:', { 
      itemId: item?.id, 
      managementKey: initialManagementKey ? `${initialManagementKey.substring(0, 5)}...` : 'none'
    });
  }, [item, initialManagementKey]);

  const fetchCategories = async () => {
    try {
      // Try to get categories from cache first
      const cachedCategories = localStorage.getItem('cached_categories');
      const cacheExpiry = localStorage.getItem('categories_cache_expiry');
      
      if (cachedCategories && cacheExpiry) {
        // Check if cache is still valid
        if (Date.now() < Number(cacheExpiry)) {
          const parsedCategories = JSON.parse(cachedCategories);
          setCategories(parsedCategories);
          return;
        }
      }

      // Set up fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch('/api/v1/categories', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        
        // Cache the categories
        localStorage.setItem('cached_categories', JSON.stringify(data));
        localStorage.setItem('categories_cache_expiry', String(Date.now() + (24 * 60 * 60 * 1000))); // 24 hours
        
        setCategories(data);
      } catch (apiError) {
        console.error('Error fetching categories from API:', apiError);
        
        // Use default categories as fallback
        setCategories(DEFAULT_CATEGORIES);
        
        // Cache the default categories with a shorter expiry (4 hours)
        localStorage.setItem('cached_categories', JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem('categories_cache_expiry', String(Date.now() + (4 * 60 * 60 * 1000)));
        
        setToast({
          show: true,
          message: 'Could not connect to the server. Using default categories.',
          type: 'warning'
        });
      }
    } catch (err) {
      console.error('Unexpected error in fetchCategories:', err);
      setToast({
        show: true,
        message: 'Failed to load categories. Please try again later.',
        type: 'error'
      });
    }
  };

  // Function to fetch images from the API
  const fetchItemImages = async (itemId) => {
    if (!itemId) return;
    
    console.log('Fetching images for item:', itemId);
    setLoadingImages(true);
    try {
      const response = await fetch(`/api/v1/images/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched images from API:', data);
        
        // Transform the image data to the format needed by ImageManager
        if (Array.isArray(data) && data.length > 0) {
          const formattedImages = data.map(img => ({
            id: img.id,
            url: `/images/${img.hash_filename}`,
            isPrimary: img.is_primary === 1
          }));
          console.log('Formatted images for ImageManager:', formattedImages);
          setItemImages(formattedImages);
        } else {
          console.log('No images found for item');
          setItemImages([]);
        }
      } else {
        console.error('Failed to fetch images:', response.status);
        setItemImages([]);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setItemImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  // Handle images change from the ImageManager component
  const handleImagesChange = (newImages, deleteImagesFunc) => {
    setItemImages(newImages);
    
    // Store the deleteImages function if provided
    if (deleteImagesFunc && typeof deleteImagesFunc === 'function') {
      window.deleteMarkedImages = deleteImagesFunc;
    }
  };

  const handlePaymentMethodToggle = (method) => {
    setSelectedPaymentMethods(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  const handleShippingOptionToggle = (option) => {
    setSelectedShippingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const uploadFiles = async (itemId, managementKey, files) => {
    if (!itemId || !managementKey) {
      setToast({
        show: true,
        message: 'Cannot upload images: Missing item ID or management key',
        type: 'error'
      });
      return;
    }
    if (files.length === 0) return;
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('managementKey', managementKey);
      setToast({ show: true, message: `Uploading ${files.length} image(s)...`, type: 'info' });
      const uploadUrl = `/api/v1/images/${item.id}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const uploadedImages = await response.json();
        setToast({ show: true, message: `Successfully uploaded ${Array.isArray(uploadedImages) ? uploadedImages.length : 0} image(s)`, type: 'success' });
      } else {
        const errorData = await response.json();
        setToast({ show: true, message: errorData.error || 'Failed to upload images', type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: `Error uploading images: ${err.message}`, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Get the list of selected payment methods
      const paymentMethods = Object.entries(selectedPaymentMethods)
        .filter(([_, selected]) => selected)
        .map(([method]) => method);
      
      // Get the list of selected shipping options
      const shippingOptions = Object.entries(selectedShippingOptions)
        .filter(([_, selected]) => selected)
        .map(([option]) => option);
      
      // Build the request body
      const data = {
        title,
        description,
        price: parseFloat(price),
        category_id: parseInt(categoryId, 10) || null,
        location,
        condition,
        negotiable,
        paymentMethods,
        shipping: shippingOptions,
        managementKey,
        email,
        phone,
        teamsLink: teamsLink
      };
      
      // STEP 1: First apply any pending image changes (order updates and deletions)
      // This must happen BEFORE updating the item, as it may change the image list
      let imageSuccess = true;
      if (window.applyImageChanges && typeof window.applyImageChanges === 'function') {
        try {
          setToast({
            show: true,
            message: 'Updating image order and processing deletions...',
            type: 'info'
          });
          
          imageSuccess = await window.applyImageChanges();
          if (!imageSuccess) {
            console.warn('Some image operations failed, but continuing with item update');
          }
        } catch (imageError) {
          console.error('Error applying image changes:', imageError);
          imageSuccess = false;
        }
      }
      
      // STEP 2: Update the item data
      setToast({
        show: true,
        message: 'Saving item changes...',
        type: 'info'
      });
      
      const response = await fetch(`/api/v1/items/${item.id}?managementKey=${encodeURIComponent(managementKey)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update item');
      }
      
      // STEP 3: Upload any new images
      if (newFiles.length > 0) {
        try {
          setToast({
            show: true,
            message: `Now uploading ${newFiles.length} new image(s)...`,
            type: 'info'
          });
          await uploadFiles(item.id, managementKey, newFiles);
        } catch (uploadError) {
          console.error('Error uploading new images:', uploadError);
          setToast({
            show: true,
            message: `Error uploading new images: ${uploadError.message}`,
            type: 'error'
          });
        }
      }
      
      // Show a success message that includes info about any image failures
      setToast({
        show: true,
        message: imageSuccess 
          ? 'Item updated successfully!' 
          : 'Item updated, but some image operations failed.',
        type: imageSuccess ? 'success' : 'warning'
      });
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
      }, 2000);
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message || 'Failed to update item');
      setToast({
        show: true,
        message: `Error: ${err.message || 'Failed to update item'}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to handle copying management key to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(managementKey);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000); // Clear feedback after 2 seconds
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  // If item is not loaded, show a loading state
  if (!item) {
    return html`
      <div className="max-w-3xl mx-auto pb-16">
        <${FormHeader} 
          darkMode=${darkMode} 
          onBack=${onBack} 
          html=${html} 
        />
        
        <div className="flex justify-center p-8">
          <${LoadingSpinner} 
            darkMode=${darkMode} 
            size="large" 
            html=${html} 
          />
        </div>
      </div>
    `;
  }

  return html`
    <div className="max-w-3xl mx-auto pb-16">
      ${toast.show && html`
        <${Toast}
          message=${toast.message}
          type=${toast.type}
          onClose=${() => setToast({ ...toast, show: false })}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      
      <${FormHeader} 
        darkMode=${darkMode} 
        onBack=${onBack} 
        html=${html} 
      />

      <${FormContainer} 
        darkMode=${darkMode} 
        title="Edit Item" 
        html=${html}
      >
        ${showManagementKeyInput && html`
          <${ManagementKeyInput}
            darkMode=${darkMode}
            managementKey=${managementKey}
            setManagementKey=${setManagementKey}
            onConfirm=${() => setShowManagementKeyInput(false)}
            html=${html}
          />
        `}

        <form onSubmit=${handleSubmit}>
          <${TitleDescriptionSection}
            darkMode=${darkMode}
            title=${title}
            setTitle=${setTitle}
            description=${description}
            setDescription=${setDescription}
            html=${html}
          />
          
          <!-- Images -->
          ${loadingImages ? html`
            <div className="mb-6">
              <${LoadingSpinner} 
                darkMode=${darkMode} 
                html=${html} 
              />
            </div>
          ` : html`
            <div className="form-section form-section-2 mb-6">
              <${ImageManager}
                darkMode=${darkMode}
                html=${html}
                itemId=${item.id}
                managementKey=${managementKey}
                existingImages=${itemImages}
                onImagesChange=${handleImagesChange}
                onNewFilesChange=${setNewFiles}
                maxImages=${8}
                mode="reorder"
                allowUploads=${true}
                showUploadButton=${false}
              />
            </div>
          `}

          <${PriceNegotiableSection}
            darkMode=${darkMode}
            price=${price}
            setPrice=${setPrice}
            negotiable=${negotiable}
            setNegotiable=${setNegotiable}
            html=${html}
          />

          <!-- Condition and Category -->
          <div className="grid grid-cols-1 gap-6 mb-6">
            <${ConditionSelectionSection}
              darkMode=${darkMode}
              html=${html}
              selectedCondition=${condition}
              onConditionSelect=${(value) => setCondition(value)}
            />
            
            <${CategorySelectionSection}
              darkMode=${darkMode}
              html=${html}
              categories=${categories}
              selectedCategoryId=${categoryId}
              onCategorySelect=${(id) => setCategoryId(String(id))}
            />
          </div>

          <${LocationSection}
            darkMode=${darkMode}
            location=${location}
            setLocation=${setLocation}
            html=${html}
          />

          <${ContactInfoSection}
            darkMode=${darkMode}
            email=${email}
            setEmail=${setEmail}
            phone=${phone}
            setPhone=${setPhone}
            teamsLink=${teamsLink}
            setTeamsLink=${setTeamsLink}
            html=${html}
          />

          <${PaymentMethodsSection}
            darkMode=${darkMode}
            html=${html}
            selectedMethods=${selectedPaymentMethods}
            onMethodToggle=${handlePaymentMethodToggle}
          />

          <${ShippingOptionsSection}
            darkMode=${darkMode}
            html=${html}
            selectedOptions=${selectedShippingOptions}
            onOptionToggle=${handleShippingOptionToggle}
          />

          <${SubmitButton}
            darkMode=${darkMode}
            loading=${loading}
            disabled=${showManagementKeyInput}
            html=${html}
          />
        </form>
      </${FormContainer}>
    </div>
  `;
}; 
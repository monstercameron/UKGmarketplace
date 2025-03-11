import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG, PAYMENT_METHODS, SHIPPING_OPTIONS } from '../utils/constants.js';
import { Toast } from './Toast.js';
import { Breadcrumbs } from './Breadcrumbs.js';
import { ImageManager } from './form/ImageManager.js';
import { ConditionSelectionSection } from './form/ConditionSelectionSection.js';
import { CategorySelectionSection } from './form/CategorySelectionSection.js';
import { PaymentMethodsSection } from './form/PaymentMethodsSection.js';
import { ShippingOptionsSection } from './form/ShippingOptionsSection.js';

export const EditItemForm = ({ item, managementKey: initialManagementKey, darkMode, onBack, html }) => {
  // Form state initialized with item data
  const [title, setTitle] = React.useState(item?.title || '');
  const [description, setDescription] = React.useState(item?.description || '');
  const [price, setPrice] = React.useState(item?.price || '');
  const [condition, setCondition] = React.useState(item?.condition || 'new');
  const [location, setLocation] = React.useState(item?.location || '');
  const [categoryId, setCategoryId] = React.useState(item?.category_id || '');
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

    fetchCategories();
  }, []);

  // Fetch images for the item when component mounts
  React.useEffect(() => {
    if (item) {
      fetchItemImages(item.id);
    }
  }, [item]);
  
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
  const handleImagesChange = (newImages) => {
    console.log('Images changed in EditItemForm:', newImages);
    setItemImages(newImages);
    
    // No need to update the server here as the ImageManager component
    // already handles updating the image order on the server via its updateImageOrder function
  };

  // Add debugging for props
  React.useEffect(() => {
    console.log('EditItemForm props:', { 
      itemId: item?.id, 
      managementKey: initialManagementKey ? `${initialManagementKey.substring(0, 5)}...` : 'none'
    });
  }, [item, initialManagementKey]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Debug the form submission
    console.log('Submitting form with management key:', managementKey ? `${managementKey.substring(0, 5)}...` : 'none');

    // Validate form
    if (!title || !description || !price || !condition || !location || !categoryId || !email) {
      setToast({
        show: true,
        message: 'Please fill in all required fields',
        type: 'error'
      });
      setLoading(false);
      return;
    }

    // Validate management key
    if (!managementKey) {
      setToast({
        show: true,
        message: 'Management key is required',
        type: 'error'
      });
      setLoading(false);
      return;
    }

    // Convert selected payment methods to array of keys
    const paymentMethodsArray = Object.entries(selectedPaymentMethods)
      .filter(([_, selected]) => selected)
      .map(([method]) => method);

    if (paymentMethodsArray.length === 0) {
      setToast({
        show: true,
        message: 'Please select at least one payment method',
        type: 'error'
      });
      setLoading(false);
      return;
    }

    // Convert selected shipping options to array of keys
    const shippingOptionsArray = Object.entries(selectedShippingOptions)
      .filter(([_, selected]) => selected)
      .map(([option]) => option);

    if (shippingOptionsArray.length === 0) {
      setToast({
        show: true,
        message: 'Please select at least one shipping option',
        type: 'error'
      });
      setLoading(false);
      return;
    }

    try {
      const itemId = item?.id || window.location.hash.substring(1).split('/').pop();
      
      if (!itemId) {
        throw new Error('Item ID not found');
      }

      // Create the request payload with the correct field names
      const requestPayload = {
        managementKey: managementKey,
        title,
        description,
        price: parseFloat(price),
        condition,
        location,
        categoryId: parseInt(categoryId),
        shipping: shippingOptionsArray,
        paymentMethods: paymentMethodsArray,
        negotiable,
        email,
        phone: phone || null,
        teamsLink: teamsLink || null
      };

      console.log('Sending update request for item ID:', itemId);

      const response = await fetch(`/api/v1/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', responseData);
        throw new Error(responseData.error || 'Failed to update item');
      }

      console.log('Update successful:', responseData);
      
      // Ensure image order is saved
      if (itemImages.length > 0) {
        try {
          // Create an array of image IDs in the current order
          const imageIds = itemImages.map(img => img.id);
          
          // Send the order to the server
          const imageOrderResponse = await fetch(`/api/v1/items/${itemId}/images/reorder?managementKey=${encodeURIComponent(managementKey)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageIds })
          });
          
          if (!imageOrderResponse.ok) {
            console.error('Failed to update image order during form submission:', imageOrderResponse.status);
          } else {
            console.log('Image order updated successfully during form submission');
          }
        } catch (err) {
          console.error('Error updating image order during form submission:', err);
        }
      }
      
      setSuccess(true);
      setToast({
        show: true,
        message: 'Item updated successfully!',
        type: 'success'
      });

      // Navigate back to item detail page after a short delay
      setTimeout(() => {
        window.location.hash = `/item/${itemId}`;
        
        // Dispatch route change event with updated item
        window.dispatchEvent(new CustomEvent('routechange', {
          detail: {
            route: `/item/${itemId}`,
            updatedItem: {
              ...item,
              ...requestPayload,
              id: itemId,
              management_key: managementKey
            }
          }
        }));
      }, 1500);

    } catch (err) {
      console.error('Error updating item:', err);
      setToast({
        show: true,
        message: err.message,
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
        <div 
          className="sticky top-0 z-10 -mx-4 px-4 py-4 mb-6 transition-all duration-300"
          style=${{
            backgroundColor: darkMode ? `${DARK_BG}CC` : `${WHITE}CC`,
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
          }}
        >
          <div className="flex items-center justify-between">
            <${Breadcrumbs} 
              darkMode=${darkMode} 
              html=${html}
              items=${[
                { text: 'Home', link: true, onClick: onBack },
                { text: 'Edit Item' }
              ]} 
            />
            <button
              onClick=${onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:-translate-x-1"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                color: darkMode ? WHITE : DARK_TEAL
              }}
            >
              <span className="material-icons">arrow_back</span>
              <span>Cancel</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-center p-8">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-4" 
            style=${{ 
              borderColor: `${LIGHT_TEAL}`,
              borderTopColor: LIGHT_TEAL,
              animation: 'spin 1s cubic-bezier(0.55, 0.25, 0.25, 0.7) infinite'
            }}
          ></div>
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
      <div 
        className="sticky top-0 z-10 -mx-4 px-4 py-4 mb-6 transition-all duration-300"
        style=${{
          backgroundColor: darkMode ? `${DARK_BG}CC` : `${WHITE}CC`,
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        }}
      >
        <div className="flex items-center justify-between">
          <${Breadcrumbs} 
            darkMode=${darkMode} 
            html=${html}
            items=${[
              { text: 'Home', link: true, onClick: onBack },
              { text: 'Edit Item' }
            ]} 
          />
          <button
            onClick=${onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:-translate-x-1"
            style=${{
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
              color: darkMode ? WHITE : DARK_TEAL
            }}
          >
            <span className="material-icons">arrow_back</span>
            <span>Cancel</span>
          </button>
        </div>
      </div>

      <div 
        className="rounded-xl shadow-lg p-6 backdrop-blur-sm mb-8"
        style=${{
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        }}
      >
        <h1 
          className="text-2xl font-bold mb-6 flex items-center gap-2"
          style=${{ color: darkMode ? WHITE : DARK_TEAL }}
        >
          <span className="material-icons">edit</span>
          Edit Item
        </h1>

        ${showManagementKeyInput && html`
          <div 
            className="mb-6 p-4 rounded-lg"
            style=${{ 
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)',
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style=${{ color: darkMode ? WHITE : DARK_TEAL }}
            >Enter Management Key</h3>
            <p
              className="mb-4"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            >
              Please enter the management key you received when you created this listing.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value=${managementKey}
                onChange=${(e) => setManagementKey(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  color: darkMode ? WHITE : DARK_TEAL,
                  border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                }}
                placeholder="Enter management key"
              />
              <button
                onClick=${() => setShowManagementKeyInput(false)}
                className="px-4 py-2 rounded-lg transition-all duration-300"
                style=${{
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  color: WHITE
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        `}

        <form onSubmit=${handleSubmit}>
          <!-- Title -->
          <div className="mb-6">
            <label 
              className="block mb-2 text-sm font-medium"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value=${title}
              onChange=${(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                color: darkMode ? WHITE : DARK_TEAL,
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              }}
              placeholder="Enter item title"
              required
            />
          </div>

          <!-- Description -->
          <div className="mb-6">
            <label 
              className="block mb-2 text-sm font-medium"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value=${description}
              onChange=${e => setDescription(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
              style=${{ 
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                color: darkMode ? WHITE : DARK_TEAL,
                minHeight: '150px'
              }}
              placeholder="Describe your item (Markdown supported)"
              required
            ></textarea>
            <p 
              className="mt-1 text-xs"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              Markdown formatting supported. You can use **bold**, *italic*, [links](url), and more.
            </p>
          </div>
          
          <!-- Images -->
          ${loadingImages ? html`
            <div className="mb-6 flex justify-center">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-4" 
                style=${{ 
                  borderColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  borderTopColor: 'transparent'
                }}
              ></div>
            </div>
          ` : html`
            <div className="form-section form-section-2">
              <${ImageManager}
                darkMode=${darkMode}
                html=${html}
                itemId=${item.id}
                managementKey=${managementKey}
                existingImages=${itemImages}
                onImagesChange=${handleImagesChange}
                maxImages=${8}
                mode="reorder"
                allowUploads=${true}
                showUploadButton=${false}
              />
            </div>
          `}

          <!-- Price and Negotiable -->
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label 
                className="block mb-2 text-sm font-medium"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-medium"
                  style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                >$</span>
                <input
                  type="number"
                  value=${price}
                  onChange=${(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                  style=${{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? WHITE : DARK_TEAL,
                    border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="negotiable"
                checked=${negotiable}
                onChange=${() => setNegotiable(!negotiable)}
                className="w-5 h-5 rounded"
                style=${{
                  accentColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                }}
              />
              <label
                htmlFor="negotiable"
                className="ml-2 text-sm font-medium"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                Price is negotiable
              </label>
            </div>
          </div>

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
              onCategorySelect=${(id) => setCategoryId(id)}
            />
          </div>

          <!-- Location -->
          <div className="mb-6">
            <label 
              className="block mb-2 text-sm font-medium"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            >
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value=${location}
              onChange=${(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                color: darkMode ? WHITE : DARK_TEAL,
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              }}
              placeholder="Enter location (e.g., Building 3, Floor 2)"
              required
            />
          </div>

          <!-- Contact Information -->
          <div className="mb-6">
            <h3 
              className="text-lg font-medium mb-4"
              style=${{ color: darkMode ? WHITE : DARK_TEAL }}
            >
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label 
                  className="block mb-2 text-sm font-medium"
                  style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value=${email}
                  onChange=${(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                  style=${{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? WHITE : DARK_TEAL,
                    border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  }}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label 
                  className="block mb-2 text-sm font-medium"
                  style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
                >
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value=${phone}
                  onChange=${(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                  style=${{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? WHITE : DARK_TEAL,
                    border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  }}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div className="mt-4">
              <label 
                className="block mb-2 text-sm font-medium"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                Teams Link (optional)
              </label>
              <input
                type="url"
                value=${teamsLink}
                onChange=${(e) => setTeamsLink(e.target.value)}
                className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  color: darkMode ? WHITE : DARK_TEAL,
                  border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                }}
                placeholder="Enter Teams chat link"
              />
            </div>
          </div>

          <!-- Payment Methods -->
          <${PaymentMethodsSection}
            darkMode=${darkMode}
            html=${html}
            selectedMethods=${selectedPaymentMethods}
            onMethodToggle=${handlePaymentMethodToggle}
          />

          <!-- Shipping Options -->
          <${ShippingOptionsSection}
            darkMode=${darkMode}
            html=${html}
            selectedOptions=${selectedShippingOptions}
            onOptionToggle=${handleShippingOptionToggle}
          />

          <!-- Submit Button -->
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled=${loading || showManagementKeyInput}
              className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
              style=${{
                backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                color: WHITE,
                opacity: (loading || showManagementKeyInput) ? 0.7 : 1,
                cursor: (loading || showManagementKeyInput) ? 'not-allowed' : 'pointer'
              }}
            >
              ${loading ? html`
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-2" 
                  style=${{ 
                    borderColor: `${WHITE}`,
                    borderTopColor: 'transparent'
                  }}
                ></div>
                <span>Updating...</span>
              ` : html`
                <span className="material-icons">save</span>
                <span>Update Item</span>
              `}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}; 
import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../utils/constants.js';
import { Toast } from './Toast.js';
import { ImageManager } from './form/ImageManager.js';
import { FormField } from './form/FormField.js';
import { PaymentMethodsSection } from './form/PaymentMethodsSection.js';
import { ShippingOptionsSection } from './form/ShippingOptionsSection.js';
import { CategorySelectionSection } from './form/CategorySelectionSection.js';
import { ConditionSelectionSection } from './form/ConditionSelectionSection.js';

export const NewItemForm = ({ darkMode, html }) => {
  // Form state
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [condition, setCondition] = React.useState('new');
  const [location, setLocation] = React.useState('');
  const [categoryId, setCategoryId] = React.useState(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = React.useState({
    cash: true,
    apple_cash: false,
    cash_app: false,
    zelle: false,
    venmo: false,
    paypal: false,
    other: false
  });
  const [selectedShippingOptions, setSelectedShippingOptions] = React.useState({
    local: true,
    office: false,
    anywhere: false
  });
  const [negotiable, setNegotiable] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [teamsLink, setTeamsLink] = React.useState('');
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);
  const [managementKey, setManagementKey] = React.useState('');
  const [images, setImages] = React.useState([]);
  const [itemId, setItemId] = React.useState(null);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });
  const [uploadingImages, setUploadingImages] = React.useState(false);

  // Fetch categories on component mount
  React.useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from API or use cached data
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Use default categories as fallback
      setCategories([
        { id: 1, name: 'Electronics & Computers' },
        { id: 2, name: 'Mobile Phones' },
        { id: 3, name: 'Gaming & Consoles' },
        { id: 4, name: 'Furniture' },
        { id: 5, name: 'Home & Kitchen Appliances' },
        { id: 6, name: 'Home Decor & Improvement' },
        { id: 7, name: 'Housing & Real Estate' },
        { id: 8, name: 'Vehicles & Automotive' },
        { id: 9, name: 'Bicycles' },
        { id: 10, name: 'Clothing & Shoes' },
        { id: 11, name: 'Jewelry & Accessories' },
        { id: 12, name: 'Health & Beauty' },
        { id: 13, name: 'Books & Media' },
        { id: 14, name: 'Musical Instruments' },
        { id: 15, name: 'Sports & Outdoor Gear' },
        { id: 16, name: 'Toys, Games & Hobbies' },
        { id: 17, name: 'Art & Collectibles' },
        { id: 18, name: 'Baby & Kids Items' },
        { id: 19, name: 'Pet Supplies' },
        { id: 20, name: 'Other' }
      ]);
    }
  };

  // Handle payment method toggle
  const handlePaymentMethodToggle = (method) => {
    setSelectedPaymentMethods(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  // Handle shipping option toggle
  const handleShippingOptionToggle = (option) => {
    setSelectedShippingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Form submitted with categoryId:', categoryId, 'type:', typeof categoryId);

    // Validate form
    if (!title || !description || !price || !condition || !location || !email) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    if (!categoryId) {
      setError('Please select a category for your item');
      setLoading(false);
      return;
    }

    // Convert selected payment methods to array of keys
    const paymentMethodsArray = Object.entries(selectedPaymentMethods)
      .filter(([_, selected]) => selected)
      .map(([method]) => method);

    console.log('Payment methods array:', paymentMethodsArray);
      
    if (paymentMethodsArray.length === 0) {
      setError('Please select at least one payment method');
      setLoading(false);
      return;
    }

    // Convert selected shipping options to array of keys
    const shippingOptionsArray = Object.entries(selectedShippingOptions)
      .filter(([_, selected]) => selected)
      .map(([option]) => option);

    if (shippingOptionsArray.length === 0) {
      setError('Please select at least one shipping option');
      setLoading(false);
      return;
    }

    try {
      // Ensure categoryId is a valid integer
      const parsedCategoryId = parseInt(categoryId, 10);
      console.log('Parsed categoryId:', parsedCategoryId, 'valid:', !isNaN(parsedCategoryId));
      
      if (isNaN(parsedCategoryId)) {
        setError('Invalid category selected. Please select a valid category.');
        setLoading(false);
        return;
      }

      console.log('Sending API request with categoryId:', parsedCategoryId);
      
      // DIRECT FIX: Create the exact format that will work
      const requestBody = {
        title,
        description,
        price: parseFloat(price),
        condition,
        location,
        category_id: parsedCategoryId, // Use snake_case for backend compatibility
        shipping: shippingOptionsArray,
        negotiable,
        email,
        phone,
        teamsLink,
        paymentMethods: paymentMethodsArray 
      };
      
      console.log('Request payload:', JSON.stringify(requestBody, null, 2));
      
      // IMPORTANT: Use the exact endpoint and format
      const response = await fetch('/api/v1/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item');
      }

      // Read the response JSON ONCE and store it
      const responseData = await response.json();
      console.log('Item creation response:', responseData);
      
      // The server returns an object with the item under key "0" and managementKey at the top level
      const itemData = responseData["0"];
      const newManagementKey = responseData.managementKey;
      
      console.log('Item data:', itemData);
      console.log('Management key:', newManagementKey);
      
      if (!itemData) {
        console.error('Invalid response format - missing item data:', responseData);
        throw new Error('Invalid response format from server');
      }
      
      // Extract item ID from the response
      const newItemId = itemData.id;
      
      console.log('Extracted item ID:', newItemId);
      console.log('Extracted management key:', newManagementKey);
      
      if (!newItemId || !newManagementKey) {
        console.error('Missing item ID or management key in response:', responseData);
        throw new Error('Invalid response from server: missing item ID or management key');
      }
      
      setManagementKey(newManagementKey);
      setItemId(newItemId);
      
      // If there are files to upload, upload them now
      if (uploadedFiles.length > 0) {
        console.log('Preparing to upload images for new item:', {
          itemId: newItemId,
          managementKey: newManagementKey ? 'valid key' : 'missing key',
          fileCount: uploadedFiles.length,
          fileDetails: uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
        });
        
        setUploadingImages(true);
        setToast({
          show: true,
          message: `Item created successfully. Now uploading ${uploadedFiles.length} image(s)...`,
          type: 'info'
        });
        
        try {
          await uploadFiles(newItemId, newManagementKey, uploadedFiles);
        } catch (uploadError) {
          console.error('Error during image upload:', uploadError);
          setToast({
            show: true,
            message: `Item created but there was an error uploading images: ${uploadError.message}`,
            type: 'warning'
          });
        } finally {
          setUploadingImages(false);
        }
      } else {
        setToast({
          show: true,
          message: 'Item created successfully!',
          type: 'success'
        });
      }
      
      setSuccess(true);
      
      // Clear form fields but keep the management key and item ID
      resetForm();
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Upload files to the server after item creation
  const uploadFiles = async (newItemId, newManagementKey, files) => {
    console.log('uploadFiles called with:', { 
      newItemId, 
      managementKey: newManagementKey ? 'valid key' : 'missing key', 
      fileCount: files.length,
      fileDetails: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
    
    if (!newItemId || !newManagementKey) {
      console.error('Cannot upload images: Missing item ID or management key');
      setToast({
        show: true,
        message: 'Cannot upload images: Missing item ID or management key',
        type: 'error'
      });
      return;
    }
    
    if (files.length === 0) {
      console.log('No files to upload');
      return;
    }
    
    // Validate that all files are valid File objects
    const invalidFiles = files.filter(file => !(file instanceof File));
    if (invalidFiles.length > 0) {
      console.error('Invalid files detected:', invalidFiles);
      setToast({
        show: true,
        message: 'Cannot upload images: Invalid file objects',
        type: 'error'
      });
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Add each file to the FormData
      files.forEach((file, index) => {
        console.log(`Adding file ${index + 1}/${files.length} to FormData:`, file.name, file.type, file.size);
        formData.append('images', file);
      });
      
      // Add the management key
      formData.append('managementKey', newManagementKey);
      console.log('Added management key to FormData');
      
      setToast({
        show: true,
        message: `Uploading ${files.length} image(s)...`,
        type: 'info'
      });
      
      console.log(`Sending request to upload ${files.length} images for item ${newItemId}`);
      
      const uploadUrl = `/api/v1/images/${newItemId}`;
      console.log('Upload URL:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      console.log('Image upload response status:', response.status);
      
      if (response.ok) {
        const uploadedImages = await response.json();
        console.log('Uploaded images response:', uploadedImages);
        
        setToast({
          show: true,
          message: `Successfully uploaded ${Array.isArray(uploadedImages) ? uploadedImages.length : 0} image(s)`,
          type: 'success'
        });
      } else {
        let errorMessage = 'Failed to upload images';
        try {
          const errorData = await response.json();
          console.error('Image upload error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing image upload error:', e);
        }
        
        setToast({
          show: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setToast({
        show: true,
        message: `Error uploading images: ${err.message}`,
        type: 'error'
      });
    }
  };

  // Reset form fields
  const resetForm = () => {
    // Reset form fields but keep the management key and item ID for the success screen
    setTitle('');
    setDescription('');
    setPrice('');
    setCondition('new');
    setLocation('');
    setCategoryId(null);
    setSelectedPaymentMethods({
      cash: true,
      apple_cash: false,
      cash_app: false,
      zelle: false,
      venmo: false,
      paypal: false,
      other: false
    });
    setSelectedShippingOptions({
      local: true,
      office: false,
      anywhere: false
    });
    setNegotiable(false);
    setEmail('');
    setPhone('');
    setTeamsLink('');
    setError(null);
    
    // Reset uploaded files AFTER the upload is complete
    if (!uploadingImages) {
      console.log('Resetting uploadedFiles');
      setUploadedFiles([]);
    } else {
      console.log('Not resetting uploadedFiles because upload is in progress');
    }
    
    console.log('Form reset completed. Management key and item ID preserved for success screen.');
  };

  // Handle reset for creating a new item
  const handleReset = () => {
    setSuccess(false);
    setManagementKey('');
    setItemId(null);
    setImages([]);
  };

  // Copy management key to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(managementKey);
      setToast({
        show: true,
        message: 'Management key copied to clipboard',
        type: 'success'
      });
      setTimeout(() => setToast({ ...toast, show: false }), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setToast({
        show: true,
        message: 'Failed to copy management key',
        type: 'error'
      });
    }
  };

  // Add keyframe animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      
      .form-section {
        animation: slideInUp 0.5s ease-out forwards;
        opacity: 0;
      }
      
      .form-section-1 { animation-delay: 0.1s; }
      .form-section-2 { animation-delay: 0.2s; }
      .form-section-3 { animation-delay: 0.3s; }
      .form-section-4 { animation-delay: 0.4s; }
      .form-section-5 { animation-delay: 0.5s; }
      .form-section-6 { animation-delay: 0.6s; }
      .form-section-7 { animation-delay: 0.7s; }
      .form-section-8 { animation-delay: 0.8s; }
      .form-section-9 { animation-delay: 0.9s; }
      .form-section-10 { animation-delay: 1.0s; }
      
      .form-container {
        animation: fadeIn 0.8s ease-out forwards;
      }
      
      .form-field-focus {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .form-field-focus:focus-within {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      }
      
      .submit-button-hover {
        transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
      }
      
      .submit-button-hover:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.2);
      }
      
      .submit-button-hover:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // If form was successfully submitted, show success screen
  if (success) {
    return html`
      <div 
        className="rounded-xl shadow-lg p-8 backdrop-blur-sm form-container"
        style=${{
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        }}
      >
        ${toast.show && html`
          <${Toast}
            message=${toast.message}
            type=${toast.type}
            onClose=${() => setToast({ ...toast, show: false })}
            darkMode=${darkMode}
            html=${html}
          />
        `}
        
        <div className="text-center mb-6">
          <span 
            className="material-icons text-6xl mb-4"
            style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}
          >check_circle</span>
          <h2 
            className="text-2xl font-bold mb-2"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >Item Listed Successfully!</h2>
          <p
            className="text-lg mb-6"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
          >Your item has been listed on the marketplace.</p>
          
          <div 
            className="mb-8 p-6 rounded-lg"
            style=${{ 
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)',
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style=${{ color: darkMode ? WHITE : DARK_TEAL }}
            >Management Key</h3>
            <p
              className="mb-4"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            >
              Save this key to edit or remove your listing later. This key will not be shown again.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value=${managementKey}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  color: darkMode ? WHITE : DARK_TEAL,
                  border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                }}
              />
              <button
                onClick=${copyToClipboard}
                className="px-4 py-2 rounded-lg transition-all duration-300"
                style=${{
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  color: WHITE
                }}
              >
                Copy
              </button>
            </div>
          </div>
          
          <button
            onClick=${handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 mx-auto"
            style=${{
              backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
              color: WHITE
            }}
          >
            <span className="material-icons">add_circle</span>
            <span>List Another Item</span>
          </button>
        </div>
      </div>
    `;
  }

  // Render the form
  return html`
    <div 
      className="rounded-xl shadow-lg p-8 backdrop-blur-sm form-container"
      style=${{
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
      }}
    >
      ${toast.show && html`
        <${Toast}
          message=${toast.message}
          type=${toast.type}
          onClose=${() => setToast({ ...toast, show: false })}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      
      <h2 
        className="text-2xl font-bold mb-6 form-section form-section-1"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >List a New Item</h2>

      ${error && html`
        <div 
          className="mb-6 p-4 rounded-lg flex items-center gap-3 form-section form-section-1"
          style=${{ 
            backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#EF4444'
          }}
        >
          <span className="material-icons">error</span>
          <span>${error}</span>
        </div>
      `}

      <form onSubmit=${handleSubmit} className="space-y-6">
        <!-- Image Upload Section -->
        <div className="form-section form-section-2">
          <${ImageManager}
            darkMode=${darkMode}
            html=${html}
            uploadedFiles=${uploadedFiles}
            onFilesChange=${setUploadedFiles}
            maxImages=${8}
            mode="upload"
            allowUploads=${true}
            showUploadButton=${false}
          />
        </div>
        
        <!-- Title Field -->
        <div className="form-section form-section-3 form-field-focus">
          <${FormField}
            darkMode=${darkMode}
            html=${html}
            id="title"
            label="Title"
            value=${title}
            onChange=${e => setTitle(e.target.value)}
            placeholder="Enter a descriptive title for your item"
            required=${true}
            description="A clear, concise title that describes your item. Good titles are specific and include key details like brand, model, or size."
          />
        </div>
        
        <!-- Description Field -->
        <div className="form-section form-section-4 form-field-focus">
          <${FormField}
            darkMode=${darkMode}
            html=${html}
            id="description"
            label="Description"
            type="textarea"
            value=${description}
            onChange=${e => setDescription(e.target.value)}
            placeholder="Provide details about your item's features, condition, and any other relevant information"
            required=${true}
            helpText="Markdown formatting is supported"
            description="Include important details about your item: features, specifications, dimensions, brand, model number, and any defects or issues. The more detail you provide, the better!"
          />
        </div>
        
        <!-- Price Field -->
        <div className="form-section form-section-5 form-field-focus">
          <${FormField}
            darkMode=${darkMode}
            html=${html}
            id="price"
            label="Price"
            type="number"
            value=${price}
            onChange=${e => setPrice(e.target.value)}
            placeholder="Enter the price in USD"
            required=${true}
            description="Set a fair price based on the item's condition and market value. Consider checking similar items to gauge appropriate pricing."
          />
        </div>
        
        <!-- Negotiable Checkbox -->
        <div className="relative flex items-center mb-4 form-section form-section-5">
          <input
            id="negotiable"
            type="checkbox"
            checked=${negotiable}
            onChange=${e => setNegotiable(e.target.checked)}
            className="w-4 h-4 rounded"
            style=${{
              accentColor: darkMode ? LIGHT_TEAL : DARK_TEAL
            }}
          />
          <label
            htmlFor="negotiable"
            className="ml-2 text-sm"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
          >
            Price is negotiable
          </label>
        </div>
        
        <!-- Condition Selection Section -->
        <div className="form-section form-section-6">
          <${ConditionSelectionSection}
            darkMode=${darkMode}
            html=${html}
            selectedCondition=${condition}
            onConditionSelect=${setCondition}
          />
        </div>
        
        <!-- Location Field -->
        <div className="form-section form-section-7 form-field-focus">
          <${FormField}
            darkMode=${darkMode}
            html=${html}
            id="location"
            label="Location"
            value=${location}
            onChange=${e => setLocation(e.target.value)}
            placeholder="Enter your location (e.g., city, campus)"
            required=${true}
            description="Specify where the item is located. This helps buyers plan for pickup or delivery. Be specific but avoid sharing your exact address."
          />
        </div>
        
        <!-- Category Selection Section -->
        <div className="form-section form-section-8">
          <${CategorySelectionSection}
            darkMode=${darkMode}
            html=${html}
            categories=${categories}
            selectedCategoryId=${categoryId}
            onCategorySelect=${setCategoryId}
          />
        </div>
        
        <!-- Shipping Options Section -->
        <div className="form-section form-section-9">
          <${ShippingOptionsSection}
            darkMode=${darkMode}
            html=${html}
            selectedOptions=${selectedShippingOptions}
            onOptionToggle=${handleShippingOptionToggle}
          />
        </div>
        
        <!-- Payment Methods Section -->
        <div className="form-section form-section-9">
          <${PaymentMethodsSection}
            darkMode=${darkMode}
            html=${html}
            selectedMethods=${selectedPaymentMethods}
            onMethodToggle=${handlePaymentMethodToggle}
          />
        </div>
        
        <!-- Contact Information -->
        <div className="border-t border-b py-4 my-6 form-section form-section-10" style=${{ borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
          <h3 
            className="text-lg font-medium mb-4"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >
            Contact Information
          </h3>
          
          <!-- Email Field -->
          <div className="form-field-focus">
            <${FormField}
              darkMode=${darkMode}
              html=${html}
              id="email"
              label="Email"
              type="email"
              value=${email}
              onChange=${e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required=${true}
              description="Your primary contact email. This will be visible to potential buyers and used for notifications about your listing."
            />
          </div>
          
          <!-- Phone Field -->
          <div className="form-field-focus mt-4">
            <${FormField}
              darkMode=${darkMode}
              html=${html}
              id="phone"
              label="Phone (Optional)"
              value=${phone}
              onChange=${e => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              description="Optional secondary contact method. Only share if you're comfortable being contacted by phone."
            />
          </div>
          
          <!-- Teams Link Field -->
          <div className="form-field-focus mt-4">
            <${FormField}
              darkMode=${darkMode}
              html=${html}
              id="teamsLink"
              label="Teams Link (Optional)"
              value=${teamsLink}
              onChange=${e => setTeamsLink(e.target.value)}
              placeholder="Enter your Microsoft Teams link"
              description="Share your Teams link if you prefer to communicate through Microsoft Teams. This is optional but can be helpful for quick communication."
            />
          </div>
        </div>
        
        <!-- Submit Button -->
        <div className="flex justify-center form-section form-section-10">
          <button
            type="submit"
            disabled=${loading || uploadingImages}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 submit-button-hover"
            style=${{
              backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
              color: WHITE,
              opacity: (loading || uploadingImages) ? 0.7 : 1
            }}
          >
            ${loading ? html`
              <span className="animate-spin material-icons">refresh</span>
              <span>Creating Listing...</span>
            ` : uploadingImages ? html`
              <span className="animate-spin material-icons">refresh</span>
              <span>Uploading Images...</span>
            ` : html`
              <span className="material-icons">add_circle</span>
              <span>List Item</span>
            `}
          </button>
        </div>
      </form>
    </div>
  `;
};
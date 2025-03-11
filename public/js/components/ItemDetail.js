import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG, PAYMENT_METHODS, DEMO_IMAGES, SHIPPING_OPTIONS } from '../utils/constants.js';
import { Breadcrumbs } from './Breadcrumbs.js';
import { ImageCarousel } from './ImageCarousel.js';
import { Toast } from './Toast.js';
import { categoryIcons, categoryToIconKey } from '../utils/categoryIcons.js';
import { formatMarkdown } from '../utils/markdown.js';

export const ItemDetail = ({ item, loading, onBack, darkMode, html }) => {
  const [showManagementKeyModal, setShowManagementKeyModal] = React.useState(false);
  const [showSoldModal, setShowSoldModal] = React.useState(false);
  const [managementKey, setManagementKey] = React.useState('');
  const [validating, setValidating] = React.useState(false);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });
  const [itemImages, setItemImages] = React.useState([]);
  const [loadingImages, setLoadingImages] = React.useState(false);
  
  // Fetch images for the item when component mounts
  React.useEffect(() => {
    if (item) {
      const itemData = Array.isArray(item) ? item[0] : item;
      fetchItemImages(itemData.id);
    }
  }, [item]);
  
  // Function to fetch images from the API
  const fetchItemImages = async (itemId) => {
    if (!itemId) return;
    
    setLoadingImages(true);
    try {
      const response = await fetch(`/api/v1/images/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched images:', data);
        
        // Transform the image data to URLs
        if (Array.isArray(data) && data.length > 0) {
          const imageUrls = data.map(img => `/images/${img.hash_filename}`);
          setItemImages(imageUrls);
        } else {
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
  
  const handleBack = (e) => {
    e.preventDefault();
    onBack();
  };

  const handleEditClick = () => {
    setShowManagementKeyModal(true);
  };
  
  const handleSoldClick = () => {
    setShowSoldModal(true);
  };

  const handleCloseModal = () => {
    setShowManagementKeyModal(false);
    setShowSoldModal(false);
    setManagementKey('');
  };

  const handleManagementKeySubmit = async (e) => {
    e.preventDefault();
    if (!managementKey.trim()) {
      setToast({
        show: true,
        message: 'Please enter a management key',
        type: 'error'
      });
      return;
    }

    setValidating(true);
    try {
      // In a real app, you would validate the management key against the server
      const itemData = Array.isArray(item) ? item[0] : item;
      const itemId = itemData.id;
      
      console.log('Validating management key for item:', itemId);
      
      // Make an actual API call to validate the management key
      const response = await fetch(`/api/v1/items/${itemId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managementKey })
      });
      
      // If the endpoint doesn't exist, we'll fall back to the demo behavior
      if (response.status === 404) {
        console.log('Validation endpoint not found, using demo behavior');
        // For demo purposes, accept any key that's at least 6 characters
        if (managementKey.length >= 6) {
          setToast({
            show: true,
            message: 'Management key accepted (demo mode)',
            type: 'success'
          });
          
          // Navigate to edit page
          const route = `/edit-item/${itemId}`;
          
          // Use hash-based routing
          window.location.hash = route;
          
          // Dispatch event with all necessary data
          window.dispatchEvent(new CustomEvent('routechange', { 
            detail: { 
              route: route,
              itemId: itemId,
              managementKey: managementKey
            }
          }));
          
          handleCloseModal();
        } else {
          setToast({
            show: true,
            message: 'Invalid management key (demo mode requires at least 6 characters)',
            type: 'error'
          });
        }
      } else if (response.ok) {
        const data = await response.json();
        
        if (data.valid) {
          setToast({
            show: true,
            message: 'Management key accepted',
            type: 'success'
          });
          
          // Navigate to edit page
          const route = `/edit-item/${itemId}`;
          
          // Use hash-based routing
          window.location.hash = route;
          
          // Dispatch event with all necessary data
          window.dispatchEvent(new CustomEvent('routechange', { 
            detail: { 
              route: route,
              itemId: itemId,
              managementKey: managementKey
            }
          }));
          
          handleCloseModal();
        } else {
          setToast({
            show: true,
            message: 'Invalid management key',
            type: 'error'
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to validate management key');
      }
    } catch (err) {
      console.error('Error validating management key:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setValidating(false);
    }
  };
  
  const handleSoldSubmit = async (e) => {
    e.preventDefault();
    if (!managementKey.trim()) {
      setToast({
        show: true,
        message: 'Please enter a management key',
        type: 'error'
      });
      return;
    }

    setValidating(true);
    try {
      const itemData = Array.isArray(item) ? item[0] : item;
      const itemId = itemData.id;
      
      console.log('Marking item as sold:', itemId);
      
      // Make a PATCH request to update the sold status
      const response = await fetch(`/api/v1/items/${itemId}?management_key=${encodeURIComponent(managementKey)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sold: true })
      });
      
      if (response.ok) {
        setToast({
          show: true,
          message: 'Item marked as sold successfully',
          type: 'success'
        });
        
        // Refresh the page to show updated status
        window.location.reload();
        
        handleCloseModal();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark item as sold');
      }
    } catch (err) {
      console.error('Error marking item as sold:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setValidating(false);
    }
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // Handler for Teams Desktop link
  const handleTeamsDesktopClick = () => {
    // Use the MS Teams desktop protocol to open Teams
    // Use the teams_link field as the user ID
    const teamsId = itemData.teams_link || 'user@example.com';
    window.location.href = `msteams://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(teamsId)}`;
  };
  
  // Handler for Teams Web link
  const handleTeamsWebClick = () => {
    // Get user ID from teams_link field
    const userId = itemData.teams_link || 'USER_ID';
    // Open Teams web in a new tab
    window.open(`https://teams.microsoft.com/_#/profile?userId=${encodeURIComponent(userId)}`, '_blank');
  };

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

  if (loading) return html`
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
  `;

  // Handle case when item is not found or is empty array
  if (!item || (Array.isArray(item) && item.length === 0)) {
    return html`
      <div className="max-w-7xl mx-auto">
        <div 
          className="sticky top-0 z-10 -mx-4 px-4 py-4 mb-4 transition-all duration-300"
          style=${{
            backgroundColor: darkMode ? `${DARK_BG}CC` : `${WHITE}CC`,
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
          }}
        >
          <div className="flex items-center justify-between">
            <div className="slide-in-left">
              <${Breadcrumbs} 
                darkMode=${darkMode} 
                html=${html}
                items=${[
                  { text: 'Home', link: true, onClick: handleBack }
                ]} 
              />
            </div>
            <button
              onClick=${handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 slide-in-right hover:-translate-x-1"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                color: darkMode ? WHITE : DARK_TEAL
              }}
            >
              <span className="material-icons">arrow_back</span>
              <span>Back to Listings</span>
            </button>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-8 backdrop-blur-sm fade-in-up flex flex-col items-center justify-center text-center"
          style=${{
            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
          }}
        >
          <span 
            className="material-icons text-6xl mb-4"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
          >search_off</span>
          <h2 
            className="text-2xl font-bold mb-2"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >Item Not Found</h2>
          <p
            className="text-lg mb-6"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
          >This item may have been removed or is no longer available.</p>
          <button
            onClick=${handleBack}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
            style=${{
              backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
              color: WHITE
            }}
          >
            <span className="material-icons">arrow_back</span>
            <span>Return to Listings</span>
          </button>
        </div>
      </div>
    `;
  }

  // If item is an array with one element, use that element
  const itemData = Array.isArray(item) ? item[0] : item;

  return html`
    <div className="max-w-7xl mx-auto">
      <!-- Header -->
      <div 
        className="sticky top-0 z-10 -mx-4 px-4 py-4 mb-4 transition-all duration-300"
        style=${{
          backgroundColor: darkMode ? `${DARK_BG}CC` : `${WHITE}CC`,
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        }}
      >
        <div className="flex items-center justify-between">
          <div className="slide-in-left">
            <${Breadcrumbs} 
              darkMode=${darkMode} 
              html=${html}
              items=${[
                { text: 'Home', link: true, onClick: handleBack },
                { text: itemData.category_name || 'Uncategorized', link: true, href: `/#/category/${itemData.category_id}` },
                { text: itemData.title }
              ]} 
            />
          </div>
          <div className="flex items-center gap-2 slide-in-right">
            <button
              onClick=${handleSoldClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                color: darkMode ? WHITE : DARK_TEAL
              }}
              disabled=${itemData.sold}
            >
              <span className="material-icons">${itemData.sold ? 'check_circle' : 'sell'}</span>
              <span>${itemData.sold ? 'Sold' : 'Mark as Sold'}</span>
            </button>
            <button
              onClick=${handleEditClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style=${{
                backgroundColor: itemData.sold ? 'rgba(0, 0, 0, 0.1)' : (darkMode ? LIGHT_TEAL : DARK_TEAL),
                color: itemData.sold ? (darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)') : WHITE,
                cursor: itemData.sold ? 'not-allowed' : 'pointer'
              }}
              disabled=${itemData.sold}
              title=${itemData.sold ? "Cannot edit sold items" : "Edit item"}
            >
              <span className="material-icons">edit</span>
              <span>Edit Item</span>
            </button>
            <button
              onClick=${handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:-translate-x-1"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                color: darkMode ? WHITE : DARK_TEAL
              }}
            >
              <span className="material-icons">arrow_back</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Image Carousel -->
        <div className="fade-in-up relative">
          ${loadingImages ? html`
            <div className="flex justify-center items-center h-64 rounded-xl" style=${{ backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.5)' }}>
              <div 
                className="animate-spin rounded-full h-12 w-12 border-4" 
                style=${{ 
                  borderColor: `${LIGHT_TEAL}`,
                  borderTopColor: 'transparent'
                }}
              ></div>
            </div>
          ` : itemImages.length > 0 ? html`
            <${ImageCarousel} 
              images=${itemImages}
              darkMode=${darkMode}
              html=${html}
              categoryName=${itemData.category_name}
            />
          ` : html`
            <div 
              className="flex flex-col justify-center items-center h-64 rounded-xl p-6 text-center"
              style=${{ 
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                border: '1px dashed ' + (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)')
              }}
            >
              ${(() => {
                // Get the appropriate icon key for this category
                const getCategoryIcon = () => {
                  const categoryName = itemData.category_name || 'Uncategorized';
                  let iconKey = categoryToIconKey[categoryName];
                  
                  // If no direct match, try normalized comparison
                  if (!iconKey) {
                    const normalizedName = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    iconKey = Object.entries(categoryToIconKey).find(([key]) => 
                      key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName
                    )?.[1] || 'other';
                  }
                  
                  // Get the SVG for this icon key
                  const iconSvg = categoryIcons[iconKey] || categoryIcons.other;
                  const iconColor = darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
                  
                  return iconSvg.replace('stroke="currentColor"', `stroke="${iconColor}"`);
                };
                
                return html`
                  <div className="w-32 h-32 mb-4" dangerouslySetInnerHTML=${{ __html: getCategoryIcon() }}></div>
                `;
              })()}
              <p 
                className="mt-4 text-lg"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
              >
                No images available for this ${itemData.category_name || 'item'}
              </p>
            </div>
          `}
          ${itemData.sold && html`
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style=${{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(2px)',
                zIndex: 10
              }}
            >
              <div 
                className="flex items-center gap-3 px-8 py-4 rounded-xl transform -rotate-12"
                style=${{
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  border: '3px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              >
                <span className="material-icons text-4xl text-white">sell</span>
                <span className="text-4xl font-bold text-white">SOLD</span>
              </div>
            </div>
          `}
        </div>

        <!-- Right Column: Item Details -->
        <div className="space-y-6 fade-in-up">
          <div className="flex items-center justify-between">
            <!-- Category Badge -->
            <a
              href=${`/#/category/${itemData.category_id}`}
              onClick=${(e) => {
                e.preventDefault();
                window.location.hash = `/category/${itemData.category_id}`;
              }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
              style=${{
                backgroundColor: darkMode ? 'rgba(102, 163, 210, 0.1)' : 'rgba(102, 163, 210, 0.1)',
                color: darkMode ? LIGHT_TEAL : DARK_TEAL,
                border: '1px solid ' + (darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(0, 48, 135, 0.1)')
              }}
            >
              ${(() => {
                // Get the appropriate icon key for this category
                const categoryName = itemData.category_name || 'Uncategorized';
                let iconKey = categoryToIconKey[categoryName];
                
                // If no direct match, try normalized comparison
                if (!iconKey) {
                  const normalizedName = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
                  iconKey = Object.entries(categoryToIconKey).find(([key]) => 
                    key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName
                  )?.[1] || 'other';
                }
                
                // Get the SVG for this icon key
                const iconSvg = categoryIcons[iconKey] || categoryIcons.other;
                const iconColor = darkMode ? LIGHT_TEAL : DARK_TEAL;
                
                return html`
                  <span 
                    className="mr-1"
                    style=${{ 
                      display: 'inline-flex',
                      verticalAlign: 'middle',
                      width: '16px',
                      height: '16px',
                      position: 'relative',
                      top: '-1px'
                    }}
                    dangerouslySetInnerHTML=${{ 
                      __html: iconSvg.replace('stroke="currentColor"', `stroke="${iconColor}"`)
                    }}
                  ></span>
                `;
              })()}
              <span>${itemData.category_name || 'Uncategorized'}</span>
            </a>

            <!-- New Badge -->
            ${itemData.condition === 'new' && html`
              <div
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                style=${{
                  backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <span className="material-icons text-sm">new_releases</span>
                <span>New</span>
              </div>
            `}
          </div>

          <!-- Title -->
          <div className="flex items-center justify-between">
            <h1 
              className="text-3xl font-bold" 
              style=${{ 
                color: darkMode ? WHITE : DARK_TEAL,
                textShadow: darkMode ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >${itemData.title}</h1>
            ${itemData.sold && html`
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-lg animate-pulse"
                style=${{
                  backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '2px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <span className="material-icons">sell</span>
                <span className="font-bold">SOLD</span>
              </div>
            `}
          </div>

          <!-- Price and Negotiable Flag -->
          <div className="flex items-center gap-4">
            <div 
              className="text-3xl font-bold"
              style=${{
                color: darkMode ? LIGHT_TEAL : DARK_TEAL,
                textDecoration: itemData.sold ? 'line-through' : 'none',
                opacity: itemData.sold ? 0.7 : 1
              }}
            >
              $${Number(itemData.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            ${itemData.negotiable && !itemData.sold && html`
              <div 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)',
                  color: darkMode ? WHITE : DARK_TEAL
                }}
              >
                <span className="material-icons text-sm">handshake</span>
                Negotiable
              </div>
            `}
          </div>

          <!-- Description -->
          <div 
            className=${`prose prose-lg max-w-none ${darkMode ? 'dark-mode' : ''}`}
            style=${{ 
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
            }}
            dangerouslySetInnerHTML=${{ 
              __html: formatMarkdown(itemData.description || '')
            }}
          ></div>

          <!-- Shipping Options -->
          <div className="pt-6 border-t" style=${{ borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
            <h3 
              className="text-sm font-medium mb-3"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              Shipping Options
            </h3>
            <div className="flex flex-wrap gap-3">
              ${Object.entries(SHIPPING_OPTIONS).map(([method, { icon, label }]) => {
                // Check if shipping is an array (from new form) or a string (from old data)
                const isSelected = Array.isArray(itemData.shipping) 
                  ? itemData.shipping.includes(method)
                  : itemData.shipping === method;
                
                return html`
                  <div
                    key=${method}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300"
                    style=${{
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)',
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      opacity: isSelected ? 1 : 0.5
                    }}
                  >
                    <span className="material-icons text-base">${icon}</span>
                    <span className="text-sm font-medium">${label}</span>
                  </div>
                `;
              })}
            </div>
          </div>

          <!-- Contact Information -->
          <div className="pt-6 border-t" style=${{ borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
            <h3 
              className="text-sm font-medium mb-3"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              Contact Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-icons text-base" style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}>email</span>
                ${itemData.email ? html`
                  <a 
                    href=${`mailto:${itemData.email}`}
                    className="hover:underline transition-all duration-200"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
                  >
                    ${itemData.email}
                  </a>
                  <button
                    onClick=${() => {
                      navigator.clipboard.writeText(itemData.email);
                      setToast({
                        show: true,
                        message: 'Email copied to clipboard',
                        type: 'success'
                      });
                    }}
                    className="p-1 rounded-full transition-all duration-200 hover:scale-110"
                    style=${{ 
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)',
                    }}
                    title="Copy email to clipboard"
                  >
                    <span className="material-icons text-sm" style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}>content_copy</span>
                  </button>
                ` : html`
                  <span style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                    No email provided
                  </span>
                `}
              </div>
              ${itemData.phone && html`
                <div className="flex items-center gap-2">
                  <span className="material-icons text-base" style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}>phone</span>
                  <a 
                    href=${`tel:${itemData.phone}`}
                    className="hover:underline transition-all duration-200"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
                  >
                    ${itemData.phone}
                  </a>
                  <button
                    onClick=${() => {
                      navigator.clipboard.writeText(itemData.phone);
                      setToast({
                        show: true,
                        message: 'Phone number copied to clipboard',
                        type: 'success'
                      });
                    }}
                    className="p-1 rounded-full transition-all duration-200 hover:scale-110"
                    style=${{ 
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)',
                    }}
                    title="Copy phone number to clipboard"
                  >
                    <span className="material-icons text-sm" style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}>content_copy</span>
                  </button>
                </div>
              `}
              ${itemData.teams_link && html`
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-icons text-base" style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}>person</span>
                    <span style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                      Teams ID: ${itemData.teams_link}
                    </span>
                    <button
                      onClick=${() => {
                        navigator.clipboard.writeText(itemData.teams_link);
                        setToast({
                          show: true,
                          message: 'Teams ID copied to clipboard',
                          type: 'success'
                        });
                      }}
                      className="p-1 rounded-full transition-all duration-200 hover:scale-110"
                      style=${{ 
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)',
                      }}
                      title="Copy Teams ID to clipboard"
                    >
                      <span className="material-icons text-sm" style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}>content_copy</span>
                    </button>
                  </div>
                  <div className="flex flex-row gap-2">
                    <button
                      onClick=${handleTeamsDesktopClick}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 w-fit"
                      style=${{
                        backgroundColor: '#464EB8',
                        color: WHITE
                      }}
                    >
                      <span className="material-icons">desktop_windows</span>
                      Teams Desktop
                    </button>
                    
                    <button
                      onClick=${handleTeamsWebClick}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 w-fit"
                      style=${{
                        backgroundColor: '#5059C9',
                        color: WHITE
                      }}
                    >
                      <span className="material-icons">web</span>
                      Teams Web
                    </button>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Payment Methods -->
          <div className="pt-6 border-t" style=${{ borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
            <h3 
              className="text-sm font-medium mb-3"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              Accepted Payment Methods
            </h3>
            <div className="flex flex-wrap gap-3">
              ${(() => {
                // Define all possible payment methods with their icons
                const allPaymentMethods = {
                  cash: { icon: 'payments', label: 'Cash' },
                  apple_cash: { icon: 'phone_iphone', label: 'Apple Cash' },
                  cash_app: { icon: 'attach_money', label: 'Cash App' },
                  zelle: { icon: 'swap_horiz', label: 'Zelle' },
                  venmo: { icon: 'account_balance', label: 'Venmo' },
                  paypal: { icon: 'payment', label: 'PayPal' },
                  other: { icon: 'more_horiz', label: 'Other' }
                };
                
                // Get the payment methods from the item data
                const paymentMethods = itemData.paymentMethods || [];
                
                // If no payment methods are specified, show all PAYMENT_METHODS from constants
                if (paymentMethods.length === 0) {
                  return Object.entries(PAYMENT_METHODS).map(([method, { icon, label }], index) => html`
                    <div
                      key=${method}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
                      style=${{
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)',
                        color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        animation: 'fadeInUp 0.3s ease-out forwards',
                        animationDelay: `${0.1 + (index * 0.05)}s`
                      }}
                    >
                      <span className="material-icons text-base">${icon}</span>
                      <span className="text-sm font-medium">${label}</span>
                    </div>
                  `);
                }
                
                // Otherwise, show the specified payment methods
                return paymentMethods.map((method, index) => {
                  const paymentMethod = allPaymentMethods[method] || { icon: 'payments', label: method };
                  return html`
                    <div
                      key=${method}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
                      style=${{
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)',
                        color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        animation: 'fadeInUp 0.3s ease-out forwards',
                        animationDelay: `${0.1 + (index * 0.05)}s`
                      }}
                    >
                      <span className="material-icons text-base">${paymentMethod.icon}</span>
                      <span className="text-sm font-medium">${paymentMethod.label}</span>
                    </div>
                  `;
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      <!-- Management Key Modal for Edit -->
      ${showManagementKeyModal && html`
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          style=${{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div 
            className="w-full max-w-md rounded-xl shadow-lg p-6"
            style=${{ 
              backgroundColor: darkMode ? DARK_BG : WHITE,
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 
                className="text-xl font-bold"
                style=${{ color: darkMode ? WHITE : DARK_TEAL }}
              >
                Enter Management Key
              </h2>
              <button
                onClick=${handleCloseModal}
                className="p-1 rounded-full transition-colors duration-200 hover:bg-opacity-10"
                style=${{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  '&:hover': { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <p 
              className="mb-4 text-sm"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
            >
              Please enter the management key you received when you created this listing.
            </p>
            
            <form onSubmit=${handleManagementKeySubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value=${managementKey}
                  onChange=${(e) => setManagementKey(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                  style=${{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? WHITE : DARK_TEAL,
                    border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  }}
                  placeholder="Enter management key"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                  style=${{
                    backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                    color: WHITE
                  }}
                  disabled=${validating}
                >
                  ${validating ? html`
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-t-transparent"
                      style=${{
                        borderColor: WHITE,
                        borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    ></div>
                    <span>Validating...</span>
                  ` : html`
                    <span className="material-icons">vpn_key</span>
                    <span>Submit</span>
                  `}
                </button>
              </div>
            </form>
          </div>
        </div>
      `}
      
      <!-- Management Key Modal for Sold Status -->
      ${showSoldModal && html`
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          style=${{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div 
            className="w-full max-w-md rounded-xl shadow-lg p-6"
            style=${{ 
              backgroundColor: darkMode ? DARK_BG : WHITE,
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 
                className="text-xl font-bold"
                style=${{ color: darkMode ? WHITE : DARK_TEAL }}
              >
                Mark Item as Sold
              </h2>
              <button
                onClick=${handleCloseModal}
                className="p-1 rounded-full transition-colors duration-200 hover:bg-opacity-10"
                style=${{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  '&:hover': { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <p 
              className="mb-4 text-sm"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
            >
              Please enter the management key to mark this item as sold.
            </p>
            
            <form onSubmit=${handleSoldSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value=${managementKey}
                  onChange=${(e) => setManagementKey(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                  style=${{
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? WHITE : DARK_TEAL,
                    border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  }}
                  placeholder="Enter management key"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                  style=${{
                    backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                    color: WHITE
                  }}
                  disabled=${validating}
                >
                  ${validating ? html`
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-t-transparent"
                      style=${{
                        borderColor: WHITE,
                        borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    ></div>
                    <span>Processing...</span>
                  ` : html`
                    <span className="material-icons">sell</span>
                    <span>Mark as Sold</span>
                  `}
                </button>
              </div>
            </form>
          </div>
        </div>
      `}
      
      <!-- Toast Notification -->
      ${toast.show && html`
        <${Toast}
          message=${toast.message}
          type=${toast.type}
          onClose=${closeToast}
          darkMode=${darkMode}
          html=${html}
        />
      `}
    </div>
  `;
}; 
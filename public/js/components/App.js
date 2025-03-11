import { DARK_BG, WHITE, DARK_TEAL, LIGHT_TEAL } from '../utils/constants.js';
import { LazyList } from './LazyList.js';
import { CategoryDropdown } from './CategoryDropdown.js';
import { ThemeToggle } from './ThemeToggle.js';
import { ItemDetail } from './ItemDetail.js';
import { Toast } from './Toast.js';
import { getItemFromCache, setItemInCache, getListFromCache, setListInCache } from '../utils/cache.js';
import { Breadcrumbs } from './Breadcrumbs.js';
import { NewItemForm } from './NewItemForm.js';
import { EditItemForm } from './EditItemForm.js';
import { AdminPanel } from './AdminPanel.js';
import { SearchPage } from './SearchPage.js';
import { categoryIcons, categoryToIconKey } from '../utils/categoryIcons.js';

const CategoryHeader = ({ category, categoryId, onClose, darkMode, html }) => {
  // Get the appropriate icon key for this category
  const getCategoryIcon = () => {
    // Check if category is undefined or null
    if (!category) {
      return categoryIcons.other.replace('stroke="currentColor"', `stroke="${darkMode ? LIGHT_TEAL : DARK_TEAL}"`);
    }
    
    let iconKey = categoryToIconKey[category];
    
    // If no direct match, try normalized comparison
    if (!iconKey) {
      const normalizedName = category.toLowerCase().replace(/[^a-z0-9]/g, '');
      iconKey = Object.entries(categoryToIconKey).find(([key]) => 
        key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName
      )?.[1] || 'other';
    }
    
    // Get the SVG for this icon key
    const iconSvg = categoryIcons[iconKey] || categoryIcons.other;
    const iconColor = darkMode ? LIGHT_TEAL : DARK_TEAL;
    
    return iconSvg.replace('stroke="currentColor"', `stroke="${iconColor}"`);
  };

  return html`
    <div 
      className="sticky top-16 z-40 -mx-4 px-4 py-3 mb-4 backdrop-blur-md"
      style=${{
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            dangerouslySetInnerHTML=${{ __html: getCategoryIcon() }}
            style=${{ 
              color: darkMode ? LIGHT_TEAL : DARK_TEAL,
              display: 'inline-flex',
              verticalAlign: 'middle',
              width: '20px',
              height: '20px',
              position: 'relative',
              top: '-1px'
            }}
          ></span>
          <span 
            className="font-medium"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >
            ${category}
          </span>
        </div>
        <a
          href="/"
          onClick=${(e) => {
            e.preventDefault();
            onClose();
          }}
          className="p-1.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors duration-200"
          aria-label="Clear category filter"
        >
          <span 
            className="material-icons text-base"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
          >close</span>
        </a>
      </div>
    </div>
  `;
};

const API_TIMEOUT = 30000; // 30 seconds

export const App = ({ html }) => {
  const [darkMode, setDarkMode] = React.useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      return true;
    }
    document.documentElement.classList.remove('dark');
    return false;
  });
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentRoute, setCurrentRoute] = React.useState(getRouteFromHash());
  const [error, setError] = React.useState(null);
  const [itemData, setItemData] = React.useState(null);
  const [listData, setListData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [managementKey, setManagementKey] = React.useState('');
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });

  // Helper function to get the route from the hash
  function getRouteFromHash() {
    // Remove the # and return the path, or default to '/'
    return window.location.hash ? window.location.hash.substring(1) : '/';
  }

  // Helper function to navigate to a new route
  function navigateTo(route) {
    window.location.hash = route;
    setCurrentRoute(route);
  }

  const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw err;
    }
  };

  const fetchItemDetails = async (itemId) => {
    setLoading(true);
    setError(null);
    
    // If we already have the item data from an edit, use it
    if (itemData && (
      (Array.isArray(itemData) && itemData[0]?.id === parseInt(itemId)) || 
      (!Array.isArray(itemData) && itemData.id === parseInt(itemId))
    )) {
      setLoading(false);
      return;
    }
    
    try {
      // Check cache first
      const cachedItem = getItemFromCache(itemId);
      if (cachedItem) {
        setItemData(cachedItem);
        setLoading(false);
        return;
      }
      
      const response = await fetchWithTimeout(`/api/v1/items/${itemId}`);
      if (!response.ok) throw new Error('Failed to fetch item details');
      const data = await response.json();
      
      // Normalize data to ensure compatibility with both old and new item formats
      const normalizedData = {
        ...data,
        // Ensure shipping is always an array
        shipping: Array.isArray(data.shipping) ? data.shipping : [data.shipping].filter(Boolean),
        // Ensure paymentMethods is always an array
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
        // Ensure teams_link is available
        teams_link: data.teams_link || data.teamsLink || null
      };
      
      // Cache the response
      setItemInCache(itemId, normalizedData);
      setItemData(normalizedData);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching item:', err);
        setError(err.message);
        setToast({
          show: true,
          message: `Error fetching item details: ${err.message}`,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (category = null, search = '') => {
    setLoading(true);
    setError(null);

    const params = { category, search };
    
    try {
      // Check cache first
      const cachedList = getListFromCache(params);
      if (cachedList) {
        setListData(cachedList);
        setLoading(false);
        return;
      }

      let endpoint;
      
      if (search) {
        // Use the dedicated search endpoint
        endpoint = `/api/v1/items/search?q=${encodeURIComponent(search)}`;
        if (category) {
          endpoint += `&category=${category}`;
        }
      } else if (category) {
        endpoint = `/api/v1/items/category/${category}`;
      } else {
        endpoint = '/api/v1/items';
      }

      const response = await fetchWithTimeout(endpoint);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      
      // Normalize data to ensure compatibility with both old and new item formats
      const normalizedData = data.map(item => ({
        ...item,
        // Ensure shipping is always an array
        shipping: Array.isArray(item.shipping) ? item.shipping : [item.shipping].filter(Boolean),
        // Ensure paymentMethods is always an array
        paymentMethods: Array.isArray(item.paymentMethods) ? item.paymentMethods : [],
        // Ensure teams_link is available
        teams_link: item.teams_link || item.teamsLink || null
      }));
      
      // Cache the response
      setListInCache(params, normalizedData);
      setListData(normalizedData);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle hash change events
  React.useEffect(() => {
    const handleHashChange = () => {
      const route = getRouteFromHash();
      setCurrentRoute(route);
      
      // Don't fetch items if we're on a search route - the SearchPage component will handle that
      if (route.startsWith('/search/')) {
        // Just extract the search query from the route and set it
        const query = decodeURIComponent(route.substring('/search/'.length));
        setSearchQuery(query);
        return;
      }
      
      if (route === '/') {
        setSelectedCategory(null);
        setSelectedCategoryName('');
        setListData([]); // Clear current list
        fetchItems(null, searchQuery);
      } else if (route.startsWith('/category/')) {
        const categoryId = route.split('/').pop();
        setSelectedCategory(categoryId);
        
        // Fetch category name if not already set
        if (!selectedCategoryName) {
          fetch(`/api/v1/categories/${categoryId}`)
            .then(response => response.json())
            .then(data => {
              if (data && data.name) {
                setSelectedCategoryName(data.name);
              }
            })
            .catch(err => console.error('Error fetching category name:', err));
        }
        
        setListData([]); // Clear current list
        fetchItems(categoryId, searchQuery);
      } else if (route.startsWith('/item/')) {
        const itemId = route.split('/').pop();
        fetchItemDetails(itemId);
      } else if (route.startsWith('/edit-item/')) {
        const itemId = route.split('/').pop().split('?')[0];
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const key = urlParams.get('key');
        
        if (key) {
          setManagementKey(key);
        }
        
        fetchItemDetails(itemId);
      }
    };
    
    // Initial route handling
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [searchQuery, selectedCategoryName]);

  // Add event listener for route changes from the ItemDetail component
  React.useEffect(() => {
    const handleRouteChangeEvent = (event) => {
      if (event.detail && event.detail.route) {
        // Use hash-based navigation
        navigateTo(event.detail.route);
        
        if (event.detail.updatedItem) {
          setItemData(event.detail.updatedItem);
        }
        if (event.detail.managementKey) {
          setManagementKey(event.detail.managementKey);
        }
      }
    };
    
    window.addEventListener('routechange', handleRouteChangeEvent);
    return () => window.removeEventListener('routechange', handleRouteChangeEvent);
  }, []);

  // Add initial load effect
  React.useEffect(() => {
    // Only fetch items if we're on the home route and haven't loaded items yet
    if (currentRoute === '/' && listData.length === 0) {
      fetchItems(selectedCategory, searchQuery);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Add event listener for search events
  React.useEffect(() => {
    const handleSearchEvent = (event) => {
      // Set the search query
      setSearchQuery(event.detail.query);
      
      // If we're on a search page, don't trigger a search
      if (currentRoute.startsWith('/search/')) {
        return;
      }
      
      // If we're on the home page or a category page, trigger a search
      if (currentRoute === '/' || currentRoute.startsWith('/category/')) {
        fetchItems(selectedCategory, event.detail.query);
      }
    };
    
    window.addEventListener('search', handleSearchEvent);
    return () => window.removeEventListener('search', handleSearchEvent);
  }, [currentRoute, selectedCategory]);

  const handleHomeClick = () => {
    navigateTo('/');
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategorySelect = (categoryId, categoryName) => {
    setSelectedCategory(categoryId);
    if (categoryName) {
      setSelectedCategoryName(categoryName);
    } else {
      // Fetch category name if not provided
      fetch(`/api/v1/categories/${categoryId}`)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Failed to fetch category');
        })
        .then(data => {
          if (data && data.name) {
            setSelectedCategoryName(data.name);
          } else {
            // Fallback to a generic name
            setSelectedCategoryName('Category ' + categoryId);
          }
        })
        .catch(err => {
          console.error('Error fetching category name:', err);
          // Fallback to a generic name
          setSelectedCategoryName('Category ' + categoryId);
        });
    }
    navigateTo(`/category/${categoryId}`);
    fetchItems(categoryId, searchQuery);
  };

  const handleCategoryClose = () => {
    setSelectedCategory(null);
    setSelectedCategoryName('');
    navigateTo('/');
    fetchItems(null, searchQuery);
  };

  const handleListNewItem = () => {
    // Navigate to the new item listing page
    navigateTo('/list-new-item');
  };

  const handleAdminPanel = () => {
    // Navigate to the admin panel
    navigateTo('/admin');
  };

  const renderContent = () => {
    if (error) return null; // Error will be shown via Toast
    
    // Check if currentRoute is defined before using startsWith
    if (!currentRoute) {
      return null;
    }

    if (currentRoute.startsWith('/item/')) {
      return html`<${ItemDetail} 
        item=${itemData}
        loading=${loading}
        onBack=${handleHomeClick}
        darkMode=${darkMode}
        html=${html}
      />`;
    }

    if (currentRoute.startsWith('/edit-item/')) {
      return html`<${EditItemForm}
        item=${itemData}
        managementKey=${managementKey}
        onBack=${handleHomeClick}
        darkMode=${darkMode}
        html=${html}
      />`;
    }

    if (currentRoute === '/list-new-item') {
      return html`
        <div className="max-w-3xl mx-auto">
          <div 
            className="sticky top-0 z-10 -mx-4 px-4 py-4 mb-4 transition-all duration-300"
            style=${{
              backgroundColor: darkMode ? `${DARK_BG}CC` : `${WHITE}CC`,
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
            }}
          >
            <div className="flex items-center justify-between">
              <h1 
                className="text-2xl font-bold"
                style=${{ color: darkMode ? WHITE : DARK_TEAL }}
              >
                List New Item
              </h1>
              <button
                onClick=${handleHomeClick}
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
          <${NewItemForm} darkMode=${darkMode} html=${html} />
        </div>
      `;
    }

    if (currentRoute === '/admin') {
      return html`<${AdminPanel}
        darkMode=${darkMode}
        onBack=${handleHomeClick}
        html=${html}
      />`;
    }
    
    if (currentRoute.startsWith('/search/')) {
      // Extract search query from the route
      const searchQuery = decodeURIComponent(currentRoute.substring('/search/'.length));
      
      return html`<${SearchPage}
        darkMode=${darkMode}
        onBack=${handleHomeClick}
        html=${html}
        searchQuery=${searchQuery}
      />`;
    }

    return html`
      ${currentRoute.startsWith('/category/') && html`
        <${CategoryHeader}
          category=${selectedCategoryName}
          categoryId=${selectedCategory}
          onClose=${handleCategoryClose}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      <${LazyList} 
        items=${listData}
        loading=${loading}
        selectedCategory=${selectedCategory} 
        onSelectCategory=${handleCategorySelect}
        darkMode=${darkMode}
        html=${html}
        setCurrentRoute=${setCurrentRoute}
      />
    `;
  };

  return html`
    <div 
      className="min-h-screen transition-colors duration-200"
      style=${{ backgroundColor: darkMode ? DARK_BG : WHITE }}
    >
      ${error && html`
        <${Toast}
          message=${error}
          type="error"
          onClose=${() => setError(null)}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      ${toast.show && html`
        <${Toast}
          message=${toast.message}
          type=${toast.type}
          onClose=${() => setToast({ ...toast, show: false })}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      <nav 
        className="sticky top-0 z-50 backdrop-blur-md shadow-lg transition-all duration-200"
        style=${{ 
          backgroundColor: darkMode ? 'rgba(16, 68, 3, 0.95)' : 'rgba(61, 167, 0, 0.95)',
          borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)')
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <!-- Left Section: Logo -->
            <div className="flex items-center">
              <a 
                href="/"
                onClick=${(e) => {
                  e.preventDefault();
                  handleHomeClick();
                }}
                className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
                style=${{
                  color: WHITE
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm">
                  <span className="material-icons text-2xl">storefront</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">UKG Market Place</h1>
              </a>
            </div>

            <!-- Center Section: Categories -->
            <div className="flex items-center">
              <${CategoryDropdown}
                darkMode=${darkMode}
                onSelectCategory=${handleCategorySelect}
                html=${html}
              />
            </div>

            <!-- Right Section: Actions -->
            <div className="flex items-center gap-3">
              <!-- List New Item Button -->
              <button
                onClick=${handleListNewItem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-white hover:bg-opacity-20"
                style=${{
                  color: WHITE,
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                }}
              >
                <span className="material-icons">add_circle</span>
                <span className="hidden sm:inline">List Item</span>
              </button>

              <!-- Admin Panel Button -->
              <button
                onClick=${handleAdminPanel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-white hover:bg-opacity-10"
                style=${{
                  color: WHITE,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <span className="material-icons">admin_panel_settings</span>
                <span className="hidden sm:inline">Admin</span>
              </button>

              <!-- RSS Feed Button -->
              <a
                href="/api/v1/rss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white hover:bg-opacity-10"
                style=${{
                  color: WHITE,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
                title="RSS Feed"
              >
                <span className="material-icons">rss_feed</span>
                <span className="hidden sm:inline">RSS</span>
              </a>

              <!-- Theme Toggle -->
              <${ThemeToggle}
                darkMode=${darkMode}
                setDarkMode=${setDarkMode}
                html=${html}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        ${renderContent()}
      </main>
    </div>
  `;
}; 
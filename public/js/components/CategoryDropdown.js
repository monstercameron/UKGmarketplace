import { WHITE, DARK_TEAL, LIGHT_TEAL } from '../utils/constants.js';
import { Toast } from './Toast.js';
import { categoryIcons, categoryToIconKey } from '../utils/categoryIcons.js';

const CACHE_KEY = 'cached_categories';
const CACHE_EXPIRY_KEY = 'categories_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const API_TIMEOUT = 10000; // Reduced to 10 seconds for faster feedback

// Standard categories - exactly matching the 20 categories in CategorySelectionSection.js
const STANDARD_CATEGORIES = [
  { id: 1, name: 'Electronics', slug: 'electronics' },
  { id: 2, name: 'Computers', slug: 'computers' },
  { id: 3, name: 'Mobile Phones', slug: 'mobile-phones' },
  { id: 4, name: 'Home & Kitchen', slug: 'home-kitchen' },
  { id: 5, name: 'Furniture', slug: 'furniture' },
  { id: 6, name: 'Clothing', slug: 'clothing' },
  { id: 7, name: 'Books & Media', slug: 'books-media' },
  { id: 8, name: 'Sports & Outdoors', slug: 'sports-outdoors' },
  { id: 9, name: 'Toys & Games', slug: 'toys-games' },
  { id: 10, name: 'Automotive', slug: 'automotive' },
  { id: 11, name: 'Health & Beauty', slug: 'health-beauty' },
  { id: 12, name: 'Jewelry', slug: 'jewelry' },
  { id: 13, name: 'Art & Collectibles', slug: 'art-collectibles' },
  { id: 14, name: 'Musical Instruments', slug: 'musical-instruments' },
  { id: 15, name: 'Office Supplies', slug: 'office-supplies' },
  { id: 16, name: 'Pet Supplies', slug: 'pet-supplies' },
  { id: 17, name: 'Home Improvement', slug: 'home-improvement' },
  { id: 18, name: 'Garden & Outdoor', slug: 'garden-outdoor' },
  { id: 19, name: 'Baby & Kids', slug: 'baby-kids' },
  { id: 20, name: 'Other', slug: 'other' },
  { id: 21, name: 'Housing', slug: 'housing' }
];

// Category name mappings for legacy/alternative names
const CATEGORY_NAME_MAPPINGS = {
  'computers & laptops': 'Computers',
  'smartphones': 'Mobile Phones',
  'tvs & monitors': 'Electronics',
  'audio equipment': 'Electronics',
  'gaming': 'Toys & Games',
  'home appliances': 'Home & Kitchen',
  'housing rentals': 'Housing',
  'real estate': 'Housing',
  'apartments': 'Housing',
  'rental properties': 'Housing',
  'houses for sale': 'Housing',
  'houses for rent': 'Housing',
  'cars & trucks': 'Automotive',
  'clothing & apparel': 'Clothing',
  'books & magazines': 'Books & Media',
  'sports equipment': 'Sports & Outdoors',
  'event tickets': 'Art & Collectibles'
};

export const CategoryDropdown = ({ darkMode, onSelectCategory, html }) => {
  const [categories, setCategories] = React.useState(STANDARD_CATEGORIES);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showAllCategories, setShowAllCategories] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Define the primary categories to always show (most common/important ones)
  const PRIMARY_CATEGORIES = [
    'Electronics', 
    'Computers', 
    'Mobile Phones', 
    'Furniture', 
    'Clothing', 
    'Books & Media',
    'Toys & Games',
    'Automotive'
  ];

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
        throw new Error('Request timed out after 10 seconds');
      }
      throw err;
    }
  };

  React.useEffect(() => {
    const fetchAndCacheCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to fetch from API with timeout
        try {
          const response = await fetchWithTimeout('/api/v1/categories');
          if (!response.ok) throw new Error('Failed to fetch categories');
          const data = await response.json();
          
          // Map API categories to our standard categories
          const mappedCategories = STANDARD_CATEGORIES.map(standardCat => {
            // Try to find a matching category from the API
            const apiMatch = data.find(apiCat => {
              // Try exact match
              if (apiCat.name === standardCat.name) return true;
              
              // Try mapped name
              const mappedName = CATEGORY_NAME_MAPPINGS[apiCat.name.toLowerCase()];
              if (mappedName === standardCat.name) return true;
              
              // Try normalized match
              const normalizedApiName = apiCat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const normalizedStandardName = standardCat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normalizedApiName === normalizedStandardName;
            });
            
            // If found, use the API category's ID, otherwise keep the standard ID
            return apiMatch ? { ...standardCat, id: apiMatch.id } : standardCat;
          });
          
          // Cache the categories and expiry time
          localStorage.setItem(CACHE_KEY, JSON.stringify(mappedCategories));
          localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
          
          setCategories(mappedCategories);
        } catch (err) {
          console.error('Error fetching categories from API:', err);
          
          // Try to load from cache if API fails
          loadCategories();
        } finally {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchAndCacheCategories:', err);
        setError('Failed to load categories');
        setIsLoading(false);
      }
    };
    
    const loadCategories = () => {
      try {
        // Check if we have cached categories and they're not expired
        const cachedExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
        const cachedCategories = localStorage.getItem(CACHE_KEY);
        
        if (cachedCategories && cachedExpiry && Number(cachedExpiry) > Date.now()) {
          // Use cached categories
          setCategories(JSON.parse(cachedCategories));
        } else {
          // Use standard categories as fallback
          setCategories(STANDARD_CATEGORIES);
        }
      } catch (err) {
        console.error('Error loading cached categories:', err);
        // Use standard categories as fallback
        setCategories(STANDARD_CATEGORIES);
      }
    };
    
    // Try to load from cache first for immediate display
    loadCategories();
    
    // Then fetch fresh data from API
    fetchAndCacheCategories();
  }, []);
  
  // Handle clicks outside the dropdown to close it
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sort categories alphabetically by name
  const sortedCategories = [...categories].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return html`
    <div className="relative" ref=${dropdownRef}>
      ${error && html`
        <${Toast}
          message=${error}
          type="error"
          onClose=${() => setError(null)}
          darkMode=${darkMode}
          html=${html}
        />
      `}
      <button
        onClick=${() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-white hover:bg-opacity-10"
        style=${{
          color: WHITE
        }}
      >
        <div className="flex items-center gap-2">
          <span dangerouslySetInnerHTML=${{ __html: categoryIcons.other }}></span>
          <span className="text-sm font-medium">Categories</span>
        </div>
        <span className="material-icons text-lg transition-transform duration-200" style=${{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      ${isOpen && html`
        <div 
          className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg border border-white border-opacity-10 backdrop-blur-md overflow-hidden category-dropdown-menu"
          style=${{
            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            animation: 'fadeIn 0.2s ease-out',
            maxHeight: '70vh',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode ? 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.3) rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="py-2">
            <button
              onClick=${() => {
                onSelectCategory(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200 sticky top-0 z-10"
              style=${{
                color: darkMode ? WHITE : DARK_TEAL,
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)'
                }
              }}
            >
              <span dangerouslySetInnerHTML=${{ __html: categoryIcons.other.replace('stroke="currentColor"', `stroke="${darkMode ? WHITE : DARK_TEAL}"`) }}></span>
              <span>All Categories</span>
            </button>
            
            <div className="h-px mx-3 my-2" style=${{ backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}></div>
            
            ${(() => {
              // Filter categories based on showAllCategories state
              const displayCategories = showAllCategories 
                ? sortedCategories 
                : sortedCategories.filter(category => PRIMARY_CATEGORIES.includes(category.name));
              
              // Render the filtered categories
              const categoryButtons = displayCategories.map(category => {
                // Get the appropriate icon key for this category using the same logic as CategorySelectionSection
                let iconKey = categoryToIconKey[category.name];
                if (!iconKey) {
                  // Try normalized comparison (remove spaces, lowercase)
                  const normalizedName = category.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  iconKey = Object.entries(categoryToIconKey).find(([key]) => 
                    key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName
                  )?.[1] || 'other';
                }
                const iconSvg = categoryIcons[iconKey] || categoryIcons.other;
                
                return html`
                  <button
                    key=${category.id}
                    onClick=${() => {
                      onSelectCategory(category.id, category.name);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200"
                    style=${{
                      color: darkMode ? WHITE : DARK_TEAL,
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.05)'
                      }
                    }}
                  >
                    <span dangerouslySetInnerHTML=${{ __html: iconSvg.replace('stroke="currentColor"', `stroke="${darkMode ? WHITE : DARK_TEAL}"`) }}></span>
                    <span>${category.name}</span>
                  </button>
                `;
              });
              
              // Add "More Categories" button if not showing all categories
              if (!showAllCategories && sortedCategories.length > PRIMARY_CATEGORIES.length) {
                const moreButton = html`
                  <button
                    onClick=${(e) => {
                      e.stopPropagation();
                      setShowAllCategories(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200 mt-1"
                    style=${{
                      color: darkMode ? LIGHT_TEAL : DARK_TEAL,
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)',
                      borderTop: '1px dashed ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)'
                      }
                    }}
                  >
                    <span className="material-icons text-sm">expand_more</span>
                    <span>More Categories</span>
                  </button>
                `;
                return [...categoryButtons, moreButton];
              }
              
              // Add "Show Less" button if showing all categories
              if (showAllCategories && sortedCategories.length > PRIMARY_CATEGORIES.length) {
                const lessButton = html`
                  <button
                    onClick=${(e) => {
                      e.stopPropagation();
                      setShowAllCategories(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200 mt-1"
                    style=${{
                      color: darkMode ? LIGHT_TEAL : DARK_TEAL,
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)',
                      borderTop: '1px dashed ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)'
                      }
                    }}
                  >
                    <span className="material-icons text-sm">expand_less</span>
                    <span>Show Less</span>
                  </button>
                `;
                return [...categoryButtons, lessButton];
              }
              
              return categoryButtons;
            })()}
          </div>
        </div>
      `}
    </div>
  `;
}; 
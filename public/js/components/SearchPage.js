import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../utils/constants.js';
import { Toast } from './Toast.js';
import { Breadcrumbs } from './Breadcrumbs.js';

export const SearchPage = ({ darkMode, onBack, html, searchQuery }) => {
  // State for items and pagination
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });
  
  // Search state
  const [inputValue, setInputValue] = React.useState(searchQuery);
  
  // Sorting state
  const [sortField, setSortField] = React.useState('title');
  const [sortDirection, setSortDirection] = React.useState('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  
  // Fetch items with pagination
  const fetchItems = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/items/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      const data = await response.json();
      const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
      const calculatedTotalPages = Math.ceil(totalCount / itemsPerPage) || 1;
      
      setItems(data);
      setTotalItems(totalCount);
      setTotalPages(calculatedTotalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError(err.message);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load items on component mount and when page or search query changes
  React.useEffect(() => {
    fetchItems(currentPage);
    setInputValue(searchQuery);
  }, [currentPage, searchQuery]);
  
  // Handle item click
  const handleItemClick = (itemId) => {
    window.location.hash = `/item/${itemId}`;
  };
  
  // Handle back button click
  const handleBack = (e) => {
    if (e) e.preventDefault();
    onBack();
  };
  
  // Handle search input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      window.location.hash = `/search/${encodeURIComponent(inputValue.trim())}`;
    }
  };
  
  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setInputValue('');
    // Focus the input after clearing
    document.getElementById('search-input').focus();
  };
  
  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sorted items
  const getSortedItems = () => {
    if (!items || items.length === 0) return [];
    
    return [...items].sort((a, b) => {
      let aValue, bValue;
      
      // Extract values based on sort field
      switch (sortField) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'category':
          aValue = a.category_name || '';
          bValue = b.category_name || '';
          break;
        case 'price':
          aValue = parseFloat(a.price || 0);
          bValue = parseFloat(b.price || 0);
          break;
        case 'status':
          aValue = a.sold ? 1 : 0;
          bValue = b.sold ? 1 : 0;
          break;
        default:
          aValue = a.title || '';
          bValue = b.title || '';
      }
      
      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
    });
  };
  
  // Pagination controls
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
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
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Get sorted items
  const sortedItems = getSortedItems();

  return html`
    <div className="max-w-4xl mx-auto pb-16">
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
        className="sticky top-0 z-10 -mx-4 px-4 py-4 mb-4 transition-all duration-300"
        style=${{
          backgroundColor: darkMode ? `${DARK_BG}CC` : `${WHITE}CC`,
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="slide-in-left">
            <${Breadcrumbs} 
              darkMode=${darkMode} 
              html=${html}
              items=${[
                { text: 'Home', link: true, onClick: handleBack },
                { text: `Search: "${searchQuery}"` }
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
            <span>Back to Home</span>
          </button>
        </div>
        
        <!-- Search Input -->
        <form 
          onSubmit=${handleSearchSubmit}
          className="w-full fade-in-up"
        >
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value=${inputValue}
              onChange=${handleInputChange}
              onKeyPress=${handleKeyPress}
              placeholder="Search items..."
              className="w-full px-4 py-2 pl-10 pr-16 rounded-lg transition-all duration-300"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)'
              }}
            />
            <span 
              className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >search</span>
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
              ${inputValue && html`
                <button
                  type="button"
                  onClick=${handleClearSearch}
                  className="p-1 mr-1 rounded-full hover:bg-black hover:bg-opacity-10"
                  style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                  aria-label="Clear search"
                >
                  <span className="material-icons">close</span>
                </button>
              `}
              
              <button
                type="submit"
                className="px-3 py-1 rounded-lg transition-all duration-200"
                style=${{
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  color: WHITE,
                  fontSize: '0.875rem'
                }}
                disabled=${!inputValue.trim()}
                aria-label="Search"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div 
        className="mb-6 p-4 rounded-lg fade-in-up"
        style=${{
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 48, 135, 0.05)',
          borderLeft: `4px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}`
        }}
      >
        <h1 
          className="text-xl font-bold mb-2"
          style=${{ color: darkMode ? WHITE : DARK_TEAL }}
        >
          Search Results for "${searchQuery}"
        </h1>
        <p
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
        >
          Found ${totalItems} item${totalItems !== 1 ? 's' : ''}
        </p>
      </div>
      
      ${loading ? html`
        <div 
          className="flex justify-center items-center py-12"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
        >
          <div className="animate-spin mr-2">
            <span className="material-icons">refresh</span>
          </div>
          <span>Loading search results...</span>
        </div>
      ` : html`
        ${items.length === 0 ? html`
          <div 
            className="text-center py-12 rounded-lg fade-in-up"
            style=${{ 
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
            }}
          >
            <span className="material-icons text-5xl mb-4">search_off</span>
            <h2 className="text-xl font-medium mb-2">No results found</h2>
            <p>Try different search terms or browse categories instead.</p>
            <button
              onClick=${handleBack}
              className="mt-4 px-4 py-2 rounded-lg transition-all duration-200"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                color: darkMode ? WHITE : DARK_TEAL
              }}
            >
              Back to Home
            </button>
          </div>
        ` : html`
          <div className="overflow-x-auto fade-in-up">
            <table 
              className="w-full border-collapse"
              style=${{ 
                borderRadius: '0.5rem',
                overflow: 'hidden'
              }}
            >
              <thead>
                <tr style=${{ 
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                  color: darkMode ? WHITE : DARK_TEAL
                }}>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick=${() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      <span>Item</span>
                      ${sortField === 'title' && html`
                        <span className="material-icons text-sm ml-1">
                          ${sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      `}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick=${() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      <span>Category</span>
                      ${sortField === 'category' && html`
                        <span className="material-icons text-sm ml-1">
                          ${sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      `}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick=${() => handleSort('price')}
                  >
                    <div className="flex items-center">
                      <span>Price</span>
                      ${sortField === 'price' && html`
                        <span className="material-icons text-sm ml-1">
                          ${sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      `}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick=${() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      ${sortField === 'status' && html`
                        <span className="material-icons text-sm ml-1">
                          ${sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      `}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${sortedItems.map((item, index) => html`
                  <tr 
                    key=${item.id}
                    style=${{ 
                      backgroundColor: darkMode 
                        ? index % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)'
                        : index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.04)',
                      color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-md mr-3 bg-cover bg-center"
                          style=${{ 
                            backgroundImage: `url(${item.image_url || '/images/placeholder.jpg'})`,
                            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
                          }}
                        ></div>
                        <div className="truncate max-w-[200px]">${item.title}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">${item.category_name || 'Uncategorized'}</td>
                    <td className="px-4 py-3">${item.price ? `$${parseFloat(item.price).toFixed(2)}` : 'Free'}</td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 rounded-full text-xs"
                        style=${{ 
                          backgroundColor: item.sold 
                            ? (darkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)') 
                            : (darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'),
                          color: item.sold 
                            ? (darkMode ? 'rgba(252, 165, 165, 1)' : 'rgba(220, 38, 38, 1)') 
                            : (darkMode ? 'rgba(167, 243, 208, 1)' : 'rgba(16, 185, 129, 1)')
                        }}
                      >
                        ${item.sold ? 'Sold' : 'Available'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick=${() => handleItemClick(item.id)}
                        className="px-3 py-1 rounded-lg text-sm transition-all duration-200"
                        style=${{
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                          color: darkMode ? WHITE : DARK_TEAL
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
          
          <!-- Pagination Controls -->
          <div className="flex items-center justify-between mt-6 fade-in-up">
            <div 
              className="text-sm"
              style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            >
              Showing page ${currentPage} of ${totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick=${handlePreviousPage}
                disabled=${currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                  color: darkMode ? WHITE : DARK_TEAL,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <span className="material-icons text-sm">chevron_left</span>
                <span>Previous</span>
              </button>
              
              <div 
                className="px-3 py-1.5 rounded-lg"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 48, 135, 0.15)',
                  color: darkMode ? WHITE : DARK_TEAL
                }}
              >
                ${currentPage}
              </div>
              
              <button
                onClick=${handleNextPage}
                disabled=${currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                  color: darkMode ? WHITE : DARK_TEAL,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                <span>Next</span>
                <span className="material-icons text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        `}
      `}
    </div>
  `;
}; 
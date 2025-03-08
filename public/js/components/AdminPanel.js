import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../utils/constants.js';
import { Toast } from './Toast.js';
import { Breadcrumbs } from './Breadcrumbs.js';
import { clearAllCaches } from '../utils/cache.js';

export const AdminPanel = ({ darkMode, onBack, html }) => {
  // State for items and pagination
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'error' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState('');
  
  // Check for stored authentication on mount
  React.useEffect(() => {
    const checkStoredAuth = () => {
      const storedAuth = localStorage.getItem('adminAuth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          const expiryTime = new Date(authData.expiry);
          
          if (expiryTime > new Date()) {
            // Still valid, extend by another minute
            setIsAuthenticated(true);
            extendAuthExpiry();
          } else {
            // Expired, remove from storage
            localStorage.removeItem('adminAuth');
          }
        } catch (err) {
          console.error('Error parsing stored auth:', err);
          localStorage.removeItem('adminAuth');
        }
      }
    };
    
    checkStoredAuth();
    
    // Set up interval to check expiry
    const interval = setInterval(checkStoredAuth, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to extend auth expiry
  const extendAuthExpiry = () => {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 1); // Extend by 1 minute
    
    localStorage.setItem('adminAuth', JSON.stringify({
      authenticated: true,
      expiry: expiryTime.toISOString()
    }));
  };
  
  // Fetch items with pagination
  const fetchItems = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/items?page=${page}&limit=${itemsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
      const calculatedTotalPages = Math.ceil(totalCount / itemsPerPage) || 1;
      
      setItems(data);
      setTotalPages(calculatedTotalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching items:', err);
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
  
  // Load items on component mount and when page changes
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchItems(currentPage);
    }
  }, [currentPage, isAuthenticated]);
  
  // Handle admin login
  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, this would be validated against a server endpoint
    // that checks the password against the ADMIN_PASSWORD environment variable
    if (adminPassword === 'password') {
      setIsAuthenticated(true);
      setAdminPassword('');
      
      // Store authentication in localStorage with 1 minute expiry
      extendAuthExpiry();
      
      setToast({
        show: true,
        message: 'Login successful',
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: 'Invalid admin password',
        type: 'error'
      });
    }
  };
  
  // Handle marking an item as sold
  const handleToggleSold = async (itemId, currentSoldStatus) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/v1/items/${itemId}?management_key=admin-master-key`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sold: !currentSoldStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update item');
      }
      
      // Update the local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, sold: !currentSoldStatus } : item
        )
      );
      
      setToast({
        show: true,
        message: `Item ${currentSoldStatus ? 'unmarked' : 'marked'} as sold`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating item:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deleting an item
  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Pass management key as a query parameter
      const response = await fetch(`/api/v1/items/${itemId}?management_key=admin-master-key`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete item');
      }
      
      // Remove the item from the local state
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      // Clear all caches to ensure deleted item doesn't appear in UI
      clearAllCaches();
      
      setToast({
        show: true,
        message: 'Item deleted successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle editing an item
  const handleEdit = (itemId) => {
    // Navigate to the edit page
    window.location.hash = `/edit-item/${itemId}`;
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
  
  // Render login form if not authenticated
  if (!isAuthenticated) {
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
                { text: 'Admin Panel' }
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
              <span>Back to Home</span>
            </button>
          </div>
        </div>
        
        <div 
          className="rounded-xl shadow-lg p-8 backdrop-blur-sm"
          style=${{
            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
          }}
        >
          <h1 
            className="text-2xl font-bold mb-6 flex items-center gap-2"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >
            <span className="material-icons">admin_panel_settings</span>
            Admin Login
          </h1>
          
          <form onSubmit=${handleLogin} className="space-y-6">
            <div>
              <label 
                className="block mb-2 text-sm font-medium"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                Admin Password
              </label>
              <input
                type="password"
                value=${adminPassword}
                onChange=${(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg transition-all duration-300 focus:ring-2 focus:outline-none"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  color: darkMode ? WHITE : DARK_TEAL,
                  border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                }}
                placeholder="Enter admin password"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
                style=${{
                  backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                  color: WHITE
                }}
              >
                <span className="material-icons">login</span>
                <span>Login</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
  
  // Render admin panel if authenticated
  return html`
    <div className="max-w-7xl mx-auto pb-16">
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
              { text: 'Admin Panel' }
            ]} 
          />
          <div className="flex items-center gap-2">
            <button
              onClick=${() => window.location.hash = '/list-new-item'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style=${{
                backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
                color: WHITE
              }}
            >
              <span className="material-icons">add</span>
              <span>Add New Item</span>
            </button>
            <button
              onClick=${onBack}
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
      
      <div 
        className="rounded-xl shadow-lg p-6 backdrop-blur-sm mb-8"
        style=${{
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 
            className="text-2xl font-bold flex items-center gap-2"
            style=${{ color: darkMode ? WHITE : DARK_TEAL }}
          >
            <span className="material-icons">inventory_2</span>
            Manage Items
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label 
                className="text-sm font-medium"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                Items per page:
              </label>
              <select
                value=${itemsPerPage}
                onChange=${(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                  fetchItems(1);
                }}
                className="px-2 py-1 rounded-lg text-sm"
                style=${{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: darkMode ? WHITE : DARK_TEAL,
                  border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            
            <button
              onClick=${() => {
                setCurrentPage(1);
                fetchItems(1);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm"
              style=${{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 48, 135, 0.1)',
                color: darkMode ? WHITE : DARK_TEAL
              }}
            >
              <span className="material-icons text-sm">refresh</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        ${loading && items.length === 0 ? html`
          <div className="flex justify-center p-8">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-4" 
              style=${{ 
                borderColor: darkMode ? `${LIGHT_TEAL}` : `${DARK_TEAL}`,
                borderTopColor: 'transparent'
              }}
            ></div>
          </div>
        ` : html`
          <div className="overflow-x-auto">
            <table className="w-full" style=${{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-sm font-medium"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >ID</th>
                  <th 
                    className="px-4 py-2 text-left text-sm font-medium"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >Title</th>
                  <th 
                    className="px-4 py-2 text-left text-sm font-medium"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >Price</th>
                  <th 
                    className="px-4 py-2 text-left text-sm font-medium"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >Category</th>
                  <th 
                    className="px-4 py-2 text-left text-sm font-medium"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >Date</th>
                  <th 
                    className="px-4 py-2 text-left text-sm font-medium"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >Sold</th>
                  <th 
                    className="px-4 py-2 text-left text-sm font-medium"
                    style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                  >Actions</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0 ? html`
                  <tr>
                    <td 
                      colSpan="7" 
                      className="text-center py-8"
                      style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                    >
                      No items found
                    </td>
                  </tr>
                ` : items.map(item => html`
                  <tr 
                    key=${item.id}
                    className="transition-colors duration-200"
                    style=${{
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <td 
                      className="px-4 py-3 rounded-l-lg"
                      style=${{ color: darkMode ? WHITE : DARK_TEAL }}
                    >${item.id}</td>
                    <td 
                      className="px-4 py-3"
                      style=${{ color: darkMode ? WHITE : DARK_TEAL }}
                    >
                      <div className="flex items-center gap-2">
                        ${item.sold && html`
                          <span 
                            className="inline-block px-2 py-0.5 text-xs rounded-full"
                            style=${{
                              backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                              color: '#EF4444'
                            }}
                          >SOLD</span>
                        `}
                        <span className=${item.sold ? 'line-through opacity-70' : ''}>${item.title}</span>
                      </div>
                    </td>
                    <td 
                      className="px-4 py-3"
                      style=${{ color: darkMode ? WHITE : DARK_TEAL }}
                    >$${item.price.toFixed(2)}</td>
                    <td 
                      className="px-4 py-3"
                      style=${{ color: darkMode ? WHITE : DARK_TEAL }}
                    >${item.category_name || 'Uncategorized'}</td>
                    <td 
                      className="px-4 py-3"
                      style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
                    >${new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked=${item.sold || false}
                          onChange=${() => handleToggleSold(item.id, item.sold || false)}
                        />
                        <div 
                          className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style=${{
                            backgroundColor: (item.sold || false) ? LIGHT_TEAL : 'rgba(255, 255, 255, 0.2)',
                          }}
                        ></div>
                      </label>
                    </td>
                    <td className="px-4 py-3 rounded-r-lg">
                      <div className="flex items-center gap-2">
                        <button
                          onClick=${() => handleEdit(item.id)}
                          className="p-1.5 rounded-full transition-colors duration-200 hover:bg-white hover:bg-opacity-10"
                          title="Edit item"
                        >
                          <span 
                            className="material-icons text-base"
                            style=${{ color: darkMode ? LIGHT_TEAL : DARK_TEAL }}
                          >edit</span>
                        </button>
                        <button
                          onClick=${() => handleDelete(item.id)}
                          className="p-1.5 rounded-full transition-colors duration-200 hover:bg-white hover:bg-opacity-10"
                          title="Delete item"
                        >
                          <span 
                            className="material-icons text-base"
                            style=${{ color: '#EF4444' }}
                          >delete</span>
                        </button>
                        <button
                          onClick=${() => window.location.hash = `/item/${item.id}`}
                          className="p-1.5 rounded-full transition-colors duration-200 hover:bg-white hover:bg-opacity-10"
                          title="View item"
                        >
                          <span 
                            className="material-icons text-base"
                            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
                          >visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
          
          <!-- Pagination Controls -->
          <div className="flex items-center justify-between mt-6">
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
      </div>
    </div>
  `;
}; 
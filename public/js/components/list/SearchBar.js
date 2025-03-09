import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const SearchBar = ({ 
  darkMode, 
  html, 
  searchQuery, 
  onSearch,
  totalItems = 0,
  itemsShown = 0,
  selectedCategory = null
}) => {
  // State for the input value (for immediate UI feedback)
  const [inputValue, setInputValue] = React.useState(searchQuery);
  
  // Reference to the input element to maintain focus
  const inputRef = React.useRef(null);
  
  // Handle input change - only update the input value, don't trigger search
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value); // Update the input value immediately for UI feedback
  };
  
  // Handle search submission
  const handleSearchSubmit = () => {
    if (inputValue.trim()) {
      // Navigate to search page
      window.location.hash = `/search/${encodeURIComponent(inputValue.trim())}`;
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setInputValue('');
    
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Sync inputValue with searchQuery when searchQuery changes externally
  React.useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);
  
  // Save focus state before render
  const [isFocused, setIsFocused] = React.useState(false);
  
  // Handle focus and blur events
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  
  // Restore focus after render if it was focused before
  React.useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  });

  return html`
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="relative flex-1"
        >
          <input
            ref=${inputRef}
            type="text"
            value=${inputValue}
            onChange=${handleInputChange}
            onKeyPress=${handleKeyPress}
            onFocus=${handleFocus}
            onBlur=${handleBlur}
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
                onClick=${handleClearSearch}
                className="p-1 mr-1 rounded-full hover:bg-black hover:bg-opacity-10"
                style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                aria-label="Clear search"
              >
                <span className="material-icons">close</span>
              </button>
            `}
            
            <button
              onClick=${handleSearchSubmit}
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
      </div>
      
      ${totalItems > 0 && html`
        <div 
          className="text-sm"
          style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Showing ${itemsShown} of ${totalItems} items
          ${searchQuery && html` matching "${searchQuery}"`}
          ${selectedCategory && html` in this category`}
        </div>
      `}
    </div>
  `;
}; 
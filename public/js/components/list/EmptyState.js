import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';

export const EmptyState = ({ 
  darkMode, 
  html, 
  searchQuery, 
  selectedCategory, 
  onClearSearch, 
  onViewAll 
}) => {
  return html`
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span 
        className="material-icons text-6xl mb-4"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
      >search_off</span>
      <h2 
        className="text-2xl font-bold mb-2"
        style=${{ color: darkMode ? WHITE : DARK_TEAL }}
      >No Items Found</h2>
      <p
        className="mb-4"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        ${searchQuery 
          ? `No results found for "${searchQuery}"`
          : selectedCategory 
            ? 'No items found in this category'
            : 'No items available at the moment'
        }
      </p>
      <button
        onClick=${() => {
          if (searchQuery) {
            onClearSearch();
          } else if (selectedCategory) {
            onViewAll();
          }
        }}
        className="px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
        style=${{
          backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
          color: WHITE
        }}
      >
        <span className="material-icons mr-1 align-middle text-sm">refresh</span>
        ${searchQuery ? 'Clear Search' : selectedCategory ? 'View All Items' : 'Refresh'}
      </button>
    </div>
  `;
}; 
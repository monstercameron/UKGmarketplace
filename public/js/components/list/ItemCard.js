import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';
import { categoryIcons, categoryToIconKey } from '../../utils/categoryIcons.js';

export const ItemCard = ({ 
  item, 
  index, 
  darkMode, 
  html, 
  imageUrl,
  expandedImage,
  loadingImage,
  hoveringMagnifier,
  onItemClick,
  onImageHover,
  onImageLeave,
  onMagnifierClick,
  onMagnifierHover,
  onMagnifierLeave,
  onCategoryClick
}) => {
  const hasImage = imageUrl !== null && imageUrl !== undefined;
  
  // Get the appropriate icon key for this category
  const getCategoryIcon = () => {
    const categoryName = item.category_name || 'Uncategorized';
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
    
    return iconSvg.replace('stroke="currentColor"', `stroke="${iconColor}"`);
  };
  
  return html`
    <div 
      key=${item.id}
      className="rounded-xl overflow-hidden shadow-lg group relative card-enter hover:scale-105 hover:shadow-2xl transition-transform duration-300 cursor-pointer"
      style=${{
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
        backdropFilter: 'blur(8px)',
        animationDelay: `${index * 0.05}s`,
        '--mouse-x': '50%',
        '--mouse-y': '50%'
      }}
      onClick=${() => onItemClick(item.id)}
    >
      <!-- Image Section -->
      <div 
        className="relative overflow-hidden transition-all duration-300"
        style=${{ 
          height: expandedImage ? '300px' : '200px',
          cursor: 'pointer'
        }}
        onMouseEnter=${() => onImageHover(item.id)}
        onMouseLeave=${() => onImageLeave(item.id)}
      >
        ${hasImage ? html`
          <img 
            src=${imageUrl} 
            alt=${item.title}
            className="w-full h-full object-cover transition-all duration-500"
            style=${{ 
              transform: expandedImage ? 'scale(1.1)' : 'scale(1)',
              filter: darkMode ? 'brightness(0.9)' : 'none'
            }}
          />
        ` : imageUrl === null ? html`
          <${ImagePlaceholder} darkMode=${darkMode} html=${html} item=${item} />
        ` : html`
          <${ImageLoading} darkMode=${darkMode} html=${html} />
        `}
        
        ${!loadingImage && html`
          <div 
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style=${{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          >
            <span className="text-white font-bold">View Details</span>
          </div>
        `}
        
        <div 
          className="absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200"
          style=${{ 
            backgroundColor: hoveringMagnifier 
              ? (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)') 
              : (darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)')
          }}
          onClick=${(e) => onMagnifierClick(e, item.id)}
          onMouseEnter=${(e) => onMagnifierHover(e, item.id)}
          onMouseLeave=${(e) => onMagnifierLeave(e, item.id)}
        >
          <span 
            className="material-icons text-sm"
            style=${{ 
              color: darkMode ? WHITE : DARK_TEAL,
              transform: expandedImage ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            ${expandedImage ? 'close' : 'search'}
          </span>
        </div>
        
        ${item.sold && html`
          <div 
            className="absolute top-0 left-0 w-full py-1 text-center text-xs font-bold"
            style=${{ 
              backgroundColor: '#EF4444',
              color: WHITE
            }}
          >SOLD</div>
        `}
        
        ${item.negotiable && html`
          <div 
            className="absolute bottom-2 left-2 px-2 py-0.5 text-xs rounded-full"
            style=${{ 
              backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              color: darkMode ? LIGHT_TEAL : DARK_TEAL
            }}
          >Negotiable</div>
        `}
      </div>

      <!-- Content Section -->
      <div className="p-4">
        <!-- Category Badge -->
        <a 
          href=${`/#/category/${item.category_id}`}
          onClick=${(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onCategoryClick) {
              onCategoryClick(e, item.category_id, item.category_name);
            }
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mb-2 hover:scale-105 transition-transform duration-200"
          style=${{
            backgroundColor: darkMode ? 'rgba(102, 163, 210, 0.1)' : 'rgba(102, 163, 210, 0.1)',
            color: darkMode ? LIGHT_TEAL : DARK_TEAL,
            border: '1px solid ' + (darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(0, 48, 135, 0.1)')
          }}
        >
          <span 
            className="w-3 h-3 flex items-center justify-center"
            style=${{ 
              display: 'inline-flex',
              verticalAlign: 'middle',
              marginRight: '2px',
              position: 'relative',
              top: '-1px'
            }}
            dangerouslySetInnerHTML=${{ __html: getCategoryIcon() }}
          ></span>
          <span>${item.category_name || 'Uncategorized'}</span>
        </a>
        
        <!-- Title -->
        <h3 
          className="text-lg font-semibold mb-2 line-clamp-2"
          style=${{ 
            color: darkMode ? WHITE : DARK_TEAL,
            height: '3rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >${item.title}</h3>
        
        <!-- Price -->
        <div className="flex items-center justify-between">
          <div 
            className="text-xl font-bold"
            style=${{
              color: darkMode ? LIGHT_TEAL : DARK_TEAL,
              textDecoration: item.sold ? 'line-through' : 'none',
              opacity: item.sold ? 0.7 : 1
            }}
          >
            $${Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          
          <!-- Location -->
          <div 
            className="flex items-center text-xs"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
          >
            <span className="material-icons text-xs mr-1">place</span>
            <span>${item.location}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Image placeholder component for when no image is available
const ImagePlaceholder = ({ darkMode, html, item }) => {
  // Get the appropriate icon key for this category
  const getCategoryIcon = () => {
    const categoryName = item?.category_name || 'Uncategorized';
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
    <div 
      className="w-full h-full flex flex-col items-center justify-center"
      style=${{ 
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="w-24 h-24 mb-2" dangerouslySetInnerHTML=${{ __html: getCategoryIcon() }}></div>
      <div 
        className="text-sm text-center px-4"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
      >
        ${item?.category_name || 'No Image Available'}
      </div>
    </div>
  `;
};

// Loading indicator component for when image is loading
const ImageLoading = ({ darkMode, html }) => {
  return html`
    <div 
      className="w-full h-full flex items-center justify-center loading-shimmer"
      style=${{ 
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(0, 0, 0, 0.05)'
      }}
    >
      <span 
        className="material-icons text-4xl"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }}
      >
        image
      </span>
    </div>
  `;
}; 
import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG, PAYMENT_METHODS, DEFAULT_ITEM_IMAGE } from '../utils/constants.js';
import { ItemCard } from './list/ItemCard.js';
import { EmptyState } from './list/EmptyState.js';
import { LoadingState } from './list/LoadingState.js';
import { SearchBar } from './list/SearchBar.js';
import { useImageService } from './list/ImageService.js';

export const LazyList = ({ selectedCategory, onSelectCategory, darkMode, html, setCurrentRoute }) => {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedImages, setExpandedImages] = React.useState({});
  const [loadingImages, setLoadingImages] = React.useState({});
  const [hoveringMagnifier, setHoveringMagnifier] = React.useState({});
  const [totalItems, setTotalItems] = React.useState(0);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [showNote, setShowNote] = React.useState(true);
  
  // Fullscreen image gallery state
  const [showFullscreenGallery, setShowFullscreenGallery] = React.useState(false);
  const [fullscreenItemId, setFullscreenItemId] = React.useState(null);
  const [fullscreenImages, setFullscreenImages] = React.useState([]);
  const [fullscreenCurrentIndex, setFullscreenCurrentIndex] = React.useState(0);
  const [fullscreenScale, setFullscreenScale] = React.useState(1);
  const [fullscreenPosition, setFullscreenPosition] = React.useState({ x: 0, y: 0 });
  const [fullscreenIsDragging, setFullscreenIsDragging] = React.useState(false);
  const [fullscreenDragStart, setFullscreenDragStart] = React.useState({ x: 0, y: 0 });
  const fullscreenImageRef = React.useRef(null);
  
  // Use the image service
  const imageService = useImageService(React);
  
  // Refs for managing timeouts and DOM elements
  const imageTimeouts = React.useRef({});
  const hoverTimeouts = React.useRef({});
  const itemsPerPage = 10;
  const loadingRef = React.useRef(null);
  const scrollPositionRef = React.useRef(0);

  // Save scroll position when component unmounts
  React.useEffect(() => {
    return () => {
      scrollPositionRef.current = window.scrollY;
    };
  }, []);

  // Restore scroll position when component mounts
  React.useEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, []);

  // Fetch images for items when they change
  React.useEffect(() => {
    if (items.length > 0) {
      imageService.fetchItemImages(items.map(item => item.id));
    }
  }, [items]);

  // Add keyframe animations to the document
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes pulseGlow {
        0% { box-shadow: 0 0 0 0 rgba(0, 48, 135, 0.2); }
        70% { box-shadow: 0 0 0 10px rgba(0, 48, 135, 0); }
        100% { box-shadow: 0 0 0 0 rgba(0, 48, 135, 0); }
      }
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      .card-enter {
        animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .loading-shimmer {
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0.05) 0%,
          rgba(255, 255, 255, 0.15) 50%,
          rgba(255, 255, 255, 0.05) 100%
        );
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Intersection Observer for infinite scrolling
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hasMore, loading, loadingRef.current]);

  // Fetch items when page, category, or search query changes
  React.useEffect(() => {
    // Check if we're on a search page - if so, don't fetch items
    if (window.location.hash.startsWith('#/search/')) {
      return;
    }
    
    const fetchItems = async () => {
      try {
        setLoading(true);
        
        // Determine the API endpoint based on whether we're searching or not
        let endpoint;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString()
        });
        
        if (searchQuery) {
          // Use the correct search API endpoint
          endpoint = '/api/v1/items/search';
          queryParams.set('q', searchQuery);
          
          // Add category filter if needed
          if (selectedCategory) {
            queryParams.set('category', selectedCategory.toString());
          }
        } else if (selectedCategory) {
          // Use the category endpoint if no search but has category
          endpoint = `/api/v1/items/category/${selectedCategory}`;
        } else {
          // Default to all items
          endpoint = '/api/v1/items';
        }
        
        const response = await fetch(`${endpoint}?${queryParams}`);
        
        if (!response.ok) throw new Error('Failed to fetch items');
        
        const data = await response.json();
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
        setTotalItems(totalCount);
        
        if (page === 1) {
          setItems(data);
        } else {
          setItems(prevItems => [...prevItems, ...data]);
        }
        
        setHasMore(data.length === itemsPerPage);
        setInitialLoading(false);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
  }, [page, selectedCategory, searchQuery, itemsPerPage]);

  // Reset page when category or search query changes
  React.useEffect(() => {
    setPage(1);
    setItems([]);
    setInitialLoading(true);
  }, [selectedCategory, searchQuery]);

  // Handle search input
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    
    // Don't dispatch a search event if we're on a search page
    if (window.location.hash.startsWith('#/search/')) {
      return;
    }
    
    // Dispatch event for global search state
    window.dispatchEvent(new CustomEvent('search', { detail: { query: value } }));
  };

  // Handle item click
  const handleItemClick = (itemId) => {
    window.location.hash = `/item/${itemId}`;
  };

  // Handle category click
  const handleCategoryClick = (e, categoryId, categoryName) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelectCategory) {
      onSelectCategory(categoryId, categoryName);
    }
    
    // Use hash-based routing
    window.location.hash = `/category/${categoryId}`;
    
    // Dispatch event for category selection
    window.dispatchEvent(new CustomEvent('setcategory', { 
      detail: { categoryId, categoryName }
    }));
  };

  // Handle image hover
  const handleImageHover = (itemId) => {
    // Clear any existing timeouts
    if (hoverTimeouts.current[itemId]) {
      clearTimeout(hoverTimeouts.current[itemId]);
      delete hoverTimeouts.current[itemId];
    }
    
    // Set loading state
    setLoadingImages(prev => ({ ...prev, [itemId]: true }));
    
    // Set a timeout to show the expanded image
    imageTimeouts.current[itemId] = setTimeout(() => {
      setExpandedImages(prev => ({ ...prev, [itemId]: true }));
      setLoadingImages(prev => ({ ...prev, [itemId]: false }));
    }, 300);
  };

  // Handle image leave
  const handleImageLeave = (itemId) => {
    // Clear any existing timeouts
    if (imageTimeouts.current[itemId]) {
      clearTimeout(imageTimeouts.current[itemId]);
      delete imageTimeouts.current[itemId];
    }
    
    // Reset expanded state
    setExpandedImages(prev => ({ ...prev, [itemId]: false }));
    setLoadingImages(prev => ({ ...prev, [itemId]: false }));
  };

  // Handle magnifier hover
  const handleMagnifierHover = (e, itemId) => {
    e.stopPropagation();
    setHoveringMagnifier(prev => ({ ...prev, [itemId]: true }));
    
    // Set a timeout to prevent flickering
    hoverTimeouts.current[itemId] = setTimeout(() => {
      setLoadingImages(prev => ({ ...prev, [itemId]: true }));
    }, 100);
  };

  // Handle magnifier leave
  const handleMagnifierLeave = (e, itemId) => {
    e.stopPropagation();
    setHoveringMagnifier(prev => ({ ...prev, [itemId]: false }));
    
    // Clear timeouts
    if (hoverTimeouts.current[itemId]) {
      clearTimeout(hoverTimeouts.current[itemId]);
      delete hoverTimeouts.current[itemId];
    }
    if (imageTimeouts.current[itemId]) {
      clearTimeout(imageTimeouts.current[itemId]);
      delete imageTimeouts.current[itemId];
    }

    // Reset loading state if not expanded
    if (!expandedImages[itemId]) {
      setLoadingImages(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle magnifier click - updated to show fullscreen gallery
  const handleMagnifierClick = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear any existing timeouts
    if (hoverTimeouts.current[itemId]) {
      clearTimeout(hoverTimeouts.current[itemId]);
      delete hoverTimeouts.current[itemId];
    }
    if (imageTimeouts.current[itemId]) {
      clearTimeout(imageTimeouts.current[itemId]);
      delete imageTimeouts.current[itemId];
    }

    // Find the item
    const item = items.find(item => item.id === itemId);
    if (!item) return;

    // Get the image URL for this item
    const imageUrl = imageService.getItemImageUrl(itemId);
    if (!imageUrl) return;

    // Set up fullscreen gallery
    setFullscreenItemId(itemId);
    setFullscreenImages([imageUrl]); // Start with the main image
    setFullscreenCurrentIndex(0);
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    
    // Fetch additional images if available
    imageService.fetchItemImagesDirectly(itemId)
      .then(imageUrls => {
        if (imageUrls && imageUrls.length > 0) {
          setFullscreenImages(imageUrls);
        }
      })
      .catch(err => {
        console.error('Error fetching additional images:', err);
      });

    // Show the fullscreen gallery
    setShowFullscreenGallery(true);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  };

  // Handle fullscreen gallery close
  const handleCloseFullscreenGallery = () => {
    setShowFullscreenGallery(false);
    setFullscreenItemId(null);
    setFullscreenImages([]);
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    
    // Restore body scrolling
    document.body.style.overflow = '';
  };

  // Fullscreen gallery navigation
  const handleFullscreenNext = () => {
    setFullscreenCurrentIndex((prev) => (prev + 1) % fullscreenImages.length);
    resetFullscreenZoom();
  };

  const handleFullscreenPrev = () => {
    setFullscreenCurrentIndex((prev) => (prev - 1 + fullscreenImages.length) % fullscreenImages.length);
    resetFullscreenZoom();
  };

  // Fullscreen zoom controls
  const resetFullscreenZoom = () => {
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
  };

  const handleFullscreenZoomIn = () => {
    setFullscreenScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleFullscreenZoomOut = () => {
    setFullscreenScale(prev => Math.max(prev - 0.5, 1));
  };

  // Fullscreen mouse controls
  const handleFullscreenMouseDown = (e) => {
    if (fullscreenScale > 1) {
      setFullscreenIsDragging(true);
      setFullscreenDragStart({ 
        x: e.clientX - fullscreenPosition.x, 
        y: e.clientY - fullscreenPosition.y 
      });
    }
  };

  const handleFullscreenMouseMove = (e) => {
    if (fullscreenIsDragging && fullscreenScale > 1) {
      const newX = e.clientX - fullscreenDragStart.x;
      const newY = e.clientY - fullscreenDragStart.y;
      setFullscreenPosition({ x: newX, y: newY });
    }
  };

  const handleFullscreenMouseUp = () => {
    setFullscreenIsDragging(false);
  };

  // Fullscreen wheel handler
  const handleFullscreenWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      const newScale = Math.max(1, Math.min(3, fullscreenScale + delta));
      setFullscreenScale(newScale);
    } else {
      if (fullscreenScale === 1) {
        if (e.deltaY > 0) {
          handleFullscreenNext();
        } else {
          handleFullscreenPrev();
        }
      }
    }
  };

  // Fullscreen keyboard controls
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showFullscreenGallery) return;
      
      if (e.key === 'ArrowLeft') {
        handleFullscreenPrev();
      } else if (e.key === 'ArrowRight') {
        handleFullscreenNext();
      } else if (e.key === 'Escape') {
        handleCloseFullscreenGallery();
      } else if (e.key === '+') {
        handleFullscreenZoomIn();
      } else if (e.key === '-') {
        handleFullscreenZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    if (fullscreenIsDragging) {
      window.addEventListener('mousemove', handleFullscreenMouseMove);
      window.addEventListener('mouseup', handleFullscreenMouseUp);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleFullscreenMouseMove);
      window.removeEventListener('mouseup', handleFullscreenMouseUp);
    };
  }, [showFullscreenGallery, fullscreenIsDragging, fullscreenImages.length, fullscreenCurrentIndex, fullscreenScale]);

  // Render fullscreen gallery
  const renderFullscreenGallery = () => {
    if (!showFullscreenGallery) return null;
    
    // Create a portal element if it doesn't exist
    if (!document.getElementById('fullscreen-gallery-portal')) {
      const portalDiv = document.createElement('div');
      portalDiv.id = 'fullscreen-gallery-portal';
      document.body.appendChild(portalDiv);
    }
    
    // Use ReactDOM.createPortal to render outside the normal DOM hierarchy
    return ReactDOM.createPortal(
      html`
        <div 
          id="fullscreen-image-viewer"
          style=${{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}
          onClick=${handleCloseFullscreenGallery}
        >
          <!-- Image Container -->
          <div 
            style=${{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              cursor: fullscreenScale > 1 ? 'grab' : 'default'
            }}
            onClick=${(e) => e.stopPropagation()}
            onWheel=${handleFullscreenWheel}
            onMouseDown=${handleFullscreenMouseDown}
          >
            <img
              ref=${fullscreenImageRef}
              src=${fullscreenImages[fullscreenCurrentIndex]}
              alt="Enlarged view"
              style=${{ 
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                transform: 'translate(' + fullscreenPosition.x + 'px, ' + fullscreenPosition.y + 'px) scale(' + fullscreenScale + ')',
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-out'
              }}
            />
          </div>

          <!-- Top Controls -->
          <div 
            style=${{
              position: 'fixed',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
              zIndex: 100000
            }}
            onClick=${(e) => e.stopPropagation()}
          >
            <!-- Zoom Controls -->
            <div 
              style=${{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)'
              }}
            >
              <button
                onClick=${handleFullscreenZoomOut}
                disabled=${fullscreenScale <= 1}
                style=${{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: fullscreenScale <= 1 ? 'default' : 'pointer',
                  opacity: fullscreenScale <= 1 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (fullscreenScale > 1) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut=${(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span class="material-icons" style=${{ color: 'white', fontSize: '20px' }}>remove</span>
              </button>
              <span style=${{ color: 'white', fontSize: '14px', minWidth: '36px', textAlign: 'center' }}>
                ${Math.round(fullscreenScale * 100)}%
              </span>
              <button
                onClick=${handleFullscreenZoomIn}
                disabled=${fullscreenScale >= 3}
                style=${{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: fullscreenScale >= 3 ? 'default' : 'pointer',
                  opacity: fullscreenScale >= 3 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (fullscreenScale < 3) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut=${(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span class="material-icons" style=${{ color: 'white', fontSize: '20px' }}>add</span>
              </button>
            </div>
            
            <!-- Close Button -->
            <button
              onClick=${handleCloseFullscreenGallery}
              style=${{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver=${(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              }}
              onMouseOut=${(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
              }}
            >
              <span class="material-icons" style=${{ color: 'white', fontSize: '20px' }}>close</span>
            </button>
          </div>

          <!-- Bottom Controls -->
          <div 
            style=${{
              position: 'fixed',
              bottom: '16px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 0',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 100000
            }}
            onClick=${(e) => e.stopPropagation()}
          >
            <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick=${(e) => {
                  e.stopPropagation();
                  handleFullscreenPrev();
                }}
                disabled=${fullscreenImages.length <= 1}
                style=${{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: fullscreenImages.length <= 1 ? 'default' : 'pointer',
                  opacity: fullscreenImages.length <= 1 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (fullscreenImages.length > 1) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut=${(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span class="material-icons" style=${{ color: 'white', fontSize: '24px' }}>chevron_left</span>
              </button>
              
              <span style=${{ color: 'white', fontSize: '14px' }}>
                ${fullscreenCurrentIndex + 1} / ${fullscreenImages.length}
              </span>
              
              <button
                onClick=${(e) => {
                  e.stopPropagation();
                  handleFullscreenNext();
                }}
                disabled=${fullscreenImages.length <= 1}
                style=${{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: fullscreenImages.length <= 1 ? 'default' : 'pointer',
                  opacity: fullscreenImages.length <= 1 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (fullscreenImages.length > 1) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut=${(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span class="material-icons" style=${{ color: 'white', fontSize: '24px' }}>chevron_right</span>
              </button>
            </div>
          </div>

          <!-- Keyboard Shortcuts Help -->
          <div 
            style=${{
              position: 'fixed',
              bottom: '16px',
              left: '16px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              zIndex: 100000
            }}
          >
            Use arrow keys to navigate • +/- to zoom • ESC to close
          </div>
        </div>
      `,
      document.getElementById('fullscreen-gallery-portal')
    );
  };

  // Clean up the portal when component unmounts
  React.useEffect(() => {
    return () => {
      const portal = document.getElementById('fullscreen-gallery-portal');
      if (portal) {
        document.body.removeChild(portal);
      }
      
      // Ensure body scrolling is restored
      document.body.style.overflow = '';
    };
  }, []);

  // Add animation styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
        60% {
          transform: translateY(-10px);
        }
      }
      
      @keyframes wave {
        0% {
          transform: rotate(0deg);
        }
        10% {
          transform: rotate(14deg);
        }
        20% {
          transform: rotate(-8deg);
        }
        30% {
          transform: rotate(14deg);
        }
        40% {
          transform: rotate(-4deg);
        }
        50% {
          transform: rotate(10deg);
        }
        60% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(0deg);
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes slideInDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutUp {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-100%);
          opacity: 0;
        }
      }
      
      .dismissable-note {
        position: relative;
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 8px;
        animation: slideInDown 0.5s ease-out forwards;
        transition: all 0.3s ease;
      }
      
      .dismissable-note.dismissing {
        animation: slideOutUp 0.5s ease-out forwards;
      }
      
      .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .close-button:hover {
        transform: scale(1.1);
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      .scroll-top-button {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
        z-index: 1000;
      }
      
      .scroll-top-button.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .scroll-top-button:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
      }
      
      .footer {
        margin-top: 40px;
        padding: 30px 0;
        border-top: 1px solid rgba(125, 125, 125, 0.2);
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .guidelines {
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        animation: fadeIn 0.5s ease-out forwards;
        transition: all 0.3s ease;
      }
      
      .guidelines:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      }
      
      .item-card-animation {
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
      }
      
      .end-message-container {
        animation: bounce 2s ease infinite;
      }
      
      .waving-hand {
        animation: wave 2.5s ease infinite;
        transform-origin: 70% 70%;
        display: inline-block;
      }
      
      .loading-shimmer {
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0.05) 0%,
          rgba(255, 255, 255, 0.15) 50%,
          rgba(255, 255, 255, 0.05) 100%
        );
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  // Handle scroll events for scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle dismissing the note
  const handleDismissNote = () => {
    setShowNote(false);
    // Optionally save to localStorage to keep it dismissed between sessions
    localStorage.setItem('ukgMarketplaceNoteDismissed', 'true');
  };
  
  // Check if note was previously dismissed
  React.useEffect(() => {
    const noteDismissed = localStorage.getItem('ukgMarketplaceNoteDismissed');
    if (noteDismissed === 'true') {
      setShowNote(false);
    }
  }, []);

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('search', { detail: { query: '' } }));
  };

  // Handle view all items
  const handleViewAll = () => {
    window.location.hash = '/';
  };

  // Show loading state for initial load
  if (initialLoading) {
    return html`<${LoadingState} darkMode=${darkMode} html=${html} />`;
  }

  // Show empty state if no items
  if (items.length === 0 && !loading) {
    return html`
      <div className="container mx-auto px-4 py-8">
        <${SearchBar}
          darkMode=${darkMode}
          html=${html}
          searchQuery=${searchQuery}
          onSearch=${handleSearch}
          totalItems=${totalItems}
          itemsShown=${items.length}
          selectedCategory=${selectedCategory}
        />
        
        <${EmptyState}
          darkMode=${darkMode}
          html=${html}
          searchQuery=${searchQuery}
          selectedCategory=${selectedCategory}
          onClearSearch=${handleClearSearch}
          onViewAll=${handleViewAll}
        />
      </div>
    `;
  }

  // Show items grid
  return html`
    <div className="container mx-auto px-4 py-8">
      ${initialLoading ? html`
        <${LoadingState} darkMode=${darkMode} />
      ` : error ? html`
        <div className="text-red-500 text-center py-8">
          Error: ${error}
        </div>
      ` : html`
        ${showNote && html`
          <div 
            className="dismissable-note"
            style=${{ 
              backgroundColor: darkMode ? `${DARK_BG}` : `${WHITE}`,
              border: `1px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}`,
              color: darkMode ? WHITE : DARK_BG,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div 
              className="close-button"
              onClick=${handleDismissNote}
              style=${{ 
                color: darkMode ? LIGHT_TEAL : DARK_TEAL
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div 
              className="font-bold text-lg mb-2"
              style=${{ 
                color: darkMode ? LIGHT_TEAL : DARK_TEAL
              }}
            >
              Welcome to UKG Marketplace
            </div>
            <p className="mb-2">
              This platform runs on the <strong>honor system</strong> and is built on trust within our community.
            </p>
            <p>
              Please be respectful and honest with your fellow coworkers. Together, we can create a positive and valuable marketplace for everyone at UKG.
            </p>
          </div>
        `}
        
        <${SearchBar}
          searchQuery=${searchQuery}
          onSearch=${handleSearch}
          onClearSearch=${handleClearSearch}
          darkMode=${darkMode}
          html=${html}
          totalItems=${totalItems}
          itemsShown=${items.length}
          selectedCategory=${selectedCategory}
          onSelectCategory=${handleCategoryClick}
          onViewAll=${handleViewAll}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${items.map((item, index) => {
            return html`
              <div 
                className="item-card-animation" 
                style=${{ 
                  animationDelay: `${(index % itemsPerPage) * 0.1}s`,
                }}
              >
                <${ItemCard}
                  key=${item.id}
                  item=${item}
                  index=${index}
                  darkMode=${darkMode}
                  html=${html}
                  imageUrl=${imageService.getItemImageUrl(item.id)}
                  expandedImage=${expandedImages[item.id]}
                  loadingImage=${loadingImages[item.id]}
                  hoveringMagnifier=${hoveringMagnifier[item.id]}
                  onItemClick=${handleItemClick}
                  onImageHover=${handleImageHover}
                  onImageLeave=${handleImageLeave}
                  onMagnifierClick=${handleMagnifierClick}
                  onMagnifierHover=${handleMagnifierHover}
                  onMagnifierLeave=${handleMagnifierLeave}
                  onCategoryClick=${handleCategoryClick}
                />
              </div>
            `;
          })}
        </div>
        
        ${hasMore && html`
          <div 
            ref=${loadingRef}
            className="flex justify-center items-center py-8"
            style=${{ minHeight: '100px' }}
          >
            <div 
              className="animate-spin rounded-full h-8 w-8 border-4" 
              style=${{ 
                borderColor: darkMode ? `${LIGHT_TEAL}` : `${DARK_TEAL}`,
                borderTopColor: 'transparent'
              }}
            ></div>
          </div>
        `}
        
        ${!hasMore && items.length > 0 && html`
          <div className="end-message-container flex flex-col items-center justify-center py-8 text-center"
               style=${{ marginTop: '80px', paddingTop: '40px' }}>
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 120 120" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style=${{ marginBottom: '16px' }}
            >
              <!-- Smiling face -->
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill=${darkMode ? LIGHT_TEAL : DARK_TEAL} 
                fillOpacity="0.2"
              />
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                stroke=${darkMode ? LIGHT_TEAL : DARK_TEAL} 
                strokeWidth="4" 
                strokeLinecap="round"
              />
              <!-- Eyes -->
              <circle 
                cx="40" 
                cy="50" 
                r="5" 
                fill=${darkMode ? WHITE : DARK_BG}
              />
              <circle 
                cx="80" 
                cy="50" 
                r="5" 
                fill=${darkMode ? WHITE : DARK_BG}
              />
              <!-- Smile -->
              <path 
                d="M35 75 Q60 95 85 75" 
                stroke=${darkMode ? WHITE : DARK_BG} 
                strokeWidth="4" 
                strokeLinecap="round" 
                fill="none"
              />
              <!-- Waving hand -->
              <g className="waving-hand">
                <path 
                  d="M100 90 Q110 80 115 85 Q120 90 115 95 Q110 100 105 95 Q100 90 100 85 Z" 
                  fill=${darkMode ? LIGHT_TEAL : DARK_TEAL}
                />
                <path 
                  d="M95 95 L100 85" 
                  stroke=${darkMode ? LIGHT_TEAL : DARK_TEAL} 
                  strokeWidth="4" 
                  strokeLinecap="round"
                />
              </g>
            </svg>
            <div 
              className="text-xl font-bold"
              style=${{ 
                color: darkMode ? LIGHT_TEAL : DARK_TEAL,
                marginBottom: '8px'
              }}
            >
              That's all, folks!
            </div>
            <div 
              className="text-sm"
              style=${{ 
                color: darkMode ? `${WHITE}99` : `${DARK_BG}99`,
              }}
            >
              You've reached the end of the list
            </div>
          </div>
        `}
        
        <!-- Community Guidelines -->
        <div 
          className="guidelines mt-12"
          style=${{ 
            backgroundColor: darkMode ? `${DARK_BG}` : `${WHITE}`,
            border: `1px solid ${darkMode ? LIGHT_TEAL : DARK_TEAL}20`,
            color: darkMode ? WHITE : DARK_BG
          }}
        >
          <h3 
            className="text-xl font-bold mb-4"
            style=${{ 
              color: darkMode ? LIGHT_TEAL : DARK_TEAL
            }}
          >
            Community Guidelines
          </h3>
          <p className="mb-3">
            Welcome to the UKG Marketplace! This platform runs on the <strong>honor system</strong> and is built on trust within our community.
          </p>
          <ul className="list-disc pl-6 mb-3">
            <li className="mb-2">Be respectful and honest with your fellow coworkers</li>
            <li className="mb-2">Provide accurate descriptions and fair pricing</li>
            <li className="mb-2">Communicate promptly and clearly</li>
            <li className="mb-2">Honor your commitments and agreements</li>
          </ul>
          <p>
            Together, we can create a positive and valuable marketplace for everyone at UKG.
          </p>
        </div>
        
        <!-- Footer -->
        <footer className="footer text-center">
          <div 
            className="mb-4"
            style=${{ 
              color: darkMode ? LIGHT_TEAL : DARK_TEAL,
              fontWeight: 'bold'
            }}
          >
            UKG Marketplace
          </div>
          <div 
            className="text-sm mb-3"
            style=${{ 
              color: darkMode ? `${WHITE}99` : `${DARK_BG}99`
            }}
          >
            A platform for UKG employees to buy, sell, and exchange items
          </div>
          <div 
            className="text-sm"
            style=${{ 
              color: darkMode ? `${WHITE}99` : `${DARK_BG}99`
            }}
          >
            Contact: <a 
              href="mailto:cam.cameron@ukg.com" 
              style=${{ 
                color: darkMode ? LIGHT_TEAL : DARK_TEAL,
                textDecoration: 'underline'
              }}
            >
              cam.cameron@ukg.com
            </a>
          </div>
          <div 
            className="text-xs mt-6"
            style=${{ 
              color: darkMode ? `${WHITE}66` : `${DARK_BG}66`
            }}
          >
            © ${new Date().getFullYear()} UKG Inc. All rights reserved.
          </div>
        </footer>
      `}
      
      <!-- Scroll to Top Button -->
      ${showScrollTop && html`
        <div 
          className=${`scroll-top-button visible`}
          onClick=${scrollToTop}
          style=${{ 
            backgroundColor: darkMode ? LIGHT_TEAL : DARK_TEAL,
            color: darkMode ? DARK_BG : WHITE
          }}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 5L5 12H9V19H15V12H19L12 5Z" 
              fill="currentColor"
            />
          </svg>
        </div>
      `}
      
      ${showFullscreenGallery && renderFullscreenGallery()}
    </div>
  `;
};
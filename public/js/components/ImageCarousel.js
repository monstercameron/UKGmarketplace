import { DARK_BG, WHITE, DARK_TEAL, LIGHT_TEAL } from '../utils/constants.js';
import { categoryIcons, categoryToIconKey } from '../utils/categoryIcons.js';

export const ImageCarousel = ({ images = [], darkMode, html, categoryName }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isEnlarged, setIsEnlarged] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const carouselRef = React.useRef(null);
  const enlargedImageRef = React.useRef(null);

  // Add keyframe animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes zoomIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .carousel-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }
      .carousel-slide-in {
        animation: slideIn 0.3s ease-out forwards;
      }
      .carousel-zoom-in {
        animation: zoomIn 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 1));
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (isEnlarged) {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newScale = Math.max(1, Math.min(3, scale + delta));
        setScale(newScale);
      } else {
        const rect = enlargedImageRef.current?.getBoundingClientRect();
        if (rect && scale === 1) {
          if (e.deltaY > 0) {
            handleNext();
          } else {
            handlePrev();
          }
        }
      }
    } else {
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
    } else {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
    } else {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape' && isEnlarged) {
      setIsEnlarged(false);
      resetZoom();
    } else if (e.key === '+' && isEnlarged) {
      handleZoomIn();
    } else if (e.key === '-' && isEnlarged) {
      handleZoomOut();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEnlarged, isDragging]);

  React.useEffect(() => {
    if (!isEnlarged) {
      resetZoom();
    }
  }, [isEnlarged]);

  if (!images.length) {
    // Get the appropriate icon key for this category
    const getCategoryIcon = () => {
      const catName = categoryName || 'Uncategorized';
      let iconKey = categoryToIconKey[catName];
      
      // If no direct match, try normalized comparison
      if (!iconKey) {
        const normalizedName = catName.toLowerCase().replace(/[^a-z0-9]/g, '');
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
        className="relative group rounded-xl overflow-hidden"
        style=${{ 
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          border: '1px dashed ' + (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)')
        }}
      >
        <div className="flex flex-col justify-center items-center h-64 p-6 text-center">
          <div className="w-32 h-32 mb-4" dangerouslySetInnerHTML=${{ __html: getCategoryIcon() }}></div>
          <p 
            className="mt-4 text-lg"
            style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
          >
            No images available for this ${categoryName || 'item'}
          </p>
        </div>
      </div>
    `;
  }

  // Create a portal for the enlarged view to ensure it's outside the normal DOM hierarchy
  const renderEnlargedView = () => {
    // Create a portal element if it doesn't exist
    if (!document.getElementById('image-viewer-portal')) {
      const portalDiv = document.createElement('div');
      portalDiv.id = 'image-viewer-portal';
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
          onClick=${() => {
            setIsEnlarged(false);
            resetZoom();
          }}
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
              cursor: scale > 1 ? 'grab' : 'default'
            }}
            onClick=${(e) => e.stopPropagation()}
            onWheel=${handleWheel}
            onMouseDown=${handleMouseDown}
          >
            <img
              ref=${enlargedImageRef}
              src=${images[currentIndex]}
              alt="Enlarged view"
              style=${{ 
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                transform: 'translate(' + position.x + 'px, ' + position.y + 'px) scale(' + scale + ')',
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
                onClick=${handleZoomOut}
                disabled=${scale <= 1}
                style=${{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: scale <= 1 ? 'default' : 'pointer',
                  opacity: scale <= 1 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (scale > 1) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut=${(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span class="material-icons" style=${{ color: 'white', fontSize: '20px' }}>remove</span>
              </button>
              <span style=${{ color: 'white', fontSize: '14px', minWidth: '36px', textAlign: 'center' }}>
                ${Math.round(scale * 100)}%
              </span>
              <button
                onClick=${handleZoomIn}
                disabled=${scale >= 3}
                style=${{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: scale >= 3 ? 'default' : 'pointer',
                  opacity: scale >= 3 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (scale < 3) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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
              onClick=${() => {
                setIsEnlarged(false);
                resetZoom();
              }}
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
                  handlePrev();
                }}
                disabled=${images.length <= 1}
                style=${{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: images.length <= 1 ? 'default' : 'pointer',
                  opacity: images.length <= 1 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (images.length > 1) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut=${(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span class="material-icons" style=${{ color: 'white', fontSize: '24px' }}>chevron_left</span>
              </button>
              
              <span style=${{ color: 'white', fontSize: '14px' }}>
                ${currentIndex + 1} / ${images.length}
              </span>
              
              <button
                onClick=${(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled=${images.length <= 1}
                style=${{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: images.length <= 1 ? 'default' : 'pointer',
                  opacity: images.length <= 1 ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver=${(e) => {
                  if (images.length > 1) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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
      document.getElementById('image-viewer-portal')
    );
  };

  // Clean up the portal when component unmounts
  React.useEffect(() => {
    return () => {
      const portal = document.getElementById('image-viewer-portal');
      if (portal) {
        document.body.removeChild(portal);
      }
    };
  }, []);

  return html`
    <div 
      className="relative group"
      onWheel=${handleWheel}
      onTouchStart=${handleTouchStart}
      onTouchMove=${handleTouchMove}
      onTouchEnd=${handleTouchEnd}
      ref=${carouselRef}
      tabIndex="0"
    >
      ${isEnlarged ? renderEnlargedView() : null}
      
      <div 
        className="relative overflow-hidden rounded-xl aspect-video cursor-pointer"
        onClick=${() => setIsEnlarged(true)}
      >
        <img
          src=${images[currentIndex]}
          alt="Item image"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style=${{ 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.3) 100%)'
          }}
        />

        <!-- Click to Enlarge Indicator -->
        <div
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style=${{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            color: WHITE
          }}
        >
          <span className="material-icons text-sm">zoom_in</span>
          <span className="text-sm">Click to enlarge</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        ${images.map((_, index) => html`
          <button
            key=${index}
            onClick=${() => setCurrentIndex(index)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style=${{
              backgroundColor: index === currentIndex 
                ? (darkMode ? WHITE : DARK_BG)
                : (darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
              transform: index === currentIndex ? 'scale(1.5)' : 'scale(1)'
            }}
          />
        `)}
      </div>

      ${images.length > 1 && html`
        <button
          onClick=${handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          style=${{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <span 
            className="material-icons"
            style=${{ color: darkMode ? WHITE : DARK_BG }}
          >chevron_left</span>
        </button>
        
        <button
          onClick=${handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          style=${{
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <span 
            className="material-icons"
            style=${{ color: darkMode ? WHITE : DARK_BG }}
          >chevron_right</span>
        </button>
      `}
    </div>
  `;
}; 
export const LoadingState = ({ darkMode, html }) => {
  return html`
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${Array(8).fill().map((_, i) => html`
          <div 
            key=${i}
            className="rounded-xl overflow-hidden shadow-lg"
            style=${{
              backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid ' + (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              backdropFilter: 'blur(8px)'
            }}
          >
            <div 
              className="w-full h-48 loading-shimmer"
              style=${{ 
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
              }}
            ></div>
            <div className="p-4 space-y-3">
              <div 
                className="w-1/3 h-6 rounded loading-shimmer"
                style=${{ 
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }}
              ></div>
              <div 
                className="w-full h-6 rounded loading-shimmer"
                style=${{ 
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }}
              ></div>
              <div 
                className="w-2/3 h-6 rounded loading-shimmer"
                style=${{ 
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }}
              ></div>
              <div className="flex justify-between">
                <div 
                  className="w-1/4 h-6 rounded loading-shimmer"
                  style=${{ 
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }}
                ></div>
                <div 
                  className="w-1/4 h-6 rounded loading-shimmer"
                  style=${{ 
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }}
                ></div>
              </div>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}; 
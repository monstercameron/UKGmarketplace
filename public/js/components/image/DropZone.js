import { DARK_TEAL, LIGHT_TEAL, WHITE, DARK_BG } from '../../utils/constants.js';

export const DropZone = ({ 
  onFilesSelected, 
  maxFiles = 8, 
  accept = 'image/*', 
  darkMode = false,
  html
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef(null);
  
  // Handle file selection from the file input
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    onFilesSelected(files);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    }
  };
  
  // Handle click on the dropzone
  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return html`
    <div
      className=${`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer ${dragActive ? 'border-opacity-100' : 'border-opacity-50'}`}
      style=${{ 
        borderColor: dragActive ? LIGHT_TEAL : (darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'),
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
      }}
      onDragEnter=${handleDrag}
      onDragOver=${handleDrag}
      onDragLeave=${handleDrag}
      onDrop=${handleDrop}
      onClick=${handleDropzoneClick}
    >
      <input
        ref=${fileInputRef}
        type="file"
        multiple
        accept=${accept}
        onChange=${handleFileSelect}
        className="hidden"
      />
      
      <span 
        className="material-icons text-4xl mb-2"
        style=${{ 
          color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)'
        }}
      >cloud_upload</span>
      
      <p 
        className="text-center mb-1 font-medium"
        style=${{ 
          color: darkMode ? WHITE : DARK_TEAL
        }}
      >
        Drag & drop images here
      </p>
      
      <p 
        className="text-center text-sm"
        style=${{ 
          color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
        }}
      >
        or click to browse (max ${maxFiles} files)
      </p>
    </div>
  `;
}; 
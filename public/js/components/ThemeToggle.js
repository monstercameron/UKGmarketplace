import { WHITE, LIGHT_TEAL } from '../utils/constants.js';

export const ThemeToggle = ({ darkMode, setDarkMode, html }) => {
  const handleToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return html`
    <button
      onClick=${handleToggle}
      className="p-2 rounded-xl transition-all duration-200 hover:bg-white hover:bg-opacity-10"
      style=${{
        color: WHITE
      }}
      aria-label=${darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        <span 
          className="material-icons absolute transition-all duration-300"
          style=${{
            transform: darkMode ? 'rotate(360deg) scale(1)' : 'rotate(0deg) scale(0)',
            opacity: darkMode ? 1 : 0
          }}
        >light_mode</span>
        <span 
          className="material-icons absolute transition-all duration-300"
          style=${{
            transform: darkMode ? 'rotate(360deg) scale(0)' : 'rotate(0deg) scale(1)',
            opacity: darkMode ? 0 : 1
          }}
        >dark_mode</span>
      </div>
    </button>
  `;
}; 
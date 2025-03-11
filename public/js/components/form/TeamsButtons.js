import { DARK_TEAL, WHITE } from '../../utils/constants.js';

export const TeamsButtons = ({ teamsLinks, darkMode, html }) => {
  if (!teamsLinks?.web && !teamsLinks?.app) return null;

  return html`
    <div className="flex flex-col gap-2">
      <button
        onClick=${() => window.open(teamsLinks.web, '_blank')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
        style=${{
          backgroundColor: '#464EB8',
          color: WHITE
        }}
      >
        <span className="material-icons">open_in_new</span>
        Open in Teams Web
      </button>
      
      <button
        onClick=${() => window.location.href = teamsLinks.app}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
        style=${{
          backgroundColor: darkMode ? 'rgba(70, 78, 184, 0.2)' : 'rgba(70, 78, 184, 0.1)',
          color: '#464EB8',
          border: '1px solid rgba(70, 78, 184, 0.3)'
        }}
      >
        <span className="material-icons">chat</span>
        Open in Teams App
      </button>
    </div>
  `;
}; 
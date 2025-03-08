import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../utils/constants.js';

export const Breadcrumbs = ({ darkMode, items, html }) => {
  return html`
    <div className="flex items-center space-x-2 mb-6">
      ${items.map((item, index) => html`
        <div key=${index} className="flex items-center">
          ${index > 0 && html`
            <span 
              className="mx-2 material-icons text-sm"
              style=${{ 
                color: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
              }}
            >chevron_right</span>
          `}
          ${item.link ? html`
            <a
              href=${item.href ? (item.href.startsWith('/#/') ? item.href : '/#/' + item.href.replace(/^(\/|#)+/, '')) : (item.category_id ? '/#/category/' + item.category_id : '#')}
              onClick=${(e) => { if(item.onClick && !((item.href && item.href.includes('category')) || item.category_id)) { e.preventDefault(); item.onClick(e); } }}
              className="transition-colors duration-200"
              style=${{
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  color: darkMode ? LIGHT_TEAL : DARK_TEAL
                }
              }}
            >${item.text}</a>
          ` : html`
            <span
              style=${{
                color: darkMode ? WHITE : DARK_TEAL,
                fontWeight: 600
              }}
            >${item.text}</span>
          `}
        </div>
      `)}
    </div>
  `;
}; 
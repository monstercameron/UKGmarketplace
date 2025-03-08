import { initializeHtml } from './utils/setup.js';
import { App } from './components/App.js';

let html;

const init = async () => {
  html = await initializeHtml();
  window.ReactDOM.render(
    html`<${window.React.StrictMode}><${App} html=${html} /></${window.React.StrictMode}>`,
    document.getElementById('root')
  );
};

init(); 
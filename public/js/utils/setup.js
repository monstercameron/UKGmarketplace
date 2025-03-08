// Initialize htm with React after ensuring dependencies are loaded
export const waitForDependencies = () => {
  return new Promise((resolve) => {
    const check = () => {
      if (window.React && window.ReactDOM && window.htm) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
};

// Initialize htm with React
export const initializeHtml = async () => {
  await waitForDependencies();
  return window.htm.bind(window.React.createElement);
}; 
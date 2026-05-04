export const initLockdown = () => {
  // Disable Right Click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable F12, Ctrl+Shift+I, Ctrl+U
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
        (e.ctrlKey && e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  });

   // Disable DevTools detection - CPU intensive, enable only if necessary
   setInterval(() => {
     const before = new Date();
     debugger;
     const after = new Date();
     if (after - before > 100) {
       window.location.href = '/';
     }
   }, 1000);
};

export const preventScreenshot = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    video {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
};
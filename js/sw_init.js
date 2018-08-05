/* Register service worker */
if (navigator.serviceWorker) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
} else {
    console.log('serviceWorker not found')
}
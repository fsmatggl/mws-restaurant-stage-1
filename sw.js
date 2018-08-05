importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded`);
} else {
  console.log(`Workbox didn't load`);
}

workbox.precaching.precacheAndRoute([]);

workbox.precaching.precacheAndRoute([
  'index.html',
  'restaurant.html',
  'js/main.js',
  'js/restaurant_info.js',
  'js/dbhelper.js',
  'js/idb.js',
  'css/styles_medium.css',
  'css/styles_large.css',
  'css/fonts/md-icons/MaterialIcons-Regular.ttf',
  'css/fonts/Quicksand/Quicksand-Bold.ttf',
  'css/fonts/Quicksand/Quicksand-Light.ttf',
  'css/fonts/Quicksand/Quicksand-Medium.ttf',
  'css/fonts/Quicksand/Quicksand-Regular.ttf'
]);

workbox.routing.registerRoute(
  // Cache JS files
  /.*\.js/,
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: 'js-cache',
  })
);

workbox.routing.registerRoute(
  // Cache HTML files
  /.*\.html/,
  // Use cache but update in the background ASAP
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: 'html-cache',
  })
);

workbox.routing.registerRoute(
  // Cache CSS files
  /.*\.css/,
  // Use cache but update in the background ASAP
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: 'css-cache',
  })
);

workbox.routing.registerRoute(
  // Cache Fonts files
  /fonts/,
  // Use cache but update in the background ASAP
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: 'fonts-cache',
  })
);

workbox.routing.registerRoute(
  // Cache image files
  /.*\.(?:png|jpg|jpeg|svg|gif)/,
  // Use the cache if it's available
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: 'image-cache',
    plugins: [
      new workbox.expiration.Plugin({
        // Cache for a maximum of a week
        maxAgeSeconds: 7 * 24 * 60 * 60,
      })
    ],
  })
);
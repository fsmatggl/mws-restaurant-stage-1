let staticCacheName = 'restaurant-reviews-v1';

/* Initialize the cache on SW install */
self.addEventListener('install', function (event) {
  /* Array of requests to put in the cache */
  let urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'css/styles.css',
    'css/styles_medium.css',
    'css/styles_large.css',
    'img_sized/1-small.jpg',
    'img_sized/2-small.jpg',
    'img_sized/3-small.jpg',
    'img_sized/4-small.jpg',
    'img_sized/5-small.jpg',
    'img_sized/6-small.jpg',
    'img_sized/7-small.jpg',
    'img_sized/8-small.jpg',
    'img_sized/9-small.jpg',
    'img_sized/10-small.jpg',
    'dist/img/1-small.webp',
    'dist/img/2-small.webp',
    'dist/img/3-small.webp',
    'dist/img/4-small.webp',
    'dist/img/5-small.webp',
    'dist/img/6-small.webp',
    'dist/img/7-small.webp',
    'dist/img/8-small.webp',
    'dist/img/9-small.webp',
    'dist/img/10-small.webp',
    'dist/img/placeholder.jpg',
    'img/icon.png',
    'img/iconx600.png',
    'img/placeholder.jpg',
    'https://fonts.googleapis.com/css?family=Open+Sans|Quicksand',
    'css/fonts/md-icons/MaterialIcons-Regular.eot',
    'css/fonts/md-icons/MaterialIcons-Regular.ttf',
    'css/fonts/md-icons/MaterialIcons-Regular.woff',
    'css/fonts/md-icons/MaterialIcons-Regular.woff2'
  ];

  event.waitUntil(
    /* Open a new cache */
    caches.open(staticCacheName).then(function (cache) {
      /* Store the urls and return addAll's promise */
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    /* Retrieve all the caches' name */
    caches.keys().then(function (cacheNames) {
      /* Wait for the execution of every promise */
      return Promise.all(
        /* Filter the names */
        cacheNames.filter(function (cacheName) {
          /* Only return those starting with "wittr-" and is not the current cache */
          return cacheName.startsWith('restaurant-reviews-') &&
            cacheName != staticCacheName;
        }).map(function (cacheName) {
          /* Delete each of those caches */
          return cache.delete(cacheName);
        })
      );
    })
  );
});


self.addEventListener('fetch', function (event) {
  event.respondWith(
    /* Look for a match in the cache */
    caches.match(event.request).then(function (response) {
      /* Respond with the cached response if there's a match */
      if (response) return response;
      /* If there's no match, response will be falsy and original fetch should be done */
      return fetch(event.request);
    })
  );
});
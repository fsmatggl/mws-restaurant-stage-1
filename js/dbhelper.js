let retryQueue = [];

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Restaurants URL.
   */
  static get RESTAURANTS_URL() {
    const port = 1337 // Node server
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Reviews URL.
   */
  static get REVIEWS_URL() {
    const port = 1337 // Node server
    return `http://localhost:${port}/reviews`;
    
  }

  /**
   * IndexedDB Database name
   */
  static get IDB_DATABASE_NAME() {
    return 'mws-restaurant';
  }

  /**
   * IndexedDB Database restaurant storage name
   */
  static get IDB_RESTAURANTS_STORE_NAME() {
    return 'restaurants';
  }
  /**
   * IndexedDB database review storage name
   */
  static get IDB_REVIEWS_STORE_NAME() {
    return 'reviews';
  }

  static get IDB_REVIEWS_STORE_RESTAURANT_ID_INDEX() {
    return 'restaurant_id';
  }

  /**
   * Open the database where restaurants are stored
   */
  static openDatabase() {
    return idb.open(DBHelper.IDB_DATABASE_NAME, 1, function(upgradeDb) {
      console.log(`database oldVersion ${upgradeDb.oldVersion}`);
      switch(upgradeDb.oldVersion) {
        case 0:
          console.log('created object store restaurants');
          upgradeDb.createObjectStore(DBHelper.IDB_RESTAURANTS_STORE_NAME);
          console.log('created object store reviews');
          upgradeDb.createObjectStore(DBHelper.IDB_REVIEWS_STORE_NAME, {autoIncrement:true});
          /* Create an index to later retrieve the data ordered by such index */
          var reviewsStore = upgradeDb.transaction.objectStore(DBHelper.IDB_REVIEWS_STORE_NAME);
          reviewsStore.createIndex(DBHelper.IDB_REVIEWS_STORE_RESTAURANT_ID_INDEX, DBHelper.IDB_REVIEWS_STORE_RESTAURANT_ID_INDEX);
      }
    });
  };

  /**
   * Save restaurants data in the IDB database
   */
  static saveData(items, storeName) {
    console.log(`Saving data in ${storeName}`);
    console.log(items);
    let dbPromise = DBHelper.openDatabase();
    dbPromise.then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let itemStore = tx.objectStore(storeName);

      items.forEach((item) => {
        if (item.restaurant_id) {
          console.log('Casting restaurant_id to number');
          item.restaurant_id = Number(item.restaurant_id);
        }
        itemStore.put(item, item.id);
      });
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    /* Open the IDB database */
    let dbPromise = DBHelper.openDatabase();
    dbPromise.then(db => {
      /* Open transaction to retrieve restaurants */
      let tx = db.transaction(DBHelper.IDB_RESTAURANTS_STORE_NAME, 'readwrite');
      let restaurantsStore = tx.objectStore(DBHelper.IDB_RESTAURANTS_STORE_NAME);
      let restaurants = restaurantsStore.getAll().then((restaurants) => {
        /* There are no restaurants in the database */
        if (restaurants.length === 0) {
          console.log('No restaurants data found in the database. Requesting data from the server');
          /* Retrieve data from the server */
          fetch(DBHelper.RESTAURANTS_URL).then(response => {
            if (response.status === 200) { // Got a success response from server!
              console.log('Successfully retrieved restaurant data')
              response.json().then(function(data) {
                /* Save data in IDB */
                DBHelper.saveData(data, DBHelper.IDB_RESTAURANTS_STORE_NAME);
                callback(null, data);
              });
            } else { // Oops!. Got an error from server.
              const error = (`Request failed. Returned status of ${response.status}`);
              callback(error, null);
            }
          });
        } else {
          /* Restaurants found in the IDB */
          console.log('Using restaurant data found in IDB database');
          callback(null, restaurants);
        }
      });
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static updateRestaurant(restaurant) {
    /* Open the IDB database */
    console.log(`Updating restaurant (${restaurant.id}) data`);
    let dbPromise = DBHelper.openDatabase();
    dbPromise.then(db => {
      let tx = db.transaction(DBHelper.IDB_RESTAURANTS_STORE_NAME, 'readwrite');
      let restaurantsStore = tx.objectStore(DBHelper.IDB_RESTAURANTS_STORE_NAME);

      restaurantsStore.put(restaurant, restaurant.id);
    });

    const url = `http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`;
    const config = {method: 'PUT'};
    fetch(url, config).catch(() => {
      /* If it wasn't possible to update the server, try again later  */
      retry({url: url, config: config});
    });
  }

  static retry(request) {
    retryQueue.push(request);
  }

  static getReviewsByRestaurantId(restaurantId, callback) {
    let url = `http://localhost:1337/reviews?restaurant_id=${restaurantId}`;
    /* Open the IDB database */
    let dbPromise = DBHelper.openDatabase();
    dbPromise.then(db => {
      /* Open transaction to retrieve restaurants */
      let tx = db.transaction(DBHelper.IDB_REVIEWS_STORE_NAME, 'readwrite');
      let reviewsStore = tx.objectStore(DBHelper.IDB_REVIEWS_STORE_NAME);
      let reviewsRestaurantIdIndex = reviewsStore.index(DBHelper.IDB_REVIEWS_STORE_RESTAURANT_ID_INDEX);
      /* Get reviews by restaurant ID */
      reviewsRestaurantIdIndex.getAll(restaurantId).then((reviews) => {
        /* There are no restaurants in the database */
        if (reviews.length === 0) {
          console.log('No reviews data found in the database. Requesting data from the server');
          /* Retrieve data from the server */
          fetch(url).then(response => {
            if (response.status === 200) { // Got a success response from server!
              console.log(`Successfully retrieved restaurand (${restaurantId}) reviews`);
              response.json().then(function(data) {
                /* Save data in IDB */
                DBHelper.saveData(data, DBHelper.IDB_REVIEWS_STORE_NAME);
                callback(null, data);
              });
            } else { // Oops!. Got an error from server.
              const error = (`Request failed. Returned status of ${response.status}`);
              callback(error, null);
            }
          });
        } else {
          /* Restaurants found in the IDB */
          console.log('Using reviews data found in IDB database');
          callback(null, reviews);
        }
      });
    })
  }

  static refreshRestaurantReviews(config) {
    let restaurantId = config.body.restaurant_id;
    if (config.method === 'POST' && restaurantId) {
      console.log(`Refreshing restaurant ${restaurantId} IDB reviews`);
      DBHelper.idbClearRestaurantReviews(restaurantId);
      // fill reviews
      DBHelper.getReviewsByRestaurantId(restaurantId, (error, reviews) => {
        if (!reviews) {
          console.error(error);
          return;
        }
        console.log('Refreshed the following restaurant ${restaurandId} IDB reviews');
        console.log(reviews);
      });
    }
  }

  static idbClearRestaurantReviews(restaurant_id) {
    /* Open the IDB database */
    let dbPromise = DBHelper.openDatabase();
    dbPromise.then(db => {
      /* Open transaction to retrieve restaurants */
      let tx = db.transaction(DBHelper.IDB_REVIEWS_STORE_NAME, 'readwrite');
      let reviewsStore = tx.objectStore(DBHelper.IDB_REVIEWS_STORE_NAME);
      let reviewsRestaurantIdIndex = reviewsStore.index(DBHelper.IDB_REVIEWS_STORE_RESTAURANT_ID_INDEX);
      return reviewsRestaurantIdIndex.openCursor();
    })
    .then(function iterate(cursor) {
      if (!cursor) return;
      console.log('Cursored at:', cursor.value.name);
      if (cursor.value.restaurant_id === restaurant_id) {
        cursor.delete();
      }
      return cursor.continue().then(iterate);
    })
    .then(() => console.log('Done cursoring'));
  }

  static saveReview(review) {
    DBHelper.saveData([review], DBHelper.IDB_REVIEWS_STORE_NAME);

    let encodedReview = {};
    encodedReview.restaurant_id = encodeURI(review.restaurant_id);
    encodedReview.name = encodeURI(review.name);
    encodedReview.rating = encodeURI(review.rating);
    encodedReview.comments = encodeURI(review.comments);

    const url = `http://localhost:1337/reviews?restaurant_id=${encodedReview.restaurant_id}&name=${encodedReview.name}&rating=${encodedReview.rating}&comments=${encodedReview.comments}`;
    const config = {
      method: 'POST',
      body: review
    };
    fetch(url, config)
    .then(DBHelper.refreshRestaurantReviews(config))
    .catch(() => {
      console.log(`Could not perform the following request, will retry later: /${config.method} ${url}`);
      /* If it wasn't possible to update the server, try again later  */
      DBHelper.retry({url: url, config: config});
    });
  }
}

window.addEventListener('online', () => {
  console.log('Back online again')
  let newQueue = [];
  retryQueue.forEach((request) => {
    console.log(`Retrying request: /${request.config.method} ${request.url}`)
    fetch(request.url, request.config)
    .then(DBHelper.refreshRestaurantReviews(request.config))
    .catch(() => {
      newQueue.push(request);
    });
  });
  retryQueue = newQueue;
});

window.addEventListener('offline', () => {
  window.alert('You have lost connection');
});

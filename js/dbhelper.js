/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    // const port = 8000 // Change this to your server port
    const port = 1337 // Node server
    // return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}/restaurants`;
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
  static get IDB_RESTAURANT_STORE_NAME() {
    return 'restaurants';
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
          upgradeDb.createObjectStore(DBHelper.IDB_RESTAURANT_STORE_NAME);
      }
    });
  };

  /**
   * Save restaurants data in the IDB database
   */
  static saveData(restaurants) {
    console.log('Saving data');
    let dbPromise = DBHelper.openDatabase();
    dbPromise.then(db => {
      let tx = db.transaction(DBHelper.IDB_RESTAURANT_STORE_NAME, 'readwrite');
      let restaurantsStore = tx.objectStore(DBHelper.IDB_RESTAURANT_STORE_NAME);

      restaurants.forEach((restaurant) => {
        restaurantsStore.put(restaurant, restaurant.id);
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
      let tx = db.transaction(DBHelper.IDB_RESTAURANT_STORE_NAME, 'readwrite');
      let restaurantsStore = tx.objectStore(DBHelper.IDB_RESTAURANT_STORE_NAME);
      let restaurants = restaurantsStore.getAll().then((restaurants) => {
        /* There are no restaurants in the database */
        if (restaurants.length === 0) {
          console.log('No restaurants data found in the database. Requesting data from the server');
          /* Retrieve data from the server */
          fetch(DBHelper.DATABASE_URL).then( response => {
            if (response.status === 200) { // Got a success response from server!
              console.log('Successfully retrieved restaurant data')
              response.json().then(function(data) {
                /* Save data in IDB */
                DBHelper.saveData(data);
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

}

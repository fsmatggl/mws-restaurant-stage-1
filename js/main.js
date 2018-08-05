let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

let lazyImageObserver;

if ("IntersectionObserver" in window) {
  lazyImageObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        let lazyImage = entry.target;
        console.log(lazyImage);
        lazyImage.src = lazyImage.getAttribute('data-src');
        //lazyImage.srcset = lazyImage.dataset.srcset;
        lazyImage.classList.remove("lazy");
        lazyImageObserver.unobserve(lazyImage);
      }
    });
  });
} else {
  console.error('Could not use IntersectionObserver');
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  /* Wait until the map is fully loaded and remove iframe tabindex */
  const listener = self.map.addListener('tilesloaded', () => {
    removeMapsElementFocusAndSetAria();
    google.maps.event.removeListener(listener);
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const doSearchMessage = document.getElementById('do-search-container');
  if (!doSearchMessage.classList.contains('hidden')) {
    doSearchMessage.classList.add('hidden');
  }

  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  /* Add picture element */
  const picture = document.createElement('picture');

  let source;
  /* Append source for large resolution */
  source = document.createElement('source');
  source.media = '(min-width: 625px)';
  source.srcset = `/dist/img/${restaurant.id}-large.webp 800w`;
  picture.append(source);

  /* Append source for medium resolution */
  source = document.createElement('source');
  source.media = '(min-width: 425px)';
  source.srcset = `/dist/img/${restaurant.id}-medium.webp 625w`;
  picture.append(source);

  /* Append img for small resolution */
  const image = document.createElement('img');
  image.setAttribute('src', '/dist/img/placeholder.jpg');
  image.className = 'restaurant-img lazy';

  image.setAttribute('data-src', `/dist/img/${restaurant.id}-small.webp`);

  image.alt = restaurant.alt;
  picture.append(image);

  li.append(picture);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const favorite = document.createElement('button');
  favorite.style.color = '#a55902';
  favorite.style.cursor = 'pointer';
  if (restaurant.is_favorite) {
    favorite.innerHTML = `<i class="material-icons">star</i><p class="favorite-text">You like this restaurant!</p>`;
  } else {
    favorite.innerHTML = `<i class="material-icons">star_border</i><p class="favorite-text">Mark as favorite!</p>`;
  }
  favorite.onclick = () => {
    if (restaurant.is_favorite) {
      favorite.innerHTML = `<i class="material-icons">star_border</i><p class="favorite-text">Mark as favorite!</p>`;
      restaurant.is_favorite = false;
    } else {
      favorite.innerHTML = `<i class="material-icons">star</i><p class="favorite-text">You like this restaurant!</p>`;
      restaurant.is_favorite = true;
    }
    DBHelper.updateRestaurant(restaurant);
  }
  li.append(favorite);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  if (!restaurants) return;
  if (!self.map) return;
  
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/**
 * Remove all the map iframes and areas from the tab order and set aria labels
 */
removeMapsElementFocusAndSetAria = () => {
  const map = document.getElementById('map');
  const iframes = map.querySelectorAll("iframe");

   for (iframe of iframes) {
     iframe.setAttribute('tabindex', '-1');
     iframe.setAttribute('aria-label', 'Google Maps');
   }

   const areas = map.querySelectorAll("area");

   for (area of areas) {
    area.setAttribute('tabindex', '-1');
    area.setAttribute('aria-hidden', 'true');
  }
}

swapMap = () => {
  console.log('Swapping to dynamic map');
  if (document.getElementById('map').classList.contains('hidden-height')) {
    document.getElementById('map').classList.remove('hidden-height');
    document.getElementById('map').classList.add('map');
    addMarkersToMap();
  }
}

search = () => {
  updateRestaurants();
  swapMap();
  addMarkersToMap();
}

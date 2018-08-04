let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      /* Wait until the map is fully loaded and remove iframe tabindex */
      const listener = self.map.addListener('tilesloaded', () => {
        removeMapsElementFocusAndSetAria();
        google.maps.event.removeListener(listener)
      });

      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  let image;
  let imageSrc;

  /* Set large image */
  image = document.getElementById('restaurant-img-large');
  image.media = '(min-width: 625px)';
  image.srcset =  `/img_sized/${restaurant.id}-large.jpg 800w`;

  /* Set medium image */
  image = document.getElementById('restaurant-img-medium');
  image.media = '(min-width: 425px)';
  image.srcset = `/img_sized/${restaurant.id}-medium.jpg 625w`;
  
  /* Set small image */
  image = document.getElementById('restaurant-img-small');
  image.src = `/img_sized/${restaurant.id}-small.jpg`;
  image.className = 'restaurant-img';
  image.alt = restaurant.alt;


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.getReviewsByRestaurantId(restaurant.id, (error, reviews) => {
    if (!reviews) {
      console.error(error);
      return;
    }
    fillReviewsHTML(reviews);
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  addRestaurantHoursTodayDay();

  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Add today's day of the week in the hours header
 */
addRestaurantHoursTodayDay = () => {
  const date = new Date();
  const weekday = new Array(7);
  weekday[0] = "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";

  const today = weekday[date.getDay()];
  document.getElementById('restaurant-today').innerHTML = `Today is ${today}`; 
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  console.log(reviews);
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const dateElement = document.createElement('p');
  const date = new Date(review.createdAt);
  const dateString = `${date.getHours()}:${date.getMinutes()} - ${date.getDay()}/${date.getMonth()}/${date.getFullYear()}`;
  dateElement.innerHTML = dateString;
  li.appendChild(dateElement);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
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

saveReview = () => {
  let form = new FormData(document.getElementById('reviews-form'));
  
  let date = Date.now();
  let review = {};
  review.restaurant_id = self.restaurant.id;
  review.name = form.get('name');
  review.rating = form.get('rating');
  review.comments = form.get('comments');
  review.updatedAt = date;
  review.createdAt = date;

  console.log('review')

  DBHelper.saveReview([review]);

  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));

  document.getElementById('form-name').value='';
  document.getElementById('form-rating').value='';
  document.getElementById('form-comments').value='';
}

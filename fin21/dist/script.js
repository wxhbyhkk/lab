// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoid3hoYnloa2siLCJhIjoiY2xjcGRhZWJnMXM3dTNvcDhsYWFwdjlteiJ9.ZrG5cyH-eqnczL4GY9-_TA';

// Create a map instance and set configuration options
const map = new mapboxgl.Map({
  container: 'map', // Specify the container element to render the map in
  style: 'mapbox://styles/wxhbyhkk/clk2t76et00ge01pf218jg7ik', // Use the specified map style URL
  center: [-0.1276, 51.5072], // Set the initial center of the map (default value, modify as needed)
  zoom: 9 // Set the initial zoom level of the map (default value, modify as needed)
});

// Detect the user's location and set the map's center to the user's location
function locateUser() {
  if ('geolocation' in navigator) {
    // Use the Geolocation API to get the user's geographic location information
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Get the user's latitude and longitude
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Set the map's center to the user's location
        map.setCenter([longitude, latitude]);
      },
      (error) => {
        console.error('Unable to get user location:', error);
      }
    );
  } else {
    console.error('Geolocation API is not supported in this browser');
  }
}

// Call the locateUser function to detect the user's location and set the map's center
locateUser();




// Define the weather types mapping object
const weatherTypes = {
  0: "Clear night",
  1: "Sunny day",
  2: "Partly cloudy (night)",
  3: "Partly cloudy (day)",
  4: "Not used",
  5: "Mist",
  6: "Fog",
  7: "Cloudy",
  8: "Overcast",
  9: "Light rain shower (night)",
  10: "Light rain shower (day)",
  11: "Drizzle",
  12: "Light rain",
  13: "Heavy rain shower (night)",
  14: "Heavy rain shower (day)",
  15: "Heavy rain",
  16: "Sleet shower (night)",
  17: "Sleet shower (day)",
  18: "Sleet",
  19: "Hail shower (night)",
  20: "Hail shower (day)",
  21: "Hail",
  22: "Light snow shower (night)",
  23: "Light snow shower (day)",
  24: "Light snow",
  25: "Heavy snow shower (night)",
  26: "Heavy snow shower (day)",
  27: "Heavy snow",
  28: "Thunder shower (night)",
  29: "Thunder shower (day)",
  30: "Thunder",
};

// Listen for 'click' event on the map and handle the logic
map.on('click', 'site', async (event) => {
  // If the user clicked on one of the markers, get its information
  const features = map.queryRenderedFeatures(event.point, {
    layers: ['site'] // Replace with your layer name
  });
  if (!features.length) {
    return;
  }
  const feature = features[0];

  try {
    // Fetch weather data from the backend
    const response = await fetch(`http://localhost:8888/site/${feature.properties.id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const data = await response.json();

    // Update wxParams array with Night Minimum Temperature and Night Maximum Temperature
    const wxParams = data.wxParams;
    wxParams.push({ name: 'Nm', units: 'C', value: 'Night Minimum Temperature' });
    wxParams.push({ name: 'FNm', units: 'C', value: 'Feels Like Night Minimum Temperature' });

    // Create a popup, specify its options and properties, and add it to the map
    const popup = new mapboxgl.Popup({ offset: [0, -15], className: "my-popup" })
      .setLngLat(feature.geometry.coordinates)
      .setHTML(`
        <h3>ID:  ${feature.properties.id}</h3>  
        <p>Name: ${feature.properties.name}</p>
        <p>UnitaryAuthArea: ${feature.properties.unitaryAuthArea}</p>
                <br>
        <div class="popup-content">
          ${generateWeatherHTML(data)}
        </div>
      `)
      .addTo(map);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Handle error and display a message in the popup
    const popup = new mapboxgl.Popup({ offset: [0, -15], className: "my-popup" })
      .setLngLat(feature.geometry.coordinates)
      .setHTML(`
        <h3>ID: ${feature.properties.id}</h3>
        <p>Name: ${feature.properties.name}</p>
        <p>UnitaryAuthArea: ${feature.properties.unitaryAuthArea}</p>
        <div class="popup-content">
          <p>Weather: Error loading data</p>
        </div>
      `)
      .addTo(map);
  }
});

// Generate HTML content for weather information
function generateWeatherHTML(data) {
  const wxParams = data.wxParams;
  const periods = data.periods;

  let weatherHTML = '<h3>Weather:</h3>';
  periods.forEach((period) => {
    weatherHTML += `<p>Date: ${period.value}</p>`;
    period.reps.forEach((rep) => {
      const weatherType = weatherTypes[rep.W] || 'Unknown';
      let temperatureHTML = '';
      if (rep.dayNight === 'Day') {
        const maxTemperature = rep.Dm !== undefined ? `<p>Day Temperature: ${rep.Dm}${wxParams.find(param => param.name === 'Dm').units}</p>` : '';
        temperatureHTML += maxTemperature;
      } else if (rep.dayNight === 'Night') {
        const minTemperature = rep.Nm !== undefined ? `<p>Night Temperature: ${rep.Nm}${wxParams.find(param => param.name === 'Nm').units}</p>` : '';
        temperatureHTML += minTemperature;
      }
      weatherHTML += `
        <p>Day/Night: ${rep.dayNight}</p>
        <p>Weather Type: ${weatherType}</p>
        <p>Wind Speed: ${rep.S}mph</p>
        ${temperatureHTML}
        <hr>
      `;
    });
  });

  return weatherHTML;
}

map.addControl(new mapboxgl.NavigationControl(), "top-left");

map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  }),
  "top-left"
);


const geocoder = new MapboxGeocoder({
  // Initialize the geocoder
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false, // Do not use the default marker style
  placeholder: "Search for places in UK", // Placeholder text for the search bar
  proximity: {
    longitude: 55.8642,
    latitude: 4.2518
  } // Coordinates of Glasgow center
});

map.addControl(geocoder, "top-right");
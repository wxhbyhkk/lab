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

    // Function to update the site icon to "Sun"
    function updateSiteIconToSun(feature, iconFilename) {
      map.loadImage(
        `http://localhost:8888/icons/${iconFilename}.svg`, // Replace with the correct URL to the "Sun" icon image
        (error, image) => {
          if (error) throw error;

          // Add the image to the map style.
          map.addImage('sun-icon', image);

          // Update the site's icon to the "Sun" icon
          map.getSource('site').getLayer(feature.id).setLayout({
            'icon-image': 'sun-icon',
            'icon-size': 0.25
          });
        }
      );
    }

    // Function to generate HTML content for weather information
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

     // Function to create or update the weather chart
    function createOrUpdateWeatherChart(temperatureData) {
      const ctx = document.getElementById('weather-chart').getContext('2d');

      // Find the highest and lowest temperatures in the data
      const maxTemperature = Math.max(...temperatureData) + 2;
      const minTemperature = Math.min(...temperatureData) - 2;

      // Check if the weather chart already exists
      if (window.weatherChart) {
        // Update the existing weather chart with new temperature data
        window.weatherChart.data.datasets[0].data = temperatureData;
        window.weatherChart.options.scales.y.suggestedMin = minTemperature;
        window.weatherChart.options.scales.y.suggestedMax = maxTemperature;
        window.weatherChart.update();
      } else {
        // Create a new weather chart
        window.weatherChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['1', '2', '3', '4', '5'],

            datasets: [{
              label: 'Temperature',
              data: temperatureData,
              borderColor: 'rgba(0, 0, 0, 1)',
                
              borderWidth: 2,
              fill: false,
          
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: false,
                suggestedMin: minTemperature,
                suggestedMax: maxTemperature
              }
            }
          }
        });
      }
    }

    // Listen for 'click' event on the map and handle the logic
    map.on('click', 'site', async (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['site']
      });
      if (!features.length) {
        return;
      }
      const feature = features[0];

      try {
        // Fetch weather data from the backend
        const response = await fetch(`  http://localhost:8888/site/${feature.properties.id}`
                                   );
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();

        // Update wxParams array with Night Minimum Temperature and Night Maximum Temperature
        const wxParams = data.wxParams;
        wxParams.push({ name: 'Nm', units: 'C', value: 'Night Minimum Temperature' });
        wxParams.push({ name: 'FNm', units: 'C', value: 'Feels Like Night Minimum Temperature' });

        // Update the site icon to "Sun"
        updateSiteIconToSun(feature);

        // Generate HTML content for the popup
        const popupContent = `
          <h3>ID:  ${feature.properties.id}</h3>  
          <p>Name: ${feature.properties.name}</p>
          <p>UnitaryAuthArea: ${feature.properties.unitaryAuthArea}</p>
          <br>
          <div class="popup-content">
            ${generateWeatherHTML(data)}
          </div>
        `;

        // Create a popup and add it to the map
        const popup = new mapboxgl.Popup({ offset: [0, -15], className: "my-popup" })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(popupContent)
          .addTo(map);

        // Extract the temperature data for the chart
        const temperatureData = data.periods.map(period => parseInt(period.reps[0].Dm));

        // Create or update the weather chart with the new temperature data
        createOrUpdateWeatherChart(temperatureData);
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

    // Add map controls
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

 // Add keyboard event listener
    document.addEventListener('keydown', (event) => {
      // Get current map center
      const currentCenter = map.getCenter();

      // Set the amount of pixel to move on arrow key press
      const moveAmount =700;

      switch (event.key) {
        case 'ArrowUp':
          map.easeTo({ center: [currentCenter.lng, currentCenter.lat + moveAmount / 10000] });
          break;
        case 'ArrowDown':
          map.easeTo({ center: [currentCenter.lng, currentCenter.lat - moveAmount / 10000] });
          break;
        case 'ArrowLeft':
          map.easeTo({ center: [currentCenter.lng - moveAmount / 10000, currentCenter.lat] });
          break;
        case 'ArrowRight':
          map.easeTo({ center: [currentCenter.lng + moveAmount / 10000, currentCenter.lat] });
          break;
        default:
          break;
      }
    });

// 获取按钮和图表容器的引用
const toggleButton = document.getElementById('toggle-button');
const chartContainer = document.getElementById('chart-container');

// 初始状态下，图表容器是隐藏的
let isChartVisible = false;

// 添加按钮点击事件监听器
toggleButton.addEventListener('click', () => {
  // 切换图表容器的显示和隐藏状态
  isChartVisible = !isChartVisible;
  chartContainer.style.display = isChartVisible ? 'block' : 'none';
});

map.addControl(new mapboxgl.FullscreenControl(), "top-left");

	map.on("load", function () {
  map.addControl(new mapboxgl.Minimap({
    center: [-4.548, 54.83],
    zoom: 4,
    id: "mapboxgl-minimap",
    width: "300px",
    height: "370px",
    zoomLevels: [],
  
  }), 'bottom-left');
});

function Minimap ( options )
{
	Object.assign(this.options, options);

	this._ticking = false;
	this._lastMouseMoveEvent = null;
	this._parentMap = null;
	this._isDragging = false;
	this._isCursorOverFeature = false;
	this._previousPoint = [0, 0];
	this._currentPoint = [0, 0];
	this._trackingRectCoordinates = [[[], [], [], [], []]];
}

Minimap.prototype = Object.assign({}, mapboxgl.NavigationControl.prototype, {

	options: {
		id: "mapboxgl-minimap",
		width: "320px",
		height: "180px",
		style: "mapbox://styles/mapbox/streets-v8",
		center: [0, 0],
		zoom: 6,

		// should be a function; will be bound to Minimap
		zoomAdjust: null,

		// if parent map zoom >= 18 and minimap zoom >= 14, set minimap zoom to 16
		zoomLevels: [
			[18, 14, 16],
			[16, 12, 14],
			[14, 10, 12],
			[12, 8, 10],
			[10, 6, 8]
		],

		lineColor: "#08F",
		lineWidth: 1,
		lineOpacity: 1,

		fillColor: "#F80",
		fillOpacity: 0.25,

		dragPan: false,
		scrollZoom: false,
		boxZoom: false,
		dragRotate: false,
		keyboard: false,
		doubleClickZoom: false,
		touchZoomRotate: false
	},

	onAdd: function ( parentMap )
	{
		this._parentMap = parentMap;

		var opts = this.options;
		var container = this._container = this._createContainer(parentMap);
		var miniMap = this._miniMap = new mapboxgl.Map({
			attributionControl: false,
			container: container,
			style: opts.style,
			zoom: opts.zoom,
			center: opts.center
		});

		if (opts.maxBounds) miniMap.setMaxBounds(opts.maxBounds);

		miniMap.on("load", this._load.bind(this));

		return this._container;
	},

	_load: function ()
	{
		var opts = this.options;
		var parentMap = this._parentMap;
		var miniMap = this._miniMap;
		var interactions = [
			"dragPan", "scrollZoom", "boxZoom", "dragRotate",
			"keyboard", "doubleClickZoom", "touchZoomRotate"
		];

		interactions.forEach(function(i){
			if( opts[i] !== true ) {
				miniMap[i].disable();
			}
		});

		if( typeof opts.zoomAdjust === "function" ) {
			this.options.zoomAdjust = opts.zoomAdjust.bind(this);
		} else if( opts.zoomAdjust === null ) {
			this.options.zoomAdjust = this._zoomAdjust.bind(this);
		}

		var bounds = miniMap.getBounds();

		this._convertBoundsToPoints(bounds);

		miniMap.addSource("trackingRect", {
			"type": "geojson",
			"data": {
				"type": "Feature",
				"properties": {
					"name": "trackingRect"
				},
				"geometry": {
					"type": "Polygon",
					"coordinates": this._trackingRectCoordinates
				}
			}
		});

		miniMap.addLayer({
			"id": "trackingRectOutline",
			"type": "line",
			"source": "trackingRect",
			"layout": {},
			"paint": {
				"line-color": opts.lineColor,
				"line-width": opts.lineWidth,
				"line-opacity": opts.lineOpacity
			}
		});

		// needed for dragging
		miniMap.addLayer({
			"id": "trackingRectFill",
			"type": "fill",
			"source": "trackingRect",
			"layout": {},
			"paint": {
				"fill-color": opts.fillColor,
				"fill-opacity": opts.fillOpacity
			}
		});

		this._trackingRect = this._miniMap.getSource("trackingRect");

		this._update();

		parentMap.on("move", this._update.bind(this));

		miniMap.on("mousemove", this._mouseMove.bind(this));
		miniMap.on("mousedown", this._mouseDown.bind(this));
		miniMap.on("mouseup", this._mouseUp.bind(this));

		miniMap.on("touchmove", this._mouseMove.bind(this));
		miniMap.on("touchstart", this._mouseDown.bind(this));
		miniMap.on("touchend", this._mouseUp.bind(this));

		this._miniMapCanvas = miniMap.getCanvasContainer();
		this._miniMapCanvas.addEventListener("wheel", this._preventDefault);
		this._miniMapCanvas.addEventListener("mousewheel", this._preventDefault);
	},

	_mouseDown: function ( e )
	{
		if( this._isCursorOverFeature )
		{
			this._isDragging = true;
			this._previousPoint = this._currentPoint;
			this._currentPoint = [e.lngLat.lng, e.lngLat.lat];
		}
	},

	_mouseMove: function (e)
	{
		this._ticking = false;

		var miniMap = this._miniMap;
		var features = miniMap.queryRenderedFeatures(e.point, {
			layers: ["trackingRectFill"]
		});

		// don't update if we're still hovering the area
		if( ! (this._isCursorOverFeature && features.length > 0) )
		{
			this._isCursorOverFeature = features.length > 0;
			this._miniMapCanvas.style.cursor = this._isCursorOverFeature ? "move" : "";
		}

		if( this._isDragging )
		{
			this._previousPoint = this._currentPoint;
			this._currentPoint = [e.lngLat.lng, e.lngLat.lat];

			var offset = [
				this._previousPoint[0] - this._currentPoint[0],
				this._previousPoint[1] - this._currentPoint[1]
			];

			var newBounds = this._moveTrackingRect(offset);

			this._parentMap.fitBounds(newBounds, {
				duration: 80,
				noMoveStart: true
			});
		}
	},

	_mouseUp: function ()
	{
		this._isDragging = false;
		this._ticking = false;
	},

	_moveTrackingRect: function ( offset )
	{
		var source = this._trackingRect;
		var data = source._data;
		var bounds = data.properties.bounds;

		bounds._ne.lat -= offset[1];
		bounds._ne.lng -= offset[0];
		bounds._sw.lat -= offset[1];
		bounds._sw.lng -= offset[0];

		this._convertBoundsToPoints(bounds);
		source.setData(data);

		return bounds;
	},

	_setTrackingRectBounds: function ( bounds )
	{
		var source = this._trackingRect;
		var data = source._data;

		data.properties.bounds = bounds;
		this._convertBoundsToPoints(bounds);
		source.setData(data);
	},

	_convertBoundsToPoints: function ( bounds )
	{
		var ne = bounds._ne;
		var sw = bounds._sw;
		var trc = this._trackingRectCoordinates;

		trc[0][0][0] = ne.lng;
		trc[0][0][1] = ne.lat;
		trc[0][1][0] = sw.lng;
		trc[0][1][1] = ne.lat;
		trc[0][2][0] = sw.lng;
		trc[0][2][1] = sw.lat;
		trc[0][3][0] = ne.lng;
		trc[0][3][1] = sw.lat;
		trc[0][4][0] = ne.lng;
		trc[0][4][1] = ne.lat;
	},

	_update: function ( e )
	{
		if( this._isDragging  ) {
			return;
		}

		var parentBounds = this._parentMap.getBounds();

		this._setTrackingRectBounds(parentBounds);

		if( typeof this.options.zoomAdjust === "function" ) {
			this.options.zoomAdjust();
		}
	},

	_zoomAdjust: function ()
	{
		var miniMap = this._miniMap;
		var parentMap = this._parentMap;
		var miniZoom = parseInt(miniMap.getZoom(), 10);
		var parentZoom = parseInt(parentMap.getZoom(), 10);
		var levels = this.options.zoomLevels;
		var found = false;

		levels.forEach(function(zoom)
		{
			if( ! found && parentZoom >= zoom[0] )
			{
				if( miniZoom >= zoom[1] ) {
					miniMap.setZoom(zoom[2]);
				}

				miniMap.setCenter(parentMap.getCenter());
				found = true;
			}
		});

		if( ! found && miniZoom !== this.options.zoom )
		{
			if( typeof this.options.bounds === "object" ) {
				miniMap.fitBounds(this.options.bounds, {duration: 50});
			}

			miniMap.setZoom(this.options.zoom)
		}
	},

	_createContainer: function ( parentMap )
	{
		var opts = this.options;
		var container = document.createElement("div");

		container.className = "mapboxgl-ctrl-minimap mapboxgl-ctrl";
		container.setAttribute('style', 'width: ' + opts.width + '; height: ' + opts.height + ';');
		container.addEventListener("contextmenu", this._preventDefault);

		parentMap.getContainer().appendChild(container);

		if( opts.id !== "" ) {
			container.id = opts.id;
		}

		return container;
	},

	_preventDefault: function ( e ) {
		e.preventDefault();
	}
});

mapboxgl.Minimap = Minimap;
// 在你的现有JavaScript代码中添加以下部分

document.getElementById("toggleMinimap").addEventListener("click", function () {
  var minimapContainer = document.querySelector(".mapboxgl-ctrl-minimap");
  
  if (minimapContainer.style.display === "none") {
    minimapContainer.style.display = "block"; // 切换小地图的显示状态为显示
  } else {
    minimapContainer.style.display = "none"; // 切换小地图的显示状态为隐藏
  }
});

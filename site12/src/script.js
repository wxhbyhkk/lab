map.on('click', (event) => {
// If the user clicked on one of your markers, get its information. 
const featuress = map.queryRenderedFeatures(event.point, {
layers: ['site'] // replace with your layer name 
});
if (!featuress.length) { 
  return;
}
const feature1 = featuress[0];
  
/*
Create a popup, specify its options and properties, and add it to the map.
*/
const popup = new mapboxgl.Popup({ offset: [0, -15], className: "my-popup" }) .setLngLat(feature1.geometry.coordinates).setHTML(
`
<h3>Location: ${feature1.properties.sitename}</h3>
<p>websites: ${feature1.properties.url}</p>
<p>Zip code: ${feature1.properties.siteid}</p>
<p>item: ${feature1.properties.item}</p>
`
     )
     .addTo(map);
  });
map.on("mousemove", (event) => {
  const dzone = map.queryRenderedFeatures(event.point, {
    layers: ["pm10"]
  
    
  }
);


const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");

//On click the radio button, toggle the style of the map.
for (const input of inputs) {
  input.onclick = (layer) => {
  
    if (layer.target.id == "pm10") {
      map.setStyle(pm10);}
     if (layer.target.id == "co2") {
      map.setStyle(co2);} if (layer.target.id == "nox") {
      map.setStyle(nox);}
    if (layer.target.id == "pm25") {
      map.setStyle(pm25);}
  };
}


  document.getElementById("pd").innerHTML = dzone.length
    ? 
    
   ` <p2>Borough: <strong>${dzone[0].properties.borough}</strong><br /> 
   </p2>
      <p2>2013Emissions: <strong>${dzone[0].properties.all_2013}</strong><strong> tonnes/year</strong><br /></p2>
      <p2>2016Emissions: <strong>${dzone[0].properties.all_2016}</strong><strong> tonnes/year<br /></strong></p2>
   <p2>2019Emissions: <strong>${dzone[0].properties.all_2019}</strong><strong> tonnes/year</strong></p2>
   `
    : `<p2>Hover over a data zone!</p2>`;

   map.getSource("hover").setData({
    type: "FeatureCollection",
    features: dzone.map(function (f) {
      return { type: "Feature", geometry: f.geometry };
    })
    
})
});


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
  placeholder:"Search for places in London"

});

map.addControl(geocoder, "top-right");

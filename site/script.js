/*
Add an event listener that runs
when a user clicks on the map element. */ 
map.on('click', (event) => {
// If the user clicked on one of your markers, get its information. 
const features = map.queryRenderedFeatures(event.point, {
layers: ['site'] // replace with your layer name 
});
if (!features.length) { 
  return;
}
const feature = features[0];
  
/*
Create a popup, specify its options and properties, and add it to the map.
*/
const popup = new mapboxgl.Popup({ offset: [0, -15], className: "my-popup" }) .setLngLat(feature.geometry.coordinates).setHTML(
`
<h3>Location: ${feature.properties.sitename}</h3>
<p>websites: ${feature.properties.url}</p>
<p>Zip code: ${feature.properties.siteid}</p>
<p>item: ${feature.properties.item}</p>
`
     )
     .addTo(map);
  
});


const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");

//On click the radio button, toggle the style of the map.
for (const input of inputs) {
  input.onclick = (layer) => {
    if (layer.target.id == "ob") {
      map.setStyle(ob);
    }
    if (layer.target.id == "pm102019") {
      map.setStyle(pm102019);
    }
  };
}
let viewport_width = document.documentElement.clientWidth;
let viewport_height = document.documentElement.clientHeight;
document.getElementById('main').style.width = viewport_width+'px';
document.getElementById('main').style.height = viewport_height+'px';
document.getElementById('tooltip').style.height = viewport_height-80+'px';

//// JS related to TOOLTIP
function hover() {
  let tt = document.getElementById('tooltip');
  tt.style.visibility = "visible";
}https://codepen.io/kitpaddle/full/yLvjrVV
function leave() {
  let tt = document.getElementById('tooltip');
  tt.style.visibility = "hidden";
}

//// JS RELATED TO MAP / LEAFLET

const startingPos =[59.651, 17.941];
const URL_OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const URL_WHITE = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png';
const URL_SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Creating MAP and baseMap Layer and adding them to the DIV
// So even if other layers take time to load map shows right away
const map = L.map('map', {
  center: startingPos,
  zoom: 10,
  fullscreenControl: true,
  attributionControl: false,
  renderer: L.canvas()
});

L.control.attribution({
  position: 'bottomleft'
}).addTo(map);

// Creating Basemaps
const baseMapGrey = new L.tileLayer(URL_WHITE, {
  attribution: '&copy; <a href="https://carto.com/">CartoDB</a> & <a href="https://www.openstreetmap.org/copyright">OSM</a> kitpaddle',
  minZoom: 10,
  updateWhenIdle: true,
  keepBuffer: 5,
  edgeBufferTiles: 2
});
const baseMap = L.tileLayer(URL_OSM, {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kitpaddle',
  minZoom: 10
}).addTo(map);
const baseMapSat = new L.tileLayer(URL_SAT, {
  attribution: '&copy; <a href="https://carto.com/">CartoDB</a> & <a href="https://www.openstreetmap.org/copyright">OSM</a>& <a href="https://www.esri.com/en-us/home">ESRI</a> kitpaddle',
  minZoom: 10,
  updateWhenIdle: true,
  keepBuffer: 5,
  edgeBufferTiles: 2
});
// Creating Layergroup for basemaps
const baseMaps = {
  "Base Map": baseMapGrey,
  "Detailed Map": baseMap,
  "Satellite": baseMapSat
};

// Creating GeoJson
let geoCtrPoly = {
  "type": "Feature",
    "properties": {
      "name": "ESSA CTR",
        "popupContent": "The ESSA CTR boundaries"
    },
      "geometry": {
        "type": "Polygon",
          "coordinates": [
            [
              [
                17.96161651611328,
                59.491469015645784
              ],
              [
                18.322792053222656,
                59.632351851463916
              ],
              [
                18.253097534179688,
                59.774028637875354
              ],
              [
                18.172760009765625,
                59.814792236965225
              ],
              [
                17.77759552001953,
                59.81496485809926
              ],
              [
                17.696571350097656,
                59.55798351453151
              ],
              [
                17.779998779296875,
                59.506803361027174
              ],
              [
                17.96161651611328,
                59.491469015645784
              ]
            ]
          ]
      }
};

let selectedFeatures = [];
  
//Creating Layers from GeoJson
let ctrLayer = new L.geoJSON(geoCtrPoly, {pmIgnore: true, interactive: false, style:{opacity:0.4, fillOpacity: 0.1}});
ctrLayer.addTo(map);
// Creating Layergroup for overlays
const overlayMaps = {
  "ESSA CTR": ctrLayer
};

// Create control with layerGroups
let panelLayers = new L.control.layers(baseMaps, overlayMaps);
// Add control AND layers to map
panelLayers.addTo(map);
//map.fitBounds(ctrLayer.getBounds());


// TESTING GEOJSON from Drawings
let essaLayer;
const showArr = ["MKN_RWY_ID_W", "MKN_RWY_CHEV_Y", "MKN_RWY_AP_W", "MKN_RWY_CL_W", "MKN_RWY_TDZ_W", "MKN_RWY_THR_MARKINGS_W", "MKN_RWY_THRP_W", "MKN_RWY_SIST_W"];
fetch('https://kitpaddle.github.io/hosting/M20-1-000-00-P3.json').then(response => {
  return response.json();
}).then(data => {
  let d = data.features;
  let layersArray = [];
  for (let i=0;i<d.length;i++){
    if(layersArray.indexOf(d[i].properties.Layer) < 0) {
      layersArray.push(d[i].properties.Layer);
     }
  }
  let filteredData = d.filter(i => showArr.some(e => e == i.properties.Layer));
  //console.log(layersArray);
  essaLayer = new L.geoJSON(filteredData, {pmIgnore: true, style:{color:'black'}});
  essaLayer.addTo(map);
  panelLayers.addOverlay(essaLayer, "Runways");
}).catch(err => {
  // Do something for an error here
});

// add Leaflet-Geoman controls with some options to the map  
map.pm.addControls({  
  position: 'topleft',
  drawMarker: false,
  drawCircle: false,
  drawCircleMarker: false,
  drawPolygon: false,
  drawRectangle: false,
  drawText: false,
  dragMode: false,
  cutPolygon: false,
  rotateMode: false
});

map.pm.enableDraw('Line',{ continueDrawing: false, snappable: false }); 
map.pm.disableDraw();
map.pm.setPathOptions({
  color: 'orange',
  weight: 6,
  fillOpacity: 1,
});

map.on('pm:create', (e) => {
  let temp = map.pm.getGeomanDrawLayers(true);
  console.log('Added powerline');
  let temp2 = temp.toGeoJSON();
  drawNames(temp2);
});

map.on('pm:remove', (e) => {
  let temp = map.pm.getGeomanDrawLayers(true);
  console.log('Removed powerline');
  let temp2 = temp.toGeoJSON();
  drawNames(temp2);
});

let linesnr = 0;
let nameLayer = new L.geoJSON(null,{pmIgnore: true});
nameLayer.addTo(map);

function drawNames(json){
  map.removeLayer(nameLayer);
  let a = json.features;
  for(let i=0;i<a.length;i++){
    a[i].properties.name = String.fromCharCode(65+(Math.floor(i/26)))+(i%10).toString();
  }
  nameLayer = new L.geoJSON(json, {pmIgnore: true, onEachFeature: onEachPower, style: {color: 'black', opacity: 0, weight: 0.1}});
  nameLayer.addTo(map);
  document.getElementById("linesNr").innerHTML = 'Lines to be inspected: '+a.length;
  linesnr = a.length;
}

function onEachPower(feature, layer){
  layer.bindTooltip(feature.properties.name, {permanent: true, direction: 'right'}).openTooltip();
}


//// PRINTING

let form = document.getElementById('survey-form');
form.addEventListener('submit', (event) => {
  event.preventDefault(); //Don't open new page
  
  let bounds = essaLayer.getBounds();
  bounds.extend(map.pm.getGeomanDrawLayers(true).getBounds());
  baseMap.addTo(map);
  
  
  //Rearrange DIVS for printing (hiding and so on)
  document.getElementById('infobar').style.display = 'none';
  document.getElementById('printinfo').style.display = 'flex';
  document.getElementById('main').style.height = '270mm';
  document.getElementById('main').style.width = '400mm';
  document.getElementById('map').style.width = '100%';
  
  // FIlling in data from FORM
  document.getElementById('printname').innerHTML = form.elements['name'].value;
  document.getElementById('printnr').innerHTML = form.elements['phone'].value;
  document.getElementById('printemail').innerHTML = form.elements['email'].value;
  document.getElementById('printtype').innerHTML = form.elements['actype'].value;
  document.getElementById('printcs').innerHTML = form.elements['accall'].value;
  document.getElementById('printdof').innerHTML = form.elements['dof'].value;
  document.getElementById('printextra').innerHTML = form.elements['comments'].value;
  document.getElementById('printlines').innerHTML = linesnr.toString();
  if(form.elements['alt'].checked) document.getElementById('printalt').innerHTML = 'YES';
  else document.getElementById('printalt').innerHTML = 'NO';
  /////////////////
  setTimeout(function(){
    map.invalidateSize();
    map.fitBounds(bounds);
  }, 500);
  setTimeout(function(){ 
    window.print();
    document.getElementById('infobar').style.display = 'block';
    document.getElementById('main').style.height = viewport_height+'px';
    document.getElementById('main').style.width = viewport_width+'px';
    document.getElementById('map').style.width = '80%';
    document.getElementById('printinfo').style.display = 'none';
  }, 2000);
  
  //map.on("load", ()=>{window.print();});
  //map.setView(startingPos, 10);
  
});
const featureModal = new bootstrap.Modal(document.getElementById("featureModal"), {
  keyboard: false
});

const map = L.map("map", {
  zoomSnap: L.Browser.mobile ? 0 : 1,
  tap: (L.Browser.safari && !L.Browser.mobile) ? false : true,
  maxZoom: 20,
  minZoom: 12,
  zoomControl: false
}).fitWorld();

$('.navbar-collapse a').click(function(){
  $(".navbar-collapse").collapse('hide');
});


function togglePage(page) {
  //console.log(page)
  if (page=='invasives') {
    $("#invasives").show();
    $("#map").hide();
    $("#trees").hide();
  }
  else if (page=='map') {
    $("#map").show();
    $("#invasives").hide();
    $("#trees").hide();
  }
  else {
    $("#trees").show();
    $("#invasives").hide();
    $("#map").hide();
  }

  
}
function ZoomToExtent() {
  map.fitBounds(layers.basemaps["Trail Map"].options.bounds);
}

map.attributionControl.setPrefix("");

map.on("click", (e) => {
  layers.select.clearLayers();
});

const layers = {
  basemaps: {
    // "Streets": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.@2xpng", {
    //   maxNativeZoom: 18,
    //   maxZoom: map.getMaxZoom(),
    //   attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attribution">CARTO</a>',
    // }),
    // "Aerial": L.tileLayer("https://orthos.its.ny.gov/arcgis/rest/services/wms/2017/MapServer/tile/{z}/{y}/{x}", {
    //   maxNativeZoom: 18,
    //   maxZoom: map.getMaxZoom(),
    //   attribution: "NYS ITS - GPO",
    // }),
    // "Topo": L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", {
    //   maxNativeZoom: 16,
    //   maxZoom: map.getMaxZoom(),
    //   attribution: "USGS",
    // }),
    // "Winter Trails Map": L.tileLayer.mbTiles("data/trail_map_winter.mbtiles", {
    //   autoScale: true,
    //   updateWhenIdle: false
    // }).once("databaseloaded", (e) => {
    //   layers.basemaps["Winter Trails Map"].bringToFront();
    //   map.removeLayer(layers.basemaps["Winter Trails Map"])
    // }).addTo(map),
    "Trail Map": L.tileLayer.mbTiles("data/trail_map.mbtiles", {
      autoScale: true,
      fitBounds: true,
      updateWhenIdle: false
    }).on("databaseloaded", (e) => {
      map.setMaxBounds(L.latLngBounds(layers.basemaps["Trail Map"].options.bounds).pad(1));
      controls.locateCtrl.start();
    })
  },
  overlays: {
    "Points of Interest": L.geoJSON(null, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          title: feature.properties.name,
          // radius: 8,
          // color: "green",
          // fillColor: "blue",
          // stroke: 0.5,
          // fillOpacity: 1
          icon: L.icon({
          iconUrl: `assets/img/icons/${feature.properties.icon}.png`,
          iconSize: [24, 28],
          iconAnchor: [12, 28],
          popupAnchor: [0, -25]
          })
        });
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          popupclose: (e) => {
//            layers.select.clearLayers();
              return false;
          },
          click: (e) => {
            
            showFeatureModal(feature.properties);
            return false;
            // layers.select.clearLayers();
            // layers.select.addLayer(L.geoJSON(layer.toGeoJSON(), {
            //   style: {
            //     color: "#00FFFF",
            //     weight: 5
            //   },
            //   pointToLayer: (feature, latlng) => {
            //     return L.circleMarker(latlng, {
            //       radius: 6,
            //       color: "#00FFFF",
            //       fillColor: "#00FFFF",
            //       fillOpacity: 1
            //     }); 
            //   }
            // }))
          }
        });
      }
    })
    //.addTo(map)
  },
  select: L.featureGroup(null).addTo(map)
};


map.on('zoomend', function () {
  if (map.getZoom() < 15 && map.hasLayer(layers.overlays["Points of Interest"])) {
      map.removeLayer(layers.overlays["Points of Interest"]);
  }
  if (map.getZoom() > 15 && map.hasLayer(layers.overlays["Points of Interest"]) == false)
  {
      map.addLayer(layers.overlays["Points of Interest"]);
  }   
});

/*** Begin Zoom Extent Control ***/
L.Control.ZoomExtent = L.Control.extend({
  onAdd: function(map) {    
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = `
      <a class='leaflet-bar-part leaflet-bar-part-single zoom-extent-btn' title='Zoom To Map' onclick='ZoomToExtent();'>
        <i class='icon-zoom_out_map'></i>
      </a>
    `;
    L.DomEvent.on(div, "click", function (e) {
      L.DomEvent.stopPropagation(e);
    });
    return div
  }
});

L.control.zoomextent = (opts) => {
  return new L.Control.ZoomExtent(opts);
}
/*** End custom control ***/

const controls = {
  // layerCtrl: L.control.layers(layers.basemaps, layers.overlays, {
  //   collapsed: true,
  //   position: "topright"
  // }).addTo(map),

  locateCtrl: L.control.locate({
    icon: "icon-gps_fixed",
    iconLoading: "spinner icon-gps_fixed",
    setView: "untilPan",
    cacheLocation: true,
    position: "topright",
    flyTo: false,
    keepCurrentZoomLevel: true,
    circleStyle: {
      interactive: false
    },
    markerStyle: {
      interactive: true
    },
    metric: false,
    strings: {
      title: "My location",
      outsideMapBoundsMsg: "You seem to be located outside the map boundary!",
      popup: (options) => {
        const loc = controls.locateCtrl._marker.getLatLng();
        return `<div style="text-align: center;">You are within ${Number(options.distance).toLocaleString()} ${options.unit}<br>from <strong>${loc.lat.toFixed(6)}</strong>, <strong>${loc.lng.toFixed(6)}</strong></div>`;
      }
    },
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 18
    },
    onLocationOutsideMapBounds: function(control) {
      // control.stop();
      // alert(control.options.strings.outsideMapBoundsMsg);
    },
    onLocationError: (e) => {
      hideLoader();
      document.querySelector(".leaflet-control-locate").getElementsByTagName("span")[0].className = "icon-gps_off";
      alert(e.message);
    }
  }).addTo(map),
  zoomCtrl: L.control.zoomextent({
    position: "topright"
  }).addTo(map),
  scaleCtrl: L.control.scale({
    position: "bottomleft"
  }).addTo(map)
};

function ZoomToExtent() {
  map.fitBounds(layers.basemaps["Trail Map"].options.bounds);
}

// $.getJSON("data/interactive_points.geojson", function (data) {
//   layers.overlays["Points of Interest"].addData(data);
// });

function loadData() {
  fetch('data/points.csv')
  .then(response => response.text())
  .then(data => csv2geojson.csv2geojson(data, {}, function(err, data) {
    if (data) {
      layers.overlays["Points of Interest"].addData(data);
    }
  }));
}


function emptyFeatureModal() {
  document.getElementById("feature-title").innerHTML = "";
  document.getElementById("feature-photo_1").innerHTML = "";
  document.getElementById("feature-photo_2").innerHTML = "";
  document.getElementById("feature-button-1").innerHTML = "";
  document.getElementById("feature-button-2").innerHTML = "";
  document.getElementById("feature-audio").innerHTML = "";
  featureModal.hide();
}

function showFeatureModal(properties) {
  let photos = [];
  document.getElementById("feature-title").innerHTML = properties.name;
 
  document.getElementById("feature-general_description").innerHTML = properties.description;
  // document.getElementById("feature-_server_updated_at").innerHTML = new Date(properties._server_updated_at).toLocaleString(undefined, {year: "numeric", month: "long", day: "numeric"});
  //document.getElementById("feature-other_photos").innerHTML = "";
  if (properties.photo1_filename) {
    document.getElementById("feature-photo_1").innerHTML = `<img src="data/photos/${properties.photo1_filename}" class="img-fluid mx-auto d-block" alt="photo"></img>`;
    //photos.push(properties.photo1_filename);
  } else {
    document.getElementById("feature-photo_1").innerHTML = "";
  }
  if (properties.photo2_filename) {
    document.getElementById("feature-photo_2").innerHTML = `<img src="data/photos/${properties.photo2_filename}" class="img-fluid mx-auto d-block" alt="photo"></img>`;
    //photos.push(properties.photo2_filename);
  } else {
    document.getElementById("feature-photo_2").innerHTML = "";
  }
  if (properties.url_1) {
    document.getElementById("feature-button-1").innerHTML = `<a href="${properties.url_1}" target="_blank"><button type="button" class="btn btn-primary btn-sm">${properties.url_1_button_label}</button></a>`;
    //photos.push(properties.photo2_filename);
  } else {
    document.getElementById("feature-button-1").innerHTML = "";
  }
  if (properties.url_2) {
    document.getElementById("feature-button-2").innerHTML = `<a href="${properties.url_2}" target="_blank"><button type="button" class="btn btn-success btn-sm">${properties.url_2_button_label}</button></a>`;
    //photos.push(properties.photo2_filename);
  } else {
    document.getElementById("feature-button-2").innerHTML = "";
  }
  if (properties.audio_filename) {
    document.getElementById("feature-audio").insertAdjacentHTML("beforeend", `<div class="p-2 flex-fill"><audio id="audio" class="mx-auto d-block" controls=""><source type="audio/mpeg" src="data/audio/${properties.audio_filename}"> Your browser does not support the audio element.</audio></div>`)
  } else {
    document.getElementById("feature-audio").innerHTML = "";
  }
  //   if (properties.photo_other) {
  //   photos = photos.concat(properties.photo_other.split(","));
  // }
  // photos.forEach(photo => {
  //   document.getElementById("feature-other_photos").insertAdjacentHTML("beforeend", `<div class="p-2 flex-fill"><a href="data/photos/${photo}" target="_blank"><img src="data/photos/${photo}" class="img-thumbnail mx-auto d-block" style="max-height: 100px" alt="photo"></img></a></div>`);
  // });
  featureModal.show();
}

function showLoader() {
  document.getElementById("progress-bar").style.display = "block";
}

function hideLoader() {
  document.getElementById("progress-bar").style.display = "none";
}

document.getElementById("featureModal").addEventListener("hidden.bs.modal", function (event) {
  let audioPlayer = document.getElementById("audio");
  if (audioPlayer) {
    audioPlayer.pause();
  }
})

initSqlJs({
  locateFile: function() {
    return "assets/vendor/sqljs-1.6.2/sql-wasm.wasm";
  }
}).then(function(SQL){
  hideLoader();
  loadData();
  layers.basemaps["Trail Map"].addTo(map);
});


var map, mapMenu, cartoLayer, infoWindow, polygonArray, contextMenu, regions, geocoder;
//-------------------------------------------BASE MAP--------------------------------------------
polygonArray = [];
regions = [];
var latlng = new google.maps.LatLng(40.00, -100.00);
var styledMap;
var styles;
var drawingManager;
//Create an array of styles.
styles = [{ "featureType": "all", "elementType": "geometry.fill", "stylers": [{ "weight": "2.00" }] }, { "featureType": "all", "elementType": "geometry.stroke", "stylers": [{ "color": "#9c9c9c" }] }, { "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "on" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] }, { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] }, { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#eeeeee" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#7b7b7b" }] }, { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }] }, { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#c8d7d4" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#070707" }] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }];

styledMap = new google.maps.StyledMapType(styles, { name: 'Styled Map' });
var mapOptions = {
    zoom: 4,
    center: latlng,
    scaleControl: true,

    disableDefaultUI: true,
    mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT
    },
    zoomControl: true,
    zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_TOP
    },
    rotateControl: true,
    rotateControlOptions: {
        position: google.maps.ControlPosition.LEFT_TOP
    }

};

map = new google.maps.Map(document.getElementById('map'), mapOptions);

//Associate the styled map with the MapTypeId and set it to display.
map.mapTypes.set('map_style', styledMap);
//-----------------------------------------DRAWN SHAPE------------------------------------------
var drawnOptions = {
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['circle', 'polygon', 'rectangle']
    },
    polygonOptions: {
        editable: true,
        clickable: true
    },
    circleOptions: {
        fillColor: '#ffff00',
        fillOpacity: .5,
        strokeWeight: 2,
        clickable: true,// available for click event
        editable: true,
        zIndex: 1
    },
    rectangleOptions: {
        fillColor: '#ffff00',
        fillOpacity: .5,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1
    }
};
//-----------------------------------------CARTO DB LAYER---------------------------------------
var layers = new Array();
var cb_i = 0;

var dict = new Object();
var CartoDBLayer = function (n, u, c) {
    this.category = c;
    this.name = n;
    var l;

    cb_i++;
    var l_in = cb_i;

    this.putOnMap = function () {
        cartodb.createLayer(map, u).addTo(map, l_in).on('done', function (layer) {
            l = layer;
            var sublayer = layer.getSubLayer(0);
            $('#search').on('click', function () {
                var address = document.getElementById("address").value;
                var geolocation;
                geocoder.geocode({ 'address': address }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        geolocation = results[0].geometry.location;
                        var marker = new google.maps.Marker({
                            map: map,
                            draggable: true,
                            animation: google.maps.Animation.DROP,
                            position: results[0].geometry.location
                        });
                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });
            });
        });
    };
    this.clearFromMap = function () {
        l.getSubLayer(0).hide();
        l.remove();
        l.clear();
    };
    this.isOnMap = function () {
        return false;
    };

    this.sublayer = function () {
        return l.getSubLayer(0);
    };
};

//dict['state'] = new CartoDBLayer('State', 'https://hashtaghealth.carto.com/api/v2/viz/a88b82ca-0900-11e7-b06b-0e3ff518bd15/viz.json', 'Map Layers');
//dict['county'] = new CartoDBLayer('County', 'https://hashtaghealth.carto.com/api/v2/viz/d61716ee-0e4d-11e7-9c2f-0ee66e2c9693/viz.json', 'Map Layers');
//dict['zipcode'] = new CartoDBLayer('ZIP code', '', 'Map Layers');

layers.push(new CartoDBLayer('State', 'https://hashtaghealth.carto.com/api/v2/viz/a88b82ca-0900-11e7-b06b-0e3ff518bd15/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('County', 'https://hashtaghealth.carto.com/api/v2/viz/d61716ee-0e4d-11e7-9c2f-0ee66e2c9693/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Census Tract', '', 'Map Layers'));
layers.push(new CartoDBLayer('ZIP code', '', 'Map Layers'));
layers.push(new CartoDBLayer('Fair/Poor Health', 'https://hashtaghealth.carto.com/api/v2/viz/54fbfc8d-3125-481b-8d24-e5359c972d86/viz.json', 'Map Layers'));

//-----------------------------------------INITIALIZE MAP---------------------------------------
function initMap() {
  
    geocoder = new google.maps.Geocoder();
    //-----------------------------DRAWING MANAGER AND ITS CONTENT-----------------------------------------
    //Creating a context menu to use it in event handler
    DrawnMenuSetUp();
    contextMenu = new ContextMenuDrawing(map);

    drawingManager = new google.maps.drawing.DrawingManager(drawnOptions);
    drawingManager.setMap(map);
    drawingManager.setDrawingMode(null);
    // Add a listener to show coordinate when right click
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event1) {
        polygonArray.push(event1);
        drawingManager.setDrawingMode(null);
        google.maps.event.addListener(event1.overlay, 'rightclick', function (event) {
            contextMenu.show(event.latLng);
            document.getElementById('rm').addEventListener('click', function () {
                event1.overlay.setMap(null);
            });
        });
    });

    //function createSelector(layer) {
    //    var cartocss = "";
    //    var $options = $(".layer_selector").find("input");
    //    $options.click(function (e) {
    //        var $li = $(e.target);
    //        var selected = $li.attr('id');

    //        $options.removeClass('selected');
    //        $li.addClass('selected');

    //        cartocss = $('#' + selected).text();

    //        layer[0].setCartoCSS(cartocss);

    //        dict[selected].putOnMap();

    //    });
    //}
    

    // GET BOUNDS SO LIMIT ONLY COORDINATES WITHIN THE SHAPES
    // google.maps.event.addListener(drawingManager, 'overlaycomplete', getArrays);
}
google.maps.event.addDomListener(window, 'load', initMap);

//-------------------HELPER METHOD TO EXTRACT JSON FILE----------------





//-------------------HELPER METHODS FOR DRAWING MANAGER----------------
function removeAll() {
    for (var i = 0; i < polygonArray.length; i++) {
        polygonArray[i].overlay.setMap(null);
    }
    polygonArray = [];
}


//------------------HELPER METHODS FOR CARTO DB------------------------
function loadLayers() {
    for (i = 0; i < layers.length; i++) {
        var c;

        if (!hasCategoty(layers[i].category)) {
            if (layers[i].category != '') {
                c = addCategoryUI(layers[i].category, layers[i].name);
            }
            else {
                c = getCategoryContent(layers[i].category);
            }

        }
        else {
            c = getCategoryContent(layers[i].category);
        }

        if (layers[i].category != '') {
            var catTable = c.getElementsByTagName('table')[0];
            // new row
            var layerItem = document.createElement('tr');
            // new cell
            var itemtd = document.createElement('td');

            var itemin = document.createElement('input');
            itemin.type = 'radio';
            itemin.name = 'other';
            itemin.id = layers[i].name;
            itemin.onclick = showLayer;

            var itemtd2 = document.createElement('td');
            itemtd2.innerHTML = layers[i].name;

            itemtd.appendChild(itemin);
            layerItem.appendChild(itemtd);
            layerItem.appendChild(itemtd2);

            //layerItem.innerHTML = "<td><input onclick='showLayer(\""+layers[i].name+"\")' type='checkbox' name='other' id='"+layers[i].name+"' value='trafficLayer'/></td><td align='left'>"+layers[i].name+"</td>"

            catTable.appendChild(layerItem);
        }

    }
}
//loadLayers();

function showLayer() {
    var $radio = $('input[name=other]:checked');
    var id = $radio.attr('id');
    for (i = 0; i < layers.length; i++) {
        // each layer is just an cartodb object. not a real layer
        if (layers[i].name == id )
            layers[i].putOnMap();
        else
            layers[i].clearFromMap();
    }
}

function getCategoryContent(cat) {
    var accordion = document.getElementById('accordion');
    var e = accordion.getElementsByTagName("h3");

    for (j = 0; j < e.length; j++) {
        if (e[j].textContent == cat) {
            return accordion.getElementsByTagName('div')[j];
            break;
        }
        else if (j == e.length) {
            return false;
            break;
        }
    }
}

function hasCategoty(cat) {
    var accordion = document.getElementById('accordion');
    var e = accordion.getElementsByTagName("h3");

    for (j = 0; j < e.length; j++) {
        if (e[j].textContent == cat) {
            return true;
            break;
        }
        else if (j == e.length) {
            return false;
            break;
        }
    }
}

function addCategoryUI(tag, id) {
    var accordion = document.getElementById('accordion');
    var accorHeader = document.createElement('h3');
    var accorContent = document.createElement('div');

    accorHeader.innerHTML = '<strong>' + tag + '</strong>';
    var contentTable = document.createElement('table');
    accorContent.appendChild(contentTable);

    accordion.appendChild(accorHeader);
    accordion.appendChild(accorContent);

    return accorContent;
}


var map, mapMenu, cartoLayer, infoWindow, polygonArray, contextMenu, regions;
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

var CartoDBLayer = function (n, u, c) {
    this.category = c;
    this.name = n;
    var l;

    cb_i++;
    var l_in = cb_i;

    this.putOnMap = function () {
        cartodb.createLayer(map, u).addTo(map, l_in).on('done', function (layer) {
            l = layer;
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
};
layers.push(new CartoDBLayer('State', 'https://hashtaghealth.carto.com/api/v2/viz/a88b82ca-0900-11e7-b06b-0e3ff518bd15/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('County', '', 'Map Layers'));
layers.push(new CartoDBLayer('Census Tract', '', 'Map Layers'));
layers.push(new CartoDBLayer('ZIP code', '', 'Map Layers'));
layers.push(new CartoDBLayer('Fair/Poor Health', 'https://hashtaghealth.carto.com/api/v2/viz/54fbfc8d-3125-481b-8d24-e5359c972d86/viz.json', 'Map Layers'));

//-----------------------------------------INITIALIZE MAP---------------------------------------
function initMap() {
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

    MapMenuSetUp();
    mapMenu = new ContextMenuMap(map);
    google.maps.event.addListener(map, 'rightclick', function (e) {
        mapMenu.show(e.latLng);
        document.getElementById('add').addEventListener('click', function () {
            addToRegions(e.latLng);
        });
        document.getElementById('not add').addEventListener('click', function () {
            removeFromRegions(e.latLng);
        });
    });

    

    // GET BOUNDS SO LIMIT ONLY COORDINATES WITHIN THE SHAPES
    // google.maps.event.addListener(drawingManager, 'overlaycomplete', getArrays);
}
google.maps.event.addDomListener(window, 'load', initMap);

//-------------------HELPER METHOD TO EXTRACT JSON FILE----------------
function addToRegions(coor) {
    alert("ADD QUERY");
    var query = "SELECT cartodb_id,name10 FROM states WHERE ST_Contains(the_geom, ST_GeomFromText('POINT(" + coor.lng + " " + coor.lat + ")', 4326));"
    var options = { url: 'https://hashtaghealth.carto.com/api/v2/sql?f=geojson&q=' + encodeURIComponent(query) };
    REQUEST(options, function (error, response, body) {
        if (error) {
            ALERT('Error with request: ' + error);
        } else {
            data = JSON.parse(body);
            var cartodb_id = data.rows[0].cartodb_id;
            var name = data.rows[0].name10;
            regions.push(name);;
            alert(name);
        }
    });
    /*
    $ajax({
        url: 'https://hashtaghealth.carto.com/api/v2/sql?f=geojson&q=' + encodeURIComponent(query),
        dataType: "jsonp",
        success: function (data) {
            var cartodb_id = data.rows[0].cartodb_id;
            var name = data.rows[0].name10;
            regions.push(name);
        }
    });
    */
}

function getResult() {
    alert("GET TWEETS");
    var result = [];
    for (var i = 0; i < regions.length; i++) {
        var query = "SELECT * FROM states WHERE name10=" + regions[i] + ");"
        $ajax({
            url: 'https://hashtaghealth.carto.com/api/v2/sql?f=geojson&q=' + encodeURIComponent(query),
            dataType: "jsonp",
            success: function (data) {
                result.concat(data);
            }
        });
    }
    
    var JSONObject = $.parseJSON(result);
    console.log(JSONObject);
    alert(JSONObject[0]);
    console.log(result);
    regions = [];
}

//-------------------HELPER METHODS FOR DRAWING MANAGER----------------
function removeAll() {
    for (var i = 0; i < polygonArray.length; i++) {
        polygonArray[i].overlay.setMap(null);
    }
    polygonArray = [];
}
function boundFromCircle(event) {
    var bounds = this.getBounds();
    var start = bounds.getNorthEast();
    var end = bounds.getSouthWest();
    var center = bounds.getCenter();
    var radius = event.overlay.getRadius();
}
function boundFromRectangle(event) {
    var bounds = this.getBounds();
    var start = bounds.getNorthEast();
    var end = bounds.getSouthWest();
}
function getArrays(e) {
    if (e.type !== google.maps.drawing.OverlayType.MARKER) {
        // Switch back to non-drawing mode after drawing a shape.
        drawingManager.setDrawingMode(null);
        // Add an event listener that selects the newly-drawn shape when the user
        // mouses down on it.
        var newShape = e.overlay;
        newShape.type = e.type;
        google.maps.event.addListener(newShape, 'click', function (e) {
            if (e.vertex !== undefined) {
                if (newShape.type === google.maps.drawing.OverlayType.POLYGON) {
                    var path = newShape.getPaths().getAt(e.path);
                    path.removeAt(e.vertex);
                    if (path.length < 3) {
                        newShape.setMap(null);
                    }
                }
                if (newShape.type === google.maps.drawing.OverlayType.POLYLINE) {
                    var path = newShape.getPath();
                    path.removeAt(e.vertex);
                    if (path.length < 2) {
                        newShape.setMap(null);
                    }
                }
            }
            //setSelection(newShape);  // set draggable and editable true
        });
        // setSelection(newShape);

        if (e.type == google.maps.drawing.OverlayType.POLYLINE || google.maps.drawing.OverlayType.POLYGON) {
            var locations = e.overlay.getPath().getArray();
            // assign coordinates to document id 'outout' to print out
            document.getElementById('output').innerHTML = locations.toString();


            //---------------OR-----------------------------------------------------------------
            //var newpolygons = [];
            //google.maps.event.addListener(drawingManager, 'polygoncomplete', function (polygon) {
            //    coordinates = (polygon.getPath().getArray());
            //    newpolygons.push(coordinates);
            //});
            //-----------------------------------------------------------------------------------
        }
        else {
            //get lat/lng bounds of the current shape
            var bounds = e.overlay.getBounds();
            var start = bounds.getNorthEast();
            var end = bounds.getSouthWest();
            var center = bounds.getCenter();
            //console.log(bounds.toString());    
            document.getElementById('output').innerHTML = bounds.toString();
        }
    }
}
function showArrays(event) {
    // Since this polygon has only one path, we can call getPath() to return the
    // MVCArray of LatLngs.
    var vertices = this.getPath();

    var contentString = '<b>Polygon</b><br>' +
        'Clicked location: <br>' + event.latLng.lat() + ',' + event.latLng.lng() +
        '<br>';

    // Iterate over the vertices.
    for (var i = 0; i < vertices.getLength() ; i++) {
        var xy = vertices.getAt(i);
        contentString += '<br>' + 'Coordinate ' + i + ':<br>' + xy.lat() + ',' +
            xy.lng();
    }

    // Replace the info window's content and position.
    infoWindow.setContent(contentString);
    infoWindow.setPosition(event.latLng);

    infoWindow.open(map);
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

            var layerItem = document.createElement('tr');

            var itemtd = document.createElement('td');

            var itemin = document.createElement('input');
            itemin.type = 'checkbox';
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

loadLayers();

function showLayer() {
    for (i = 0; i < layers.length; i++) {
        if (layers[i].name == this.id) {
            if (!this.checked) {
                layers[i].clearFromMap();
            }
            else {
                layers[i].putOnMap();
            }
        }
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

//function startVisible(name) {
//    for (i = 0; i < layers.length; i++) {
//        if (layers[i].name == name) {
//            layers[i].putOnMap();
//            var checkbox = document.getElementById(name);
//            checkbox.checked = true;
//        }
//    }
//};

function codeAddress() {
    var address = document.getElementById("address").value;
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            map.setZoom(10);
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
}
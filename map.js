var map, infoWindow, drawingManager;
var polygonArray = [];
var latlng = new google.maps.LatLng(40.00, -100.00);
var styles = [{ "featureType": "all", "elementType": "geometry.fill", "stylers": [{ "weight": "2.00" }] }, { "featureType": "all", "elementType": "geometry.stroke", "stylers": [{ "color": "#9c9c9c" }] }, { "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "on" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] }, { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] }, { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#eeeeee" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#7b7b7b" }] }, { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }] }, { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#c8d7d4" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#070707" }] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }];
var styledMap = new google.maps.StyledMapType(styles, { name: 'Styled Map' });
var mapOptions = {
    zoom: 4,
    center: latlng,
    scaleControl: true,
    //  mapTypeId: 'roadmap', //google.maps.MapTypeId.ROADMAP,// 'map_style' ],
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
map.setMapTypeId('map_style');// dynamically change map style

function initMap() {
    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
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
    });

    drawingManager.setMap(map);

    // GET BOUNDS TO LIMIT ONLY COORDINATES WITHIN THE SHAPES
    //---------------------------------------------------------------
    google.maps.event.addListener(drawingManager, 'overlaycomplete', showArrays);

    // Clear the current selection when the drawing mode is changed, or when the
    // map is clicked.
    google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
    google.maps.event.addListener(map, 'click', clearSelection);
    google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', deleteSelectedShape);

    //---------------------------------------------------------------
    startVisible('City Boundary');
    //google.maps.event.addDomListener(window, "load", initMap);
}
google.maps.event.addDomListener(window, "load", initMap);

// HELPER METHODS
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
//function boundFromCircle(event) {
//    var bounds = this.getBounds();
//    var start = bounds.getNorthEast();
//    var end = bounds.getSouthWest();
//    var center = bounds.getCenter();
//    var radius = event.overlay.getRadius();
//}

//function boundFromRectangle(event) {
//    var bounds = this.getBounds();
//    var start = bounds.getNorthEast();
//    var end = bounds.getSouthWest();
//}

function showArrays(event) {
    // Since this polygon has only one path, we can call getPath() to return the
    // MVCArray of LatLngs.
    var vertices = this.getPath();

    var contentString = '<b>Bermuda Triangle polygon</b><br>' +
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
function startVisible(name) {
    for (i = 0; i < layers.length; i++) {
        if (layers[i].name == name) {
            layers[i].putOnMap();
            var checkbox = document.getElementById(name);
            checkbox.checked = true;
        }
    }
};

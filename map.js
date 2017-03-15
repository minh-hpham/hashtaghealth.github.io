var map, cartoLayer, infoWindow, polygonArray, contextMenu, lastCoordinate;
//-------------------------------------------BASE MAP--------------------------------------------
polygonArray = [];
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
layers.push(new CartoDBLayer('Age Adjusted Mortality', 'https://hashtaghealth.carto.com/api/v2/viz/4fec2e9a-923f-11e6-9aca-0e3ebc282e83/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Premature Mortality Rate', 'https://hashtaghealth.carto.com/api/v2/viz/316ace20-a1c1-498d-ad60-ca2e20466449/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Diabetes', 'https://hashtaghealth.carto.com/api/v2/viz/e3bb2ea8-055d-4214-8479-187ffca6622a/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Obesity', 'https://hashtaghealth.carto.com/api/v2/viz/73fd643d-f500-48c5-9e3a-99387051b871/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Fair/Poor Health', 'https://hashtaghealth.carto.com/api/v2/viz/54fbfc8d-3125-481b-8d24-e5359c972d86/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Physical Inactivity', 'https://hashtaghealth.carto.com/api/v2/viz/5b503f86-c3b5-4d28-ae69-fe082e795200/viz.json', 'Map Layers'));
//-----------------------------------------INITIALIZE MAP---------------------------------------
function initMap() {
    //-----------------------------DRAWING MANAGER AND ITS CONTENT-----------------------------------------
    //Creating a context menu to use it in event handler
    ContextMenuSetUp();
    contextMenu = new ContextMenuClass(map);

    drawingManager = new google.maps.drawing.DrawingManager(drawnOptions);
    drawingManager.setMap(map);
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
    //----------------------------END OF DRAWING MANAGER-------------------------------------------------

    // GET BOUNDS SO LIMIT ONLY COORDINATES WITHIN THE SHAPES
    // google.maps.event.addListener(drawingManager, 'overlaycomplete', getArrays);
}
google.maps.event.addDomListener(window, 'load', initMap);


//-------------------MENU CONTEXT TO DELETE SHAPE---------------------
// Defining the context menu class.
function ContextMenuClass(map) {
    this.setMap(map);
    this.map = map;
    this.mapDiv = map.getDiv();
    this.menuDiv = null;
};
// set up function for this menu
function ContextMenuSetUp() {
    ContextMenuClass.prototype = new google.maps.OverlayView();
    ContextMenuClass.prototype.draw = function () { };
    ContextMenuClass.prototype.onAdd = function () {
        var that = this;
        this.menuDiv = document.createElement('div');
        this.menuDiv.className = 'contextmenu';
        this.menuDiv.innerHTML = '<a id="rm">Remove Shape</a>';
        //this.menuDiv.innerHTML = '<a href="javascript:remove()">Remove Shape</a>';
        this.getPanes().floatPane.appendChild(this.menuDiv);
        //This event listener below will close the context menu
        //on map click
        google.maps.event.addListener(this.map, 'click', function (mouseEvent) {
            that.hide();
        });
    };
    ContextMenuClass.prototype.onRemove = function () {
        this.menuDiv.parentNode.removeChild(this.menuDiv);
    };
    ContextMenuClass.prototype.show = function (coord) {
        var proj = this.getProjection();
        var mouseCoords = proj.fromLatLngToDivPixel(coord);
        var left = Math.floor(mouseCoords.x);
        var top = Math.floor(mouseCoords.y);
        this.menuDiv.style.display = 'block';
        this.menuDiv.style.left = left + 'px';
        this.menuDiv.style.top = top + 'px';
        this.menuDiv.style.visibility = 'visible';
    };
    ContextMenuClass.prototype.hide = function (x, y) {
        this.menuDiv.style.visibility = 'hidden';
    }
}
//-------------------HELPER METHOD FOR DRAWING MANAGER----------------
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
// Google geocoding code

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




















//-------------------CARTO LAYER - INCOMPLETE--------------------------------------
/*
var cartoStyle = '#world_borders { ' + 'polygon-fill: #1a9850; ' + 'polygon-opacity:0.7; ' + '} ' + '#world_borders [pop2005 > 10000000] { ' + 'polygon-fill: #8cce8a ' + '} ' + '#world_borders [pop2005 > 40000000] { ' + 'polygon-fill: #fed6b0 ' + '} ' + '#world_borders [pop2005 > 70000000] { ' + 'polygon-fill: #d73027 ' + '} ';
//Creating CartoDB layer and add it to map.
cartodb.createLayer(map, {
    user_name: 'gmapcookbook',
    type: 'cartodb',
    sublayers: [{
        sql: 'SELECT * FROM world_borders',
        cartocss: cartoStyle,
        interactivity: 'cartodb_id, name, pop2005, area',
    }]
})
.addTo(map)
.done(function (layer) {
    cartoLayer = layer;
    //Enabling popup info window
    cartodb.vis.Vis.addInfowindow(map, layer.getSubLayer(0),
    ['name', 'pop2005', 'area']);
    //Enabling UTFGrid layer to add interactivity.
    layer.setInteraction(true);
    layer.on('featureOver', function (e, latlng, pos, data) {
        $('#infoDiv').html('<b>Info : </b>' + data.name +
        ' (Population : ' + data.pop2005 + ')');
    });
});
//Listening click event of the search button to filter the
//data of map
$('#search').click(function () {
    var txtValue = $('#address').val();
    cartoLayer.setQuery('SELECT * FROM world_borders WHERE name LIKE \'%' + txtValue + '%\'');
    if (txtValue == '') {
        cartoLayer.setCartoCSS(cartoStyle);
    }
    else {
        cartoLayer.setCartoCSS('#world_borders {polygon-fill: #00000d; polygon-opacity:0.7; }');
    }
});
*/
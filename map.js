var map, mapMenu, cartoLayer, contextMenu, regions, geocoder;

//-------------------------------------------BASE MAP--------------------------------------------
var polygonArray = new Array();
var circle = new Array();
var rectangle = new Array();

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

    var table_name;
    if (n == 'State')
        table_name = 'states';
    else if (n == 'County')
        table_name = 'counties';
    else
        table_name = 'zipcode';

    var withinRect = "SELECT AVG(calories) as a, AVG(percentalc) as b, AVG(percentexe) as c,AVG(percentfas) as d,AVG(percentfoo) as e,AVG(percenthap) as f,AVG(percenthea) as g,AVG(sentalc) as h,AVG(sentex) as i,AVG(sentfastfo) as j,AVG(sentfood) as k,AVG(senthealth) as l FROM public.{{table}} WHERE the_geom && ST_MakeEnvelope({{left}}, {{bottom}}, {{right}}, {{top}}, 4326)";
    var withinCircle = "SELECT AVG(calories) as a, AVG(percentalc) as b, AVG(percentexe) as c,AVG(percentfas) as d,AVG(percentfoo) as e,AVG(percenthap) as f,AVG(percenthea) as g,AVG(sentalc) as h,AVG(sentex) as i,AVG(sentfastfo) as j,AVG(sentfood) as k,AVG(senthealth) as l FROM public.{{table}} WHERE ST_Distance_Sphere(the_geom, ST_SetSRID(ST_MakePoint({{lon}}, {{lat}}),4326)) <= {{radius}}";

    this.putOnMap = function () {
        cartodb.createLayer(map, u).addTo(map, l_in).on('done', function (layer) {
            l = layer;
            layer.setInteraction(true);

            $('#search').on('click', function () {
                var loc = [];
                var address = document.getElementById("address").value;

                geocoder.geocode({ 'address': address }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        loc[0] = results[0].geometry.location.lat();
                        loc[1] = results[0].geometry.location.lng();
                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });

                var sql = new cartodb.SQL({ user: 'hashtaghealth' });
                sql.execute("SELECT * FROM public.{{table}} WHERE name10 ILIKE '%{{name}}%' ", { table: table_name, name: address })
                    .done(function (data) {
                        var id = data.rows[0].cartodb_id;
                        layer.trigger('featureClick', null, [loc[0], loc[1]], null, { cartodb_id: id }, 0);
                    }).error(function (errors) {
                        alert(errors[0]);
                    });

            });
            $('#aggregate').on('click', function () {
                if (circle.length > 0) {
                    for (var c = 0; c < circle.length; c++) {
                        openInfoWindowCircle(table_name, circle, c);
                    }
                }

                if (rectangle.length > 0) {
                    for (var r = 0; r < rectangle.length; r++) {
                        openInfoWindowRectangle(table_name, rectangle, r);
                        //alert("EXECUTE");
                        //sql.execute(withinRect, { table: table_name, left: rectangle[r][0], bottom: rectangle[r][1], right: rectangle[r][2], top: rectangle[r][3] })
                        //    .done(function (data) {
                        //        alert(data.rows[0].b);
                        //        var contentString = '<div class="infobox"><h3>AVERAGE DATA IN THAT REGION</h3><br><h4>AVERAGE CALORIC DENSITY OF FOOD </h4><p>' + data.rows[0].a
                        //           + "</p><h4>PERCENT ABOUT ALCOHOL</h4><p>" + data.rows[0].b
                        //           + "</p><h4>PERCENT ABOUT EXERCISE</h4><p>" + data.rows[0].c
                        //           + "</p><h4>PERCENT ABOUT FAST FOOD</h4><p>" + data.rows[0].d
                        //           + "</p><h4> PERCENT ABOUT FOOD</h4><p>" + data.rows[0].e
                        //           + "</p><h4>PERCENT THAT ARE HAPPY</h4><p>" + data.rows[0].f
                        //           + "</p><h4>PERCENT ABOUT HEALTHY FOOD</h4><p>" + data.rows[0].g
                        //           + "</p><h4>PERCENT ABOUT ALCOHOL THAT ARE HAPPY</h4><p>" + data.rows[0].h
                        //           + "</p><h4>PERCENT OF EXERCISE TWEETS THAT ARE HAPPY</h4><p>" + data.rows[0].i
                        //           + "</p><h4>PERCENT ABOUT FAST FOOD THAT ARE HAPPY</h4><p>" + data.rows[0].j
                        //           + "</p><h4>PERCENT OF FOOD TWEETS THAT ARE HAPPY</h4><p>" + data.rows[0].k
                        //           + "</p><h4>PERCENT ABOUT HEALTHY FOODS THAT ARE HAPPY</h4><p>" + data.rows[0].l + "</p></div>";
                        //        // Replace the info window's content and position.
                        //        var infoWindow = new google.maps.InfoWindow();
                        //        infoWindow.setContent(contentString);
                        //        infoWindow.setPosition(google.maps.ControlPosition.TOP_CENTER);
                        //        infoWindow.open(map);
                        //    }).error(function (errors) {
                        //        alert(errors[0]);
                        //    });
                    }
                }
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
    function openInfoWindowCircle(table_name, circle, c) {

        var infoWindow = new google.maps.InfoWindow({
            position: circle[c].getCenter(),
            pixelOffset: new google.maps.Size(-30, -30)
        });
        var number = c + 1;
        var contentString = '<div class="infobox"><h3>AVERAGE DATA IN CIRCLE #' + number;
        var sql = new cartodb.SQL({ user: 'hashtaghealth' });
        sql.execute(withinCircle, { table: table_name, lon: circle[c].getCenter().lng(), lat: circle[c].getCenter().lat(), radius: circle[c].getRadius() })
            .done(function (data) {

                contentString += '</h3><br><h4>AVERAGE CALORIC DENSITY OF FOOD </h4><p>' + data.rows[0].a.toFixed(4)
                    + '</p><h4>PERCENT ABOUT ALCOHOL</h4><p>' + data.rows[0].b.toFixed(4)
                    + '</p><h4>PERCENT ABOUT EXERCISE</h4><p>' + data.rows[0].c.toFixed(4)
                    + '</p><h4>PERCENT ABOUT FAST FOOD</h4><p>' + data.rows[0].d.toFixed(4)
                    + '</p><h4> PERCENT ABOUT FOOD</h4><p>' + data.rows[0].e.toFixed(4)
                    + '</p><h4>PERCENT THAT ARE HAPPY</h4><p>' + data.rows[0].f.toFixed(4)
                    + '</p><h4>PERCENT ABOUT HEALTHY FOOD</h4><p>' + data.rows[0].g.toFixed(4)
                    + '</p><h4>PERCENT ABOUT ALCOHOL THAT ARE HAPPY</h4><p>' + data.rows[0].h.toFixed(4)
                    + '</p><h4>PERCENT OF EXERCISE TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].i.toFixed(4)
                    + '</p><h4>PERCENT ABOUT FAST FOOD THAT ARE HAPPY</h4><p>' + data.rows[0].j.toFixed(4)
                    + '</p><h4>PERCENT OF FOOD TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].k.toFixed(4)
                    + '</p><h4>PERCENT ABOUT HEALTHY FOODS THAT ARE HAPPY</h4><p>' + data.rows[0].l.toFixed(4) + '</p></div>';

                infoWindow.setContent(contentString);
                infoWindow.open(map);

            }).error(function (errors) {
                alert(errors[0]);
            });
    }
    function openInfoWindowRectangle(table_name, rectangle, r) {
        var ne = rectangle[r].getNorthEast();
        var sw = rectangle[r].getSouthWest();
        //alert(sw.lng());
        //alert(sw.lat());
        //alert(ne.lng());
        //alert(ne.lat());

        var infoWindow = new google.maps.InfoWindow({
            position: ne,
            //pixelOffset: new google.maps.Size(-30, -30)
        });
        var number = r + 1;
        var contentString = '<div class="infobox"><h3>AVERAGE DATA IN RECTANGLE #' + number;

        alert("EXECUTE");
        var sql = new cartodb.SQL({ user: 'hashtaghealth' });
        
        sql.execute(withinRect, { table: table_name, left: sw.lng(), bottom: sw.lat(), right: ne.lng(), top: ne.lat() })
            .done(function (data) {
                alert(data.rows[0].a);
                contentString += '</h3><br><h4>AVERAGE CALORIC DENSITY OF FOOD </h4><p>' + data.rows[0].a.toFixed(4)
                   + '</p><h4>PERCENT ABOUT ALCOHOL</h4><p>' + data.rows[0].b.toFixed(4)
                   + '</p><h4>PERCENT ABOUT EXERCISE</h4><p>' + data.rows[0].c.toFixed(4)
                   + '</p><h4>PERCENT ABOUT FAST FOOD</h4><p>' + data.rows[0].d.toFixed(4)
                   + '</p><h4> PERCENT ABOUT FOOD</h4><p>' + data.rows[0].e.toFixed(4)
                   + '</p><h4>PERCENT THAT ARE HAPPY</h4><p>' + data.rows[0].f.toFixed(4)
                   + '</p><h4>PERCENT ABOUT HEALTHY FOOD</h4><p>' + data.rows[0].g.toFixed(4)
                   + '</p><h4>PERCENT ABOUT ALCOHOL THAT ARE HAPPY</h4><p>' + data.rows[0].h.toFixed(4)
                   + '</p><h4>PERCENT OF EXERCISE TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].i.toFixed(4)
                   + '</p><h4>PERCENT ABOUT FAST FOOD THAT ARE HAPPY</h4><p>' + data.rows[0].j.toFixed(4)
                   + '</p><h4>PERCENT OF FOOD TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].k.toFixed(4)
                   + '</p><h4>PERCENT ABOUT HEALTHY FOODS THAT ARE HAPPY</h4><p>' + data.rows[0].l.toFixed(4) + '</p></div>';

                // Replace the info window's content and position.
                infoWindow.setContent(contentString);
                infoWindow.open(map);
            }).error(function (errors) {
                alert(errors[0]);
            });
    }


};
layers.push(new CartoDBLayer('State', 'https://hashtaghealth.carto.com/api/v2/viz/a88b82ca-0900-11e7-b06b-0e3ff518bd15/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('County', 'https://hashtaghealth.carto.com/api/v2/viz/d61716ee-0e4d-11e7-9c2f-0ee66e2c9693/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Census Tract', '', 'Map Layers'));
layers.push(new CartoDBLayer('ZIP code', '', 'Map Layers'));


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
    google.maps.event.addListener(drawingManager, 'circlecomplete', function (shape) {
        if (shape == null || (!(shape instanceof google.maps.Circle))) return;
        circle.push(shape);
    });

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        drawingManager.setDrawingMode(null);
        polygonArray.push(event.overlay);
        //if (event.type == google.maps.drawing.OverlayType.POLYGON) {
        //    var locations = event.overlay.getPath().getArray();
        //    alert(locations);
        //}
        if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
            rectangle.push(event.overlay.getBounds());
        }
    });
}
google.maps.event.addDomListener(window, 'load', initMap);

//-------------------HELPER METHODS FOR DRAWING MANAGER----------------
function removeAll() {
    for (var i = 0; i < polygonArray.length; i++) {
        polygonArray[i].setMap(null);
    }
    polygonArray = [];
    circle = [];
    rectangle = [];
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
loadLayers();

function showLayer() {
    for (i = 0; i < layers.length; i++) {
        if (layers[i].name == this.id && this.checked)
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

//function startVisible(name) {
//    for (i = 0; i < layers.length; i++) {
//        if (layers[i].name == name) {
//            layers[i].putOnMap();
//            var checkbox = document.getElementById(name);
//            checkbox.checked = true;
//        }
//    }
//};

var map, geocoder, drawingManager;

//-------------------------------------------BASE MAP--------------------------------------------
var polygonArray = new Array();
var polygon = new Array();
var circle = new Array();
var rectangle = new Array();

var withinRect = "SELECT AVG(calories) as a, AVG(percentalc) as b, AVG(percentexe) as c,AVG(percentfas) as d,AVG(percentfoo) as e,AVG(percenthap) as f,AVG(percenthea) as g,AVG(sentalc) as h,AVG(sentex) as i,AVG(sentfastfo) as j,AVG(sentfood) as k,AVG(senthealth) as l FROM public.{{table}} WHERE the_geom && ST_MakeEnvelope({{left}}, {{bottom}}, {{right}}, {{top}}, 4326)";
var withinCircle = "SELECT AVG(calories) as a, AVG(percentalc) as b, AVG(percentexe) as c,AVG(percentfas) as d,AVG(percentfoo) as e,AVG(percenthap) as f,AVG(percenthea) as g,AVG(sentalc) as h,AVG(sentex) as i,AVG(sentfastfo) as j,AVG(sentfood) as k,AVG(senthealth) as l FROM public.{{table}} WHERE ST_DWITHIN(the_geom, ST_SetSRID(ST_MakePoint({{lon}}, {{lat}}),4326)::geography,{{radius}})";
var withinPol = "SELECT AVG(calories) as a, AVG(percentalc) as b, AVG(percentexe) as c,AVG(percentfas) as d,AVG(percentfoo) as e,AVG(percenthap) as f,AVG(percenthea) as g,AVG(sentalc) as h,AVG(sentex) as i,AVG(sentfastfo) as j,AVG(sentfood) as k,AVG(senthealth) as l FROM public.{{table}} WHERE the_geom && ST_Transform(ST_GeomFromText('POLYGON(({{coordinates}}))',4326),4326)";

var latlng = new google.maps.LatLng(40.00, -100.00);

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


//CartoDB Layer
var CartoDBLayer = function (n, href, u, c) {
    this.category = c;
    this.name = n;
    this.link = href;
    var l;

    cb_i++;
    var l_in = cb_i;

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

//layers.push(	new LayerContainer('Subdivisions', 'https://www.cartedesign.com/farmington/subdivisions2.kmz', 'City Layers'));

layers.push(new CartoDBLayer('states', 'State <a href="https://hashtaghealth.github.io/geoportal/state.txt" target="_blank">(.txt /</a><a href="https://hashtaghealth.github.io/geoportal/state.xls" target="_blank">.xls)</a>', 'https://hashtaghealth.carto.com/api/v2/viz/a88b82ca-0900-11e7-b06b-0e3ff518bd15/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('counties', 'County <a href="https://hashtaghealth.github.io/geoportal/county.txt" target="_blank">(.txt /</a><a href="https://hashtaghealth.github.io/geoportal/county.xls" target="_blank">.xls)</a>', 'https://hashtaghealth.carto.com/api/v2/viz/d61716ee-0e4d-11e7-9c2f-0ee66e2c9693/viz.json', 'Map Layers'));
layers.push(new CartoDBLayer('Census Tract', 'Census Tract <a href="https://hashtaghealth.github.io/geoportal/tract.txt" target="_blank">(.txt /</a><a href="https://hashtaghealth.github.io/geoportal/tract.xlsx" target="_blank">.xlsx)</a>', '', 'Map Layers'));
layers.push(new CartoDBLayer('ZIP code', 'Zip code <a href="https://hashtaghealth.github.io/geoportal/zipcode.txt" target="_blank">(.txt /</a><a href="https://hashtaghealth.github.io/geoportal/zipcode.xls" target="_blank">.xls)</a>', '', 'Map Layers'));

//-----------------------------------------INITIALIZE MAP---------------------------------------
function initMap() {
    geocoder = new google.maps.Geocoder();

    drawingManager = new google.maps.drawing.DrawingManager(drawnOptions);
    drawingManager.setMap(map);
    drawingManager.setDrawingMode(null);

    startVisible('states');

    // Add a listener to show coordinate when right click
    google.maps.event.addListener(drawingManager, 'circlecomplete', function (shape) {
        if (shape == null || (!(shape instanceof google.maps.Circle))) return;
        circle.push(shape);
    });
    google.maps.event.addListener(drawingManager, 'polygoncomplete', function (shape) {
        var vertices = shape.getPath();
        //var content = '';
        //for (var i = 0 ; i < vertices.getLength() ; i++) {
        //    var xy = vertices.getAt(i);
        //    content += xy.lat() + ' ' + xy.lng() + ', ';
        //}
        //var xy = vertices.getAt(0);
        //content += xy.lat() + ' ' + xy.lng();
        //var array = new Array();
        //array.push(xy);
        //array.push(content);
        polygon.push(vertices);

    });
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        drawingManager.setDrawingMode(null);
        polygonArray.push(event.overlay);
        if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
            rectangle.push(event.overlay.getBounds());
        }
    });
}
google.maps.event.addDomListener(window, 'load', initMap);

//-------------------GET TABLE NAME------------------------------------
function getTableName() {
    var $radio = $('input[name=other]:checked');
    var id = $radio.attr('id');
    return id;
}
//-------------------HELPER METHODS TO AGGREGATE DATA----------------------------
function getResults() {
    var table_name = getTableName();
    if (circle.length > 0) {
        for (var c = 0; c < circle.length; c++) {
            openInfoWindowCircle(table_name, circle, c);
        }
    }
    if (rectangle.length > 0) {
        for (var r = 0; r < rectangle.length; r++) {
            openInfoWindowRectangle(table_name, rectangle, r);
        }
    }

    if (polygon.length > 0) {
        for (var r = 0; r < polygon.length; r++) {
            openInfoWindowPolygon(table_name, polygon, r);
        }
    }
}
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
                + '</p><h4>PROPORTION ABOUT ALCOHOL</h4><p>' + data.rows[0].b.toFixed(4)
                + '</p><h4>PROPORTION ABOUT EXERCISE</h4><p>' + data.rows[0].c.toFixed(4)
                + '</p><h4>PROPORTION ABOUT FAST FOOD</h4><p>' + data.rows[0].d.toFixed(4)
                + '</p><h4> PROPORTION ABOUT FOOD</h4><p>' + data.rows[0].e.toFixed(4)
                + '</p><h4>PROPORTION THAT ARE HAPPY</h4><p>' + data.rows[0].f.toFixed(4)
                + '</p><h4>PROPORTION ABOUT HEALTHY FOOD</h4><p>' + data.rows[0].g.toFixed(4)
                + '</p><h4>PROPORTION ABOUT ALCOHOL THAT ARE HAPPY</h4><p>' + data.rows[0].h.toFixed(4)
                + '</p><h4>PROPORTION OF EXERCISE TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].i.toFixed(4)
                + '</p><h4>PROPORTION ABOUT FAST FOOD THAT ARE HAPPY</h4><p>' + data.rows[0].j.toFixed(4)
                + '</p><h4>PROPORTION OF FOOD TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].k.toFixed(4)
                + '</p><h4>PROPORTION ABOUT HEALTHY FOODS THAT ARE HAPPY</h4><p>' + data.rows[0].l.toFixed(4) + '</p></div>';

            infoWindow.setContent(contentString);
            infoWindow.open(map);

        }).error(function (errors) {
            alert(errors[0]);
        });
}
function openInfoWindowRectangle(table_name, rectangle, r) {
    var ne = rectangle[r].getNorthEast();
    var sw = rectangle[r].getSouthWest();
    var infoWindow = new google.maps.InfoWindow({
        position: ne,
    });
    var number = r + 1;
    var contentString = '<div class="infobox"><h3>AVERAGE DATA IN RECTANGLE #' + number;

    var sql = new cartodb.SQL({ user: 'hashtaghealth' });

    sql.execute(withinRect, { table: table_name, left: sw.lng(), bottom: sw.lat(), right: ne.lng(), top: ne.lat() })
        .done(function (data) {
            contentString += '</h3><br><h4>AVERAGE CALORIC DENSITY OF FOOD </h4><p>' + data.rows[0].a.toFixed(4)
               + '</p><h4>PROPORTION ABOUT ALCOHOL</h4><p>' + data.rows[0].b.toFixed(4)
               + '</p><h4>PROPORTION ABOUT EXERCISE</h4><p>' + data.rows[0].c.toFixed(4)
               + '</p><h4>PROPORTION ABOUT FAST FOOD</h4><p>' + data.rows[0].d.toFixed(4)
               + '</p><h4>PROPORTION ABOUT FOOD</h4><p>' + data.rows[0].e.toFixed(4)
               + '</p><h4>PROPORTION THAT ARE HAPPY</h4><p>' + data.rows[0].f.toFixed(4)
               + '</p><h4>PROPORTION ABOUT HEALTHY FOOD</h4><p>' + data.rows[0].g.toFixed(4)
               + '</p><h4>PROPORTION ABOUT ALCOHOL THAT ARE HAPPY</h4><p>' + data.rows[0].h.toFixed(4)
               + '</p><h4>PROPORTION OF EXERCISE TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].i.toFixed(4)
               + '</p><h4>PROPORTION ABOUT FAST FOOD THAT ARE HAPPY</h4><p>' + data.rows[0].j.toFixed(4)
               + '</p><h4>PROPORTION OF FOOD TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].k.toFixed(4)
               + '</p><h4>PROPORTION ABOUT HEALTHY FOODS THAT ARE HAPPY</h4><p>' + data.rows[0].l.toFixed(4) + '</p></div>';

            // Replace the info window's content and position.
            infoWindow.setContent(contentString);
            infoWindow.open(map);
        }).error(function (errors) {
            alert(errors[0]);
        });
}
function openInfoWindowPolygon(table_name, polygon, r) {

    var vertices = polygon[r];
    var content = '';

    for (var i = 0 ; i < vertices.getLength() ; i++) {
        var xy = vertices.getAt(i);
        content += xy.lng() + ' ' + xy.lat() + ',';
    }
    var xy = vertices.getAt(0);
    content += xy.lng() + ' ' + xy.lat() + ' ';
    var infoWindow = new google.maps.InfoWindow({
        position: xy
    });
   
    var number = r + 1;
    var contentString = '<div class="infobox"><h3>AVERAGE DATA IN POLYGON #' + number;
    var sql = new cartodb.SQL({ user: 'hashtaghealth' });
    sql.execute(withinPol, { table: table_name, coordinates: content })
        .done(function (data) {
            contentString += '</h3><br><h4>AVERAGE CALORIC DENSITY OF FOOD </h4><p>' + data.rows[0].a.toFixed(4)
               + '</p><h4>PROPORTION ABOUT ALCOHOL</h4><p>' + data.rows[0].b.toFixed(4)
               + '</p><h4>PROPORTION ABOUT EXERCISE</h4><p>' + data.rows[0].c.toFixed(4)
               + '</p><h4>PROPORTION ABOUT FAST FOOD</h4><p>' + data.rows[0].d.toFixed(4)
               + '</p><h4>PROPORTION ABOUT FOOD</h4><p>' + data.rows[0].e.toFixed(4)
               + '</p><h4>PROPORTION THAT ARE HAPPY</h4><p>' + data.rows[0].f.toFixed(4)
               + '</p><h4>PROPORTION ABOUT HEALTHY FOOD</h4><p>' + data.rows[0].g.toFixed(4)
               + '</p><h4>PROPORTION ABOUT ALCOHOL THAT ARE HAPPY</h4><p>' + data.rows[0].h.toFixed(4)
               + '</p><h4>PROPORTION OF EXERCISE TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].i.toFixed(4)
               + '</p><h4>PROPORTION ABOUT FAST FOOD THAT ARE HAPPY</h4><p>' + data.rows[0].j.toFixed(4)
               + '</p><h4>PROPORTION OF FOOD TWEETS THAT ARE HAPPY</h4><p>' + data.rows[0].k.toFixed(4)
               + '</p><h4>PROPORTION ABOUT HEALTHY FOODS THAT ARE HAPPY</h4><p>' + data.rows[0].l.toFixed(4) + '</p></div>';

            // Replace the info window's content and position.
            infoWindow.setContent(contentString);
            infoWindow.open(map);
        }).error(function (errors) {
            alert(errors[0]);
        });
}
//-------------------HELPER METHODS FOR DRAWING MANAGER----------------
function removeAll() {
    for (var i = 0; i < polygonArray.length; i++) {
        polygonArray[i].setMap(null);
    }
    polygonArray = [];
    circle = [];
    rectangle = [];
    polygon = [];
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
            itemtd2.innerHTML = layers[i].link;

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

function startVisible(name) {
    for (i = 0; i < layers.length; i++) {
        if (layers[i].name == name) {
            layers[i].putOnMap();
            var checkbox = document.getElementById(name);
            checkbox.checked = true;
        }
    }
};

function main() {
    var map;
    var sql;        // sql query object for querying CartoDB SQL API
    var sublayers = [];
    // create google maps map
    var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(26.178347, 50.6116694),
        mapTypeId: google.maps.MapTypeId.HYBRID,
        panControl: true,
        panControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    // create layer and add to the map, then add some interactive elements
    cartodb.createLayer(map, 'http://zbahrain.cartodb.com/api/v2/viz/f5073bec-b841-11e4-b79c-0e4fddd5de28/viz.json')
    .addTo(map)
    .on('done', function (layer) {
        var subLayerOptions = {
            sql: "SELECT * FROM roadscomplete where block = '525'"
        }
        var sublayer = layer.getSubLayer(0);
        sublayer.set(subLayerOptions);
        sublayers.push(sublayer);

        sublayer.on('error', function (err) {
            cartodb.log.log('error: ' + err);
        });

    })
    .on('error', function () {
        cartodb.log.log("some error occurred");
    });

  
    // Define the LatLng coordinates for the polygon's path.
    var triangleCoords = [new google.maps.LatLng(26.1750729378, 50.5527011926), new google.maps.LatLng(26.1750278514, 50.5528370586), new google.maps.LatLng(26.1749037197, 50.5527864969), new google.maps.LatLng(26.1749497896, 50.5526475251), new google.maps.LatLng(26.1750711189, 50.5526969966), new google.maps.LatLng(26.1750729378, 50.5527011926), ];

    // Construct the polygon.
    var bermudaTriangle = new google.maps.Polygon({
        paths: triangleCoords,
        strokeColor: '#FFF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#EA4A38',
        fillOpacity: 0.75
    });

    bermudaTriangle.setMap(map);
    map.setMap(map);

}

window.onload = main;
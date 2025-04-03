var map = L.map('map').setView([49.0448989, 16.3351411], 14); // M. Krumlov

map.attributionControl._attributions = {};
map.attributionControl.setPrefix();
map.zoomControl.setPosition('topleft');
L.control.scale({ imperial: false, maxwidth: 200 }).addTo(map);

// Podkladová vrstva
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var orthoLayer = L.tileLayer('https://ags.cuzk.gov.cz/arcgis1/rest/services/ORTOFOTO_WM/MapServer/WMTS/tile/1.0.0/ORTOFOTO_WM/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', {
    attribution: '&copy; <a href="https://www.cuzk.cz">ČÚZK Orthophoto</a>',
    maxZoom: 22
});

var kmGridLayer = L.tileLayer('https://services.cuzk.cz/wmts/local-km-wmts-google/rest/WMTS/default/KN_I/{z}/{y}/{x}.png', {
    attribution: '&copy; <a href="https://www.cuzk.cz">ČÚZK Kilometric Grid</a>',
    maxZoom: 20
});

// Vytvoření geoJSON vrstvy pro parcely města (bez dat)
var parcelyK = L.geoJSON(null, {
    style: function (feature) {
        return {
            fillColor: feature.properties["export_Katastr_Parcela - LV"] == 10001 ? '#C082A1' : '#FFFFFF',
            color: feature.properties["export_Katastr_Parcela - LV"] == 10001 ? '#A64D79' : '#9E9E9E',
            weight: 0.6,
            fillOpacity: feature.properties["export_Katastr_Parcela - LV"] == 10001 ? 0.5 : 0.4,
        };
    },
    onEachFeature: function (feature, layer) {
        // Add popup on hover
        layer.on('mouseover', function (e) {
            layer.bindTooltip("<b>Číslo parcely: </b> " + feature.properties.KmenoveCislo + (feature.properties.PododdeleniCisla ? "/" + feature.properties.PododdeleniCisla : "")).openTooltip();
            e.target.setStyle({
                weight: 3, 
                color: '#004619'
            });
            e.target.bringToFront();
        });

        // Reset style on mouseout
        layer.on('mouseout', function (e) {
            parcelyK.resetStyle(e.target);
        });
    }
}).addTo(map);


function getColor(property) {
    return property == 2 ? '#cc7d0f' :
           property == 4 ? '#c3e332' :
           property == 5 ? '#9fe8ba' :
           property == 6 ? '#89eae8' :
           property == 7 ? '#90ce45' :
           property == 10 ? '#068246' :
           property == 11 ? '#66a3c9' :
           property == 13 ? '#a5aaa8' :
           property == 14 ? '#d0b7c7' :
                              '#ffffff';
  }

// Vytvoření geoJSON vrstvy pro parcely podle druhu pozemku (bez dat)
var parcelyDP = L.geoJSON(null, {
    style: function (feature) {
        return {
            fillColor: getColor(feature.properties.DruhPozemkuKod),
            color: 'black',
            weight: 0.6,
            fillOpacity: 0.4,
        };
    },
    onEachFeature: function (feature, layer) {
        // Add popup on hover
        layer.on('mouseover', function (e) {
            layer.bindTooltip("<b>Číslo parcely: </b> " + feature.properties.KmenoveCislo + (feature.properties.PododdeleniCisla ? "/" + feature.properties.PododdeleniCisla : "")).openTooltip();
            e.target.setStyle({
                weight: 3, 
                color: '#004619'
            });
            e.target.bringToFront();
        });

        // Reset style on mouseout
        layer.on('mouseout', function (e) {
            parcelyDP.resetStyle(e.target);
        });
    }
});

// Načtení geojson souboru s parcelami
fetch('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/parcely_Krumlov.geojson')
    .then(response => response.json())
    .then(data => {
        parcelyK.addData(data);
        parcelyDP.addData(data);
        //map.fitBounds(parcelyK.getBounds()); // Auto-zoom to parcels
    })
    .catch(error => console.error('Error loading the GeoJSON:', error));

// Přepínač vrstev
var baseMaps = {
    "OpenStreetMaps": osmLayer,
    "Ortofoto": orthoLayer,
};

var overlayMaps = {
    "Parcely města M. Krumlov": parcelyK,
    "Parcely podle druhu pozemku": parcelyDP,
    "Katastrální mapa": kmGridLayer,
};

//Legenda
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        druhyP = [2, 4, 5, 6, 7, 10, 11, 13, 14];
        druhyPlabels = ['orná půda', 'vinice', 'zahrada', 'ovocný sad', 'trvalý travní porost', 'lesní pozemek', 'vodní plocha', 'zastavěná plocha a nádvoří', 'ostatní plocha'];
    div.innerHTML += '<h4>Parcely podle druhu pozemku</h4>';
    for (var i = 0; i < druhyP.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(druhyP[i]) + '"></i> ' +
            (druhyPlabels[i]) + '<br>';
    }
    return div;
};

// Zobrazit legendu, pokud je aktivní vrstva parcelyDP
function toggleLegend() {
    if (map.hasLayer(parcelyDP)) {
        legend.addTo(map);
    } else {
        map.removeControl(legend);
    }
}

// Přidání legendy do mapy
parcelyDP.on('add', toggleLegend);
parcelyDP.on('remove', toggleLegend);

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

var map = L.map('map').setView([49.0448989, 16.3351411], 14); // M. Krumlov

map.attributionControl._attributions = {};
map.attributionControl.setPrefix();
map.zoomControl.setPosition('topleft');
L.control.scale({ imperial: false, maxwidth: 200 }).addTo(map);

// Podkladová vrstva
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});

var orthoLayer = L.tileLayer('https://ags.cuzk.gov.cz/arcgis1/rest/services/ORTOFOTO_WM/MapServer/WMTS/tile/1.0.0/ORTOFOTO_WM/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', {
    attribution: '&copy; <a href="https://www.cuzk.cz">ČÚZK Orthophoto</a>',
    maxZoom: 22
}).addTo(map);

/*
var kmGridLayer = L.tileLayer('https://services.cuzk.cz/wmts/local-km-wmts-google.asp/WMTS/tile/1.0.0/local-km/default/GoogleMapsCompatible/{z}/{y}/{x}.png', {
    attribution: '&copy; <a href="https://www.cuzk.cz">ČÚZK Kilometric Grid</a>',
    maxZoom: 20
});*/

// funkce pro načtení geojson souboru
function loadGeoJSON(url, layer) {
    fetch(url)
        .then(response => response.json())
        .then(data => layer.addData(data))
        .catch(error => console.error(`Error loading ${url}:`, error));
}

// funkce pro načtení barvy parcely podle druhu pozemku
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

// Vytvoření geoJSON vrstvy pro parcely města Krumlov
var parcelyK = L.geoJSON(null, {
    style: function (feature) {
        return {
            fillColor: feature.properties["export_Katastr_Parcela - LV"] == 10001 ? '#0AFFF5' : '#FFFFFF',
            color: feature.properties["export_Katastr_Parcela - LV"] == 10001 ? '#0AFFF5' : '#9E9E9E',
            weight: 0.6,
            fillOpacity: 0.2,
            //fillOpacity: feature.properties["export_Katastr_Parcela - LV"] == 10001 ? 0.5 : 0.4,
        };
    },
    onEachFeature: function (feature, layer) {
        // Add popup on hover
        layer.on('mouseover', function (e) {
            layer.bindTooltip("<b>Číslo parcely: </b> " + feature.properties.KmenoveCislo + (feature.properties.PododdeleniCisla ? "/" + feature.properties.PododdeleniCisla : "")).openTooltip();
            e.target.setStyle({
                weight: 3, 
                color: '#261a20'
            });
            e.target.bringToFront();
        });

        // Reset style on mouseout
        layer.on('mouseout', function (e) {
            parcelyK.resetStyle(e.target);
        });
    }
}).addTo(map);

// Vytvoření vrstev parcel vlastnictví
function createParcelLayer(fillColor, hoverColor = '#261a20') {
    return L.geoJSON(null, {
        style: function (feature) {
            return {
                fillColor: fillColor,
                color: fillColor,
                weight: 0.6,
                fillOpacity: 0.2
            };
        },
    });
};

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
                color: '#000000'
            });
            e.target.bringToFront();
        });

        // Reset style on mouseout
        layer.on('mouseout', function (e) {
            parcelyDP.resetStyle(e.target);
        });
    }
});

loadGeoJSON('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/parcely_Krumlov.geojson', parcelyK);
loadGeoJSON('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/parcely_Krumlov.geojson', parcelyDP);

// Přepínač vrstev
var baseMaps = {
    "OpenStreetMaps": osmLayer,
    "Ortofoto": orthoLayer,
};

var overlayMaps = {
    "Parcely podle druhu pozemku": parcelyDP,
    "Parcely města M. Krumlov": parcelyK,
    //"Katastrální mapa": kmGridLayer,
};

// Parcely podle vlastnictví zdroj a styl
const vlastnictviLayers = [
    { name: "Parcely vlastněné státem", file: "parcely_CR.geojson", color: "#ff7184" },
    { name: "Parcely vlastníka AGRO 2000 s.r.o.", file: "parcely_Agro.geojson", color: "#dcff71" },
    { name: "Parcely vlastníka AGRO Rakšice, spol. s r. o.", file: "parcely_AgroRaksice.geojson", color: "#61e82a" },
    { name: "Parcely vlastníka Jiří Břínek", file: "parcely_BrinekJiri.geojson", color: "#c971ff" },
    { name: "Parcely vlastníka Vratislav Břínek", file: "parcely_BrinekVratislav.geojson", color: "#e5a8d9" },
    { name: "Parcely vlastníka BioZem s.r.o.", file: "parcely_BioZem.geojson", color: "#ffe171" }
];

vlastnictviLayers.forEach(item => {
    let layer = createParcelLayer(item.color);
    overlayMaps[item.name] = layer;
    loadGeoJSON(`https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/${item.file}`, layer);
});


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

//Legenda vlastnictví
var legendOwners = L.control({position: 'bottomright'});
legendOwners.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        colors = vlastnictviLayers.map(item => item.color);
        labels = vlastnictviLayers.map(item => item.name);
    div.innerHTML += '<h4>Parcely podle vlastnictví</h4>';
    div.innerHTML += '<i style="background:#0AFFF5"></i> Parcely města M. Krumlov<br>';
    for (var i = 0; i < colors.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors[i] + '"></i> ' +
            (labels[i]) + '<br>';
    }
    return div;
};

legendOwners.addTo(map);

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
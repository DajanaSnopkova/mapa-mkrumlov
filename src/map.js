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

var kmGridLayer = L.tileLayer('https://services.cuzk.cz/wmts/local-km-wmts-google.asp/WMTS/tile/1.0.0/local-km/default/GoogleMapsCompatible/{z}/{y}/{x}.png', {
    attribution: '&copy; <a href="https://www.cuzk.cz">ČÚZK Kilometric Grid</a>',
    maxZoom: 20
});

var eagriOLNej = L.tileLayer.wms("https://mze.gov.cz/public/app/wms/plpis.fcgi", {
    layers: 'ODTOKLINIE_NEJ_V8', 
    format: 'image/png',
    transparent: true,
    attribution: '&copy; <a href="http://eagri.cz">eAGRI</a>',
    version: '1.3.0',
    crs: L.CRS.EPSG4326,
    tiled: true
});

var eagriOL = L.tileLayer.wms("https://mze.gov.cz/public/app/wms/plpis.fcgi", {
    layers: 'ODTOKLINIE_V2', 
    format: 'image/png',
    transparent: true,
    attribution: '&copy; <a href="http://eagri.cz">eAGRI</a>',
    version: '1.3.0',
    crs: L.CRS.EPSG4326,
    tiled: true
});

var eagriDPBuc = L.tileLayer.wms("https://mze.gov.cz/public/app/wms/public_DPB_PB_OPV.fcgi", {
    layers: 'DPB_UCINNE', 
    format: 'image/png',
    transparent: true,
    attribution: '&copy; <a href="http://eagri.cz">eAGRI</a>',
    version: '1.3.0',
    crs: L.CRS.EPSG4326,
    tiled: true
});

var eagriDPBuziv = L.tileLayer.wms("https://mze.gov.cz/public/app/wms/public_DPB_PB_OPV.fcgi", {
    layers: 'DPB_UZIV', 
    format: 'image/png',
    transparent: true,
    attribution: '&copy; <a href="http://eagri.cz">eAGRI</a>',
    version: '1.3.0',
    crs: L.CRS.EPSG4326,
    tiled: true
});

var eagriLPISVym = L.tileLayer.wms("https://mze.gov.cz/public/app/wms/plpis.fcgi", {
    layers: 'LPIS_FB_VYMERA_TISK', 
    format: 'image/png',
    transparent: true,
    attribution: '&copy; <a href="http://eagri.cz">eAGRI</a>',
    version: '1.3.0',
    crs: L.CRS.EPSG4326,
    tiled: true
});

var zabagedSraz = L.tileLayer.wms("https://ags.cuzk.gov.cz/arcgis/services/ZABAGED_POLOHOPIS/MapServer/WmsServer", {
    layers: '47', 
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    attribution: '&copy; <a href="https://www.cuzk.cz">ČÚZK</a>',
    tiled: true
});


// funkce pro načtení geojson souboru
function loadGeoJSON(url, layer) {
    fetch(url)
        .then(response => response.json())
        .then(data => layer.addData(data))
        .catch(error => console.error(`Error loading ${url}:`, error));
}

// funkce pro načtení barvy parcely podle atributu
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
};

function getColorNavrzenaOpatreni(property) {
    return property == 'BC' ? 'rgb(135,168,37)' :
           property == 'BK' ? 'rgb(200,220,15)' :
           property == 'DR' ? 'rgb(201,126,173)' :
           property == 'PC' ? 'rgb(185,139,57)' :
           property == 'RL' ? 'rgb(217,18,55)' :
           property == 'SM' ? 'rgb(240,241,7)' :
           property == 'VL' ? 'rgb(7,110,30' :
           property == 'NULL' ? 'rgb(180,180,200)':
                            'rgb(180,180,200)';
};

function getColorErozniOpatreni(property) {
    return property == 'H' ? 'rgb(255,186,225)' :
    property == 'P' ? 'rgb(35,120,178)' :
    property == 'S' ? 'rgb(219,106,251)' :
    property == 'T' ? 'rgb(32,200,230)' :
    property == 'V' ? 'rgb(7,110,30)' :
    property == 'Z' ? 'rgb(255,238,126)' :
    property == 'NULL' ? 'rgb(180,180,200)':	
                     'rgb(180,180,200)';
};

// Vytvoření vrstev parcel vlastnictví
function createParcelLayer(fillColor, hoverColor = '#261a20') {
    const geoJsonLayer = L.geoJSON(null, {
        style: function (feature) {
            return {
                fillColor: fillColor,
                color: fillColor,
                weight: 0.6,
                fillOpacity: 0.2
            };
        },
        onEachFeature: function (feature, layer) {
            layer.on('mouseover', function (e) {
                layer.bindTooltip(feature.properties.KmenoveCislo + (feature.properties.PododdeleniCisla ? "/" + feature.properties.PododdeleniCisla : "")).openTooltip();
                e.target.setStyle({
                    weight: 3,
                    color: hoverColor
                });
                e.target.bringToFront();
            });

            layer.on('mouseout', function (e) {
                geoJsonLayer.resetStyle(e.target);  // This resets it to the default defined in `style:`
            });
        }
    });

    return geoJsonLayer;
};


// Vytvoření geoJSON vrstvy pro parcely podle druhu pozemku (bez dat)
/*
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
*/

// Vytvoření geoJSON vrstvy pro katastrální území
var ku = L.geoJSON(null, {
    style: function (feature) {
        return {
            fillColor: '#0AFFF5',
            color: '#0AFFF5',
            weight: 1,
            fillOpacity: 0,
        };
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.Nazev) {
            layer.bindTooltip(feature.properties.Nazev, {
                permanent: true,
                direction: 'center',
                className: 'katastralni-label'
            });
        }
    }
}).addTo(map);

// Vytvoření geoJSON vrstvy pro priority opatření
var priorityOp = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
        let priority = feature.properties["Priorita opatření"];
        let color = 'white'; 
        if (priority === '3') {
            color = '#FF0000'; 
        } else if (priority === '2') {
            color = '#FFA500';
        }

        return L.circleMarker(latlng, {
            radius: 2.5,
            fillColor: color,
            color: 'black',
            weight: 0.2,
            opacity: 1,
            fillOpacity: 0.8
        });
    }
});

// Vytvoření geoJSON vrstvy pro parcely podle navržených opatření (bez dat)
var parcelyNavrhOpatreni = L.geoJSON(null, {
    style: function (feature) {
        return {
            fillColor: getColorNavrzenaOpatreni(feature.properties["Návrh opatření"]),
            color: 'black',
            weight: 0.2,
            fillOpacity: 0.8,
        };
    },
    onEachFeature: function (feature, layer) {
        layer.on('mouseover', function (e) {
            layer.bindTooltip(feature.properties.KmenoveCislo + (feature.properties.PododdeleniCisla ? "/" + feature.properties.PododdeleniCisla : "")).openTooltip();
            e.target.setStyle({
                weight: 3,
                color: hoverColor
            });
            e.target.bringToFront();
        });

        layer.on('mouseout', function (e) {
            parcelyNavrhOpatreni.resetStyle(e.target);  // This resets it to the default defined in `style:`
        });
    }
}).addTo(map);

// Vytvoření geoJSON vrstvy pro parcely podle protierozních opatření (bez dat)
var parcelyErozniOpatreni = L.geoJSON(null, {
    style: function (feature) {
        return {
            fillColor: getColorErozniOpatreni(feature.properties["Protierozní opatření"]),
            color: 'black',
            weight: 0.2,
            fillOpacity: 0.8,
        };
    },
    onEachFeature: function (feature, layer) {
        layer.on('mouseover', function (e) {
            layer.bindTooltip(feature.properties.KmenoveCislo + (feature.properties.PododdeleniCisla ? "/" + feature.properties.PododdeleniCisla : "")).openTooltip();
            e.target.setStyle({
                weight: 3,
                color: hoverColor
            });
            e.target.bringToFront();
        });

        layer.on('mouseout', function (e) {
            parcelyErozniOpatreni.resetStyle(e.target);  // This resets it to the default defined in `style:`
        });
    }
});

//loadGeoJSON('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/parcely_Krumlov.geojson', parcelyDP);
loadGeoJSON('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/ku.geojson', ku);
loadGeoJSON('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/navrhOpatreni.geojson', parcelyNavrhOpatreni);
loadGeoJSON('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/priority_realizace.geojson', priorityOp);
loadGeoJSON('https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/navrhOpatreni.geojson', parcelyErozniOpatreni);

// Přepínač vrstev
var baseMaps = {
    "OpenStreetMaps": osmLayer,
    "Ortofoto": orthoLayer
};

/*
var overlayMaps = {
    "Navržená opatření": parcelyNavrhOpatreni,
    "Protierozní opatření": parcelyErozniOpatreni,
    //"Parcely podle druhu pozemku": parcelyDP,
    "Eroze - odtokové linie - nejdelší kritická délka OL": eagriOLNej,
    "Eroze - odtokové linie": eagriOL,
    "DPB účinné - kód": eagriDPBucKod,
    "DPB účinné": eagriDPBuc,
    "LPIS výměra": eagriLPISVym,
    "Stupeň, sráz - ZABAGED": zabagedSraz,
    //"Katastrální mapa": kmGridLayer,
};
*/

var groupedOverlays = {
    "Výsledné vrstvy": {
        "Navržená opatření": parcelyNavrhOpatreni,
        "Priority navržených opatření": priorityOp,
        "Protierozní opatření": parcelyErozniOpatreni,
    },
    "Podkladové vrstvy": {
        "Eroze - odtokové linie - nejdelší kritická délka OL": eagriOLNej,
        "Eroze - odtokové linie": eagriOL,
        "DPB účinné": eagriDPBuc,
        "DPB uživatel": eagriDPBuziv,
        "LPIS výměra": eagriLPISVym,
        "Stupeň, sráz - ZABAGED": zabagedSraz,
        "Katastrální území": ku,
    },
    "Parcely podle vlastnictví": {}
};

// Parcely podle vlastnictví zdroj a styl
const vlastnictviLayers = [
    //{ name: "Parcely města M. Krumlov", file: "parcely_mesta.geojson", color: "#0AFFF5" },
    { name: "Parcely vlastněné státem", file: "parcely_CR.geojson", color: "#ff7184" },
    { name: "Parcely vlastníka AGRO 2000 s.r.o.", file: "parcely_Agro.geojson", color: "#dcff71" },
    { name: "Parcely vlastníka AGRO Rakšice, spol. s r. o.", file: "parcely_AgroRaksice.geojson", color: "#61e82a" },
    { name: "Parcely vlastníka Jiří Břínek", file: "parcely_BrinekJiri.geojson", color: "#c971ff" },
    { name: "Parcely vlastníka Vratislav Břínek", file: "parcely_BrinekVratislav.geojson", color: "#e5a8d9" },
    { name: "Parcely vlastníka BioZem s.r.o.", file: "parcely_BioZem.geojson", color: "#ffe171" },
];

vlastnictviLayers.forEach(item => {
    let layer = createParcelLayer(item.color);
    groupedOverlays["Parcely podle vlastnictví"][item.name] = layer;
    //overlayMaps[item.name] = layer;
    loadGeoJSON(`https://raw.githubusercontent.com/DajanaSnopkova/mapa-mkrumlov/main/data/${item.file}`, layer);
    
    layer.on('add', toggleOwnerLegend);
    layer.on('remove', toggleOwnerLegend);
});

/*
//Legenda druh pozemku
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
*/

//Legenda navržená opatření
var legendNavrhOpatreni = L.control({position: 'bottomright'});
legendNavrhOpatreni.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        druhyNO = ['BC', 'BK', 'DR', 'PC', 'RL', 'SM', 'VL', 'NULL'];
        druhyNOlabels = ['biocentrum', 'biokoridor', 'ponechat', 'polní cesta', 'rozvojová plocha', 'směna pozemků', 'větrolam', 'neposuzovaná plocha'];
    div.innerHTML += '<h4>Navržená opatření</h4>';
    for (var i = 0; i < druhyNO.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColorNavrzenaOpatreni(druhyNO[i]) + '"></i> ' +
            (druhyNOlabels[i]) + '<br>';
    }
    return div;
};

legendNavrhOpatreni.addTo(map);

//Legenda protierozní opatření	
var legendErozniOpatreni = L.control({position: 'bottomright'});
legendErozniOpatreni.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        druhyEO = ['H', 'P', 'S', 'T', 'V', 'Z', 'NULL'];
        druhyEOlabels = ['úprava terénu (příkopy, terasy)', 'úprava vodoteče (přehrážky, stabilizace)', 'svejl (zasakovací prohlubně s výsadbou)', 'tůň, mokřad', 'výsadby dřevin, solitérů, stromořadí', 'zachování stavu, zatravnění', 'neposuzovaná plocha'];
    div.innerHTML += '<h4>Protierozní opatření</h4>';
    for (var i = 0; i < druhyEO.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColorErozniOpatreni(druhyEO[i]) + '"></i> ' +
            (druhyEOlabels[i]) + '<br>';
    }
    return div;
};

//Legenda priority opatření
var legendPriorityOp = L.control({position: 'bottomright'});
legendPriorityOp.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        colors = ['#FF0000', '#FFA500'],
        labels = ['3 - vysoká priorita', '2 - střední priorita'];
    div.innerHTML += '<h4>Priority navržených opatření</h4>';
    for (var i = 0; i < colors.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors[i] + '; border-radius: 25px;"></i> ' +
            (labels[i]) + '<br>';
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
    for (var i = 0; i < colors.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors[i] + '"></i> ' +
            (labels[i]) + '<br>';
    }
    return div;
};

// Zobrazit legendu, pokud je aktivní vrstva
function toggleLegend(layerName, legendName) {
    if (map.hasLayer(layerName)) {
        legendName.addTo(map);
    } else {
        map.removeControl(legendName);
    }
};

// Zobrazit legendu, pokud je aktivní vrstva podle vlastnictví
function anyOwnerLayerVisible() {
    const layers = Object.values(groupedOverlays["Parcely podle vlastnictví"]);
    return layers.some(layer => map.hasLayer(layer));
};

function toggleOwnerLegend() {
    if (anyOwnerLayerVisible()) {
        legendOwners.addTo(map);
    } else {
        map.removeControl(legendOwners);
    }
};


// Přidání legendy do mapy
/*
parcelyDP.on('add', function () { toggleLegend(parcelyDP, legend); });
parcelyDP.on('remove', function () { toggleLegend(parcelyDP, legend); });
*/
parcelyNavrhOpatreni.on('add', function () { toggleLegend(parcelyNavrhOpatreni, legendNavrhOpatreni); });
parcelyNavrhOpatreni.on('remove', function () { toggleLegend(parcelyNavrhOpatreni, legendNavrhOpatreni); });

parcelyErozniOpatreni.on('add', function () { toggleLegend(parcelyErozniOpatreni, legendErozniOpatreni); });
parcelyErozniOpatreni.on('remove', function () { toggleLegend(parcelyErozniOpatreni, legendErozniOpatreni); });

priorityOp.on('add', function () { toggleLegend(priorityOp, legendPriorityOp); });
priorityOp.on('remove', function () { toggleLegend(priorityOp, legendPriorityOp); });

//L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
L.control.groupedLayers(baseMaps, groupedOverlays, { collapsed: false }).addTo(map);
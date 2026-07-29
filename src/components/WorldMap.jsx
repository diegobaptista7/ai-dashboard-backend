import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Country name normalization map for fuzzy matching
const ALIASES = {
  'usa': 'united states of america', 'united states': 'united states of america', 'us': 'united states of america',
  'uk': 'united kingdom', 'great britain': 'united kingdom', 'england': 'united kingdom',
  'drc': 'dem. rep. congo', 'dr congo': 'dem. rep. congo', 'democratic republic of the congo': 'dem. rep. congo',
  'republic of the congo': 'congo', 'russia': 'russian federation',
  'iran': 'iran (islamic republic of)', 'syria': 'syrian arab republic',
  'south korea': 'republic of korea', 'north korea': "democratic people's republic of korea",
  'tanzania': 'united republic of tanzania', 'vietnam': 'viet nam', 'laos': 'lao pdr',
  'ivory coast': "côte d'ivoire", 'cote d\'ivoire': "côte d'ivoire",
  'bolivia': 'plurinational state of bolivia', 'venezuela': 'bolivarian republic of venezuela',
  'moldova': 'republic of moldova', 'cape verde': 'cabo verde', 'eswatini': 'swaziland',
  'north macedonia': 'republic of north macedonia',
};

function normalize(name) {
  const n = (name || '').toLowerCase().trim();
  return ALIASES[n] || n;
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function countToColor(count, max) {
  if (!count) return '#DBEAFE';
  const t = Math.min(count / max, 1);
  return `rgb(${lerp(191, 29, t)},${lerp(219, 78, t)},${lerp(254, 216, t)})`;
}

export default function WorldMap({ data }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  const countryStats = useMemo(() => {
    const stats = {};
    data.forEach((r) => {
      if (r.countries) {
        const key = normalize(r.countries);
        if (!stats[key]) {
          stats[key] = { total: 0, deployed: 0, development: 0 };
        }
        stats[key].total += 1;
        if (r._project_type === 'deployed') {
          stats[key].deployed += 1;
        } else if (r._project_type === 'development') {
          stats[key].development += 1;
        }
      }
    });
    return stats;
  }, [data]);

  const maxCount = useMemo(
    () => Math.max(...Object.values(countryStats).map(s => s.total), 1),
    [countryStats]
  );

  const styleFeature = (feature) => {
    const name = normalize(feature.properties.name || '');
    const stat = countryStats[name];
    const count = stat ? stat.total : 0;
    return {
      fillColor: countToColor(count, maxCount),
      fillOpacity: 0.85,
      color: count > 0 ? '#93B4D8' : '#C0D4F0',
      weight: count > 0 ? 0.8 : 0.5,
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.name || 'Unknown';
    const stat = countryStats[normalize(name)];
    
    let html = `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5">
        <strong>${name}</strong><br/>`;
        
    if (!stat || stat.total === 0) {
      html += 'No projects';
    } else {
      html += `Total projects: ${stat.total}`;
      if (stat.deployed > 0) html += `<br/>Deployed projects: ${stat.deployed}`;
      if (stat.development > 0) html += `<br/>Development projects: ${stat.development}`;
    }
    
    html += '</div>';

    layer.bindTooltip(
      html,
      { sticky: true, opacity: 0.97, className: 'leaflet-tooltip-custom' }
    );
    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 1, weight: 1.5, color: '#6366F1' }),
      mouseout: (e) => e.target.setStyle(styleFeature(feature)),
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={[20, 0]}
        zoom={1.5}
        minZoom={1.5}
        maxZoom={8}
        zoomSnap={0.5}
        zoomDelta={0.5}
        style={{ width: '100%', height: '100%', background: '#EFF6FF' }}
        zoomControl={true}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        {geoData && (
          <GeoJSON
            key={JSON.stringify(countryStats)}
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      {/* Legend */}
      <div className="map-legend">
        <span style={{ background: '#DBEAFE' }} />
        <span className="legend-label">0</span>
        <div className="legend-gradient" />
        <span className="legend-label">High</span>
      </div>
    </div>
  );
}

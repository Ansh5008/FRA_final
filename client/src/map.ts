import L from 'leaflet';

// Interfaces for API responses
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OverpassElement {
  type: string;
  id: number;
  geometry: Array<{lat: number, lon: number}>;
  tags: {[key: string]: string};
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Global variables
let map: L.Map | null = null;
let buildingLayerGroup: L.LayerGroup | null = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const locationInput = document.getElementById('locationInput') as HTMLInputElement;
  const generateMapBtn = document.getElementById('generateMapBtn') as HTMLButtonElement;
  const loadingDiv = document.getElementById('loading') as HTMLDivElement;

  // Add event listeners
  generateMapBtn.addEventListener('click', handleGenerateMap);
  locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleGenerateMap();
    }
  });

  // Initialize empty map
  initializeMap();
});

function initializeMap(): void {
  if (map) {
    map.remove();
  }

  map = L.map('map').setView([51.505, -0.09], 13); // Default to London

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  buildingLayerGroup = L.layerGroup().addTo(map);
}

async function handleGenerateMap(): Promise<void> {
  const locationInput = document.getElementById('locationInput') as HTMLInputElement;
  const generateMapBtn = document.getElementById('generateMapBtn') as HTMLButtonElement;
  const loadingDiv = document.getElementById('loading') as HTMLDivElement;

  const location = locationInput.value.trim();
  if (!location) {
    alert('Please enter a location');
    return;
  }

  // Show loading state
  generateMapBtn.disabled = true;
  loadingDiv.style.display = 'block';
  
  try {
    // Step 1: Geocode the location
    const coordinates = await geocodeLocation(location);
    if (!coordinates) {
      alert('Location not found. Please try a different search term.');
      return;
    }

    // Step 2: Fetch building data
    const buildings = await fetchBuildingData(coordinates.lat, coordinates.lon);
    if (buildings.length === 0) {
      alert('No buildings found in this area. Try a different location or zoom level.');
      return;
    }

    // Step 3: Clear existing buildings and add new ones
    if (buildingLayerGroup) {
      buildingLayerGroup.clearLayers();
    }

    // Step 4: Plot buildings on map
    plotBuildings(buildings);

    // Step 5: Fit map bounds to show all buildings
    const group = new L.FeatureGroup(buildingLayerGroup!.getLayers());
    map!.fitBounds(group.getBounds().pad(0.1));

  } catch (error) {
    console.error('Error generating map:', error);
    alert('An error occurred while generating the map. Please try again.');
  } finally {
    // Hide loading state
    generateMapBtn.disabled = false;
    loadingDiv.style.display = 'none';
  }
}

async function geocodeLocation(location: string): Promise<{lat: number, lon: number} | null> {
  // Check if input is already coordinates (lat,lng format)
  const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
  if (coordPattern.test(location)) {
    const [lat, lon] = location.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lon)) {
      return { lat, lon };
    }
  }

  // Use Nominatim API for geocoding
  const encodedLocation = encodeURIComponent(location);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`;

  try {
    const response = await fetch(url);
    const data: NominatimResult[] = await response.json();
    
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function fetchBuildingData(lat: number, lon: number): Promise<OverpassElement[]> {
  // Create bounding box around the point (roughly 500m radius)
  const offset = 0.005; // Approximately 500 meters
  const south = lat - offset;
  const west = lon - offset;
  const north = lat + offset;
  const east = lon + offset;

  // Overpass API query for buildings
  const query = `
    [out:json][timeout:25];
    (
      way["building"](${south},${west},${north},${east});
      relation["building"](${south},${west},${north},${east});
    );
    out geom;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });

    const data: OverpassResponse = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error('Overpass API error:', error);
    return [];
  }
}

function plotBuildings(buildings: OverpassElement[]): void {
  if (!map || !buildingLayerGroup) return;

  buildings.forEach((building) => {
    if (!building.geometry || building.geometry.length === 0) return;

    // Convert geometry to LatLng points
    const points: L.LatLng[] = building.geometry.map(point => 
      L.latLng(point.lat, point.lon)
    );

    // Create polygon with random semi-transparent color
    const color = getRandomColor();
    const polygon = L.polygon(points, {
      fillColor: color,
      fillOpacity: 0.6,
      color: '#000000', // Black border
      weight: 2,
      opacity: 1
    });

    // Create popup content
    const popupContent = createPopupContent(building);
    polygon.bindPopup(popupContent);

    // Add hover effects
    polygon.on('mouseover', function(this: L.Polygon) {
      this.setStyle({
        weight: 4,
        opacity: 1
      });
    });

    polygon.on('mouseout', function(this: L.Polygon) {
      this.setStyle({
        weight: 2,
        opacity: 1
      });
    });

    // Add to layer group
    buildingLayerGroup!.addLayer(polygon);
  });
}

function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createPopupContent(building: OverpassElement): string {
  let content = `<div style="font-family: Arial, sans-serif;">`;
  content += `<strong>OSM ID:</strong> ${building.id}<br>`;
  content += `<strong>Type:</strong> ${building.type}<br>`;
  
  if (building.tags) {
    content += `<strong>Tags:</strong><br>`;
    Object.entries(building.tags).forEach(([key, value]) => {
      content += `&nbsp;&nbsp;${key}: ${value}<br>`;
    });
  }
  
  content += `</div>`;
  return content;
}
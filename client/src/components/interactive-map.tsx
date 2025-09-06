import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

const InteractiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const buildingLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // Default to India

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      buildingLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const geocodeLocation = async (locationQuery: string): Promise<{lat: number, lon: number} | null> => {
    // Check if input is already coordinates (lat,lng format)
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (coordPattern.test(locationQuery)) {
      const [lat, lon] = locationQuery.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }

    // Use Nominatim API for geocoding
    const encodedLocation = encodeURIComponent(locationQuery);
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
  };

  const fetchBuildingData = async (lat: number, lon: number): Promise<OverpassElement[]> => {
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
  };

  const getRandomColor = (): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createPopupContent = (building: OverpassElement): string => {
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
  };

  const plotBuildings = (buildings: OverpassElement[]): void => {
    if (!mapInstanceRef.current || !buildingLayerGroupRef.current) return;

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
      buildingLayerGroupRef.current!.addLayer(polygon);
    });
  };

  const handleGenerateMap = async (): Promise<void> => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Geocode the location
      const coordinates = await geocodeLocation(location);
      if (!coordinates) {
        setError('Location not found. Please try a different search term.');
        return;
      }

      // Step 2: Fetch building data
      const buildings = await fetchBuildingData(coordinates.lat, coordinates.lon);
      if (buildings.length === 0) {
        setError('No buildings found in this area. Try a different location or zoom level.');
        return;
      }

      // Step 3: Clear existing buildings and add new ones
      if (buildingLayerGroupRef.current) {
        buildingLayerGroupRef.current.clearLayers();
      }

      // Step 4: Plot buildings on map
      plotBuildings(buildings);

      // Step 5: Fit map bounds to show all buildings
      if (buildingLayerGroupRef.current && mapInstanceRef.current) {
        const group = new L.FeatureGroup(buildingLayerGroupRef.current.getLayers());
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }

    } catch (error) {
      console.error('Error generating map:', error);
      setError('An error occurred while generating the map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerateMap();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter address, city, or coordinates (lat,lng)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button 
          onClick={handleGenerateMap} 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Generate Map
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div 
        ref={mapRef} 
        className="w-full h-[500px] border-2 border-border rounded-lg"
        style={{ minHeight: '500px' }}
      />

      <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Forest Claims</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Pending Review</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Rejected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Buildings</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
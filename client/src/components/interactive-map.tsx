import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { MapPin, Search, Loader2, Layers, Download, Share2, Ruler, Home, Building, TreePine, MapIcon, Bookmark } from 'lucide-react';
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
  const landUseLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showLandUse, setShowLandUse] = useState(true);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [mapStats, setMapStats] = useState({
    buildings: 0,
    landUse: 0,
    area: 0
  });
  const [suggestions] = useState([
    'Bhopal, Madhya Pradesh',
    'Ranchi, Jharkhand', 
    'Delhi',
    'Mumbai, Maharashtra',
    'Bangalore, Karnataka',
    'Jaipur, Rajasthan',
    'Gumla, Jharkhand',
    'Khunti, Jharkhand'
  ]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map with India center and appropriate zoom
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([20.5937, 78.9629], 5);

      // Add custom tile layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '© Esri, Maxar, GeoEye'
      });

      osmLayer.addTo(mapInstanceRef.current);

      // Add layer control
      const baseLayers = {
        'Street Map': osmLayer,
        'Satellite': satelliteLayer
      };

      // Initialize layer groups
      buildingLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      landUseLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

      const overlays = {
        'Buildings': buildingLayerGroupRef.current,
        'Land Use': landUseLayerGroupRef.current
      };

      L.control.layers(baseLayers, overlays, { position: 'topright' }).addTo(mapInstanceRef.current);
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
      L.control.scale({ position: 'bottomleft' }).addTo(mapInstanceRef.current);
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

    // Use Nominatim API for geocoding with India-specific search
    const encodedLocation = encodeURIComponent(locationQuery + ', India');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&countrycodes=IN&limit=1&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FRA-ACT-GIS-Map/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
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
      throw error;
    }
  };

  const fetchBuildingData = async (lat: number, lon: number): Promise<OverpassElement[]> => {
    // Create bounding box around the point (roughly 1km radius for better coverage)
    const offset = 0.01; // Approximately 1 kilometer
    const south = lat - offset;
    const west = lon - offset;
    const north = lat + offset;
    const east = lon + offset;

    // Overpass API query for buildings and land use in India
    const query = `
      [out:json][timeout:30];
      (
        way["building"](${south},${west},${north},${east});
        relation["building"](${south},${west},${north},${east});
        way["landuse"~"residential|commercial|industrial"](${south},${west},${north},${east});
      );
      out geom;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'FRA-ACT-GIS-Map/1.0'
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data: OverpassResponse = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Overpass API error:', error);
      throw error;
    }
  };

  const getBuildingColor = (buildingType: string): string => {
    const colorMap: { [key: string]: string } = {
      'residential': '#4CAF50',
      'commercial': '#2196F3', 
      'industrial': '#FF9800',
      'office': '#9C27B0',
      'retail': '#00BCD4',
      'warehouse': '#795548',
      'school': '#8BC34A',
      'hospital': '#F44336',
      'religious': '#FFC107',
      'default': '#607D8B'
    };
    return colorMap[buildingType] || colorMap.default;
  };

  const getLandUseColor = (landUse: string): string => {
    const colorMap: { [key: string]: string } = {
      'residential': '#81C784',
      'commercial': '#64B5F6',
      'industrial': '#FFB74D',
      'forest': '#2E7D32',
      'agricultural': '#8BC34A',
      'default': '#90A4AE'
    };
    return colorMap[landUse] || colorMap.default;
  };

  const createEnhancedPopup = (element: OverpassElement, type: 'building' | 'landuse'): string => {
    const tags = element.tags || {};
    const icon = type === 'building' ? '🏢' : '🌿';
    
    let content = `
      <div style="font-family: Inter, sans-serif; max-width: 300px; padding: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
          <span style="font-size: 20px;">${icon}</span>
          <div>
            <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">
              ${type === 'building' ? (tags.name || 'Building') : (tags.name || 'Land Area')}
            </h3>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              ${type === 'building' ? (tags.building || 'Structure') : (tags.landuse || 'Land Use')}
            </p>
          </div>
        </div>
    `;

    // Key information
    if (type === 'building') {
      if (tags.levels) content += `<div style="margin: 4px 0;"><strong>Floors:</strong> ${tags.levels}</div>`;
      if (tags.height) content += `<div style="margin: 4px 0;"><strong>Height:</strong> ${tags.height}</div>`;
      if (tags.addr_housenumber && tags.addr_street) {
        content += `<div style="margin: 4px 0;"><strong>Address:</strong> ${tags.addr_housenumber} ${tags.addr_street}</div>`;
      }
    } else {
      if (tags.surface) content += `<div style="margin: 4px 0;"><strong>Surface:</strong> ${tags.surface}</div>`;
      if (tags.access) content += `<div style="margin: 4px 0;"><strong>Access:</strong> ${tags.access}</div>`;
    }

    // Additional tags
    const interestingTags = ['amenity', 'shop', 'office', 'leisure', 'tourism', 'historic'];
    interestingTags.forEach(tag => {
      if (tags[tag]) {
        content += `<div style="margin: 4px 0;"><strong>${tag.charAt(0).toUpperCase() + tag.slice(1)}:</strong> ${tags[tag]}</div>`;
      }
    });

    content += `
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
          OSM ID: ${element.id} | Type: ${element.type}
        </div>
      </div>
    `;

    return content;
  };

  const plotBuildings = (elements: OverpassElement[]): void => {
    if (!mapInstanceRef.current || !buildingLayerGroupRef.current || !landUseLayerGroupRef.current) return;

    let buildingCount = 0;
    let landUseCount = 0;

    elements.forEach((element) => {
      if (!element.geometry || element.geometry.length === 0) return;

      // Convert geometry to LatLng points
      const points: L.LatLng[] = element.geometry.map(point => 
        L.latLng(point.lat, point.lon)
      );

      const isBuilding = element.tags && element.tags.building;
      const isLandUse = element.tags && element.tags.landuse;

      if (isBuilding && showBuildings) {
        buildingCount++;
        const buildingType = element.tags.building;
        const color = getBuildingColor(buildingType);
        
        const polygon = L.polygon(points, {
          fillColor: color,
          fillOpacity: 0.7,
          color: '#2c3e50',
          weight: 1,
          opacity: 0.9
        });

        // Enhanced popup content
        const popupContent = createEnhancedPopup(element, 'building');
        polygon.bindPopup(popupContent);

        // Smooth hover effects
        polygon.on('mouseover', function(this: L.Polygon) {
          this.setStyle({
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
          });
        });

        polygon.on('mouseout', function(this: L.Polygon) {
          this.setStyle({
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.7
          });
        });

        buildingLayerGroupRef.current!.addLayer(polygon);
      }

      if (isLandUse && showLandUse) {
        landUseCount++;
        const landUseType = element.tags.landuse;
        const color = getLandUseColor(landUseType);
        
        const polygon = L.polygon(points, {
          fillColor: color,
          fillOpacity: 0.4,
          color: '#34495e',
          weight: 1,
          opacity: 0.6,
          dashArray: '5, 5'
        });

        const popupContent = createEnhancedPopup(element, 'landuse');
        polygon.bindPopup(popupContent);

        landUseLayerGroupRef.current!.addLayer(polygon);
      }
    });

    setMapStats({ buildings: buildingCount, landUse: landUseCount, area: 0 });
  };

  const handleGenerateMap = async (): Promise<void> => {
    if (!location.trim()) {
      setError('Please enter an Indian location (district, state, or village)');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Geocode the location
      const coordinates = await geocodeLocation(location);
      if (!coordinates) {
        setError('Location not found in India. Please try a different Indian district, state, or village.');
        return;
      }

      // Step 2: Fetch building data
      const buildings = await fetchBuildingData(coordinates.lat, coordinates.lon);
      if (buildings.length === 0) {
        setError('No cadastral data found for this location. Try a more urbanized area or different location.');
        return;
      }

      // Step 3: Clear existing data
      if (buildingLayerGroupRef.current) {
        buildingLayerGroupRef.current.clearLayers();
      }
      if (landUseLayerGroupRef.current) {
        landUseLayerGroupRef.current.clearLayers();
      }
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Step 4: Add location marker
      if (mapInstanceRef.current) {
        markerRef.current = L.marker([coordinates.lat, coordinates.lon])
          .bindPopup(`<strong>${location}</strong><br/>📍 ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`)
          .addTo(mapInstanceRef.current);
      }

      // Step 5: Plot buildings and land use
      plotBuildings(buildings);

      // Step 6: Add to recent locations
      if (!recentLocations.includes(location)) {
        setRecentLocations(prev => [location, ...prev.slice(0, 4)]);
      }

      // Step 7: Fit map bounds
      if (mapInstanceRef.current) {
        const allLayers = [
          ...(buildingLayerGroupRef.current?.getLayers() || []),
          ...(landUseLayerGroupRef.current?.getLayers() || [])
        ];
        
        if (allLayers.length > 0) {
          const group = new L.FeatureGroup(allLayers);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        } else {
          mapInstanceRef.current.setView([coordinates.lat, coordinates.lon], 15);
        }
      }

    } catch (error) {
      console.error('Error generating map:', error);
      if (error instanceof Error) {
        setError(`Failed to load map data: ${error.message}. Please try again.`);
      } else {
        setError('An error occurred while generating the map. Please try again.');
      }
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
    <div className="space-y-6">
      {/* Enhanced Search Section */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapIcon className="w-5 h-5" />
            Indian Cadastral Map Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter Indian district, state, village or coordinates (e.g. Bhopal, Ranchi, Gumla)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-white dark:bg-gray-800"
            />
            <Button 
              onClick={handleGenerateMap} 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 min-w-[140px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Generate Map
            </Button>
          </div>
          
          {/* Quick suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(suggestion)}
                  className="text-xs h-7"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          
          {/* Recent locations */}
          {recentLocations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bookmark className="w-4 h-4" />
                Recent Searches:
              </div>
              <div className="flex flex-wrap gap-2">
                {recentLocations.map((recent, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setLocation(recent)}
                  >
                    {recent}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Map and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div 
                ref={mapRef} 
                className="w-full h-[600px] rounded-lg overflow-hidden"
                style={{ minHeight: '600px' }}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          {/* Map Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buildings:</span>
                <span className="font-medium">{mapStats.buildings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Land Areas:</span>
                <span className="font-medium">{mapStats.landUse}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Layer Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Buildings</span>
                </div>
                <Switch 
                  checked={showBuildings} 
                  onCheckedChange={setShowBuildings}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Land Use</span>
                </div>
                <Switch 
                  checked={showLandUse} 
                  onCheckedChange={setShowLandUse}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                  <span>Residential</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  <span>Commercial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-600 rounded-sm"></div>
                  <span>Industrial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded-sm"></div>
                  <span>Office</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-sm border-2 border-dashed border-gray-600"></div>
                  <span>Land Use</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
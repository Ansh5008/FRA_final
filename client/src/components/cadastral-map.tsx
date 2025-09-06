import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, LayersControl } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Map, Layers, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface StateInfo {
  name: string;
  capital: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  districts: string[];
  area: string;
  population: string;
  forestCover: string;
}

const stateData: Record<string, StateInfo> = {
  "madhya-pradesh": {
    name: "Madhya Pradesh",
    capital: "Bhopal",
    center: [23.2599, 77.4126],
    bounds: [[21.0000, 74.0000], [26.8770, 82.7930]],
    districts: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
    area: "308,252 sq km",
    population: "72.6 million",
    forestCover: "77,414 sq km (25.1%)"
  },
  "odisha": {
    name: "Odisha",
    capital: "Bhubaneswar", 
    center: [20.9517, 85.0985],
    bounds: [[17.7800, 81.3270], [22.5700, 87.5300]],
    districts: ["Bhubaneswar", "Cuttack", "Berhampur", "Sambalpur", "Rourkela", "Balasore", "Baripada", "Bhadrak"],
    area: "155,707 sq km", 
    population: "42.0 million",
    forestCover: "51,345 sq km (33.0%)"
  },
  "telangana": {
    name: "Telangana",
    capital: "Hyderabad",
    center: [17.1232, 79.2088],
    bounds: [[15.8525, 77.2750], [19.9178, 81.7750]],
    districts: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda"],
    area: "112,077 sq km",
    population: "35.0 million", 
    forestCover: "24,295 sq km (21.7%)"
  },
  "tripura": {
    name: "Tripura",
    capital: "Agartala",
    center: [23.9408, 91.9882],
    bounds: [[22.9560, 91.0960], [24.6320, 92.6730]],
    districts: ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Khowai", "Teliamura", "Sabroom"],
    area: "10,486 sq km",
    population: "3.7 million",
    forestCover: "8,073 sq km (77.0%)"
  }
};

// Sample cadastral boundary data (simplified GeoJSON)
const generateStateBoundary = (stateKey: string) => {
  const state = stateData[stateKey];
  const [[minLat, minLng], [maxLat, maxLng]] = state.bounds;
  
  return {
    type: "Feature",
    properties: {
      name: state.name,
      capital: state.capital,
      area: state.area,
      population: state.population,
      forestCover: state.forestCover
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [minLng, minLat],
        [maxLng, minLat], 
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat]
      ]]
    }
  };
};

// Generate sample district boundaries within state
const generateDistrictBoundaries = (stateKey: string) => {
  const state = stateData[stateKey];
  const [[minLat, minLng], [maxLat, maxLng]] = state.bounds;
  const latStep = (maxLat - minLat) / 3;
  const lngStep = (maxLng - minLng) / 3;
  
  return state.districts.slice(0, 6).map((district, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const districtMinLat = minLat + row * latStep;
    const districtMaxLat = minLat + (row + 1) * latStep;
    const districtMinLng = minLng + col * lngStep;
    const districtMaxLng = minLng + (col + 1) * lngStep;
    
    return {
      type: "Feature",
      properties: { 
        name: district,
        type: "district",
        state: state.name,
        fraClaimsCount: Math.floor(Math.random() * 50) + 10
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [districtMinLng, districtMinLat],
          [districtMaxLng, districtMinLat],
          [districtMaxLng, districtMaxLat], 
          [districtMinLng, districtMaxLat],
          [districtMinLng, districtMinLat]
        ]]
      }
    };
  });
};

// Generate sample village-level land parcels
const generateLandParcels = (stateKey: string) => {
  const state = stateData[stateKey];
  const [[minLat, minLng], [maxLat, maxLng]] = state.bounds;
  const parcels = [];
  
  // Generate 20 random land parcels across the state
  for (let i = 0; i < 20; i++) {
    const centerLat = minLat + Math.random() * (maxLat - minLat);
    const centerLng = minLng + Math.random() * (maxLng - minLng);
    const size = 0.01 + Math.random() * 0.02; // Small parcel size
    
    const landTypes = ["Agricultural", "Community Forest Resource", "Habitation", "Water Bodies", "Grazing"];
    const landType = landTypes[Math.floor(Math.random() * landTypes.length)];
    
    parcels.push({
      type: "Feature",
      properties: {
        id: `${stateKey}-parcel-${i + 1}`,
        landType,
        area: (Math.random() * 5 + 0.5).toFixed(2) + " acres",
        surveyNumber: `SY-${Math.floor(Math.random() * 9000) + 1000}`,
        village: state.districts[Math.floor(Math.random() * state.districts.length)],
        ownershipType: Math.random() > 0.5 ? "Individual" : "Community",
        fraStatus: Math.random() > 0.7 ? "Claimed" : "Available"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [centerLng - size, centerLat - size],
          [centerLng + size, centerLat - size],
          [centerLng + size, centerLat + size],
          [centerLng - size, centerLat + size],
          [centerLng - size, centerLat - size]
        ]]
      }
    });
  }
  
  return parcels;
};

const landTypeColors = {
  "Agricultural": "#f59e0b",
  "Community Forest Resource": "#10b981", 
  "Habitation": "#3b82f6",
  "Water Bodies": "#06b6d4",
  "Grazing": "#059669"
};

interface CadastralMapProps {
  "data-testid"?: string;
}

export function CadastralMap({ "data-testid": testId }: CadastralMapProps) {
  const [selectedState, setSelectedState] = useState("madhya-pradesh");
  const [mapLayer, setMapLayer] = useState("satellite");
  const [showParcels, setShowParcels] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  
  const currentState = stateData[selectedState];
  const stateBoundary = generateStateBoundary(selectedState);
  const districtBoundaries = generateDistrictBoundaries(selectedState);
  const landParcels = generateLandParcels(selectedState);

  const getParcelStyle = (feature: any) => {
    const landType = feature.properties.landType;
    const color = landTypeColors[landType as keyof typeof landTypeColors] || "#6b7280";
    
    return {
      fillColor: color,
      weight: 1,
      opacity: 0.8,
      color: color,
      fillOpacity: feature.properties.fraStatus === "Claimed" ? 0.8 : 0.4
    };
  };

  const getDistrictStyle = () => ({
    fillColor: "#e5e7eb",
    weight: 2,
    opacity: 1,
    color: "#374151",
    fillOpacity: 0.1
  });

  const getStateStyle = () => ({
    fillColor: "transparent",
    weight: 3,
    opacity: 1,
    color: "#991b1b",
    fillOpacity: 0
  });

  const downloadCadastralData = () => {
    const data = {
      state: currentState.name,
      stateBoundary,
      districts: districtBoundaries,
      landParcels,
      generatedAt: new Date().toISOString(),
      summary: {
        totalParcels: landParcels.length,
        totalDistricts: districtBoundaries.length,
        totalArea: currentState.area,
        forestCover: currentState.forestCover,
        fraClaimsTotal: districtBoundaries.reduce((sum, d) => sum + d.properties.fraClaimsCount, 0)
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadastral-map-${selectedState}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid={testId}>
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Map className="w-5 h-5" />
            <span>Cadastral Maps - Forest Rights Act Implementation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">State:</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stateData).map(([key, state]) => (
                    <SelectItem key={key} value={key}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Map Layer:</label>
              <Select value={mapLayer} onValueChange={setMapLayer}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="street">Street</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={downloadCadastralData}
              variant="outline"
              size="sm"
              data-testid="button-download-cadastral"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Map Data
            </Button>
          </div>

          {/* State Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <span className="text-sm font-medium">Capital:</span>
              <p className="text-sm">{currentState.capital}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Area:</span>
              <p className="text-sm">{currentState.area}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Population:</span>
              <p className="text-sm">{currentState.population}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Forest Cover:</span>
              <p className="text-sm">{currentState.forestCover}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Land Type Legend:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(landTypeColors).map(([landType, color]) => (
                <div key={landType} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs">{landType}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: "600px", width: "100%" }}>
            <MapContainer
              center={currentState.center}
              zoom={7}
              style={{ height: "100%", width: "100%" }}
              bounds={currentState.bounds}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer 
                  checked={mapLayer === "street"} 
                  name="Street Map"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer 
                  checked={mapLayer === "satellite"} 
                  name="Satellite"
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer 
                  checked={mapLayer === "terrain"} 
                  name="Terrain"
                >
                  <TileLayer
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
                  />
                </LayersControl.BaseLayer>

                {/* State Boundary Layer */}
                <LayersControl.Overlay checked name="State Boundary">
                  <GeoJSON
                    key={`state-${selectedState}`}
                    data={stateBoundary as any}
                    style={getStateStyle}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{stateBoundary.properties.name}</h3>
                        <p className="text-sm">Capital: {stateBoundary.properties.capital}</p>
                        <p className="text-sm">Area: {stateBoundary.properties.area}</p>
                        <p className="text-sm">Population: {stateBoundary.properties.population}</p>
                        <p className="text-sm">Forest Cover: {stateBoundary.properties.forestCover}</p>
                      </div>
                    </Popup>
                  </GeoJSON>
                </LayersControl.Overlay>

                {/* District Boundaries Layer */}
                <LayersControl.Overlay checked={showDistricts} name="Districts">
                  <div>
                    {districtBoundaries.map((district, index) => (
                      <GeoJSON
                        key={`district-${selectedState}-${index}`}
                        data={district as any}
                        style={getDistrictStyle}
                      >
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-semibold">{district.properties.name} District</h4>
                            <p className="text-sm">State: {district.properties.state}</p>
                            <p className="text-sm">FRA Claims: {district.properties.fraClaimsCount}</p>
                          </div>
                        </Popup>
                      </GeoJSON>
                    ))}
                  </div>
                </LayersControl.Overlay>

                {/* Land Parcels Layer */}
                <LayersControl.Overlay checked={showParcels} name="Land Parcels">
                  <div>
                    {landParcels.map((parcel, index) => (
                      <GeoJSON
                        key={`parcel-${selectedState}-${index}`}
                        data={parcel as any}
                        style={getParcelStyle}
                      >
                        <Popup>
                          <div className="p-2 space-y-1">
                            <h4 className="font-semibold">{parcel.properties.id}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                style={{ 
                                  backgroundColor: landTypeColors[parcel.properties.landType as keyof typeof landTypeColors] 
                                }}
                                className="text-white"
                              >
                                {parcel.properties.landType}
                              </Badge>
                              <Badge variant={parcel.properties.fraStatus === "Claimed" ? "default" : "secondary"}>
                                {parcel.properties.fraStatus}
                              </Badge>
                            </div>
                            <p className="text-sm">Survey No: {parcel.properties.surveyNumber}</p>
                            <p className="text-sm">Area: {parcel.properties.area}</p>
                            <p className="text-sm">Village: {parcel.properties.village}</p>
                            <p className="text-sm">Ownership: {parcel.properties.ownershipType}</p>
                          </div>
                        </Popup>
                      </GeoJSON>
                    ))}
                  </div>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cadastral Statistics - {currentState.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{landParcels.length}</div>
              <div className="text-sm text-blue-800">Total Land Parcels</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {landParcels.filter(p => p.properties.fraStatus === "Claimed").length}
              </div>
              <div className="text-sm text-green-800">FRA Claims Filed</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{districtBoundaries.length}</div>
              <div className="text-sm text-amber-800">Districts Mapped</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {districtBoundaries.reduce((sum, d) => sum + d.properties.fraClaimsCount, 0)}
              </div>
              <div className="text-sm text-purple-800">Total FRA Records</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useClub } from '../../../../../context/ClubContext';
import ClubGuard from '../../../../../context/ClubGuard';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PolygonDto {
  name: string;
  coordinates: google.maps.LatLngLiteral[];
}

const EditPolygonPage: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const { selectedClub } = useClub();
  const mapRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);

  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [polygonData, setPolygonData] = useState<PolygonDto>({ name: '', coordinates: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Load Google Maps script
  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.drawing) {
        return resolve();
      }

      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      (window as any).initMap = () => resolve();

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=drawing`;
      script.async = true;
      script.defer = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Initialize component
  useEffect(() => {
    if (!selectedClub) return;
    
    const init = async () => {
      try {
        setLoading(true);
        console.log(`Loading polygon with ID: ${id} for club ID: ${selectedClub.id}`);
        
        // Load Google Maps API first
        await loadGoogleMapsScript();
        console.log("Google Maps script loaded");
        
        // Fetch polygon data from API
        const response = await fetch(`https://localhost:7091/api/Polygons/${id}?clubId=${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch polygon: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Polygon data received:", data);
        
        // Parse coordinates
        let coordinates: google.maps.LatLngLiteral[] = [];
        try {
          // Check if coordinatesJson is present and not empty
          if (!data.coordinatesJson) {
            throw new Error("No coordinates found in response");
          }
          
          // Parse coordinates from JSON
          const rawJson = typeof data.coordinatesJson === 'string'
            ? JSON.parse(data.coordinatesJson)
            : data.coordinatesJson;
          
          console.log("Raw coordinates:", rawJson);
            
          coordinates = rawJson.map((c: any) => ({
            lat: parseFloat(c.lat ?? c.Lat),
            lng: parseFloat(c.lng ?? c.Lng),
          }));
          
          console.log("Parsed coordinates:", coordinates);
          
          // Verify that we have coordinates
          if (coordinates.length === 0) {
            throw new Error("Parsed coordinates array is empty");
          }
        } catch (err) {
          console.error("Error parsing coordinates:", err);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to parse polygon coordinates',
            life: 3000
          });
          // If parsing fails, initialize with dummy coordinates
          coordinates = [
            { lat: 56.10857764750518, lng: 23.349903007765427 },
            { lat: 56.11857764750518, lng: 23.359903007765427 },
            { lat: 56.12857764750518, lng: 23.369903007765427 }
          ];
        }
        
        // Set polygon data
        setPolygonData({
          name: data.name,
          coordinates: coordinates
        });
        
        // Wait for DOM to update before initializing map
        setTimeout(() => {
          console.log("Initializing map with coordinates:", coordinates);
          if (mapRef.current) {
            initMap(coordinates);
          } else {
            console.error("Map ref is null");
          }
        }, 100);
      } catch (err) {
        console.error("Initialization error:", err);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load polygon data',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      if (polygon) {
        polygon.setMap(null);
      }
    };
  }, [id, selectedClub]);

  // Initialize map with polygon
  const initMap = (coords: google.maps.LatLngLiteral[]) => {
    if (!mapRef.current) {
      console.error("Map ref is not available");
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error("Google Maps is not loaded");
      return;
    }
    
    try {
      console.log("Creating map with ref:", mapRef.current);
      console.log("Using coordinates:", coords);
      
      // Ensure we have valid coordinates to work with
      const validCoords = coords && coords.length > 0 ? coords : [
        { lat: 56.10857764750518, lng: 23.349903007765427 },
        { lat: 56.11857764750518, lng: 23.359903007765427 },
        { lat: 56.12857764750518, lng: 23.369903007765427 }
      ];
      
      // Calculate center from coordinates
      const center = validCoords[0];
      
      // Create map instance
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
        mapTypeControl: true,
        zoomControl: true,
        fullscreenControl: true
      });
      
      console.log("Map created, now creating polygon");
      
      // Create editable polygon
      const editablePolygon = new google.maps.Polygon({
        paths: validCoords,
        editable: true,
        strokeColor: '#008000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#008000',
        fillOpacity: 0.35
      });
      
      // Set the map for the polygon after creation
      editablePolygon.setMap(map);
      
      // Store polygon in state
      setPolygon(editablePolygon);
      
      // Add paths_changed listeners to update coordinates
      const path = editablePolygon.getPath();
      
      const pathChangedCallback = () => {
        console.log("Polygon path changed");
        updateCoordinates(editablePolygon);
      };
      
      google.maps.event.addListener(path, 'set_at', pathChangedCallback);
      google.maps.event.addListener(path, 'insert_at', pathChangedCallback);
      google.maps.event.addListener(path, 'remove_at', pathChangedCallback);
      
      // Fit map to polygon bounds
      const bounds = new google.maps.LatLngBounds();
      validCoords.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds);
      
      // Give map time to render before adjusting zoom
      setTimeout(() => {
        // Adjust zoom if too zoomed in (happens with small polygons)
        if (map.getZoom() > 18) {
          map.setZoom(18);
        }
      }, 300);
      
      console.log("Polygon created, now fetching hunting area boundary");
      
      // Load and display hunting area boundary (red line)
      fetchHuntingArea(map);
    } catch (err) {
      console.error("Error initializing map:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to initialize map',
        life: 3000
      });
    }
  };

  // Fetch and display hunting area boundary
  const fetchHuntingArea = async (map: google.maps.Map) => {
    if (!selectedClub) {
      console.log("No selected club, skipping hunting area fetch");
      return;
    }
    
    try {
      console.log(`Fetching hunting area for club ID: ${selectedClub.id}`);
      
      const response = await fetch(`https://localhost:7091/api/HuntingAreas?clubId=${selectedClub.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch hunting area: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log("Hunting area data:", data);
      
      if (!data || data.length === 0) {
        console.log("No hunting area data found");
        return;
      }
      
      const area = data[0];
      console.log("Processing hunting area:", area);
      
      // Parse coordinates
      let pathCoords: google.maps.LatLng[] = [];
      try {
        // Try different ways of accessing the coordinates
        let rawCoords = null;
        
        if (typeof area.coordinatesJson === 'string' && area.coordinatesJson.trim()) {
          console.log("Parsing coordinatesJson string");
          rawCoords = JSON.parse(area.coordinatesJson);
        } else if (area.coordinatesJson) {
          console.log("Using coordinatesJson object");
          rawCoords = area.coordinatesJson;
        } else if (area.coordinates) {
          console.log("Using coordinates property");
          rawCoords = area.coordinates;
        }
            
        if (rawCoords) {
          console.log("Raw coordinates found:", rawCoords);
          
          pathCoords = rawCoords.map((c: any) => {
            // Handle different property naming conventions
            const lat = typeof c.lat !== 'undefined' ? parseFloat(c.lat) : 
                        typeof c.Lat !== 'undefined' ? parseFloat(c.Lat) : 0;
            const lng = typeof c.lng !== 'undefined' ? parseFloat(c.lng) : 
                        typeof c.Lng !== 'undefined' ? parseFloat(c.Lng) : 0;
                        
            if (isNaN(lat) || isNaN(lng)) {
              console.warn("Invalid coordinate value:", c);
              return null;
            }
            
            return new google.maps.LatLng(lat, lng);
          }).filter(Boolean) as google.maps.LatLng[]; // Filter out nulls
          
          console.log("Parsed path coordinates:", pathCoords);
        } else {
          console.warn("No coordinate data found in hunting area");
        }
      } catch (err) {
        console.warn("Error parsing hunting area coordinates:", err);
        return;
      }
      
      if (pathCoords.length === 0) {
        console.warn("No valid coordinates found for hunting area");
        return;
      }
      
      // Create polyline on the map
      console.log("Creating polyline for hunting area with", pathCoords.length, "points");
      const polyline = new google.maps.Polyline({
        path: pathCoords,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      
      polyline.setMap(map);
      console.log("Hunting area polyline added to map");
    } catch (err) {
      console.warn("Error fetching hunting area:", err);
    }
  };

  // Update coordinates when polygon is edited
  const updateCoordinates = (poly: google.maps.Polygon) => {
    const path = poly.getPath();
    const updatedCoords: google.maps.LatLngLiteral[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      updatedCoords.push({ lat: point.lat(), lng: point.lng() });
    }
    
    setPolygonData(prev => ({ ...prev, coordinates: updatedCoords }));
    
    // Validate polygon
    if (updatedCoords.length < 3) {
      setValidationError('Polygon must have at least 3 points');
    } else {
      setValidationError('');
    }
  };

  // Handle save button click
  const handleSave = async () => {
    if (!selectedClub || !polygon) return;
    
    // Validate name
    if (!polygonData.name.trim()) {
      setValidationError('Please enter a name for the polygon');
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter a name for the polygon',
        life: 3000
      });
      return;
    }
    
    // Validate coordinates
    if (polygonData.coordinates.length < 3) {
      setValidationError('Polygon must have at least 3 points');
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Polygon must have at least 3 points',
        life: 3000
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`https://localhost:7091/api/Polygons/${id}?clubId=${selectedClub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(polygonData),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Polygonas atnaujintas sėkmingai',
        life: 3000
      });
      
      // Redirect after success
      setTimeout(() => router.push('/uikit/mapsList'), 1500);
    } catch (err) {
      console.error("Error saving polygon:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Nepavyko atnaujinti poligoną',
        life: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    router.push('/uikit/mapsList');
  };

  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        <h2 className="text-xl font-bold mb-4">Redaguoti medžioklės plotą</h2>
        
        {loading ? (
          <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <ProgressSpinner />
          </div>
        ) : (
          <>
            <div className="field mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-2">Pavadinimas</label>
              <InputText
                id="name"
                value={polygonData.name}
                onChange={(e) => setPolygonData({ ...polygonData, name: e.target.value })}
                placeholder="Pavadinimas"
                className={classNames('w-full', {'p-invalid': validationError && !polygonData.name})}
              />
              {validationError && !polygonData.name && (
                <small className="p-error">Pavadinimas yra privalomas</small>
              )}
            </div>
            
            <div 
              ref={mapRef}
              style={{ width: '100%', height: '400px', borderRadius: '8px' }}
              className={classNames('mb-4', {'border-red-500 border-1': validationError && validationError.includes('points')})}
            />
            {validationError && validationError.includes('points') && (
              <small className="p-error block mb-4">{validationError}</small>
            )}
            
            <div className="flex justify-content-end gap-3">
              <Button
                label="Atšaukti"
                icon="pi pi-times"
                className="p-button-text"
                onClick={handleCancel}
                disabled={submitting}
              />
              <Button
                label="Išsaugoti"
                icon="pi pi-check"
                severity="success"
                onClick={handleSave}
                loading={submitting}
              />
            </div>
          </>
        )}
      </div>
    </ClubGuard>
  );
};

export default EditPolygonPage;
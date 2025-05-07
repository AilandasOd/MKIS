'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useClub } from '../../../../context/ClubContext';
import ClubGuard from '../../../../context/ClubGuard';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Polygon {
  id: number;
  name: string;
  coordinates: google.maps.LatLngLiteral[];
}

const MapsCreate: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [nameDialogVisible, setNameDialogVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [polygonId, setPolygonId] = useState<number | null>(null);
  const [newPolygonCoords, setNewPolygonCoords] = useState<google.maps.LatLngLiteral[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedClub } = useClub();

  // Helper function to extract coordinates from a polygon
  const getPolygonCoordinates = (poly: google.maps.Polygon): google.maps.LatLngLiteral[] => {
    const path = poly.getPath();
    const coordinates: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({ lat: point.lat(), lng: point.lng() });
    }
    return coordinates;
  };

  // Load Google Maps script
  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.drawing) {
        console.log("Google Maps API already loaded");
        return resolve();
      }

      console.log("Loading Google Maps API with drawing library");
      
      // Cleanup any existing script to prevent duplicate loads
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        console.log("Found existing Google Maps script, using it");
        existingScript.addEventListener("load", () => {
          console.log("Existing script loaded");
          resolve();
        });
        return;
      }

      // Create a global callback function that Google Maps will call when loaded
      const callbackName = `initGoogleMaps${Date.now()}`;
      (window as any)[callbackName] = () => {
        console.log(`Google Maps loaded via callback ${callbackName}`);
        resolve();
        // Clean up the global callback
        delete (window as any)[callbackName];
      };

      // Create and append the script
      console.log("Creating new Google Maps script tag");
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = (e) => {
        console.error("Error loading Google Maps script:", e);
        reject(new Error("Failed to load Google Maps API"));
      };
      document.head.appendChild(script);
    });
  };

  // Load existing polygons and hunting area from the server
  const loadExistingPolygons = async (mapInstance: google.maps.Map) => {
    if (!selectedClub) return;

    try {
      // Create a bounds object to fit all elements
      const bounds = new google.maps.LatLngBounds();
      
      // 1. Load existing polygons
      const polyRes = await fetch(`https://localhost:7091/api/Polygons?clubId=${selectedClub.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (!polyRes.ok) {
        throw new Error(`Failed to fetch polygons: ${polyRes.status}`);
      }

      const polygonData = await polyRes.json();
      const polygonInstances: google.maps.Polygon[] = [];

      polygonData.forEach((polygon: any) => {
        try {
          // Try to parse coordinates JSON correctly
          let coordinates: google.maps.LatLngLiteral[] = [];
          
          try {
            // Try parsing as JSON string first
            const rawCoords = typeof polygon.coordinatesJson === 'string' 
              ? JSON.parse(polygon.coordinatesJson) 
              : polygon.coordinatesJson;
              
            coordinates = rawCoords.map((c: any) => ({
              lat: parseFloat(c.lat ?? c.Lat),
              lng: parseFloat(c.lng ?? c.Lng),
            }));
          } catch (err) {
            console.error("Error parsing coordinates:", err);
            return; // Skip this polygon
          }

          // Create polygon instance
          const polygonInstance = new google.maps.Polygon({
            paths: coordinates,
            strokeColor: '#008000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#008000',
            fillOpacity: 0.35,
            map: mapInstance,
          });

          // Add to list of polygons
          polygonInstances.push(polygonInstance);

          // Create info window
          const center = calculatePolygonCenter(coordinates);
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="color: black;"><strong>${polygon.name}</strong></div>`,
            position: center,
          });

          // Add click listener
          polygonInstance.addListener("click", () => {
            if (polygon) {
              infoWindow.open(mapInstance);
            }
          });

          // Add coordinates to bounds
          coordinates.forEach(coord => bounds.extend(coord));
        } catch (err) {
          console.error("Error creating polygon:", err);
        }
      });

      // Update state with polygons
      setPolygons(polygonInstances);
      
      // 2. Load and display hunting area (red boundary line)
      try {
        const huntingRes = await fetch(`https://localhost:7091/api/HuntingAreas?clubId=${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });
        
        if (huntingRes.ok) {
          const huntingData = await huntingRes.json();
          
          if (huntingData && huntingData.length > 0) {
            const area = huntingData[0];
            
            // Parse coordinates
            let rawCoords;
            try {
              rawCoords = typeof area.coordinatesJson === 'string'
                ? JSON.parse(area.coordinatesJson)
                : typeof area.coordinates !== 'undefined'
                  ? area.coordinates
                  : null;
            } catch (err) {
              console.warn("Could not parse hunting area coordinates:", err);
              rawCoords = null;
            }
            
            if (rawCoords) {
              // Convert to LatLng objects for Google Maps
              const pathCoords = rawCoords.map((c: any) => {
                const lat = parseFloat(c.lat ?? c.Lat);
                const lng = parseFloat(c.lng ?? c.Lng);
                return new google.maps.LatLng(lat, lng);
              });
              
              // Create polyline for hunting area boundary
              const boundaryLine = new google.maps.Polyline({
                path: pathCoords,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: mapInstance,
              });
              
              // Extend bounds to include hunting area
              pathCoords.forEach(coord => bounds.extend(coord));
            }
          }
        }
      } catch (err) {
        console.warn("Error loading hunting area:", err);
      }

      // Fit bounds if we have any elements to display
      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds);
      }
    } catch (err) {
      console.error("Error loading map data:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load existing map data',
        life: 3000,
      });
    }
  };

  // Helper function to calculate polygon center
  const calculatePolygonCenter = (coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
    if (coords.length === 0) return { lat: 0, lng: 0 };

    const bounds = new google.maps.LatLngBounds();
    coords.forEach(coord => bounds.extend(coord));
    const center = bounds.getCenter();
    return { lat: center.lat(), lng: center.lng() };
  };

  // Initialize map with drawing controls
  const initMap = async () => {
    if (!mapRef.current) return;

    try {
      // Create the map
      const mapOptions = {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 }, // Default to Lithuania
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
      };

      const newMap = new google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);

      // Load existing polygons
      await loadExistingPolygons(newMap);

      // Create drawing manager
      const manager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          fillColor: "#00FF00",
          strokeColor: "#00FF00",
          fillOpacity: 0.5,
          strokeWeight: 2,
          clickable: true,
          editable: true,
          zIndex: 1,
        },
      });

      manager.setMap(newMap);
      setDrawingManager(manager);

      // Listen for polygon completion
      google.maps.event.addListener(
        manager, 
        "overlaycomplete", 
        (event: google.maps.drawing.OverlayCompleteEvent) => {
          if (event.type === google.maps.drawing.OverlayType.POLYGON) {
            // Set the new polygon as editable
            const newPolygon = event.overlay as google.maps.Polygon;
            newPolygon.setOptions({ editable: true });
            
            // Store the polygon in state
            setPolygon(newPolygon);
            
            // Extract coordinates
            const coordinates = getPolygonCoordinates(newPolygon);
            setNewPolygonCoords(coordinates);
            
            // Stop drawing mode
            manager.setDrawingMode(null);
            
            // Show dialog to name polygon
            setNameDialogVisible(true);
          }
        }
      );
    } catch (err) {
      console.error("Map initialization error:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to initialize map',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize map when component mounts
  useEffect(() => {
    const init = async () => {
      if (!selectedClub) return;
      
      setLoading(true);
      
      try {
        // Load Google Maps API
        await loadGoogleMapsScript();
        
        // Initialize map
        await initMap();
      } catch (err) {
        console.error("Error initializing:", err);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load map',
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    init();

    // Cleanup function
    return () => {
      if (polygon) {
        polygon.setMap(null);
      }
      polygons.forEach(p => p.setMap(null));
      if (drawingManager) {
        drawingManager.setMap(null);
      }
    };
  }, [selectedClub]); // Re-run when selectedClub changes

  // Handle saving a polygon
  const handleSavePolygon = async (name: string, coordinates: google.maps.LatLngLiteral[]) => {
    if (!selectedClub) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No club selected',
        life: 3000,
      });
      return;
    }

    if (coordinates.length < 3) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Polygon must have at least 3 points',
        life: 3000,
      });
      return;
    }

    const payload = {
      name,
      coordinates
    };

    try {
      const response = await fetch(`https://localhost:7091/api/Polygons?clubId=${selectedClub.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Polygon saved successfully',
        life: 3000,
      });

      // Clear current polygon editing state
      if (polygon) {
        // Change color to indicate it's saved
        polygon.setOptions({
          strokeColor: '#008000',
          fillColor: '#008000',
          editable: false
        });
        
        // Add to polygons list
        setPolygons([...polygons, polygon]);
      }
      
      // Reset state for new polygon
      setPolygon(null);
      
      // Reset drawing manager to create new polygons
      if (drawingManager) {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      }
    } catch (err) {
      console.error("Error saving polygon:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save polygon',
        life: 3000,
      });
    }
  };

  // Handle dialog save action
  const handleDialogSave = () => {
    if (nameInput.trim() && newPolygonCoords.length) {
      handleSavePolygon(nameInput, newPolygonCoords);
      setNameDialogVisible(false);
      setNameInput('');
    } else {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please provide a name for the polygon',
        life: 3000,
      });
    }
  };

  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        <h2 className="text-xl font-bold mb-4">Medžioklės ploto žymėjimas</h2>
        
        {selectedClub ? (
          <div>
            <div ref={mapRef} style={{ height: "600px", width: "100%", borderRadius: "8px" }} />
            
            <Dialog
              header="Įveskite medžioklės ploto pavadinimą"
              visible={nameDialogVisible}
              onHide={() => setNameDialogVisible(false)}
              style={{ width: '30vw' }}
              modal
              position="top"
              draggable={false}
              resizable={false}
              footer={
                <div className="flex justify-content-end">
                  <Button 
                    label="Atšaukti" 
                    icon="pi pi-times" 
                    className="p-button-text mr-2" 
                    onClick={() => {
                      setNameDialogVisible(false);
                      // Remove temporary polygon if canceled
                      if (polygon) {
                        polygon.setMap(null);
                        setPolygon(null);
                      }
                      // Reset drawing mode
                      if (drawingManager) {
                        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                      }
                    }}
                  />
                  <Button 
                    label="Išsaugoti" 
                    icon="pi pi-check" 
                    onClick={handleDialogSave} 
                  />
                </div>
              }
            >
              <div className="p-fluid">
                <div className="field">
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Ploto pavadinimas</label>
                  <InputText
                    id="name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full"
                    placeholder="Ploto pavadinimas"
                    autoFocus
                  />
                </div>
              </div>
            </Dialog>
          </div>
        ) : (
          <div className="p-4 text-center">
            <i className="pi pi-exclamation-circle text-3xl text-yellow-500 mb-3"></i>
            <p>Pasirinkite klubą, kad galėtumėte žymėti medžioklės plotus.</p>
          </div>
        )}
      </div>
    </ClubGuard>
  );
};

export default MapsCreate;
// MKInformacineSistemaFront/app/(main)/maps/objectsmap/page.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useClub } from '../../../../context/ClubContext';
import ClubGuard from '../../../../context/ClubGuard';

const TOWER_ICON = '/layout/images/Tower.png';
const EATING_ICON = '/layout/images/Corn.png';
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type MarkerType = 'Tower' | 'EatingZone';

interface NamedMarker {
  id?: number;
  marker: google.maps.Marker;
  type: MarkerType;
  name: string;
}

interface MapObject {
  id: number;
  name: string;
  type: string;
  coordinate: {
    lat: number;
    lng: number;
  };
}

const MapWithCustomMarkers: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [selectedType, setSelectedType] = useState<MarkerType>('Tower');
  const [markers, setMarkers] = useState<NamedMarker[]>([]);
  const [nameDialogVisible, setNameDialogVisible] = useState(false);
  const [newMarker, setNewMarker] = useState<google.maps.Marker | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const { selectedClub } = useClub();

  const getIconForType = (type) => {
    console.log(`Getting icon for type: ${type}`);
    const iconUrl = type === 'Tower' ? TOWER_ICON : EATING_ICON;
    console.log(`Icon URL: ${iconUrl}`);
    return {
      url: iconUrl,
      scaledSize: new google.maps.Size(32, 32),
    };
  };

  // Fetch map objects from API
  useEffect(() => {
    if (!selectedClub || !map) return;

    const fetchMapObjects = async () => {
      try {
        const response = await fetch(`https://localhost:7091/api/MapObjects?clubId=${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const objects: MapObject[] = await response.json();
        
        // Create markers for each object
        const newMarkers: NamedMarker[] = [];
        
        objects.forEach(obj => {
          const position = { lat: obj.coordinate.lat, lng: obj.coordinate.lng };
          const type = obj.type as MarkerType;
          const icon = getIconForType(type);
          
          const marker = new google.maps.Marker({
            position,
            map,
            icon,
            draggable: isDrawingActive,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="color: black;"><strong>${obj.name}</strong></div>`,
          });

          marker.addListener('click', () => infoWindow.open(map, marker));
          
          // Add right-click to delete
          marker.addListener('rightclick', () => {
            if (isDrawingActive) {
              handleDeleteMarker(marker, obj.id);
            }
          });

          newMarkers.push({ 
            id: obj.id,
            marker, 
            type, 
            name: obj.name 
          });
        });
        
        setMarkers(newMarkers);
      } catch (err) {
        console.error("Error fetching map objects:", err);
        toast.current?.show({
          severity: 'error',
          summary: 'Klaida',
          detail: 'Nepavyko gauti objektų duomenų',
          life: 3000,
        });
      }
    };

    fetchMapObjects();
  }, [selectedClub, map, isDrawingActive]);

  const handleTypeChange = (e) => {
    setSelectedType(e.value);
    if (drawingManager) {
      drawingManager.setOptions({
        markerOptions: {
          icon: getIconForType(e.value),
          draggable: true
        }
      });
    }
  };

  // Delete marker handler
  const handleDeleteMarker = async (marker: google.maps.Marker, id?: number) => {
    if (!id || !selectedClub) return;

    try {
      const response = await fetch(`https://localhost:7091/api/MapObjects/${id}?clubId=${selectedClub.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Remove marker from map and state
      marker.setMap(null);
      setMarkers(prev => prev.filter(m => m.marker !== marker));

      toast.current?.show({
        severity: 'info',
        summary: 'Ištrinta',
        detail: 'Žymeklis pašalintas',
        life: 2000,
      });
    } catch (err) {
      console.error("Error deleting marker:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko ištrinti žymeklio',
        life: 3000,
      });
    }
  };

  const drawHuntingArea = async (mapInstance: google.maps.Map) => {
    if (!selectedClub) return;
    
    try {
      const res = await fetch(`https://localhost:7091/api/HuntingAreas?clubId=${selectedClub.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (!data.length) return;
        const area = data[0];
        const pathCoords = area.coordinates.map((c: any) => new google.maps.LatLng(c.lat, c.lng));
        new google.maps.Polyline({
          path: pathCoords,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: mapInstance,
        });
      }
    } catch (error) {
      console.error("Failed to fetch hunting area:", error);
    }
  };

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps && google.maps.drawing) {
        resolve();
        return;
      }
  
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          // Wait for drawing lib to be available
          const waitForDrawingLib = () => {
            if (google.maps.drawing) {
              resolve();
            } else {
              setTimeout(waitForDrawingLib, 100);
            }
          };
          waitForDrawingLib();
        });
        return;
      }
  
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const waitForDrawingLib = () => {
          if (google.maps.drawing) {
            resolve();
          } else {
            setTimeout(waitForDrawingLib, 100);
          }
        };
        waitForDrawingLib();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  

  const initMap = async () => {
    if (!mapRef.current || !selectedClub) return;
  
    try {
      // Create the map
      const newMap = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
      });
  
      setMap(newMap);
      
      // Draw hunting area boundary
      await drawHuntingArea(newMap);
  
      // Don't create the drawing manager here - we'll create it later
      setDrawingManager(null);
  
      // This will trigger the useEffect that creates the drawing manager with the correct icon
      setMap(newMap);
    } catch (err) {
      console.error("Map initialization error:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko inicializuoti žemėlapio',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!map) return;
    
    console.log(`Creating/updating drawing manager with icon type: ${selectedType}`);
  
    // If there's an existing drawing manager, remove it completely
    if (drawingManager) {
      drawingManager.setMap(null);
    }
    
    // Create a completely new drawing manager with current settings
    const manager = new google.maps.drawing.DrawingManager({
      drawingMode: isDrawingActive ? google.maps.drawing.OverlayType.MARKER : null,
      drawingControl: isDrawingActive,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.MARKER],
      },
      markerOptions: {
        icon: getIconForType(selectedType),
        draggable: true,
      },
    });
  
    // Set the map for the new drawing manager
    manager.setMap(map);
    
    // Store the new manager in state
    setDrawingManager(manager);
    
    // Add event listener for marker creation
    google.maps.event.addListener(manager, 'overlaycomplete', (event) => {
      if (event.type === google.maps.drawing.OverlayType.MARKER) {
        const marker = event.overlay;
        marker.setIcon(getIconForType(selectedType));
        marker.setDraggable(true);
        setNewMarker(marker);
        setNameDialogVisible(true);
      }
    });
    
    // Update markers draggable state
    markers.forEach(m => {
      m.marker.setDraggable(isDrawingActive);
    });
    
    return () => {
      // Cleanup function
      if (manager) {
        google.maps.event.clearInstanceListeners(manager);
        manager.setMap(null);
      }
    };
  }, [map, selectedType, isDrawingActive]);

  // Initialize map when component mounts
  useEffect(() => {
    const init = async () => {
      if (!selectedClub) return;
      
      try {
        setLoading(true);
        await loadGoogleMapsScript();
        await initMap();
      } catch (err) {
        console.error("Initialization error:", err);
        toast.current?.show({
          severity: 'error',
          summary: 'Klaida',
          detail: 'Nepavyko užkrauti žemėlapio',
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      markers.forEach(m => {
        if (m.marker) {
          m.marker.setMap(null);
        }
      });
      
      if (drawingManager) {
        drawingManager.setMap(null);
      }
    };
  }, [selectedClub]); // Re-run when selectedClub changes

  // Update drawing manager when drawing mode changes
  useEffect(() => {
    if (!drawingManager) return;
    
    // Complete reset of drawing manager options
    drawingManager.setOptions({
      drawingControl: isDrawingActive,
      drawingMode: isDrawingActive ? google.maps.drawing.OverlayType.MARKER : null,
      markerOptions: {
        icon: getIconForType(selectedType),
        draggable: true,
      }
    });
    
    // Update markers draggable state
    markers.forEach(m => {
      m.marker.setDraggable(isDrawingActive);
    });
  }, [isDrawingActive, selectedType, drawingManager]);

  const handleSaveMarker = async () => {
    if (!newMarker || !nameInput.trim() || !selectedClub) {
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Prašome įvesti objekto pavadinimą',
        life: 3000,
      });
      return;
    }

    try {
      const position = newMarker.getPosition();
      if (!position) {
        throw new Error("Invalid marker position");
      }

      const payload = {
        name: nameInput.trim(),
        type: selectedType,
        lat: position.lat(),
        lng: position.lng()
      };

      const response = await fetch(`https://localhost:7091/api/MapObjects?clubId=${selectedClub.id}`, {
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

      // Add the marker to the markers list with ID from the server
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color: black;"><strong>${nameInput}</strong></div>`,
      });

      newMarker.addListener('click', () => infoWindow.open(map, newMarker));
      
      // Add right-click to delete handler
      newMarker.addListener('rightclick', () => {
        if (isDrawingActive) {
          handleDeleteMarker(newMarker, result.id);
        }
      });

      setMarkers(prev => [...prev, { 
        id: result.id,
        marker: newMarker, 
        type: selectedType, 
        name: nameInput.trim() 
      }]);

      toast.current?.show({
        severity: 'success',
        summary: 'Objektas pridėtas',
        detail: `Pridėtas: ${selectedType === 'Tower' ? 'Bokštelis' : 'Šėrykla'}`,
        life: 2500,
      });

      setNewMarker(null);
      setNameInput('');
      setNameDialogVisible(false);

      // Reset drawing mode
      if (drawingManager) {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
      }
    } catch (err) {
      console.error("Error saving marker:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko išsaugoti objekto',
        life: 3000,
      });
    }
  };

  return (
    <ClubGuard>
      <div>
        <Toast ref={toast} />
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-bold">Objektų žymėjimas</h2>
          <div className="flex gap-4">
          <Dropdown
  value={selectedType}
  options={[
    { label: 'Bokštelis', value: 'Tower' },
    { label: 'Šėrykla', value: 'EatingZone' },
  ]}
  onChange={(e) => {
    console.log(`Dropdown changed to: ${e.value}`);
    setSelectedType(e.value);
  }}
  placeholder="Pasirinkite tipą"
  className="w-64"
  disabled={isDrawingActive}
/>
            <Button
              label={isDrawingActive ? 'Baigti žymėjimą' : 'Pradėti žymėjimą'}
              icon={isDrawingActive ? 'pi pi-check' : 'pi pi-map-marker'}
              onClick={() => setIsDrawingActive(prev => !prev)}
              severity={isDrawingActive ? 'success' : 'secondary'}
            />
          </div>
        </div>

        <div ref={mapRef} style={{ height: "600px", width: "100%", borderRadius: "8px" }} />

        <Dialog
          header="Įveskite objekto pavadinimą"
          visible={nameDialogVisible}
          onHide={() => {
            setNameDialogVisible(false);
            if (newMarker) newMarker.setMap(null);
            setNewMarker(null);
          }}
          style={{ width: '30vw' }}
          modal
          position="top"
          footer={<Button label="Išsaugoti" icon="pi pi-check" onClick={handleSaveMarker} />}
        >
          <InputText
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full"
            placeholder="Objekto pavadinimas"
          />
        </Dialog>
      </div>
    </ClubGuard>
  );
};

export default MapWithCustomMarkers;
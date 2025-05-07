'use client';
import React, { useEffect, useRef, useState } from 'react';
import RoleGuard from '../../../../context/RoleGuard';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { useClub } from '../../../../context/ClubContext';
import ClubGuard from '../../../../context/ClubGuard';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapLineDrawing: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [lineId, setLineId] = useState<number | null>(null);
  const { selectedClub } = useClub();
  const [loading, setLoading] = useState(true);

  const getCoordinates = (): { lat: number; lng: number }[] => {
    if (!polyline) return [];
    const path = polyline.getPath();
    const coords: { lat: number; lng: number }[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ lat: point.lat(), lng: point.lng() });
    }
    return coords;
  };

  const saveHuntingArea = async () => {
    if (!selectedClub) {
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepasirinktas klubas',
        life: 3000,
      });
      return;
    }

    const coords = getCoordinates();
    if (!coords.length) {
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nėra nubraižyta linija',
        life: 3000,
      });
      return;
    }

    const payload = {
      id: lineId,
      name: selectedClub.name + ' Ribos',
      coordinates: coords,
    };

    try {
      // Always use PUT if we have an ID, otherwise use POST to create a new area
      const method = lineId ? 'PUT' : 'POST';
      const url = lineId 
        ? `https://localhost:7091/api/HuntingAreas/${lineId}?clubId=${selectedClub.id}` 
        : `https://localhost:7091/api/HuntingAreas?clubId=${selectedClub.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Server error');

      const result = await res.json();
      if (!lineId && result.id) setLineId(result.id);

      toast.current?.show({
        severity: 'success',
        summary: 'Išsaugota',
        detail: 'Medžioklės ribos išsaugotos sėkmingai',
        life: 3000,
      });
    } catch (err) {
      console.error("Save error:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko išsaugoti medžioklės ribų',
        life: 3000,
      });
    }
  };

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.drawing) return resolve();

      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const waitForDrawingLibrary = (): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        if (window.google && window.google.maps?.drawing?.DrawingManager) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  // Initialize both map and hunting area together
  useEffect(() => {
    const initMapAndLoadHuntingArea = async () => {
      if (!selectedClub) return;
      
      setLoading(true);
      
      try {
        // Load Google Maps API
        await loadGoogleMapsScript();
        await waitForDrawingLibrary();
        
        if (!mapRef.current) return;
        
        // Clear existing objects
        if (polyline) {
          polyline.setMap(null);
          setPolyline(null);
        }
        
        if (drawingManager) {
          drawingManager.setMap(null);
          setDrawingManager(null);
        }
        
        // Create new map
        const newMap = new google.maps.Map(mapRef.current, {
          center: { lat: 56.10857764750518, lng: 23.349903007765427 },
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          streetViewControl: false,
        });
        
        setMap(newMap);
        
        // Fetch hunting areas for this club
        const res = await fetch(`https://localhost:7091/api/HuntingAreas?clubId=${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data && data.length > 0) {
            const area = data[0];
            setLineId(area.id);
          
            let rawJson = area.coordinatesJson || area.coordinates;
          
            // Parse if it's a string with escaped quotes (double quotes inside double quotes)
            if (typeof rawJson === 'string') {
              try {
                rawJson = JSON.parse(rawJson.replace(/""/g, '"')); // Convert to valid JSON
              } catch (err) {
                console.error("Failed to parse coordinatesJson:", err);
                toast.current?.show({
                  severity: 'error',
                  summary: 'Klaida',
                  detail: 'Netinkamas koordinačių formatas',
                  life: 3000,
                });
                return;
              }
            }
          
            const pathCoords = rawJson.map((c: any) => {
              const lat = parseFloat(c.lat ?? c.Lat);
              const lng = parseFloat(c.lng ?? c.Lng);
              return new google.maps.LatLng(lat, lng);
            });
          
            const existingLine = new google.maps.Polyline({
              path: pathCoords,
              strokeColor: "#FF0000",
              strokeOpacity: 1.0,
              strokeWeight: 3,
              editable: true,
              map: newMap,
            });
          
            setPolyline(existingLine);
          
            const bounds = new google.maps.LatLngBounds();
            pathCoords.forEach((p: any) => bounds.extend(p));
            newMap.fitBounds(bounds);
          }
        } else {
          throw new Error(`Server returned ${res.status}`);
        }
        
        // Set up drawing manager
        const manager = new google.maps.drawing.DrawingManager({
          drawingMode: polyline ? null : google.maps.drawing.OverlayType.POLYLINE,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYLINE],
          },
          polylineOptions: {
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            editable: true,
          },
        });
        
        manager.setMap(newMap);
        setDrawingManager(manager);
        
        google.maps.event.addListener(manager, "overlaycomplete", (event: google.maps.drawing.OverlayCompleteEvent) => {
          if (event.type === google.maps.drawing.OverlayType.POLYLINE) {
            // Remove old polyline if exists
            if (polyline) {
              polyline.setMap(null);
            }
            
            // Set new polyline
            const newLine = event.overlay as google.maps.Polyline;
            newLine.setOptions({ editable: true });
            setPolyline(newLine);
            
            // Turn off drawing mode
            manager.setDrawingMode(null);
            
            toast.current?.show({
              severity: 'info',
              summary: 'Nubraižyta linija',
              detail: 'Medžioklės ribos paruoštos redagavimui. Spauskite "Saugoti" kad išsaugotumėte pakeitimus.',
              life: 3000,
            });
          }
        });
      } catch (error) {
        console.error("Error initializing map:", error);
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
    
    initMapAndLoadHuntingArea();
    
    // Cleanup function
    return () => {
      if (drawingManager) {
        drawingManager.setMap(null);
      }
      if (polyline) {
        polyline.setMap(null);
      }
    };
  }, [selectedClub]); // Re-run when club changes

  return (
    <RoleGuard requiredRoles={['Admin', 'Owner']}>
      <ClubGuard>
        <div>
          <Toast ref={toast} />
          <h2 className="text-xl font-bold mb-4">Medžioklės ribų braižymas</h2>
          {selectedClub ? (
            <>
              
              <div ref={mapRef} style={{ height: "600px", width: "100%", borderRadius: "8px" }} />
              <div className="mt-4 text-right">
                <Button 
                  label="Saugoti pakeitimus" 
                  icon="pi pi-save" 
                  onClick={saveHuntingArea} 
                  disabled={!polyline || loading} 
                />
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              <p>Pasirinkite klubą, kad galėtumėte braižyti medžioklės ribas.</p>
            </div>
          )}
        </div>
      </ClubGuard>
    </RoleGuard>
  );
};

export default MapLineDrawing;
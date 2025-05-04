'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const ForestBoundaryPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [nameDialogVisible, setNameDialogVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [newPolygonCoords, setNewPolygonCoords] = useState<google.maps.LatLngLiteral[]>([]);

  const getPolygonCenter = (coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  };

  const loadExistingPolygons = (mapInstance: google.maps.Map) => {
    const bounds = new google.maps.LatLngBounds();

    // Green polygons
    fetch("https://localhost:7091/api/Polygons")
      .then(res => res.json())
      .then(polygons => {
        polygons.forEach((polygon: any) => {
          const rawCoords = JSON.parse(polygon.coordinatesJson);
          const coordinates = rawCoords.map((c: any) => ({
            lat: parseFloat(c.lat ?? c.Lat),
            lng: parseFloat(c.lng ?? c.Lng),
          }));

          const gPolygon = new google.maps.Polygon({
            paths: coordinates,
            strokeColor: '#008000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#008000',
            fillOpacity: 0.35,
            map: mapInstance,
          });

          const center = getPolygonCenter(coordinates);
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="color: black;"><strong>${polygon.name}</strong></div>`,
            position: center,
          });

          gPolygon.addListener("click", () => infoWindow.open(mapInstance));
          coordinates.forEach(coord => bounds.extend(coord));
        });

        mapInstance.fitBounds(bounds);
      });

    // Red polyline
    fetch("https://localhost:7091/api/HuntingAreas")
      .then(res => res.json())
      .then(areas => {
        if (!areas.length) return;
        const pathCoords = areas[0].coordinates.map((c: any) => ({
          lat: parseFloat(c.lat ?? c.Lat),
          lng: parseFloat(c.lng ?? c.Lng),
        }));

        new google.maps.Polyline({
          path: pathCoords,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: mapInstance,
        });

        pathCoords.forEach(coord => bounds.extend(coord));
        mapInstance.fitBounds(bounds);
      });
  };

  const initMap = () => {
    if (!mapRef.current) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 56.10857764750518, lng: 23.349903007765427 },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      streetViewControl: false,
    });

    setMap(newMap);
    loadExistingPolygons(newMap);

    const tryInitDrawingManager = () => {
      if (google.maps.drawing && google.maps.drawing.DrawingManager) {
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

        google.maps.event.addListener(manager, "overlaycomplete", (event: google.maps.drawing.OverlayCompleteEvent) => {
          if (event.type === google.maps.drawing.OverlayType.POLYGON) {
            const newPolygon = event.overlay as google.maps.Polygon;
            newPolygon.setOptions({ editable: true });
            setPolygon(newPolygon);

            const path = newPolygon.getPath();
            const coordinates: google.maps.LatLngLiteral[] = [];
            for (let i = 0; i < path.getLength(); i++) {
              const point = path.getAt(i);
              coordinates.push({ lat: point.lat(), lng: point.lng() });
            }

            setNewPolygonCoords(coordinates);
            setNameDialogVisible(true);
          }
        });
      } else {
        setTimeout(tryInitDrawingManager, 300);
      }
    };

    tryInitDrawingManager();
  };

  useEffect(() => {
    const loadGoogleMapsScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) return resolve();

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

    loadGoogleMapsScript().then(() => {
      initMap();
    });
  }, []);

  const handleSavePolygon = async (name: string, coordinates: google.maps.LatLngLiteral[]) => {
    const payload = { name, coordinates };

    try {
      await fetch("https://localhost:7091/api/Polygons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Išsaugota',
        detail: 'Medžioklės plotas sėkmingai pridėtas!',
        life: 3000,
      });

      polygon?.setMap(null);
      setPolygon(null);
      drawingManager?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);

      if (map) loadExistingPolygons(map);
    } catch (err) {
      console.error("Error saving polygon:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko išsaugoti ploto',
        life: 4000,
      });
    }
  };

  const handleDialogSave = () => {
    if (nameInput.trim() && newPolygonCoords.length) {
      handleSavePolygon(nameInput, newPolygonCoords);
      setNameDialogVisible(false);
      setNameInput('');
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <h2 className="text-xl font-bold mb-4">Medžioklės ploto žymėjimas</h2>
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
        footer={<Button label="Išsaugoti" icon="pi pi-check" onClick={handleDialogSave} />}
      >
        <InputText
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full"
          placeholder="Ploto pavadinimas"
        />
      </Dialog>
    </div>
  );
};

export default ForestBoundaryPage;

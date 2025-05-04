'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

const API_URL = 'https://localhost:7091/api/HuntingAreas';
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapLineDrawing: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [lineId, setLineId] = useState<number | null>(null);

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

  const saveOrUpdateLine = async () => {
    const coords = getCoordinates();
    if (!coords.length) return;

    const payload = {
      id: lineId,
      name: 'Main Hunting Border',
      coordinates: coords,
    };

    const method = lineId ? 'PUT' : 'POST';
    const url = lineId ? `${API_URL}/${lineId}` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Server error');

      const result = await res.json();
      if (!lineId && result.id) setLineId(result.id);

      toast.current?.show({
        severity: 'success',
        summary: 'Išsaugota',
        detail: 'Duomenys išsaugoti sėkmingai',
        life: 3000,
      });
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko išsaugoti linijos',
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

  useEffect(() => {
    const initMap = async () => {
      await loadGoogleMapsScript();
      await waitForDrawingLibrary();

      if (!mapRef.current) return;

      const newMap = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
      });

      setMap(newMap);

      fetch(API_URL)
        .then(res => res.json())
        .then(data => {
          if (!data.length) return;
          const area = data[0];
          setLineId(area.id);
          const pathCoords = area.coordinates.map((c: any) => new google.maps.LatLng(c.lat, c.lng));
          const existingLine = new google.maps.Polyline({
            path: pathCoords,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            editable: true,
            map: newMap,
          });
          setPolyline(existingLine);
        });

      const manager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYLINE,
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
          if (polyline) polyline.setMap(null);
          const newLine = event.overlay as google.maps.Polyline;
          newLine.setOptions({ editable: true });
          setPolyline(newLine);

          toast.current?.show({
            severity: 'info',
            summary: 'Braukta linija',
            detail: 'Linija paruošta redagavimui',
            life: 3000,
          });
        }
      });
    };

    initMap();
  }, []);

  return (
    <div>
      <Toast ref={toast} />
      <h2 className="text-xl font-bold mb-4">Medžioklės ribų braižymas</h2>
      <div ref={mapRef} style={{ height: "600px", width: "100%", borderRadius: "8px" }} />
      <div className="mt-4 text-right">
        <Button label="Saugoti pakeitimus" icon="pi pi-save" onClick={saveOrUpdateLine} disabled={!polyline} />
      </div>
    </div>
  );
};

export default MapLineDrawing;

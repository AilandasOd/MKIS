'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

const API_URL = 'https://localhost:7091/api/HuntingAreas';

declare global {
  interface Window {
    initMap: () => void;
  }
}

const TOWER_ICON = '/layout/images/Tower.png';
const EATING_ICON = '/layout/images/Corn.png';
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

type MarkerType = 'Tower' | 'EatingZone';

interface NamedMarker {
  marker: google.maps.Marker;
  type: MarkerType;
  name: string;
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

  const getIconForType = (type: MarkerType) => {
    return {
      url: type === 'Tower' ? TOWER_ICON : EATING_ICON,
      scaledSize: new google.maps.Size(32, 32),
    };
  };

  const seedInitialMarkers = (mapInstance: google.maps.Map) => {
    const baseLat = 56.1286255021102;
    const baseLng = 23.34730337048632;

    const offsets = [
      { lat: 0.001, lng: 0.001 },
      { lat: -0.001, lng: -0.001 },
      { lat: 0.0015, lng: -0.0012 },
      { lat: -0.0013, lng: 0.0013 },
    ];

    const types: MarkerType[] = ['Tower', 'Tower', 'EatingZone', 'EatingZone'];

    offsets.forEach((offset, index) => {
      const position = { lat: baseLat + offset.lat, lng: baseLng + offset.lng };
      const type = types[index];
      const icon = getIconForType(type);
      const marker = new google.maps.Marker({
        position,
        map: mapInstance,
        icon,
        draggable: false,
      });

      const name = `${type === 'Tower' ? 'Bokštelis' : 'Šėrykla'} ${index + 1}`;

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color: black;"><strong>${name}</strong></div>`,
      });

      marker.addListener('click', () => infoWindow.open(mapInstance, marker));

      setMarkers(prev => [...prev, { marker, type, name }]);
    });
  };

  const drawHuntingArea = (mapInstance: google.maps.Map) => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
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
      });
  };

  const initDrawingManager = (mapInstance: google.maps.Map, markerType: MarkerType) => {
    if (drawingManager) {
      drawingManager.setMap(null);
    }

    const manager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.MARKER,
      drawingControl: false,
      markerOptions: {
        icon: getIconForType(markerType),
        draggable: true,
      },
    });

    manager.setMap(mapInstance);
    setDrawingManager(manager);

    google.maps.event.addListener(manager, 'overlaycomplete', (event: google.maps.drawing.OverlayCompleteEvent) => {
      if (event.type === google.maps.drawing.OverlayType.MARKER) {
        const marker = event.overlay as google.maps.Marker;
        marker.setIcon(getIconForType(markerType));
        marker.setDraggable(true);

        setNewMarker(marker);
        setNameDialogVisible(true);
      }
    });
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

        window.initMap = () => resolve();

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    window.initMap = () => {
      if (!mapRef.current) return;

      const newMap = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
      });

      setMap(newMap);
      seedInitialMarkers(newMap);
      drawHuntingArea(newMap);
    };

    if (!window.google || !window.google.maps) {
      loadGoogleMapsScript();
    } else {
      window.initMap();
    }
  }, []);

  useEffect(() => {
    if (map && isDrawingActive) {
      initDrawingManager(map, selectedType);
    } else if (drawingManager) {
      drawingManager.setMap(null);
    }
  }, [map, selectedType, isDrawingActive]);

  const handleSaveMarker = () => {
    if (newMarker && nameInput.trim()) {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color: black;"><strong>${nameInput}</strong></div>`,
      });

      newMarker.addListener('click', () => infoWindow.open(map, newMarker));

      newMarker.addListener('rightclick', () => {
        if (isDrawingActive) {
          newMarker.setMap(null);
          setMarkers(prev => prev.filter(m => m.marker !== newMarker));
          toast.current?.show({
            severity: 'info',
            summary: 'Ištrinta',
            detail: 'Žymeklis pašalintas',
            life: 2000,
          });
        }
      });

      newMarker.setDraggable(isDrawingActive);

      setMarkers(prev => [...prev, { marker: newMarker, type: selectedType, name: nameInput.trim() }]);

      toast.current?.show({
        severity: 'success',
        summary: 'Objektas pridėtas',
        detail: `Pridėtas: ${selectedType === 'Tower' ? 'Bokštelis' : 'Šėrykla'}`,
        life: 2500,
      });

      setNewMarker(null);
      setNameInput('');
      setNameDialogVisible(false);
    }
  };

  return (
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
            onChange={(e) => setSelectedType(e.value)}
            placeholder="Pasirinkite tipą"
            className="w-64"
            disabled={isDrawingActive}
          />
          <Button
            label={isDrawingActive ? 'Baigti žymėjimą' : 'Pradėti žymėjimą'}
            icon={isDrawingActive ? 'pi pi-check' : 'pi pi-map-marker'}
            onClick={() => setIsDrawingActive(prev => {
              setMarkers(currentMarkers => {
                currentMarkers.forEach(m => m.marker.setDraggable(!prev));
                return [...currentMarkers];
              });
              return !prev;
            })}
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
  );
};

export default MapWithCustomMarkers;

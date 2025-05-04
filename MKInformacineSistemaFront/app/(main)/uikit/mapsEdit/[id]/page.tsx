'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PolygonDto {
  name: string;
  coordinates: google.maps.LatLngLiteral[];
}

const EditPolygonPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);

  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [polygonData, setPolygonData] = useState<PolygonDto>({ name: '', coordinates: [] });

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
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

  useEffect(() => {
    const init = async () => {
      await loadGoogleMapsScript();

      const res = await fetch(`https://localhost:7091/api/Polygons/${id}`);
      const data = await res.json();

      const coords = JSON.parse(data.coordinatesJson).map((c: any) => ({
        lat: parseFloat(c.lat ?? c.Lat),
        lng: parseFloat(c.lng ?? c.Lng),
      }));

      setPolygonData({ name: data.name, coordinates: coords });

      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: coords[0],
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,});

      const editablePolygon = new google.maps.Polygon({
        paths: coords,
        editable: true,
        strokeColor: '#008000',
        fillColor: '#008000',
        fillOpacity: 0.35,
        map,
      });

      setPolygon(editablePolygon);
    };

    init();
  }, [id]);

  const handleSave = async () => {
    if (!polygon) return;

    const path = polygon.getPath();
    const updatedCoords: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      updatedCoords.push({ lat: point.lat(), lng: point.lng() });
    }

    const payload = {
      name: polygonData.name,
      coordinates: updatedCoords,
    };

    const res = await fetch(`https://localhost:7091/api/Polygons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.success) {
      toast.current?.show({
        severity: 'success',
        summary: 'Išsaugota',
        detail: 'Medžioklės plotas sėkmingai atnaujintas!',
        life: 3000,
      });
      setTimeout(() => router.push('/uikit/mapsList'), 1500);
    } else {
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: result.message || 'Nepavyko išsaugoti medžioklės ploto.',
        life: 4000,
      });
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <h2 className="text-xl font-bold mb-4">Redaguoti medžioklės plotą</h2>

      <div className="mb-4">
        <InputText
          value={polygonData.name}
          onChange={(e) => setPolygonData({ ...polygonData, name: e.target.value })}
          placeholder="Pavadinimas"
          className="w-full"
        />
      </div>

      <div
        ref={mapRef}
        style={{ width: '100%', height: '400px', borderRadius: '8px' }}
        className="mb-4"
      />

      <Button
        label="Išsaugoti"
        icon="pi pi-check"
        severity="success"
        onClick={handleSave}
      />
    </div>
  );
};

export default EditPolygonPage;

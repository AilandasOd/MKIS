'use client';
import React, { useEffect, useRef, useState } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

interface Polygon {
  id: number;
  name: string;
  coordinatesJson: string;
}

const PolygonsWithMapAndList: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filteredPolygons, setFilteredPolygons] = useState<Polygon[] | null>(null);

  const getPolygonCenter = (coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  };

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const initMap = async () => {
      const [polygonRes, huntingRes] = await Promise.all([
        fetch("https://localhost:7091/api/Polygons"),
        fetch("https://localhost:7091/api/HuntingAreas")
      ]);

      const polygonData: Polygon[] = await polygonRes.json();
      const huntingAreas = await huntingRes.json();

      setPolygons(polygonData);

      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        zoom: 6,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
      });

      const bounds = new google.maps.LatLngBounds();

      polygonData.forEach((polygon) => {
        const rawCoords = JSON.parse(polygon.coordinatesJson);
        const coordinates: google.maps.LatLngLiteral[] = rawCoords.map((c: any) => ({
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
          map: map,
        });

        const center = getPolygonCenter(coordinates);
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="color: black;"><strong>${polygon.name}</strong></div>`,
          position: center,
        });

        gPolygon.addListener("click", () => infoWindow.open(map));

        coordinates.forEach(coord => bounds.extend(coord));
      });

      if (huntingAreas.length > 0) {
        const pathCoords = huntingAreas[0].coordinates.map((c: any) => ({
          lat: parseFloat(c.lat ?? c.Lat),
          lng: parseFloat(c.lng ?? c.Lng),
        }));

        new google.maps.Polyline({
          path: pathCoords,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: map,
        });

        pathCoords.forEach(coord => bounds.extend(coord));
      }

      map.fitBounds(bounds);
    };

    (window as any).initMap = initMap;

    if (!window.google || !window.google.maps) {
      loadGoogleMapsScript();
    } else {
      initMap();
    }
  }, []);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setGlobalFilter(val);

    if (val.trim() === '') {
      setFilteredPolygons(null);
    } else {
      const filtered = polygons.filter(p => p.name.toLowerCase().includes(val));
      setFilteredPolygons(filtered);
    }
  };

  const dataViewHeader = (
    <div className="flex flex-column md:flex-row md:justify-content-between gap-2 mb-1">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText value={globalFilter} onChange={handleFilter} placeholder="Ieškoti pagal pavadinimą..." />
      </span>
    </div>
  );

  const router = useRouter();

  const itemTemplate = (data: Polygon) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!window.google || !mapContainerRef.current) return;

      const rawCoords = JSON.parse(data.coordinatesJson);
      const coordinates: google.maps.LatLngLiteral[] = rawCoords.map((c: any) => ({
        lat: parseFloat(c.lat ?? c.Lat),
        lng: parseFloat(c.lng ?? c.Lng),
      }));

      const map = new google.maps.Map(mapContainerRef.current, {
        center: coordinates[0],
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        disableDefaultUI: true,
      });

      new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#008000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#008000',
        fillOpacity: 0.3,
        map: map,
      });
    }, [data]);

    return (
      <div className="col-12 md:col-4 p-1">
        <div className="card p-3 h-full">
          <div className="font-bold text-lg mb-2">{data.name}</div>
          <div ref={mapContainerRef} style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
          <Button
            label="Redaguoti"
            icon="pi pi-pencil"
            className="mt-2"
            onClick={() => router.push(`/uikit/mapsEdit/${data.id}`)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Medžioklės plotai</h2>
      <div ref={mapRef} style={{ height: '400px', width: '100%', borderRadius: '8px' }} className="mb-4" />

      <DataView
        value={filteredPolygons || polygons}
        layout="grid"
        itemTemplate={itemTemplate}
        paginator
        rows={6}
        header={dataViewHeader}
      />
    </div>
  );
};

export default PolygonsWithMapAndList;
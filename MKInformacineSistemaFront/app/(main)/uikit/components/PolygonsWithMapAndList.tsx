'use client';
import React, { useEffect, useRef, useState } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

interface Polygon {
  id: number;
  name: string;
  coordinatesJson: string;
}

class PolygonLabel extends google.maps.OverlayView {
  position: google.maps.LatLngLiteral;
  text: string;
  div: HTMLDivElement | null = null;

  constructor(position: google.maps.LatLngLiteral, text: string) {
    super();
    this.position = position;
    this.text = text;
  }

  onAdd() {
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.background = 'white';
    this.div.style.border = '1px solid #ccc';
    this.div.style.borderRadius = '4px';
    this.div.style.padding = '2px 6px';
    this.div.style.fontSize = '12px';
    this.div.style.fontWeight = 'bold';
    this.div.style.color = '#000';
    this.div.style.whiteSpace = 'nowrap';
    this.div.style.userSelect = 'none';
    this.div.innerText = this.text;
    const panes = this.getPanes();
    panes?.overlayLayer.appendChild(this.div);
  }

  draw() {
    if (!this.div) return;
    const projection = this.getProjection();
    const point = projection.fromLatLngToDivPixel(new google.maps.LatLng(this.position));
    if (point) {
      this.div.style.left = point.x + 'px';
      this.div.style.top = point.y + 'px';
    }
  }

  onRemove() {
    if (this.div) {
      this.div.remove();
      this.div = null;
    }
  }
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const initMap = async () => {
      const res = await fetch("https://localhost:7091/api/Polygons");
      const data: Polygon[] = await res.json();
      setPolygons(data);

      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        zoom: 6,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
      });

      const bounds = new google.maps.LatLngBounds();

      data.forEach((polygon) => {
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
          clickable: false, // make polygon non-clickable
        });
      
        const center = getPolygonCenter(coordinates);
      
        const label = new PolygonLabel(center, polygon.name);
label.setMap(map);
      
        coordinates.forEach(coord => bounds.extend(coord));
      });

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
    <div className="flex flex-column md:flex-row md:justify-content-between gap-2 mb-3">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText value={globalFilter} onChange={handleFilter} placeholder="Ieškoti pagal pavadinimą..." />
      </span>
    </div>
  );

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
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        map: map,
      });
    }, [data]);

    return (
      <div className="col-12 md:col-4">
        <div className="card p-3 h-full">
          <div className="font-bold text-lg mb-2">{data.name}</div>
          <div className="text-sm mb-2 text-gray-600">Taškų kiekis: {JSON.parse(data.coordinatesJson).length}</div>
          <div ref={mapContainerRef} style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
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

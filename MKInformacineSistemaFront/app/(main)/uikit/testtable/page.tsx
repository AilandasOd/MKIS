'use client';
import React, { useEffect, useRef } from 'react';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Polygon {
  id: number;
  name: string;
  coordinatesJson: string;
}

const AllPolygonsMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const initMap = async () => {
      const res = await fetch("https://localhost:7091/api/Polygons");
      const polygons: Polygon[] = await res.json();

      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        streetViewControl: false,
        zoom: 6,
        mapTypeId: google.maps.MapTypeId.HYBRID,
      });

      const bounds = new google.maps.LatLngBounds();

      polygons.forEach(polygon => {
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
          content: `<strong>${polygon.name}</strong>`,
          position: center,
        });

        gPolygon.addListener("click", () => {
          infoWindow.open(map);
        });

        coordinates.forEach(coord => bounds.extend(coord));
      });

      map.fitBounds(bounds);
    };

    // Attach global callback
    (window as any).initMap = initMap;

    if (!window.google || !window.google.maps) {
      loadGoogleMapsScript();
    } else {
      initMap();
    }
  }, []);

  const getPolygonCenter = (coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Medžioklės plotai</h2>
      <div ref={mapRef} style={{ height: '400px', width: '100%', borderRadius: '8px' }} />
    </div>
  );
};

export default AllPolygonsMap;

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card } from 'primereact/card';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
interface HuntingArea {
  id: number;
  name: string;
  coordinates: { lat: number; lng: number }[];
}

const ClubInfoWithHuntingAreas: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [huntingAreas, setHuntingAreas] = useState<HuntingArea[]>([]);
  const [loading, setLoading] = useState(true);

  const mockClubInfo = {
    name: "Šiaulių medžiotojų klubas",
    logoUrl: "/layout/images/Lmzd.png", // Updated to your local image
    membersCount: 3,
    description: "Tai seniausias Šiaulių medžiotojų klubas, įkurtas 1990 m.",
    createdAt: "1990-01-24T00:00:00",
  };

  const initMap = async () => {
    try {
      const response = await fetch("https://localhost:7091/api/HuntingAreas");
      const data = await response.json();
      setHuntingAreas(data);

      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        zoom: 6,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: false,
      });

      const bounds = new google.maps.LatLngBounds();

      data.forEach((area: any) => {
        const pathCoords = area.coordinates.map((c: any) => ({
          lat: parseFloat(c.lat ?? c.Lat),
          lng: parseFloat(c.lng ?? c.Lng),
        }));

        new google.maps.Polygon({
          paths: pathCoords,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.2,
          map: map,
        });

        pathCoords.forEach(coord => bounds.extend(coord));
      });

      map.fitBounds(bounds);
    } catch (error) {
      console.error("Failed to fetch hunting areas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve();
          return;
        }
  
        if (document.getElementById('google-maps-script')) {
          // Already loading
          (document.getElementById('google-maps-script') as any).onload = () => resolve();
          return;
        }
  
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };
  
    loadGoogleMapsScript()
      .then(() => {
        initMap();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps script', error);
        setLoading(false);
      });
  
    // Optional clean-up when unmounting
    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = ""; // Clear the map div
      }
    };
  }, []);
  

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <ProgressSpinner />
//       </div>
//     );
//   }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Klubo informacija</h2>

      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-6 w-8 h-8">
          <img
            src={mockClubInfo.logoUrl}
            alt="Club Logo"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <h3 className="text-xl font-bold mb-2">{mockClubInfo.name}</h3>
            <p><strong>Narių skaičius:</strong> {mockClubInfo.membersCount}</p>
            <p><strong>Klubas įkurtas:</strong> {new Date(mockClubInfo.createdAt).toLocaleDateString('lt-LT')}</p>
            <p><strong>Aprašas:</strong> {mockClubInfo.description}</p>
            <p>
            </p>
          </div>
        </div>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Medžioklės plotai</h2>
      <div ref={mapRef} style={{ width: "100%", height: "500px", borderRadius: "10px" }} className="mb-6" />
    </div>
  );
};

export default ClubInfoWithHuntingAreas;
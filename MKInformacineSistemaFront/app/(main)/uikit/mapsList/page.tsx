'use client';
import React, { useEffect, useRef, useState } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useClub } from '../../../../context/ClubContext';
import ClubGuard from '../../../../context/ClubGuard';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Polygon {
  id: number;
  name: string;
  coordinatesJson: string;
}

const MapsListPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [filteredPolygons, setFilteredPolygons] = useState<Polygon[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const { selectedClub } = useClub();
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polygonInstancesRef = useRef<google.maps.Polygon[]>([]);
  const huntingAreaLineRef = useRef<google.maps.Polyline | null>(null);

  // Calculate center point for a polygon
  const getPolygonCenter = (coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
    const bounds = new google.maps.LatLngBounds();
    coords.forEach(coord => bounds.extend(coord));
    const center = bounds.getCenter();
    return { lat: center.lat(), lng: center.lng() };
  };

  // Load Google Maps script
  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        return resolve();
      }

      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Cleanup function for map objects
  const cleanupMapObjects = () => {
    // Clear all polygon instances
    polygonInstancesRef.current.forEach(polygon => {
      if (polygon) polygon.setMap(null);
    });
    polygonInstancesRef.current = [];
    
    // Clear hunting area line
    if (huntingAreaLineRef.current) {
      huntingAreaLineRef.current.setMap(null);
      huntingAreaLineRef.current = null;
    }
  };

  // Initialize map and load data
  const initMap = async () => {
    if (!mapRef.current || !selectedClub) return;

    try {
      // Clean up existing objects
      cleanupMapObjects();
      
      // Create map if not exists
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 56.10857764750518, lng: 23.349903007765427 },
          zoom: 7,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          streetViewControl: false,
        });
      }
      
      const map = mapInstanceRef.current;
      const bounds = new google.maps.LatLngBounds();
      let hasVisibleElements = false;

      // 1. Fetch and display polygons
      try {
        const polygonRes = await fetch(`https://localhost:7091/api/Polygons?clubId=${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });

        if (polygonRes.ok) {
          const data = await polygonRes.json();
          setPolygons(data);
          
          // Create polygon instances for the main map
          data.forEach((polygon: Polygon) => {
            try {
              // Parse coordinates
              let coordinates: google.maps.LatLngLiteral[] = [];
              const rawCoords = typeof polygon.coordinatesJson === 'string'
                ? JSON.parse(polygon.coordinatesJson)
                : polygon.coordinatesJson;
                
              coordinates = rawCoords.map((c: any) => ({
                lat: parseFloat(c.lat ?? c.Lat),
                lng: parseFloat(c.lng ?? c.Lng),
              }));
              
              // Create polygon
              const polygonInstance = new google.maps.Polygon({
                paths: coordinates,
                strokeColor: '#008000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#008000',
                fillOpacity: 0.35,
                map: map,
              });
              
              // Add to reference for cleanup
              polygonInstancesRef.current.push(polygonInstance);
              
              // Create info window
              const center = getPolygonCenter(coordinates);
              const infoWindow = new google.maps.InfoWindow({
                content: `<div style="color: black;"><strong>${polygon.name}</strong></div>`,
                position: center,
              });
              
              // Add click event
              polygonInstance.addListener("click", () => {
                infoWindow.open(map);
              });
              
              // Extend bounds
              coordinates.forEach(coord => bounds.extend(coord));
              hasVisibleElements = true;
            } catch (err) {
              console.error("Error creating polygon:", err);
            }
          });
        }
      } catch (err) {
        console.error("Error fetching polygons:", err);
      }
      
      // 2. Fetch and display hunting area boundary
      try {
        const huntingRes = await fetch(`https://localhost:7091/api/HuntingAreas?clubId=${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });
        
        if (huntingRes.ok) {
          const data = await huntingRes.json();
          
          if (data && data.length > 0) {
            const area = data[0];
            
            // Parse coordinates
            let pathCoords: google.maps.LatLng[] = [];
            try {
              const rawCoords = typeof area.coordinatesJson === 'string'
                ? JSON.parse(area.coordinatesJson)
                : typeof area.coordinates !== 'undefined'
                  ? area.coordinates
                  : null;
                  
              if (rawCoords) {
                pathCoords = rawCoords.map((c: any) => {
                  const lat = parseFloat(c.lat ?? c.Lat);
                  const lng = parseFloat(c.lng ?? c.Lng);
                  return new google.maps.LatLng(lat, lng);
                });
              }
            } catch (err) {
              console.warn("Error parsing hunting area coordinates:", err);
            }
            
            if (pathCoords.length > 0) {
              // Create polyline
              huntingAreaLineRef.current = new google.maps.Polyline({
                path: pathCoords,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: map,
              });
              
              // Extend bounds
              pathCoords.forEach(coord => bounds.extend(coord));
              hasVisibleElements = true;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching hunting area:", err);
      }
      
      // Fit map to bounds if we have elements
      if (hasVisibleElements) {
        map.fitBounds(bounds);
      }
    } catch (err) {
      console.error("Error initializing map:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to initialize map',
        life: 3000
      });
    }
  };

  // Load data when component mounts or club changes
  useEffect(() => {
    const init = async () => {
      if (!selectedClub) return;
      
      setLoading(true);
      
      try {
        // Load Google Maps
        await loadGoogleMapsScript();
        
        // Init map and load data
        await initMap();
      } catch (err) {
        console.error("Error in initialization:", err);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load map',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      cleanupMapObjects();
    };
  }, [selectedClub]);

  // Filter polygons when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPolygons(null);
    } else {
      const filtered = polygons.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPolygons(filtered);
    }
  }, [searchTerm, polygons]);

  // Handle "Edit" button click
  const handleEditPolygon = (id: number) => {
    router.push(`/uikit/mapsEdit/${id}`);
  };

  // Create map instance for individual card
  const createMiniMap = (polygon: Polygon, containerRef: HTMLDivElement) => {
    if (!containerRef || !window.google || !window.google.maps) return;
    
    try {
      // Parse coordinates
      let coordinates: google.maps.LatLngLiteral[] = [];
      const rawCoords = typeof polygon.coordinatesJson === 'string'
        ? JSON.parse(polygon.coordinatesJson)
        : polygon.coordinatesJson;
        
      coordinates = rawCoords.map((c: any) => ({
        lat: parseFloat(c.lat ?? c.Lat),
        lng: parseFloat(c.lng ?? c.Lng),
      }));
      
      if (coordinates.length === 0) return;
      
      // Create mini map
      const miniMap = new google.maps.Map(containerRef, {
        center: coordinates[0],
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        disableDefaultUI: true,
      });
      
      // Create polygon on mini map
      const polygonInstance = new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#008000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#008000',
        fillOpacity: 0.3,
        map: miniMap,
      });
      
      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      miniMap.fitBounds(bounds);
    } catch (err) {
      console.error("Error creating mini map:", err);
    }
  };

  // Item template for DataView
  const itemTemplate = (polygon: Polygon) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (mapContainerRef.current) {
        createMiniMap(polygon, mapContainerRef.current);
      }
    }, [polygon]);
    
    return (
      <div className="col-12 md:col-4 p-2">
        <div className="card p-3 h-full">
          <div className="font-bold text-lg mb-2">{polygon.name}</div>
          <div 
            ref={mapContainerRef} 
            style={{ width: '100%', height: '200px', borderRadius: '8px' }} 
            className="mb-3"
          />
          <Button
            label="Redaguoti"
            icon="pi pi-pencil"
            onClick={() => handleEditPolygon(polygon.id)}
          />
        </div>
      </div>
    );
  };

  // DataView header with search
  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between gap-2">
      <span className="p-input-icon-left w-full md:w-auto">
        <i className="pi pi-search" />
        <InputText 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Ieškoti pagal pavadinimą..." 
          className="w-full"
        />
      </span>
      <Button
        label="Sukurti naują plotą"
        icon="pi pi-plus"
        onClick={() => router.push('/uikit/mapsCreate')}
      />
    </div>
  );

  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        <h2 className="text-2xl font-bold mb-4">Medžioklės plotai</h2>
        
        {selectedClub ? (
          <>
            <div 
              ref={mapRef} 
              style={{ height: '400px', width: '100%', borderRadius: '8px' }} 
              className="mb-4" 
            />
            
            <DataView
              value={filteredPolygons || polygons}
              layout="grid"
              itemTemplate={itemTemplate}
              paginator
              rows={6}
              header={header}
              emptyMessage="Nerasta medžioklės plotų. Sukurkite naują plotą paspaudę mygtuką viršuje."
            />
          </>
        ) : (
          <div className="p-5 text-center">
            <i className="pi pi-exclamation-circle text-3xl text-yellow-500 mb-3"></i>
            <p className="text-xl">Prašome pasirinkti klubą, kad galėtumėte peržiūrėti medžioklės plotus.</p>
          </div>
        )}
      </div>
    </ClubGuard>
  );
};

export default MapsListPage;
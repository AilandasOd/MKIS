'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';

interface Member {
  id: number;
  name: string;
}

interface AnimalHunted {
  animal: string;
  count: number;
}

interface MemberHuntData extends Member {
  hunted: AnimalHunted[];
  shotsTaken: number;
  shotsHit: number;
}

interface Area {
  id: number;
  name: string;
  coordinatesJson: string;
}

interface HuntDetails {
  id: number;
  leader: string;
  date: string;
  members: Member[];
  areas: Area[];
}

const DrivenHuntDetailsPage: React.FC = () => {
  const { huntId } = useParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const [hunt, setHunt] = useState<HuntDetails | null>(null);
  const [memberData, setMemberData] = useState<MemberHuntData[]>([]);
  const [animals, setAnimals] = useState<string[]>(['Elnias', 'Šernas', 'Lapė', 'Triušis']);

  useEffect(() => {
    async function fetchPolygons() {
      const response = await fetch("https://localhost:7091/api/Polygons");
      const polygonData: Area[] = await response.json();

      const mockHunt: HuntDetails = {
        id: Number(huntId),
        leader: 'Tomas Tomauskas',
        date: new Date().toISOString(),
        members: [
          { id: 1, name: 'Rimas' },
          { id: 2, name: 'Tomas' },
        ],
        areas: polygonData.slice(0, 4),
      };

      setHunt(mockHunt);
      setMemberData(mockHunt.members.map((m: Member) => ({ ...m, hunted: [], shotsTaken: 0, shotsHit: 0 })));
    }

    fetchPolygons();
  }, [huntId]);

  useEffect(() => {
    if (hunt && mapRef.current && window.google) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 56.10857764750518, lng: 23.349903007765427 },
        zoom: 7,
        mapTypeId: google.maps.MapTypeId.HYBRID,
      });

      const bounds = new google.maps.LatLngBounds();

      hunt.areas.forEach(area => {
        const coordinates = JSON.parse(area.coordinatesJson).map((c: any) => ({
          lat: parseFloat(c.lat ?? c.Lat),
          lng: parseFloat(c.lng ?? c.Lng),
        }));

        new google.maps.Polygon({
          paths: coordinates,
          strokeColor: '#008000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#008000',
          fillOpacity: 0.35,
          map,
        });

        coordinates.forEach(coord => bounds.extend(coord));
      });

      map.fitBounds(bounds);
    }
  }, [hunt]);

  const addAnimal = (memberId: number, animal: string) => {
    setMemberData(prev => prev.map(m => {
      if (m.id === memberId) {
        const existing = m.hunted.find(h => h.animal === animal);
        if (existing) {
          existing.count++;
        } else {
          m.hunted.push({ animal, count: 1 });
        }
      }
      return { ...m };
    }));
  };

  const totalAnimalsHunted = memberData.flatMap(m => m.hunted).reduce((acc, curr) => acc + curr.count, 0);
  const totalShotsTaken = memberData.reduce((acc, m) => acc + m.shotsTaken, 0);
  const totalShotsHit = memberData.reduce((acc, m) => acc + m.shotsHit, 0);

  if (!hunt) return <div>Įkeliama...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Varyminės medžioklės informacija</h2>
      <div className="mb-4">
        <p><strong>Vadovas:</strong> {hunt.leader}</p>
        <p><strong>Data:</strong> {new Date(hunt.date).toLocaleDateString()}</p>
        <p><strong>Dalyvavę nariai:</strong> {hunt.members.length}</p>
        <p><strong>Iš viso sumedžiota gyvūnų:</strong> {totalAnimalsHunted}</p>
        <p><strong>Iššauta kartų:</strong> {totalShotsTaken}</p>
        <p><strong>Taiklūs šūviai:</strong> {totalShotsHit}</p>
      </div>

      <div ref={mapRef} style={{ height: '400px', width: '100%', borderRadius: '8px' }} className="mb-4" />

      <h3 className="text-xl font-bold mb-2">Nariai ir jų rezultatai</h3>
      <DataTable value={memberData} className="mb-4">
        <Column field="name" header="Narys" />
        <Column
          header="Sumedžioti gyvūnai"
          body={(rowData: MemberHuntData) => (
            <div>
              {rowData.hunted.map(h => (<div key={h.animal}>{h.animal}: {h.count}</div>))}
            </div>
          )}
        />
        <Column
          header="Pridėti gyvūną"
          body={(rowData: MemberHuntData) => (
            <Dropdown
              options={animals}
              placeholder="Pasirinkti gyvūną"
              onChange={(e) => addAnimal(rowData.id, e.value)}
            />
          )}
        />
        <Column
          header="Iššauta kartų"
          body={(rowData: MemberHuntData) => (
            <InputNumber
              value={rowData.shotsTaken}
              onValueChange={(e) => setMemberData(prev => prev.map(m => m.id === rowData.id ? { ...m, shotsTaken: e.value || 0, shotsHit: Math.min(m.shotsHit, e.value || 0) } : m))}
              showButtons
              min={0}
            />
          )}
        />
        <Column
          header="Taiklūs šūviai"
          body={(rowData: MemberHuntData) => (
            <InputNumber
              value={rowData.shotsHit}
              onValueChange={(e) => setMemberData(prev => prev.map(m => m.id === rowData.id ? { ...m, shotsHit: Math.min(e.value || 0, m.shotsTaken) } : m))}
              showButtons
              min={0}
              max={rowData.shotsTaken}
            />
          )}
        />
      </DataTable>
    </div>
  );
};

export default DrivenHuntDetailsPage;

'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { useApiClient } from '../../../../../utils/apiClient';
import { format, parseISO } from 'date-fns';
import ClubGuard from '../../../../../context/ClubGuard';

interface DrivenHunt {
  id: number;
  name: string;
  location: string;
  date: string;
  game: string;
  leaderId: string;
  leaderName: string;
  isCompleted: boolean;
  completedDate?: string;
  participants: DrivenHuntParticipant[];
}

interface DrivenHuntParticipant {
  id: number;
  userId: string;
  userName: string;
  shotsTaken: number;
  shotsHit: number;
  huntedAnimals: HuntedAnimal[];
}

interface HuntedAnimal {
  id: number;
  animalType: string;
  count: number;
}

interface AnimalSummary {
  animalType: string;
  count: number;
}

const DrivenHuntDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { fetchWithClub, selectedClub } = useApiClient();
  const [hunt, setHunt] = useState<DrivenHunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [animalSummary, setAnimalSummary] = useState<AnimalSummary[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<DrivenHuntParticipant | null>(null);
  const [participantDialog, setParticipantDialog] = useState(false);
  const toast = useRef<Toast>(null);
  const hasFetchedRef = useRef(false);

  const getHuntStatus = () => {
    if (!hunt) return '';
    const huntDate = new Date(hunt.date);
    const today = new Date();
    if (hunt.isCompleted) return 'Įvykusi';
    if (huntDate.toDateString() === today.toDateString()) return 'Šiandien';
    if (huntDate > today) return 'Artėjanti';
    return 'Praėjusi';
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'Įvykusi': return 'success';
      case 'Šiandien': return 'warning';
      case 'Artėjanti': return 'info';
      case 'Praėjusi': return 'danger';
      default: return 'info';
    }
  };

  useEffect(() => {
    if (!id || !selectedClub || hasFetchedRef.current) return;
    const fetchHuntDetails = async () => {
      try {
        setLoading(true);
        const data = await fetchWithClub(`DrivenHunts/${id}`);
        setHunt(data);
        summarizeAnimals(data.participants);
        hasFetchedRef.current = true;
      } catch (error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Klaida',
          detail: 'Nepavyko įkelti medžioklės duomenų',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHuntDetails();
  }, [id, selectedClub, fetchWithClub]);

  const summarizeAnimals = (participants: DrivenHuntParticipant[]) => {
    const map = new Map<string, number>();
    participants.forEach(p => {
      p.huntedAnimals.forEach(a => {
        map.set(a.animalType, (map.get(a.animalType) || 0) + a.count);
      });
    });
    const summary: AnimalSummary[] = [];
    map.forEach((count, type) => summary.push({ animalType: type, count }));
    setAnimalSummary(summary);
  };

  const calculateAccuracy = (shotsTaken: number, shotsHit: number) => {
    return shotsTaken === 0 ? 0 : Math.round((shotsHit / shotsTaken) * 100);
  };

  const viewParticipantDetails = (participant: DrivenHuntParticipant) => {
    setSelectedParticipant(participant);
    setParticipantDialog(true);
  };

  const handleBackToList = () => {
    router.push('/drivenhunts/list');
  };

  if (loading) {
    return <div className="flex justify-content-center align-items-center min-h-screen"><i className="pi pi-spin pi-spinner text-3xl"></i></div>;
  }

  if (!hunt) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <Card className="p-4 text-center">
          <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl mb-3"></i>
          <h3 className="text-xl font-semibold">Medžioklė nerasta</h3>
          <p className="mb-4">Varyminė medžioklė nerasta arba neturite prieigos</p>
          <Button label="Grįžti į sąrašą" icon="pi pi-arrow-left" onClick={handleBackToList} />
        </Card>
      </div>
    );
  }

  const status = getHuntStatus();

  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        <div className="flex flex-column md:flex-row align-items-center md:align-items-start justify-content-between mb-4">
          <div>
            <Button icon="pi pi-arrow-left" className="p-button-text mb-3" onClick={handleBackToList} label="Grįžti į sąrašą" />
            <h2 className="text-3xl font-bold m-0">{hunt.name}</h2>
          </div>
          <div className="flex gap-2 align-items-center">
            <Tag value={status} severity={getStatusSeverity(status)} className="text-lg px-3 py-2" />
            <Button icon="pi pi-pencil" label="Redaguoti" onClick={() => router.push(`/drivenhunts/edit/${hunt.id}`)} className="ml-2" />
          </div>
        </div>

        <div className="grid">
          <div className="col-12 lg:col-4">
            <Card className="h-full">
              <h3 className="text-xl font-semibold mb-3">Informacija apie medžioklę</h3>
              <Divider />
              <div className="flex flex-column gap-3">
                <div><div className="text-500 mb-1">Vieta</div><div className="font-medium">{hunt.location}</div></div>
                <div><div className="text-500 mb-1">Data</div><div className="font-medium">{format(parseISO(hunt.date), 'yyyy-MM-dd')}</div></div>
                <div><div className="text-500 mb-1">Žvėrys</div><div className="font-medium">{hunt.game || 'Nenurodyta'}</div></div>
                <div><div className="text-500 mb-1">Vadovas</div><div className="font-medium">{hunt.leaderName}</div></div>
                {hunt.isCompleted && hunt.completedDate && <div><div className="text-500 mb-1">Užbaigta</div><div className="font-medium">{format(parseISO(hunt.completedDate), 'yyyy-MM-dd')}</div></div>}
                <div><div className="text-500 mb-1">Dalyviai</div><div className="font-medium">{hunt.participants.length}</div></div>
              </div>
            </Card>
          </div>

          <div className="col-12 lg:col-8">
            <Card>
              <h3 className="text-xl font-semibold mb-3">Dalyviai</h3>
              <DataTable value={hunt.participants} paginator rows={5} rowsPerPageOptions={[5, 10, 25]} emptyMessage="Dalyvių nerasta" sortField="userName" sortOrder={1} dataKey="id" rowHover stripedRows>
                <Column field="userName" header="Vardas" sortable />
                <Column field="shotsTaken" header="Šūviai" sortable style={{ width: '120px' }} />
                <Column field="shotsHit" header="Pataikymai" sortable style={{ width: '120px' }} />
                <Column header="Tikslumas" body={(rowData) => (
                  <div className="flex align-items-center">
                    <ProgressBar value={calculateAccuracy(rowData.shotsTaken, rowData.shotsHit)} showValue={false} style={{ width: '80px', height: '8px' }} className="mr-2" />
                    <span>{calculateAccuracy(rowData.shotsTaken, rowData.shotsHit)}%</span>
                  </div>
                )} sortable sortField="shotsHit" style={{ width: '150px' }} />
                <Column header="Žvėrys" body={(rowData) => (
                  <Tag value={rowData.huntedAnimals.reduce((sum, animal) => sum + animal.count, 0)} severity={rowData.huntedAnimals.length > 0 ? 'success' : 'info'} />
                )} style={{ width: '120px' }} />
                <Column body={(rowData) => (
                  <Button icon="pi pi-eye" className="p-button-rounded p-button-text" onClick={() => viewParticipantDetails(rowData)} tooltip="Peržiūrėti" />
                )} style={{ width: '5rem' }} />
              </DataTable>
            </Card>
          </div>

          <div className="col-12">
            <Card>
              <h3 className="text-xl font-semibold mb-3">Sumedžiotų žvėrių suvestinė</h3>
              {animalSummary.length > 0 ? (
                <DataTable value={animalSummary} paginator rows={5} rowsPerPageOptions={[5, 10, 25]} sortField="count" sortOrder={-1}>
                  <Column field="animalType" header="Žvėries tipas" sortable style={{ width: '70%' }} />
                  <Column field="count" header="Kiekis" sortable style={{ width: '30%' }} />
                </DataTable>
              ) : (
                <div className="text-center p-5">
                  <i className="pi pi-info-circle text-3xl text-blue-300 mb-3"></i>
                  <p>Šios medžioklės metu žvėrių nesumedžiota.</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        <Dialog visible={participantDialog} onHide={() => setParticipantDialog(false)} header={selectedParticipant?.userName || 'Dalyvio informacija'} style={{ width: '50vw' }} breakpoints={{ '960px': '75vw', '640px': '90vw' }} modal dismissableMask>
          {selectedParticipant && (
            <div>
              <div className="grid">
                <div className="col-12 md:col-6 mb-4">
                  <h4 className="text-lg font-semibold mb-3">Šaudymo statistika</h4>
                  <div className="grid">
                    <div className="col-6"><div className="text-500 mb-1">Šūviai</div><div className="font-medium text-xl">{selectedParticipant.shotsTaken}</div></div>
                    <div className="col-6"><div className="text-500 mb-1">Pataikymai</div><div className="font-medium text-xl">{selectedParticipant.shotsHit}</div></div>
                    <div className="col-12 mt-3">
                      <div className="text-500 mb-1">Tikslumas</div>
                      <ProgressBar value={calculateAccuracy(selectedParticipant.shotsTaken, selectedParticipant.shotsHit)} showValue className="mt-1" />
                    </div>
                  </div>
                </div>
                <div className="col-12 md:col-6 mb-4">
                  <h4 className="text-lg font-semibold mb-3">Sumedžioti žvėrys</h4>
                  {selectedParticipant.huntedAnimals.length > 0 ? (
                    <ul className="list-none p-0 m-0">
                      {selectedParticipant.huntedAnimals.map((animal, idx) => (
                        <li key={idx} className="flex justify-content-between align-items-center border-bottom-1 border-300 py-2">
                          <span className="font-medium">{animal.animalType}</span>
                          <Tag value={animal.count} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center">Žvėrių nesumedžiota</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </ClubGuard>
  );
};

export default DrivenHuntDetailsPage;

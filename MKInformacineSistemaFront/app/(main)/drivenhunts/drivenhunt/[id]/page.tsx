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

// Type definitions based on your backend DTOs
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
  
  // Add a ref to track if we've already fetched data
  const hasFetchedRef = useRef(false);

  // Calculate hunt status based on date and completion state
  const getHuntStatus = () => {
    if (!hunt) return '';
    
    const huntDate = new Date(hunt.date);
    const today = new Date();
    
    if (hunt.isCompleted) return 'Completed';
    if (huntDate.toDateString() === today.toDateString()) return 'Today';
    if (huntDate > today) return 'Upcoming';
    return 'Past';
  };
  
  // Get severity for the status tag
  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Today': return 'warning';
      case 'Upcoming': return 'info';
      case 'Past': return 'danger';
      default: return 'info';
    }
  };

  // Fetch hunt details on component mount
  useEffect(() => {
    // Only fetch if we haven't already AND we have the necessary data
    if (!id || !selectedClub || hasFetchedRef.current) return;
    
    const fetchHuntDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching hunt details for ID: ${id}`);
        const data = await fetchWithClub(`DrivenHunts/${id}`);
        setHunt(data);
        
        // Calculate animal summary
        summarizeAnimals(data.participants);
        
        // Mark that we've successfully fetched data
        hasFetchedRef.current = true;
      } catch (error) {
        console.error('Error fetching hunt details:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load hunt details',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchHuntDetails();
  }, [id, selectedClub, fetchWithClub]); // Keep these dependencies
  
  // Calculate a summary of hunted animals
  const summarizeAnimals = (participants: DrivenHuntParticipant[]) => {
    if (!participants) return;
    
    // Create a map to count animals by type
    const animalCountMap = new Map<string, number>();
    
    participants.forEach(participant => {
      participant.huntedAnimals.forEach(animal => {
        const currentCount = animalCountMap.get(animal.animalType) || 0;
        animalCountMap.set(animal.animalType, currentCount + animal.count);
      });
    });
    
    // Convert map to array for display
    const summary: AnimalSummary[] = [];
    animalCountMap.forEach((count, animalType) => {
      summary.push({ animalType, count });
    });
    
    setAnimalSummary(summary);
  };
  
  // Calculate accuracy percentage
  const calculateAccuracy = (shotsTaken: number, shotsHit: number) => {
    if (shotsTaken === 0) return 0;
    return Math.round((shotsHit / shotsTaken) * 100);
  };
  
  // View participant details
  const viewParticipantDetails = (participant: DrivenHuntParticipant) => {
    setSelectedParticipant(participant);
    setParticipantDialog(true);
  };
  
  // Back to list button handler
  const handleBackToList = () => {
    router.push('/drivenhunts/list');
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center min-h-screen">
        <i className="pi pi-spin pi-spinner text-3xl"></i>
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <Card className="p-4 text-center">
          <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl mb-3"></i>
          <h3 className="text-xl font-semibold">Hunt Not Found</h3>
          <p className="mb-4">The driven hunt you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button label="Back to Hunts List" icon="pi pi-arrow-left" onClick={handleBackToList} />
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
    <Button icon="pi pi-arrow-left" className="p-button-text mb-3" onClick={handleBackToList} label="Back to List" />
    <h2 className="text-3xl font-bold m-0">{hunt.name}</h2>
  </div>
  <div className="flex gap-2 align-items-center">
    <Tag 
      value={status} 
      severity={getStatusSeverity(status)} 
      className="text-lg px-3 py-2"
    />
    <Button 
      icon="pi pi-pencil" 
      label="Edit Hunt" 
      onClick={() => router.push(`/drivenhunts/edit/${hunt.id}`)} 
      className="ml-2"
    />
  </div>
</div>
        
        <div className="grid">
          {/* Hunt Details Card */}
          <div className="col-12 lg:col-4">
            <Card className="h-full">
              <h3 className="text-xl font-semibold mb-3">Hunt Details</h3>
              <Divider />
              
              <div className="flex flex-column gap-3">
                <div>
                  <div className="text-500 mb-1">Location</div>
                  <div className="font-medium">{hunt.location}</div>
                </div>
                
                <div>
                  <div className="text-500 mb-1">Date</div>
                  <div className="font-medium">{format(parseISO(hunt.date), 'yyyy-MM-dd')}</div>
                </div>
                
                <div>
                  <div className="text-500 mb-1">Game</div>
                  <div className="font-medium">{hunt.game || 'Not specified'}</div>
                </div>
                
                <div>
                  <div className="text-500 mb-1">Leader</div>
                  <div className="font-medium">{hunt.leaderName}</div>
                </div>
                
                {hunt.isCompleted && hunt.completedDate && (
                  <div>
                    <div className="text-500 mb-1">Completed On</div>
                    <div className="font-medium">{format(parseISO(hunt.completedDate), 'yyyy-MM-dd')}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-500 mb-1">Total Participants</div>
                  <div className="font-medium">{hunt.participants.length}</div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Participants Card */}
          <div className="col-12 lg:col-8">
            <Card>
              <h3 className="text-xl font-semibold mb-3">Participants</h3>
              
              <DataTable 
                value={hunt.participants} 
                paginator 
                rows={5} 
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No participants found"
                sortField="userName"
                sortOrder={1}
                dataKey="id"
                rowHover
                stripedRows
              >
                <Column field="userName" header="Name" sortable />
                <Column field="shotsTaken" header="Shots Taken" sortable style={{ width: '120px' }} />
                <Column field="shotsHit" header="Shots Hit" sortable style={{ width: '120px' }} />
                <Column 
                  header="Accuracy" 
                  body={(rowData) => (
                    <div className="flex align-items-center">
                      <ProgressBar 
                        value={calculateAccuracy(rowData.shotsTaken, rowData.shotsHit)} 
                        showValue={false} 
                        style={{ width: '80px', height: '8px' }} 
                        className="mr-2"
                      />
                      <span>{calculateAccuracy(rowData.shotsTaken, rowData.shotsHit)}%</span>
                    </div>
                  )}
                  sortable
                  sortField="shotsHit"
                  style={{ width: '150px' }}
                />
                <Column 
                  header="Animals" 
                  body={(rowData) => (
                    <Tag 
                      value={rowData.huntedAnimals.reduce((sum, animal) => sum + animal.count, 0)} 
                      severity={rowData.huntedAnimals.length > 0 ? 'success' : 'info'}
                    />
                  )}
                  style={{ width: '120px' }}
                />
                <Column 
                  body={(rowData) => (
                    <Button 
                      icon="pi pi-eye" 
                      className="p-button-rounded p-button-text" 
                      onClick={() => viewParticipantDetails(rowData)}
                      tooltip="View Details"
                    />
                  )} 
                  style={{ width: '5rem' }}
                />
              </DataTable>
            </Card>
          </div>
          
          {/* Hunted Animals Summary Card */}
          <div className="col-12">
            <Card>
              <h3 className="text-xl font-semibold mb-3">Hunted Animals Summary</h3>
              
              {animalSummary.length > 0 ? (
                <DataTable 
                  value={animalSummary} 
                  paginator 
                  rows={5} 
                  rowsPerPageOptions={[5, 10, 25]} 
                  sortField="count"
                  sortOrder={-1}
                >
                  <Column field="animalType" header="Animal Type" sortable style={{ width: '70%' }} />
                  <Column field="count" header="Count" sortable style={{ width: '30%' }} />
                </DataTable>
              ) : (
                <div className="text-center p-5">
                  <i className="pi pi-info-circle text-3xl text-blue-300 mb-3"></i>
                  <p>No animals were hunted during this driven hunt.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
        
        {/* Participant Details Dialog */}
        <Dialog 
          visible={participantDialog} 
          onHide={() => setParticipantDialog(false)} 
          header={selectedParticipant?.userName || 'Participant Details'}
          style={{ width: '50vw' }}
          breakpoints={{ '960px': '75vw', '640px': '90vw' }}
          modal
          dismissableMask
        >
          {selectedParticipant && (
            <div>
              <div className="grid">
                <div className="col-12 md:col-6 mb-4">
                  <h4 className="text-lg font-semibold mb-3">Shooting Statistics</h4>
                  <div className="grid">
                    <div className="col-6">
                      <div className="text-500 mb-1">Shots Taken</div>
                      <div className="font-medium text-xl">{selectedParticipant.shotsTaken}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-500 mb-1">Shots Hit</div>
                      <div className="font-medium text-xl">{selectedParticipant.shotsHit}</div>
                    </div>
                    <div className="col-12 mt-3">
                      <div className="text-500 mb-1">Accuracy</div>
                      <ProgressBar 
                        value={calculateAccuracy(selectedParticipant.shotsTaken, selectedParticipant.shotsHit)}
                        showValue 
                        className="mt-1" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="col-12 md:col-6 mb-4">
                  <h4 className="text-lg font-semibold mb-3">Hunted Animals</h4>
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
                    <p className="text-center">No animals hunted</p>
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
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { useApiClient } from '../../../../../utils/apiClient';
import ClubGuard from '../../../../../context/ClubGuard';
import { format, parseISO } from 'date-fns';

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

interface Member {
  id: string;
  name: string;
  status: string;
  userId: string;
}

interface UpdateShotsDto {
  participantId: number;
  shotsTaken: number;
  shotsHit: number;
}

interface AddAnimalDto {
  participantId: number;
  animalType: string;
}

const DrivenHuntEdit = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { fetchWithClub, selectedClub } = useApiClient();
  
  const [hunt, setHunt] = useState<DrivenHunt | null>(null);
  const [editedHunt, setEditedHunt] = useState({
    name: '',
    location: '',
    date: null as Date | null,
    game: '',
    leaderId: '',
    isCompleted: false
  });
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<DrivenHuntParticipant | null>(null);
  const [editShotsDialog, setEditShotsDialog] = useState(false);
  const [shots, setShots] = useState({ shotsTaken: 0, shotsHit: 0 });
  const [addAnimalDialog, setAddAnimalDialog] = useState(false);
  const [animalType, setAnimalType] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  
  const toast = useRef<Toast>(null);
  const hasFetchedRef = useRef(false);
  
  // Common game types
  const gameTypes = [
    { label: 'Šernai', value: 'Šernai' },
    { label: 'Elniai', value: 'Elniai' },
    { label: 'Stirnos', value: 'Stirnos' },
    { label: 'Lapės', value: 'Lapės' },
    { label: 'Šernai, stirnos', value: 'Šernai, stirnos' },
    { label: 'Stirnos, lapės', value: 'Stirnos, lapės' },
    { label: 'Šernai, stirnos, lapės', value: 'Šernai, stirnos, lapės' },
    { label: 'Įvairūs žvėrys', value: 'Įvairūs žvėrys' }
  ];
  
  // Common animal types for adding animals
  const animalTypes = [
    { label: 'Šernas', value: 'Šernas' },
    { label: 'Briedis', value: 'Briedis' },
    { label: 'Stirna', value: 'Stirna' },
    { label: 'Lapė', value: 'Lapė' },
    { label: 'Danielius', value: 'Danielius' },
    { label: 'Taurusis elnias', value: 'Taurusis elnias' },
    { label: 'Pilkasis kiškis', value: 'Pilkasis kiškis' },
    { label: 'Mangutas', value: 'Mangutas' }
  ];
  
  // Fetch hunt details and members
  useEffect(() => {
    if (hasFetchedRef.current || !id || !selectedClub) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch hunt details
        const huntData = await fetchWithClub(`DrivenHunts/${id}`);
        setHunt(huntData);
        
        // Set initial values for the edit form
        setEditedHunt({
          name: huntData.name,
          location: huntData.location,
          date: new Date(huntData.date),
          game: huntData.game,
          leaderId: huntData.leaderId,
          isCompleted: huntData.isCompleted
        });
        
        // Fetch members for the leader dropdown
        const membersData = await fetchWithClub('Members');
        setMembers(membersData);
        
        // Mark that we've fetched the data
        hasFetchedRef.current = true;
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Nepavyko užkrauti duomenų',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, selectedClub, fetchWithClub]);
  
  // Update hunt general information
  const handleSaveGeneralInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Basic validation
    if (!editedHunt.name || !editedHunt.location || !editedHunt.date || !editedHunt.leaderId) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Prašome užpildyti visus privalomus laukus',
        life: 3000
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare payload
      const payload = {
        id: parseInt(id as string),
        name: editedHunt.name,
        location: editedHunt.location,
        date: editedHunt.date,
        game: editedHunt.game,
        leaderId: editedHunt.leaderId,
        isCompleted: editedHunt.isCompleted
      };
      
      // Submit the form data
      const response = await fetch(`https://localhost:7091/api/DrivenHunts/${id}?clubId=${selectedClub?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with status ${response.status}`);
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Medžioklė sėkmingai atnaujinta',
        life: 3000
      });
      
      // If completing the hunt, update the completedDate in the UI
      if (editedHunt.isCompleted && !hunt?.isCompleted) {
        setHunt(prev => prev ? {...prev, isCompleted: true, completedDate: new Date().toISOString()} : null);
      }
      
      // Refresh hunt data to get the latest changes
      const updatedHunt = await fetchWithClub(`DrivenHunts/${id}`);
      setHunt(updatedHunt);
      
    } catch (error) {
      console.error('Error updating hunt:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Nepavyko atnaujinti medžioklės',
        life: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Update participant shots
  const handleUpdateShots = async () => {
    if (!selectedParticipant) return;
    
    try {
      const payload: UpdateShotsDto = {
        participantId: selectedParticipant.id,
        shotsTaken: shots.shotsTaken,
        shotsHit: shots.shotsHit
      };
      
      // Validate that shots hit is not greater than shots taken
      if (shots.shotsHit > shots.shotsTaken) {
        toast.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Šūvių pataikymų skaičius negali būti didesnis už šūvių skaičių',
          life: 3000
        });
        return;
      }
      
      const response = await fetch(
        `https://localhost:7091/api/DrivenHunts/${id}/participants/${selectedParticipant.id}/shots?clubId=${selectedClub?.id}`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with status ${response.status}`);
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Šūvių informacija sėkmingai atnaujinta',
        life: 3000
      });
      
      // Update the participant in the local state
      setHunt(prev => {
        if (!prev) return null;
        
        const updatedParticipants = prev.participants.map(p => 
          p.id === selectedParticipant.id 
            ? {...p, shotsTaken: shots.shotsTaken, shotsHit: shots.shotsHit} 
            : p
        );
        
        return {...prev, participants: updatedParticipants};
      });
      
      // Close the dialog
      setEditShotsDialog(false);
      
    } catch (error) {
      console.error('Error updating shots:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Nepavyko atnaujinti šūvių informacijos',
        life: 3000
      });
    }
  };
  
  // Add hunted animal
  const handleAddAnimal = async () => {
    if (!selectedParticipant || !animalType) return;
    
    try {
      const payload: AddAnimalDto = {
        participantId: selectedParticipant.id,
        animalType: animalType
      };
      
      const response = await fetch(
        `https://localhost:7091/api/DrivenHunts/${id}/participants/${selectedParticipant.id}/animals?clubId=${selectedClub?.id}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with status ${response.status}`);
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Žvėris sėkmingai pridėtas',
        life: 3000
      });
      
      // Refresh hunt data to get the updated animals
      const updatedHunt = await fetchWithClub(`DrivenHunts/${id}`);
      setHunt(updatedHunt);
      
      // Close the dialog
      setAddAnimalDialog(false);
      setAnimalType('');
      
    } catch (error) {
      console.error('Error adding animal:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Nepavyko pridėti žvėries',
        life: 3000
      });
    }
  };
  
  // Open edit shots dialog
  const openEditShotsDialog = (participant: DrivenHuntParticipant) => {
    setSelectedParticipant(participant);
    setShots({
      shotsTaken: participant.shotsTaken,
      shotsHit: participant.shotsHit
    });
    setEditShotsDialog(true);
  };
  
  // Open add animal dialog
  const openAddAnimalDialog = (participant: DrivenHuntParticipant) => {
    setSelectedParticipant(participant);
    setAddAnimalDialog(true);
  };
  
  // Calculate accuracy percentage
  const calculateAccuracy = (shotsTaken: number, shotsHit: number) => {
    if (shotsTaken === 0) return 0;
    return Math.round((shotsHit / shotsTaken) * 100);
  };
  
  // Handle cancel/back button
  const handleCancel = () => {
    router.push(`/drivenhunts/drivenhunt/${id}`);
  };
  
  // Actions column template for participants table
  const actionsTemplate = (rowData: DrivenHuntParticipant) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon="pi pi-pencil" 
          className="p-button-rounded p-button-text p-button-sm" 
          onClick={() => openEditShotsDialog(rowData)}
          tooltip="Redaguoti šūvius" 
        />
        <Button 
          icon="pi pi-plus" 
          className="p-button-rounded p-button-text p-button-sm" 
          onClick={() => openAddAnimalDialog(rowData)}
          tooltip="Pridėti žvėrį" 
        />
      </div>
    );
  };
  
  // Animals column template for participants table
  const animalsTemplate = (rowData: DrivenHuntParticipant) => {
    if (rowData.huntedAnimals.length === 0) {
      return <span className="text-500">Nėra žvėrių</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {rowData.huntedAnimals.map((animal, idx) => (
          <span key={idx} className="inline-flex align-items-center bg-primary-100 text-primary-900 px-2 py-1 text-xs rounded">
            {animal.animalType} ({animal.count})
          </span>
        ))}
      </div>
    );
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
          <h3 className="text-xl font-semibold">Medžioklė nerasta</h3>
          <p className="mb-4">Medžioklė, kurią norite redaguoti neegzistuoja arba neturite tam teisių.</p>
          <Button label="Back to Hunts List" icon="pi pi-arrow-left" onClick={() => router.push('/drivenhunts/list')} />
        </Card>
      </div>
    );
  }
  
  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        
        <div className="flex justify-content-between align-items-center mb-4">
          <h2 className="text-2xl font-bold m-0">Redaguoti varyminę medžioklę</h2>
          <Button 
            icon="pi pi-arrow-left" 
            label="Grįžti atgal" 
            className="p-button-outlined" 
            onClick={handleCancel}
          />
        </div>
        
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          <TabPanel header="General Information">
            <Card>
              <form onSubmit={handleSaveGeneralInfo} className="grid formgrid p-fluid">
                <div className="field col-12 md:col-6">
                  <label htmlFor="name" className="font-bold">Medžioklės pavadinimas*</label>
                  <InputText
                    id="name"
                    value={editedHunt.name}
                    onChange={e => setEditedHunt({ ...editedHunt, name: e.target.value })}
                    className={classNames({'p-invalid': submitted && !editedHunt.name})}
                    placeholder="Įveskite pavadinimą"
                  />
                  {submitted && !editedHunt.name && <small className="p-error">Pavadinimas privalomas.</small>}
                </div>
                
                <div className="field col-12 md:col-6">
                  <label htmlFor="location" className="font-bold">Vieta*</label>
                  <InputText
                    id="location"
                    value={editedHunt.location}
                    onChange={e => setEditedHunt({ ...editedHunt, location: e.target.value })}
                    className={classNames({'p-invalid': submitted && !editedHunt.location})}
                    placeholder="Įveskite vietą"
                  />
                  {submitted && !editedHunt.location && <small className="p-error">Vieta privaloma.</small>}
                </div>
                
                <div className="field col-12 md:col-6">
                  <label htmlFor="date" className="font-bold">Data*</label>
                  <Calendar
                    id="date"
                    value={editedHunt.date}
                    onChange={e => setEditedHunt({ ...editedHunt, date: e.value as Date })}
                    showIcon
                    className={classNames({'p-invalid': submitted && !editedHunt.date})}
                    placeholder="Pasirinkite datą"
                  />
                  {submitted && !editedHunt.date && <small className="p-error">Data privaloma.</small>}
                </div>
                
                <div className="field col-12 md:col-6">
                  <label htmlFor="leader" className="font-bold">Medžioklės vadovas*</label>
                  <Dropdown
                    id="leader"
                    value={editedHunt.leaderId}
                    options={members}
                    onChange={e => setEditedHunt({ ...editedHunt, leaderId: e.value })}
                    optionLabel="name"
                    optionValue="userId"
                    filter
                    placeholder="Pasirinkite vadovą"
                    className={classNames({'p-invalid': submitted && !editedHunt.leaderId})}
                  />
                  {submitted && !editedHunt.leaderId && <small className="p-error">Vadovas privalomas.</small>}
                </div>
                
                <div className="field col-12 md:col-6">
                  <div className="flex align-items-center">
                    <label htmlFor="isCompleted" className="font-bold mr-3">Medžioklės statusas</label>
                    <div className="p-field-checkbox">
                      <Dropdown
                        id="isCompleted"
                        value={editedHunt.isCompleted}
                        options={[
                          { label: 'Vykstanti', value: false },
                          { label: 'Užbaigta', value: true }
                        ]}
                        onChange={e => setEditedHunt({ ...editedHunt, isCompleted: e.value })}
                        placeholder="Pasirinkite statusą"
                      />
                    </div>
                  </div>
                  
                  {hunt.isCompleted && hunt.completedDate && (
                    <small className="text-color-secondary mt-2 block">
                      Užbaigta: {format(parseISO(hunt.completedDate), 'yyyy-MM-dd')}
                    </small>
                  )}
                </div>
                
                <div className="col-12 flex gap-2 justify-content-end mt-4">
                  <Button 
                    label="Atšaukti" 
                    icon="pi pi-times" 
                    className="p-button-outlined" 
                    onClick={handleCancel}
                    disabled={submitting}
                    type="button"
                  />
                  <Button 
                    label="Išsaugoti" 
                    icon="pi pi-check" 
                    type="submit"
                    loading={submitting}
                  />
                </div>
              </form>
            </Card>
          </TabPanel>
          
          <TabPanel header="Dalyviai ir sumedžioti žvėrys">
            <Card>
              <DataTable 
                value={hunt.participants} 
                paginator 
                rows={5} 
                rowsPerPageOptions={[5, 10, 25]} 
                dataKey="id"
                rowHover
                stripedRows
                emptyMessage="Nerasta dalyvių"
              >
                <Column field="userName" header="Vardas" sortable />
                <Column field="shotsTaken" header="Atliko šūvių" sortable style={{ width: '120px' }} />
                <Column field="shotsHit" header="Pataikė šūvių" sortable style={{ width: '120px' }} />
                <Column 
                  header="Taiklumas" 
                  body={(rowData) => `${calculateAccuracy(rowData.shotsTaken, rowData.shotsHit)}%`}
                  sortable
                  sortField="shotsHit"
                  style={{ width: '100px' }}
                />
                <Column 
                  header="Sumedžioti žvėrys" 
                  body={animalsTemplate}
                />
                <Column 
                  header="Veiksmai" 
                  body={actionsTemplate} 
                  style={{ width: '120px' }}
                />
              </DataTable>
            </Card>
          </TabPanel>
        </TabView>
        
        {/* Dialog for editing shots */}
        <Dialog 
          visible={editShotsDialog} 
          onHide={() => setEditShotsDialog(false)} 
          header="Redaguoti šūvius" 
          style={{ width: '450px' }}
          footer={
            <div>
              <Button label="Atšaukti" icon="pi pi-times" className="p-button-text" onClick={() => setEditShotsDialog(false)} />
              <Button label="Išsaugoti" icon="pi pi-check" onClick={handleUpdateShots} />
            </div>
          }
        >
          {selectedParticipant && (
            <div className="p-fluid">
              <div className="field mb-4">
                <label htmlFor="participant" className="font-bold">Dalyvis</label>
                <div className="p-inputtext p-component p-disabled">
                  {selectedParticipant.userName}
                </div>
              </div>
              
              <div className="field mb-4">
                <label htmlFor="shotsTaken" className="font-bold">Atliko šūvių</label>
                <InputNumber 
                  id="shotsTaken" 
                  value={shots.shotsTaken} 
                  onValueChange={(e) => setShots({ ...shots, shotsTaken: e.value || 0 })} 
                  min={0}
                />
              </div>
              
              <div className="field">
                <label htmlFor="shotsHit" className="font-bold">Pataikė šūvių</label>
                <InputNumber 
                  id="shotsHit" 
                  value={shots.shotsHit} 
                  onValueChange={(e) => setShots({ ...shots, shotsHit: e.value || 0 })} 
                  min={0} 
                  max={shots.shotsTaken}
                />
              </div>
            </div>
          )}
        </Dialog>
        
        {/* Dialog for adding animals */}
        <Dialog 
          visible={addAnimalDialog} 
          onHide={() => setAddAnimalDialog(false)} 
          header="Pridėti sumedžiotą žvėrį" 
          style={{ width: '450px' }}
          footer={
            <div>
              <Button label="Atšaukti" icon="pi pi-times" className="p-button-text" onClick={() => setAddAnimalDialog(false)} />
              <Button label="Pridėti" icon="pi pi-plus" onClick={handleAddAnimal} disabled={!animalType} />
            </div>
          }
        >
          {selectedParticipant && (
            <div className="p-fluid">
              <div className="field mb-4">
                <label htmlFor="participant" className="font-bold">Dalyvis</label>
                <div className="p-inputtext p-component p-disabled">
                  {selectedParticipant.userName}
                </div>
              </div>
              
              <div className="field">
                <label htmlFor="animalType" className="font-bold">Žvėries rūšis</label>
                <Dropdown 
                  id="animalType" 
                  value={animalType} 
                  options={animalTypes} 
                  onChange={(e) => setAnimalType(e.value)} 
                  placeholder="Pasirinkite žvėrį"
                  filter
                />
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </ClubGuard>
  );
};

export default DrivenHuntEdit;
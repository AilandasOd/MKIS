// MKInformacineSistemaFront/app/(main)/admin/mapobjects/page.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useClub } from '../../../../context/ClubContext';
import RoleGuard from '../../../../context/RoleGuard';
import ClubGuard from '../../../../context/ClubGuard';

interface MapObject {
  id: number;
  name: string;
  type: string;
  coordinate: {
    lat: number;
    lng: number;
  };
}

const AdminMapObjectsPage = () => {
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [newObjectDialog, setNewObjectDialog] = useState(false);
  const [selectedObject, setSelectedObject] = useState<MapObject | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Tower');
  const [newLat, setNewLat] = useState('56.1085');
  const [newLng, setNewLng] = useState('23.3499');
  
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const { selectedClub } = useClub();
  
  const typeOptions = [
    { label: 'Bokštelis', value: 'Tower' },
    { label: 'Šėrykla', value: 'EatingZone' }
  ];

  useEffect(() => {
    if (!selectedClub) return;
    
    const fetchObjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://localhost:7091/api/MapObjects?clubId=${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setObjects(data);
      } catch (error) {
        console.error('Error fetching map objects:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load map objects',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchObjects();
  }, [selectedClub]);

  const handleEditObject = (object: MapObject) => {
    setSelectedObject(object);
    setEditName(object.name);
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedObject || !editName.trim() || !selectedClub) return;
    
    try {
      const response = await fetch(`https://localhost:7091/api/MapObjects/${selectedObject.id}?clubId=${selectedClub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          id: selectedObject.id,
          name: editName.trim(),
          lat: selectedObject.coordinate.lat,
          lng: selectedObject.coordinate.lng
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Map object updated successfully',
        life: 3000
      });
      
      // Update local state
      setObjects(objects.map(obj => 
        obj.id === selectedObject.id ? { ...obj, name: editName.trim() } : obj
      ));
      
      setEditDialog(false);
    } catch (error) {
      console.error('Error updating map object:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update map object',
        life: 3000
      });
    }
  };

  const handleDeleteObject = (object: MapObject) => {
    confirmDialog({
      message: `Are you sure you want to delete "${object.name}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, delete',
      rejectLabel: 'No',
      accept: () => deleteObject(object.id),
    });
  };

  const deleteObject = async (id: number) => {
    if (!selectedClub) return;
    
    try {
      const response = await fetch(`https://localhost:7091/api/MapObjects/${id}?clubId=${selectedClub.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Map object deleted successfully',
        life: 3000
      });
      
      // Update local state
      setObjects(objects.filter(obj => obj.id !== id));
    } catch (error) {
      console.error('Error deleting map object:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete map object',
        life: 3000
      });
    }
  };

  const handleCreateObject = async () => {
    if (!newName.trim() || !selectedClub) return;
    
    // Validate lat/lng
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter valid coordinates',
        life: 3000
      });
      return;
    }
    
    try {
      const response = await fetch(`https://localhost:7091/api/MapObjects?clubId=${selectedClub.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          lat: lat,
          lng: lng
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Map object created successfully',
        life: 3000
      });
      
      // Add to local state
      setObjects([...objects, result]);
      
      // Reset form
      setNewName('');
      setNewType('Tower');
      setNewLat('56.1085');
      setNewLng('23.3499');
      
      setNewObjectDialog(false);
    } catch (error) {
      console.error('Error creating map object:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create map object',
        life: 3000
      });
    }
  };
  
  const getTypeLabel = (type: string) => {
    return type === 'Tower' ? 'Bokštelis' : 'Šėrykla';
  };

  const typeTemplate = (rowData: MapObject) => {
    return <span>{getTypeLabel(rowData.type)}</span>;
  };

  const coordinatesTemplate = (rowData: MapObject) => {
    return (
      <span>
        {rowData.coordinate.lat.toFixed(6)}, {rowData.coordinate.lng.toFixed(6)}
      </span>
    );
  };

  const actionsTemplate = (rowData: MapObject) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon="pi pi-pencil" 
          rounded 
          text 
          severity="info" 
          onClick={() => handleEditObject(rowData)}
          tooltip="Edit" 
        />
        <Button 
          icon="pi pi-trash" 
          rounded 
          text 
          severity="danger" 
          onClick={() => handleDeleteObject(rowData)}
          tooltip="Delete" 
        />
      </div>
    );
  };

  return (
    <RoleGuard requiredRoles={['Admin', 'Owner']}>
      <ClubGuard>
        <div className="card p-4">
          <Toast ref={toast} />
          <ConfirmDialog />
          
          <div className="flex justify-content-between align-items-center mb-4">
            <h1 className="m-0">Map Objects Management</h1>
            <div className="flex gap-2">
              <Button 
                label="Add New Object" 
                icon="pi pi-plus" 
                onClick={() => setNewObjectDialog(true)}
              />
              <Button
                label="Go to Map"
                icon="pi pi-map"
                outlined
                onClick={() => router.push('/maps/objectsmap')}
              />
            </div>
          </div>
          
          <DataTable 
            value={objects} 
            loading={loading} 
            paginator 
            rows={10} 
            rowsPerPageOptions={[5, 10, 25]} 
            emptyMessage="No map objects found" 
            tableStyle={{ minWidth: '50rem' }}
            sortField="name"
            sortOrder={1}
          >
            <Column field="name" header="Name" sortable style={{ width: '30%' }} />
            <Column field="type" header="Type" body={typeTemplate} sortable style={{ width: '20%' }} />
            <Column header="Coordinates" body={coordinatesTemplate} style={{ width: '30%' }} />
            <Column body={actionsTemplate} header="Actions" style={{ width: '20%' }} />
          </DataTable>
        </div>
        
        {/* Edit Dialog */}
        <Dialog 
          visible={editDialog} 
          onHide={() => setEditDialog(false)} 
          header="Edit Map Object" 
          footer={
            <div>
              <Button 
                label="Cancel" 
                icon="pi pi-times" 
                outlined 
                onClick={() => setEditDialog(false)} 
                className="mr-2" 
              />
              <Button 
                label="Save" 
                icon="pi pi-check" 
                onClick={handleSaveEdit} 
              />
            </div>
          }
        >
          {selectedObject && (
            <div className="flex flex-column gap-3 p-3">
              <div className="field">
                <label htmlFor="editName">Name</label>
                <InputText 
                  id="editName" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="w-full" 
                />
              </div>
              
              <div className="field">
                <label>Type</label>
                <div>{getTypeLabel(selectedObject.type)}</div>
              </div>
              
              <div className="field">
                <label>Coordinates</label>
                <div>{selectedObject.coordinate.lat.toFixed(6)}, {selectedObject.coordinate.lng.toFixed(6)}</div>
              </div>
            </div>
          )}
        </Dialog>
        
        {/* New Object Dialog */}
        <Dialog 
          visible={newObjectDialog} 
          onHide={() => setNewObjectDialog(false)} 
          header="Create New Map Object" 
          footer={
            <div>
              <Button 
                label="Cancel" 
                icon="pi pi-times" 
                outlined 
                onClick={() => setNewObjectDialog(false)} 
                className="mr-2" 
              />
              <Button 
                label="Create" 
                icon="pi pi-check" 
                onClick={handleCreateObject} 
              />
            </div>
          }
        >
          <div className="flex flex-column gap-3 p-3">
            <div className="field">
              <label htmlFor="newName">Name</label>
              <InputText 
                id="newName" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="w-full" 
              />
            </div>
            
            <div className="field">
              <label htmlFor="newType">Type</label>
              <Dropdown 
                id="newType" 
                value={newType} 
                options={typeOptions} 
                onChange={(e) => setNewType(e.value)} 
                className="w-full" 
              />
            </div>
            
            <div className="field">
              <label htmlFor="newLat">Latitude</label>
              <InputText 
                id="newLat" 
                value={newLat} 
                onChange={(e) => setNewLat(e.target.value)} 
                className="w-full" 
              />
            </div>
            
            <div className="field">
              <label htmlFor="newLng">Longitude</label>
              <InputText 
                id="newLng" 
                value={newLng} 
                onChange={(e) => setNewLng(e.target.value)} 
                className="w-full" 
              />
            </div>
          </div>
        </Dialog>
      </ClubGuard>
    </RoleGuard>
  );
};

export default AdminMapObjectsPage;
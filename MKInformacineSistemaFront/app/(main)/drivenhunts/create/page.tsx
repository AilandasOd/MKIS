'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { useApiClient } from '../../../../utils/apiClient';
import ClubGuard from '../../../../context/ClubGuard';

interface Member {
  id: string;
  name: string;
  status: string;
  userId: string; // Make sure userId is included
}

interface CreateDrivenHuntDto {
  name: string;
  location: string;
  date: Date | null;
  game: string;
  leaderId: string;
  participantIds: string[];
}

const DrivenHuntCreate = () => {
  const [formData, setFormData] = useState<CreateDrivenHuntDto>({
    name: '',
    location: '',
    date: null,
    game: '',
    leaderId: '',
    participantIds: []
  });
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { fetchWithClub, selectedClub } = useApiClient();
  const toast = useRef<Toast>(null);
  const router = useRouter();
  
  // Add a ref to track if we've already fetched data
  const hasFetchedRef = useRef(false);
  
  // Load club members
  useEffect(() => {
    // Only fetch if we haven't already AND we have a selected club
    if (hasFetchedRef.current || !selectedClub) return;
    
    const fetchMembers = async () => {
      try {
        setLoading(true);
        console.log("Fetching members for club:", selectedClub.id);
        const data = await fetchWithClub('Members');
        setMembers(data);
        
        // Mark that we've successfully fetched data
        hasFetchedRef.current = true;
        
        // If members loaded successfully, set the first member with Owner or Admin role as default leader
        const defaultLeader = data.find(m => m.status === 'Owner' || m.status === 'Admin');
        if (defaultLeader) {
          setFormData(prev => ({
            ...prev,
            leaderId: defaultLeader.userId
          }));
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load club members',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembers();
  }, [fetchWithClub, selectedClub]);
  
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission behavior which causes page refresh
    if (e) e.preventDefault();
    
    setSubmitted(true);
    
    // Basic validation
    if (!formData.name || !formData.location || !formData.date || !formData.leaderId) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields',
        life: 3000
      });
      return;
    }
    
    // Make sure we have at least one participant
    const participantIds = [...formData.participantIds];
    if (participantIds.length === 0) {
      // Add leader as participant if none selected
      participantIds.push(formData.leaderId);
    } else if (!participantIds.includes(formData.leaderId)) {
      // Add leader to participants if not already included
      participantIds.push(formData.leaderId);
    }
    
    setSubmitting(true);
    
    try {
      // Prepare payload with the updated participant IDs
      const payload = {
        ...formData,
        participantIds
      };
      
      console.log("Submitting driven hunt:", payload);
      
      // Submit the form data
      const response = await fetch(`https://localhost:7091/api/DrivenHunts?clubId=${selectedClub?.id}`, {
        method: 'POST',
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
      
      const result = await response.json();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Driven hunt created successfully',
        life: 3000
      });
      
      // Navigate back to the list after success
      setTimeout(() => {
        router.push('/drivenhunts/list');
      }, 1500);
    } catch (error) {
      console.error('Error creating driven hunt:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to create driven hunt',
        life: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/drivenhunts/list');
  };
  
  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        
        <Card className="mb-0">
          <div className="flex justify-content-between align-items-center mb-5">
            <h2 className="text-2xl font-bold m-0">Create New Driven Hunt</h2>
            <Button 
              icon="pi pi-arrow-left" 
              label="Back to List" 
              className="p-button-outlined" 
              onClick={handleCancel}
              type="button" // Explicitly set type to button
            />
          </div>
          
          {/* Wrap form controls in an actual form element */}
          <form onSubmit={handleSubmit} className="grid formgrid p-fluid">
            <div className="field col-12 md:col-6">
              <label htmlFor="name" className="font-bold">Hunt Name*</label>
              <InputText
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={classNames({'p-invalid': submitted && !formData.name})}
                placeholder="Enter hunt name"
                disabled={loading}
              />
              {submitted && !formData.name && <small className="p-error">Name is required.</small>}
            </div>
            
            <div className="field col-12 md:col-6">
              <label htmlFor="location" className="font-bold">Location*</label>
              <InputText
                id="location"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className={classNames({'p-invalid': submitted && !formData.location})}
                placeholder="Enter location"
                disabled={loading}
              />
              {submitted && !formData.location && <small className="p-error">Location is required.</small>}
            </div>
            
            <div className="field col-12 md:col-6">
              <label htmlFor="date" className="font-bold">Date*</label>
              <Calendar
                id="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.value as Date })}
                showIcon
                className={classNames({'p-invalid': submitted && !formData.date})}
                placeholder="Select date"
                minDate={new Date()}
                disabled={loading}
              />
              {submitted && !formData.date && <small className="p-error">Date is required.</small>}
            </div>
            
            <div className="field col-12 md:col-6">
              <label htmlFor="game" className="font-bold">Game Types</label>
              <Dropdown
                id="game"
                value={formData.game}
                options={gameTypes}
                onChange={e => setFormData({ ...formData, game: e.value })}
                placeholder="Select game types"
                filter
                showClear
                disabled={loading}
              />
            </div>
            
            <div className="field col-12 md:col-6">
              <label htmlFor="leader" className="font-bold">Hunt Leader*</label>
              <Dropdown
                id="leader"
                value={formData.leaderId}
                options={members}
                onChange={e => setFormData({ ...formData, leaderId: e.value })}
                optionLabel="name"
                optionValue="userId"
                filter
                placeholder="Select hunt leader"
                className={classNames({'p-invalid': submitted && !formData.leaderId})}
                disabled={loading}
              />
              {submitted && !formData.leaderId && <small className="p-error">Leader is required.</small>}
            </div>
            
            <div className="field col-12 md:col-6">
              <label htmlFor="participants" className="font-bold">Participants</label>
              <MultiSelect
                id="participants"
                value={formData.participantIds}
                options={members}
                onChange={e => setFormData({ ...formData, participantIds: e.value })}
                optionLabel="name"
                optionValue="userId"
                filter
                placeholder="Select participants"
                display="chip"
                disabled={loading}
              />
              <small className="text-color-secondary">Leader will be automatically added as a participant.</small>
            </div>
            
            <div className="col-12 flex gap-2 justify-content-end mt-4">
              <Button 
                label="Cancel" 
                icon="pi pi-times" 
                className="p-button-outlined" 
                onClick={handleCancel}
                disabled={submitting}
                type="button" // Explicitly set type to button
              />
              <Button 
                label="Create Hunt" 
                icon="pi pi-check" 
                type="submit" // Set type to submit for form submission
                loading={submitting}
                disabled={loading}
              />
            </div>
          </form>
        </Card>
      </div>
    </ClubGuard>
  );
};

export default DrivenHuntCreate;
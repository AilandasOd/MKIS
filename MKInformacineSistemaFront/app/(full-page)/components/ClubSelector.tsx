// MKInformacineSistemaFront/components/ClubSelector.tsx
'use client';

import React, { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useClub } from '../../../context/ClubContext';
import { useRouter } from 'next/navigation';

interface Club {
  id: number;
  name: string;
  logoUrl: string;
}

const ClubSelector = () => {
  const { clubs, selectedClub, setSelectedClub } = useClub();
  const [joinClubDialog, setJoinClubDialog] = useState(false);
  const router = useRouter();

  const clubSelectItems = clubs.map(club => ({
    label: club.name,
    value: club
  }));

  const handleCreateClub = () => {
    router.push('/clubs/create');
  };

  const handleJoinClub = () => {
    setJoinClubDialog(true);
  };

  const handleBrowseClubs = () => {
    router.push('/clubs/browse');
  };

  const clubOptionTemplate = (option: { label: string; value: Club }) => {
    return (
      <div className="flex align-items-center">
        {option.value.logoUrl ? (
          <img 
            src={`https://localhost:7091${option.value.logoUrl}`} 
            alt={option.label} 
            className="mr-2" 
            style={{ width: '24px', height: '24px', borderRadius: '50%' }} 
          />
        ) : (
          <i className="pi pi-users mr-2" />
        )}
        <span>{option.label}</span>
      </div>
    );
  };

  const selectedClubTemplate = (club: Club | null) => {
    if (!club) return <span>Select a club</span>;
    
    return (
      <div className="flex align-items-center">
        {club.logoUrl ? (
          <img 
            src={`https://localhost:7091${club.logoUrl}`} 
            alt={club.name} 
            className="mr-2" 
            style={{ width: '24px', height: '24px', borderRadius: '50%' }} 
          />
        ) : (
          <i className="pi pi-users mr-2" />
        )}
        <span>{club.name}</span>
      </div>
    );
  };

  // No clubs scenario - show join/create buttons
  if (clubs.length === 0) {
    return (
      <div className="flex gap-2">
        <Button 
          label="Join Club" 
          icon="pi pi-sign-in" 
          className="p-button-sm p-button-outlined" 
          onClick={handleBrowseClubs} 
        />
        <Button 
          label="Create Club" 
          icon="pi pi-plus" 
          className="p-button-sm" 
          onClick={handleCreateClub} 
        />
      </div>
    );
  }

  return (
    <div className="flex align-items-center">
      <Dropdown
        value={selectedClub}
        options={clubSelectItems}
        onChange={(e) => setSelectedClub(e.value)}
        optionLabel="name"
        placeholder="Select a Club"
        className="w-14rem mr-2"
        valueTemplate={selectedClubTemplate}
        itemTemplate={clubOptionTemplate}
      />
      <Button 
        icon="pi pi-plus" 
        className="p-button-rounded p-button-outlined p-button-sm" 
        onClick={handleCreateClub} 
        tooltip="Create New Club" 
        tooltipOptions={{ position: 'bottom' }} 
      />
    </div>
  );
};

export default ClubSelector;
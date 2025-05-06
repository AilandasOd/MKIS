// MKInformacineSistemaFront/app/(main)/layout/topbar/ClubSelector.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { useClub } from '../../../context/ClubContext';

const ClubSelector = () => {
  const { clubs, selectedClub, setSelectedClub, loading } = useClub();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // This ensures the component doesn't have hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Debug log to check selected club value
    console.log("Selected club in selector:", selectedClub);
  }, [selectedClub]);

  const handleCreateClub = () => {
    router.push('/clubs/create');
  };

  const handleBrowseClubs = () => {
    router.push('/clubs/browse');
  };

  // Option template - what shows in the dropdown list
  const itemTemplate = (option) => {
    if (!option) return <span>Select a club</span>;
    
    return (
      <div className="flex align-items-center">
        {option.logoUrl ? (
          <img 
            src={`https://localhost:7091${option.logoUrl}`} 
            alt={option.name} 
            className="mr-2" 
            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
          />
        ) : (
          <i className="pi pi-users mr-2" />
        )}
        <span>{option.name}</span>
      </div>
    );
  };

  // Create a simple label component to show selected club
  const SelectedClubLabel = () => {
    if (!selectedClub) return <span>Select a club</span>;
    
    return (
      <div className="flex align-items-center">
        {selectedClub.logoUrl ? (
          <img 
            src={`https://localhost:7091${selectedClub.logoUrl}`} 
            alt={selectedClub.name} 
            className="mr-2" 
            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
          />
        ) : (
          <i className="pi pi-users mr-2" />
        )}
        <span>{selectedClub.name}</span>
      </div>
    );
  };

  // Don't render anything until client-side mounting is complete
  if (!mounted) return null;

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
    <div className="flex align-items-center club-selector-container">
      <style jsx>{`
        .club-selector-container :global(.p-dropdown-label) {
          display: flex !important;
          align-items: center !important;
          min-height: 32px;
        }
      `}</style>
      <Dropdown
        value={selectedClub}
        options={clubs}
        onChange={(e) => setSelectedClub(e.value)}
        optionLabel="name"
        placeholder="Select a Club"
        className="w-14rem mr-2"
        valueTemplate={<SelectedClubLabel />}
        itemTemplate={itemTemplate}
        dataKey="id"
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
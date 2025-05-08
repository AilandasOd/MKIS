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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("Pasirinktas klubas selektoriuje:", selectedClub);
  }, [selectedClub]);

  const handleCreateClub = () => {
    router.push('/clubs/create');
  };

  const handleBrowseClubs = () => {
    router.push('/clubs/browse');
  };

  const itemTemplate = (option) => {
    if (!option) return <span>Pasirinkite klubą</span>;

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

  const SelectedClubLabel = () => {
    if (!selectedClub) return <span>Pasirinkite klubą</span>;

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

  if (!mounted) return null;

  if (clubs.length === 0) {
    return (
      <div className="flex gap-2">
        <Button 
          label="Prisijungti prie klubo" 
          icon="pi pi-sign-in" 
          className="p-button-sm p-button-outlined" 
          onClick={handleBrowseClubs} 
        />
        <Button 
          label="Sukurti klubą" 
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
        placeholder="Pasirinkite klubą"
        className="w-14rem mr-2"
        valueTemplate={<SelectedClubLabel />}
        itemTemplate={itemTemplate}
        dataKey="id"
      />
      <Button 
        icon="pi pi-plus" 
        className="p-button-rounded p-button-outlined p-button-sm" 
        onClick={handleCreateClub} 
        tooltip="Sukurti naują klubą" 
        tooltipOptions={{ position: 'bottom' }} 
      />
    </div>
  );
};

export default ClubSelector;

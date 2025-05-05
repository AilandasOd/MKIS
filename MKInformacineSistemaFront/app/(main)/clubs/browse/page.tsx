// MKInformacineSistemaFront/app/(main)/clubs/browse/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useClub } from '../../../../context/ClubContext';

interface Club {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  foundedDate: string;
  membersCount: number;
  isUserMember: boolean;
}

const BrowseClubsPage = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const { refreshClubs } = useClub();

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClubs(clubs);
    } else {
      const filtered = clubs.filter(club => 
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  }, [searchTerm, clubs]);

  const fetchClubs = async () => {
    try {
      const response = await fetch('https://localhost:7091/api/Clubs', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClubs(data);
        setFilteredClubs(data);
      } else {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load clubs', life: 3000 });
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect to server', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async (clubId: number) => {
    try {
      const response = await fetch('https://localhost:7091/api/Clubs/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ clubId })
      });

      if (response.ok) {
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Join request sent', life: 3000 });
        await fetchClubs(); // Refresh the list
        await refreshClubs(); // Update global club context
      } else {
        const errorText = await response.text();
        toast.current?.show({ severity: 'error', summary: 'Error', detail: errorText || 'Failed to join club', life: 3000 });
      }
    } catch (error) {
      console.error('Error joining club:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect to server', life: 3000 });
    }
  };

  const handleCreateClub = () => {
    router.push('/clubs/create');
  };

  const handleViewClub = (clubId: number) => {
    router.push(`/clubs/${clubId}`);
  };

  if (loading) {
    return <div className="flex justify-content-center mt-5"><i className="pi pi-spin pi-spinner text-4xl"></i></div>;
  }

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold m-0">Browse Hunting Clubs</h2>
        <Button label="Create Club" icon="pi pi-plus" onClick={handleCreateClub} />
      </div>
      
      <div className="mb-4">
        <span className="p-input-icon-left w-full md:w-30rem">
          <i className="pi pi-search" />
          <InputText 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search clubs..." 
            className="w-full"
          />
        </span>
      </div>
      
      {filteredClubs.length === 0 ? (
        <div className="text-center p-5">
          <i className="pi pi-search text-5xl text-gray-400 mb-3"></i>
          <p className="text-xl">No clubs found. Create a new one?</p>
          <Button label="Create Club" icon="pi pi-plus" onClick={handleCreateClub} className="mt-3" />
        </div>
      ) : (
        <div className="grid">
          {filteredClubs.map(club => (
            <div key={club.id} className="col-12 md:col-6 lg:col-4 p-2">
              <Card className="h-full">
                <div className="flex flex-column h-full">
                  <div className="flex align-items-center mb-3">
                    {club.logoUrl ? (
                      <img 
                        src={`https://localhost:7091${club.logoUrl}`} 
                        alt={club.name} 
                        className="mr-3" 
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div className="flex align-items-center justify-content-center bg-primary border-circle mr-3" style={{ width: '60px', height: '60px' }}>
                        <i className="pi pi-users text-2xl text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold m-0">{club.name}</h3>
                      <p className="text-sm text-gray-400 m-0">Founded: {new Date(club.foundedDate).toLocaleDateString('lt-LT')}</p>
                    </div>
                  </div>
                  
                  <p className="line-clamp-3 mb-3">{club.description || 'No description provided.'}</p>
                  
                  <div className="flex align-items-center mb-3 mt-auto">
                    <i className="pi pi-users mr-2" />
                    <span>{club.membersCount} members</span>
                    {club.isUserMember && (
                      <Tag value="Member" severity="success" className="ml-2" />
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      label="View" 
                      icon="pi pi-eye" 
                      className="p-button-outlined flex-grow-1" 
                      onClick={() => handleViewClub(club.id)} 
                    />
                    {!club.isUserMember && (
                      <Button 
                        label="Join" 
                        icon="pi pi-sign-in" 
                        className="flex-grow-1" 
                        onClick={() => handleJoinClub(club.id)} 
                      />
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseClubsPage;
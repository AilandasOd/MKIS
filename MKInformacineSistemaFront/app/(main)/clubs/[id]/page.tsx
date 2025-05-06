'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useClub } from '../../../../context/ClubContext';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';

interface ClubDetails {
  id: number;
  name: string;
  description: string;
  residenceAddress: string;
  foundedDate: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  membersCount: number;
  isUserMember: boolean;
  members: Member[];
  huntingAreaLocation: number[];
}

interface Member {
  id: string;
  name: string;
  role: string;
  avatarPhoto: string;
}

const ClubDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [removing, setRemoving] = useState(false);
  
  const toast = useRef<Toast>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const router = useRouter();
  const { refreshClubs, selectedClub } = useClub();

  // This effect runs when the component mounts or when the ID in the URL changes
  useEffect(() => {
    if (id) {
      console.log(`Loading club details for ID: ${id}`);
      fetchClubDetails();
    }
  }, [id, selectedClub?.id]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://localhost:7091/api/Clubs/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClub(data);
        
        // Map will be initialized in a separate useEffect
      } else if (response.status === 403) {
        // User is not a member of this club
        toast.current?.show({ 
          severity: 'error', 
          summary: 'Access Denied', 
          detail: 'You are not a member of this club', 
          life: 3000 
        });
        router.push('/clubs/browse');
      } else {
        toast.current?.show({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load club details', 
          life: 3000 
        });
      }
    } catch (error) {
      console.error('Error fetching club details:', error);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to connect to server', 
        life: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  // Improved map initialization logic
  useEffect(() => {
    if (!club?.huntingAreaLocation) return;
    
    const loadGoogleMapsAndInitMap = async () => {
      try {
        // Check if Google Maps is already loaded
        if (!window.google) {
          console.log('Loading Google Maps API');
          await loadGoogleMapsScript();
        }
        
        // Initialize or update the map
        console.log('Initializing map with location:', club.huntingAreaLocation);
        initMap(club.huntingAreaLocation);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };
    
    loadGoogleMapsAndInitMap();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [club?.huntingAreaLocation]);

  // Separate function to load Google Maps script
  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initMap = (location: number[]) => {
    if (!mapRef.current || !window.google || !location || location.length < 2) return;

    // Clear existing map elements
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    
    // Create a new map or reuse the existing one
    const mapOptions = {
      center: { lat: location[1], lng: location[0] },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.HYBRID
    };
    
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);
    } else {
      mapInstanceRef.current.setCenter(mapOptions.center);
      mapInstanceRef.current.setZoom(mapOptions.zoom);
    }

    // Add a marker
    markerRef.current = new google.maps.Marker({
      position: { lat: location[1], lng: location[0] },
      map: mapInstanceRef.current,
      title: club?.name,
      animation: google.maps.Animation.DROP
    });
  };

  const handleLeaveClub = async () => {
    try {
      setRemoving(true);
      
      // Find the membership ID for this user in this club
      const currentMember = club?.members.find(m => m.role === 'Owner' || m.role === 'Admin' || m.role === 'Member');
      
      if (!currentMember) {
        throw new Error('Could not find your membership record');
      }
      
      // Call the API to remove member
      const response = await fetch(`https://localhost:7091/api/Clubs/members/${currentMember.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'You have left the club', life: 3000 });
        
        // Refresh global clubs context and clear map resources
        await refreshClubs();
        
        // Clear map resources before navigating
        if (markerRef.current) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
        mapInstanceRef.current = null;
        
        // Navigate back to browse page
        router.push('/clubs/browse');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to leave club');
      }
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error instanceof Error ? error.message : 'Failed to leave club', 
        life: 3000 
      });
    } finally {
      setRemoving(false);
      setLeaveDialog(false);
    }
  };

  const openChangeRoleDialog = (member: Member) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setChangeRoleDialog(true);
  };

  const handleChangeRole = async () => {
    if (!selectedMember || !selectedRole) return;
    
    try {
      const response = await fetch(`https://localhost:7091/api/Clubs/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(selectedRole)
      });
      
      if (response.ok) {
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Member role updated', life: 3000 });
        setChangeRoleDialog(false);
        
        // Update local state
        if (club) {
          const updatedMembers = club.members.map(m => 
            m.id === selectedMember.id ? { ...m, role: selectedRole } : m
          );
          
          setClub({
            ...club,
            members: updatedMembers
          });
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error instanceof Error ? error.message : 'Failed to update role', 
        life: 3000 
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`https://localhost:7091/api/Clubs/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Member removed from club', life: 3000 });
        
        // Update local state
        if (club) {
          const updatedMembers = club.members.filter(m => m.id !== memberId);
          
          setClub({
            ...club,
            members: updatedMembers,
            membersCount: updatedMembers.length
          });
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error instanceof Error ? error.message : 'Failed to remove member', 
        life: 3000 
      });
    }
  };

  const roleBadge = (role: string) => {
    let severity: 'success' | 'info' | 'warning' | 'danger' = 'info';
    
    switch (role) {
      case 'Owner':
        severity = 'danger';
        break;
      case 'Admin':
        severity = 'warning';
        break;
      case 'Member':
        severity = 'success';
        break;
    }
    
    return <Tag value={role} severity={severity} />;
  };

  const memberActionTemplate = (rowData: Member) => {
    // Find current user's role in the club
    const currentUserMember = club?.members.find(m => 
      m.role === 'Owner' || m.role === 'Admin'
    );
    
    if (!currentUserMember) return null;
    
    // Check if current user has permissions to change roles or remove members
    const isCurrentUserOwner = currentUserMember.role === 'Owner';
    const isCurrentUserAdmin = currentUserMember.role === 'Admin';
    
    const canManage = isCurrentUserOwner || 
      (isCurrentUserAdmin && rowData.role !== 'Owner');
    
    if (!canManage) return null;
    
    return (
      <div className="flex gap-2">
        <Button 
          icon="pi pi-user-edit" 
          className="p-button-rounded p-button-text" 
          onClick={() => openChangeRoleDialog(rowData)}
          tooltip="Change Role" 
        />
        <Button 
          icon="pi pi-trash" 
          className="p-button-rounded p-button-text p-button-danger" 
          onClick={() => handleRemoveMember(rowData.id)}
          tooltip="Remove from Club" 
        />
      </div>
    );
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex flex-column align-items-center justify-content-center mt-5">
          <i className="pi pi-spin pi-spinner text-4xl mb-3"></i>
          <p>Loading club details...</p>
        </div>
      </div>
    );
  }

  // Handle case when club is not found or user doesn't have access
  if (!club) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <div className="text-center p-5">
          <i className="pi pi-exclamation-triangle text-5xl text-gray-400 mb-3"></i>
          <p className="text-xl">Club not found or you don't have access.</p>
          <div className="flex justify-content-center mt-4">
            <Button 
              label="Back to Clubs" 
              icon="pi pi-arrow-left" 
              onClick={() => router.push('/clubs/browse')} 
              className="mr-2"
            />
            <Button 
              label="Dashboard" 
              icon="pi pi-home" 
              onClick={() => router.push('/dashboard')} 
              severity="secondary"
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Special handling when club exists but has no location data
  const hasLocationData = club.huntingAreaLocation && club.huntingAreaLocation.length >= 2;

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      <div className="flex flex-column md:flex-row align-items-center md:align-items-start gap-4 mb-4">
        {club.logoUrl ? (
          <img 
            src={`https://localhost:7091${club.logoUrl}`} 
            alt={club.name} 
            className="border-circle" 
            style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
          />
        ) : (
          <div className="flex align-items-center justify-content-center bg-primary border-circle" style={{ width: '100px', height: '100px' }}>
            <i className="pi pi-users text-3xl text-white" />
          </div>
        )}
        
        <div className="flex-grow-1">
          <h2 className="text-3xl font-bold mb-2 text-center md:text-left">{club.name}</h2>
          <div className="flex flex-column md:flex-row gap-3 justify-content-center md:justify-content-start">
            <div className="flex align-items-center">
              <i className="pi pi-calendar mr-2" />
              <span>Founded: {new Date(club.foundedDate).toLocaleDateString('lt-LT')}</span>
            </div>
            <div className="flex align-items-center">
              <i className="pi pi-users mr-2" />
              <span>{club.membersCount} members</span>
            </div>
            {club.contactEmail && (
              <div className="flex align-items-center">
                <i className="pi pi-envelope mr-2" />
                <span>{club.contactEmail}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          label="Leave Club" 
          icon="pi pi-sign-out" 
          severity="danger" 
          outlined 
          onClick={() => setLeaveDialog(true)} 
        />
      </div>
      
      <TabView onTabChange={(e) => {
          // Force map to resize when tab is changed, to fix rendering issues
          if (e.index === 0 && mapInstanceRef.current) {
            setTimeout(() => {
              google.maps.event.trigger(mapInstanceRef.current, 'resize');
              if (club?.huntingAreaLocation && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ 
                  lat: club.huntingAreaLocation[1], 
                  lng: club.huntingAreaLocation[0] 
                });
              }
            }, 50);
          }
        }}>
        <TabPanel header="About">
          <div className="grid">
            <div className="col-12 md:col-8">
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <p className="whitespace-pre-line">{club.description || 'No description provided.'}</p>
                
                <h3 className="text-xl font-semibold mt-4 mb-3">Contact Information</h3>
                <p><strong>Address:</strong> {club.residenceAddress}</p>
                {club.contactEmail && <p><strong>Email:</strong> {club.contactEmail}</p>}
                {club.contactPhone && <p><strong>Phone:</strong> {club.contactPhone}</p>}
              </Card>
            </div>
            
            <div className="col-12 md:col-4">
              <Card className="h-full">
                <h3 className="text-xl font-semibold mb-3">Location</h3>
                {hasLocationData ? (
                  <div ref={mapRef} style={{ width: '100%', height: '300px', borderRadius: '8px' }} />
                ) : (
                  <p className="text-gray-500 italic">No location data available for this club.</p>
                )}
              </Card>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel header="Members">
          <Card>
            <DataTable 
              value={club.members} 
              paginator 
              rows={10} 
              rowsPerPageOptions={[5, 10, 25]} 
              sortField="role" 
              sortOrder={-1}
            >
              <Column 
                header="Member" 
                body={(rowData) => (
                  <div className="flex align-items-center gap-3">
                    {rowData.avatarPhoto ? (
                      <img 
                        src={`https://localhost:7091${rowData.avatarPhoto}`} 
                        alt={rowData.name} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <Avatar icon="pi pi-user" style={{ width: '32px', height: '32px' }} />
                    )}
                    <span>{rowData.name}</span>
                  </div>
                )} 
              />
              <Column field="role" header="Role" body={(rowData) => roleBadge(rowData.role)} sortable />
              <Column body={memberActionTemplate} style={{ width: '120px' }} />
            </DataTable>
          </Card>
        </TabPanel>
      </TabView>
      
      {/* Leave Club Dialog */}
      <Dialog 
        visible={leaveDialog} 
        onHide={() => setLeaveDialog(false)} 
        header="Confirm Leave" 
        footer={
          <div>
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setLeaveDialog(false)} 
              className="p-button-text" 
            />
            <Button 
              label="Leave" 
              icon="pi pi-sign-out" 
              onClick={handleLeaveClub} 
              severity="danger" 
              loading={removing}
            />
          </div>
        }
      >
        <div className="flex align-items-center gap-3">
          <i className="pi pi-exclamation-triangle text-3xl text-yellow-500" />
          <p>Are you sure you want to leave <strong>{club.name}</strong>? You will need to be invited back to rejoin the club.</p>
        </div>
      </Dialog>
      
      {/* Change Role Dialog */}
      <Dialog 
        visible={changeRoleDialog} 
        onHide={() => setChangeRoleDialog(false)} 
        header="Change Member Role" 
        footer={
          <div>
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setChangeRoleDialog(false)} 
              className="p-button-text" 
            />
            <Button 
              label="Save" 
              icon="pi pi-check" 
              onClick={handleChangeRole}
            />
          </div>
        }
      >
        {selectedMember && (
          <div>
            <p>Change role for <strong>{selectedMember.name}</strong></p>
            <Dropdown 
              value={selectedRole} 
              options={['Owner', 'Admin', 'Member']} 
              onChange={(e) => setSelectedRole(e.value)} 
              className="w-full mt-3" 
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ClubDetailsPage;
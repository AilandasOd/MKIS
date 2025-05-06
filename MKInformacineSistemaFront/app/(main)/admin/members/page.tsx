'use client';
import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { useRouter } from 'next/navigation';
import { useApiClient } from '../../../../utils/api';
import { useClub } from '../../../../context/ClubContext';
import ClubGuard from '../../../../context/ClubGuard';
import RoleGuard from '../../../../context/RoleGuard';

interface Member {
  id: number;
  userId: string;
  name: string;
  status: string;
  photo: string;
  activity: number;
  email: string;
  phoneNumber: string;
  age: number;
  huntingSince: string;
  birthDate: string;
}

const AdminMembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [nonMembers, setNonMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('Member');
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  
  const { fetchWithClub, selectedClub } = useApiClient();
  const { refreshClubs } = useClub();
  const toast = useRef<Toast>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMembers();
    fetchNonMembers();
  }, [fetchWithClub]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await fetchWithClub('Members');
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load members',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNonMembers = async () => {
    try {
      // Uses the admin endpoint to get users who are not members of this club
      const data = await fetchWithClub('Users/NonMembers');
      setNonMembers(data);
    } catch (error) {
      console.error('Error fetching non-members:', error);
      // Not showing toast here as it's not critical and might confuse users
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('lt-LT');
  };

  const photoBodyTemplate = (rowData: Member) => {
    return rowData.photo ? (
      <img 
        src={`https://localhost:7091${rowData.photo}`} 
        alt={rowData.name} 
        width="50" 
        height="50" 
        style={{ borderRadius: '50%', objectFit: 'cover' }} 
      />
    ) : (
      <Avatar 
        icon="pi pi-user" 
        size="large" 
        shape="circle" 
      />
    );
  };

  const activityBodyTemplate = (rowData: Member) => {
    let severity = 'info';
    if (rowData.activity > 75) severity = 'success';
    else if (rowData.activity < 25) severity = 'danger';
    else severity = 'warning';

    return (
      <div className="flex align-items-center">
        <div className="relative h-1.5 w-24 bg-gray-200 rounded">
          <div 
            className={`absolute h-1.5 rounded`} 
            style={{ 
              width: `${rowData.activity}%`,
              backgroundColor: severity === 'success' ? 'var(--green-500)' : 
                              severity === 'warning' ? 'var(--yellow-500)' : 
                              severity === 'danger' ? 'var(--red-500)' : 
                              'var(--primary-color)'
            }}
          ></div>
        </div>
        <span className="ml-2">{rowData.activity}%</span>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Member) => {
    return (
      <Tag 
        value={rowData.status} 
        severity={
          rowData.status === 'Owner' ? 'danger' : 
          rowData.status === 'Admin' ? 'warning' : 
          'success'
        }
      />
    );
  };
  
  const nameBodyTemplate = (rowData: Member) => {
    return (
      <a 
        className="text-primary cursor-pointer hover:underline" 
        onClick={() => router.push(`/members/${rowData.id}`)}
      >
        {rowData.name}
      </a>
    );
  };

  const actionsBodyTemplate = (rowData: Member) => {
    // Find the current user's role by checking if any member has Owner or Admin status
    const currentUserMember = members.find(m => m.status === 'Owner' || m.status === 'Admin');
    
    if (!currentUserMember) return null;
    
    // Check if current user has permissions
    const isCurrentUserOwner = currentUserMember.status === 'Owner';
    const isCurrentUserAdmin = currentUserMember.status === 'Admin';
    
    // Determine if this user can be managed by the current user
    const canManage = isCurrentUserOwner || 
      (isCurrentUserAdmin && rowData.status !== 'Owner');
    
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

  const openChangeRoleDialog = (member: Member) => {
    setSelectedMember(member);
    setSelectedRole(member.status);
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
        const updatedMembers = members.map(m => 
          m.id === selectedMember.id ? { ...m, status: selectedRole } : m
        );
        
        setMembers(updatedMembers);
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

  const handleRemoveMember = async (memberId: number) => {
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
        setMembers(members.filter(m => m.id !== memberId));
        
        // Refresh non-members list
        fetchNonMembers();
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

  const handleAddMember = async () => {
    if (!selectedUser || !userRole || !selectedClub) return;
    
    try {
      setAddMemberLoading(true);
      
      const response = await fetch('https://localhost:7091/api/Clubs/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          clubId: selectedClub.id,
          userId: selectedUser.id,
          role: userRole
        })
      });
      
      if (response.ok) {
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Member added to club', life: 3000 });
        setAddMemberDialog(false);
        
        // Reset form
        setSelectedUser(null);
        setUserRole('Member');
        
        // Refresh data
        fetchMembers();
        fetchNonMembers();
        refreshClubs();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error instanceof Error ? error.message : 'Failed to add member', 
        life: 3000 
      });
    } finally {
      setAddMemberLoading(false);
    }
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h5 className="m-0">Club Members</h5>
      <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText 
            type="search" 
            onInput={(e: React.FormEvent<HTMLInputElement>) => setGlobalFilter(e.currentTarget.value)} 
            placeholder="Search..." 
          />
        </span>
        <Button 
          label="Add Member" 
          icon="pi pi-user-plus" 
          onClick={() => setAddMemberDialog(true)} 
        />
      </div>
    </div>
  );

  return (
    <RoleGuard requiredRoles={['Admin', 'Owner']}>
      <ClubGuard>
        <div className="card">
          <Toast ref={toast} />
          <DataTable 
            value={members} 
            header={header}
            globalFilter={globalFilter}
            emptyMessage="No members found."
            loading={loading}
            paginator 
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            dataKey="id"
            responsiveLayout="scroll"
            rowHover
            stripedRows
            showGridlines
          >
            <Column header="Name" body={nameBodyTemplate} field="name" sortable />
            <Column header="Photo" body={photoBodyTemplate} style={{ width: '70px' }} />
            <Column field="age" header="Age" sortable style={{ width: '70px' }} />
            <Column field="email" header="Email" sortable />
            <Column 
              field="huntingSince" 
              header="Hunter Since" 
              body={(rowData) => formatDate(rowData.huntingSince)} 
              sortable 
            />
            <Column header="Activity" body={activityBodyTemplate} field="activity" sortable />
            <Column header="Role" body={statusBodyTemplate} field="status" sortable style={{ width: '120px' }} />
            <Column header="Actions" body={actionsBodyTemplate} style={{ width: '120px' }} />
          </DataTable>

          {/* Activity legend */}
          <div className="mt-4">
            <h5>Activity Legend</h5>
            <div className="grid">
              <div className="col-12 md:col-4">
                <Card className="p-3">
                  <div className="flex align-items-center">
                    <div className="relative h-1.5 w-24 bg-gray-200 rounded mr-3">
                      <div className="absolute h-1.5 rounded bg-green-500" style={{ width: '90%' }}></div>
                    </div>
                    <span>High Activity (75%+)</span>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-4">
                <Card className="p-3">
                  <div className="flex align-items-center">
                    <div className="relative h-1.5 w-24 bg-gray-200 rounded mr-3">
                      <div className="absolute h-1.5 rounded bg-yellow-500" style={{ width: '50%' }}></div>
                    </div>
                    <span>Medium Activity (25-75%)</span>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-4">
                <Card className="p-3">
                  <div className="flex align-items-center">
                    <div className="relative h-1.5 w-24 bg-gray-200 rounded mr-3">
                      <div className="absolute h-1.5 rounded bg-red-500" style={{ width: '15%' }}></div>
                    </div>
                    <span>Low Activity (25%)</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

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

        {/* Add Member Dialog */}
        <Dialog 
          visible={addMemberDialog} 
          onHide={() => setAddMemberDialog(false)} 
          header="Add New Member" 
          style={{ width: '500px' }}
          footer={
            <div>
              <Button 
                label="Cancel" 
                icon="pi pi-times" 
                onClick={() => setAddMemberDialog(false)} 
                className="p-button-text" 
              />
              <Button 
                label="Add Member" 
                icon="pi pi-user-plus" 
                onClick={handleAddMember}
                loading={addMemberLoading}
                disabled={!selectedUser}
              />
            </div>
          }
        >
          <div className="p-fluid">
            <div className="field mb-4">
              <label htmlFor="user" className="font-semibold">Select User</label>
              <Dropdown
                id="user"
                value={selectedUser}
                options={nonMembers}
                onChange={(e) => setSelectedUser(e.value)}
                optionLabel="userName"
                filter
                placeholder="Select a user"
                className="w-full"
                emptyMessage="No available users found"
                emptyFilterMessage="No users match the filter"
                itemTemplate={(option) => (
                  <div className="flex align-items-center">
                    {option.avatarPhoto ? (
                      <img 
                        src={`https://localhost:7091${option.avatarPhoto}`} 
                        alt={option.userName} 
                        className="mr-2" 
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <i className="pi pi-user mr-2" />
                    )}
                    <div>
                      <div>{option.firstName} {option.lastName}</div>
                      <small className="text-gray-500">{option.email}</small>
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="field">
              <label htmlFor="role" className="font-semibold">Role</label>
              <Dropdown
                id="role"
                value={userRole}
                options={['Owner', 'Admin', 'Member']}
                onChange={(e) => setUserRole(e.value)}
                className="w-full"
              />
            </div>
          </div>
        </Dialog>
      </ClubGuard>
    </RoleGuard>
  );
};

export default AdminMembersPage;
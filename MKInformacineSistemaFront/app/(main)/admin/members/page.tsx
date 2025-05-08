'use client';
import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
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
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  
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
        detail: 'Nepavyko įkelti narių sąrašo: ' + (error instanceof Error ? error.message : 'Nežinoma klaida'),
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const roleLabelsLT: Record<string, string> = {
    Owner: 'Savininkas',
    Admin: 'Administratorius',
    Member: 'Narys',
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
        value={roleLabelsLT[rowData.status] || rowData.status}
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
          tooltip="Pakeisti rolę" 
        />
        <Button 
          icon="pi pi-trash" 
          className="p-button-rounded p-button-text p-button-danger" 
          onClick={() => {
            setMemberToDelete(rowData);
            setDeleteConfirmDialog(true);
          }}
          tooltip="Panaikinti narį" 
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
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Nario rolė pakeista', life: 3000 });
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
        detail: error instanceof Error ? error.message : 'Nepavyko pakeisti rolės', 
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
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Narys pašalintas iš klubo', life: 3000 });
        
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
        detail: error instanceof Error ? error.message : 'Nepavyko pašalinti nario', 
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
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Narys pridėtas prie klubo', life: 3000 });
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
        detail: error instanceof Error ? error.message : 'Nepavyko pridėti nario', 
        life: 3000 
      });
    } finally {
      setAddMemberLoading(false);
    }
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h5 className="m-0">Klubo nariai</h5>
      <div className="flex align-items-center gap-2">
        <Button 
          label="Pridėti narį" 
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
            <Column header="Vardas" body={nameBodyTemplate} field="name" sortable />
            <Column field="age" header="Metai" sortable style={{ width: '70px' }} />
            <Column field="email" header="El. paštas" sortable />
            <Column 
              field="huntingSince" 
              header="Medžioja nuo" 
              body={(rowData) => formatDate(rowData.huntingSince)} 
              sortable 
            />
            <Column header="Aktyvumas" body={activityBodyTemplate} field="activity" sortable />
            <Column header="Rolė" body={statusBodyTemplate} field="status" sortable style={{ width: '120px' }} />
            <Column header="Veiksmai" body={actionsBodyTemplate} style={{ width: '120px' }} />
          </DataTable>
        </div>

        {/* Change Role Dialog */}
        <Dialog 
          visible={changeRoleDialog} 
          onHide={() => setChangeRoleDialog(false)} 
          header="Pakeisti rolę" 
          footer={
            <div>
              <Button 
                label="Atšaukti" 
                icon="pi pi-times" 
                onClick={() => setChangeRoleDialog(false)} 
                className="p-button-text" 
              />
              <Button 
                label="Išsaugoti" 
                icon="pi pi-check" 
                onClick={handleChangeRole}
              />
            </div>
          }
        >
          {selectedMember && (
            <div>
              <p>Pakeisti rolę <strong>{selectedMember.name}</strong></p>
              <Dropdown
  value={selectedRole}
  options={[
    { label: roleLabelsLT['Owner'], value: 'Owner' },
    { label: roleLabelsLT['Admin'], value: 'Admin' },
    { label: roleLabelsLT['Member'], value: 'Member' }
  ]}
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
          header="Pridėti narį" 
          style={{ width: '500px' }}
          footer={
            <div>
              <Button 
                label="Atšaukti" 
                icon="pi pi-times" 
                onClick={() => setAddMemberDialog(false)} 
                className="p-button-text" 
              />
              <Button 
                label="Pridėti" 
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
              <label htmlFor="user" className="font-semibold">Pasirinkite narį</label>
              <Dropdown
                id="user"
                value={selectedUser}
                options={nonMembers}
                onChange={(e) => setSelectedUser(e.value)}
                optionLabel="userName"
                filter
                placeholder="Pasirinkite narį"
                className="w-full"
                emptyMessage="No available users found"
                emptyFilterMessage="No users match the filter"
                itemTemplate={(option) => (
                  <div className="flex align-items-center">
                    <div>
                      <div>{option.firstName} {option.lastName}</div>
                      <small className="text-gray-500">{option.email}</small>
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="field">
              <label htmlFor="role" className="font-semibold">Rolė</label>
              <Dropdown
  id="role"
  value={userRole}
  options={[
    { label: roleLabelsLT['Owner'], value: 'Owner' },
    { label: roleLabelsLT['Admin'], value: 'Admin' },
    { label: roleLabelsLT['Member'], value: 'Member' }
  ]}
  onChange={(e) => setUserRole(e.value)}
  className="w-full"
/>
            </div>
          </div>
        </Dialog>
        <Dialog
  visible={deleteConfirmDialog}
  onHide={() => setDeleteConfirmDialog(false)}
  header="Patvirtinti šalinimą"
  modal
  footer={
    <div>
      <Button
        label="Atšaukti"
        icon="pi pi-times"
        onClick={() => setDeleteConfirmDialog(false)}
        className="p-button-text"
      />
      <Button
        label="Pašalinti"
        icon="pi pi-trash"
        onClick={() => {
          if (memberToDelete) handleRemoveMember(memberToDelete.id);
          setDeleteConfirmDialog(false);
        }}
        className="p-button-danger"
      />
    </div>
  }
>
  <p>Ar tikrai norite pašalinti narį <strong>{memberToDelete?.name}</strong> iš klubo?</p>
</Dialog>
      </ClubGuard>
    </RoleGuard>
  );
};

export default AdminMembersPage;
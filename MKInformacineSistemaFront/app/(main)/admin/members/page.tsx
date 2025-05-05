'use client';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import RoleGuard from '../../../../context/RoleGuard';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';

interface Member {
    id: string;
    name: string;
    birthDate: string;
    photo: string;
    activity: number;
    huntingSince: string;
    status: string;
    email: string;
    phoneNumber: string;
    age: number;
}

interface User {
    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
}

const MembersCrud = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [nonMemberUsers, setNonMemberUsers] = useState<User[]>([]);
    const [memberDialog, setMemberDialog] = useState(false);
    const [deleteMemberDialog, setDeleteMemberDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [newMember, setNewMember] = useState({
        userId: '',
        status: 'Medžiotojas'
    });
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<Member>>(null);

    useEffect(() => {
        fetchMembers();
        fetchNonMemberUsers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('https://localhost:7091/api/Members', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            });
            const data = await res.json();
            setMembers(data);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch members', life: 3000 });
        }
    };

    const fetchNonMemberUsers = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            
            // Log the token to see if it exists and is correctly formatted
            console.log('Token being sent:', token);
            
            const res = await fetch('https://localhost:7091/api/Users/NonMembers', {
                headers: {
                    // Make sure the format is exactly "Bearer [token]" with a space in between
                    'Authorization': `Bearer ${token}`
                },
                // Add credentials inclusion for cookies if needed
                credentials: 'include'
            });
    
            // Add error handling for different status codes
            if (res.status === 401) {
                console.error('Unauthorized: Token missing or invalid');
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Your session has expired. Please log in again.', life: 3000 });
                return;
            }
            
            if (res.status === 403) {
                console.error('Forbidden: You do not have permission to access this resource');
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'You do not have permission to access this page.', life: 3000 });
                return;
            }
    
            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }
    
            const data = await res.json();
            setNonMemberUsers(data);
        } catch (error) {
            console.error('Error fetching non-member users:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch users', life: 3000 });
        }
    };

    const openNew = () => {
        setNewMember({
            userId: '',
            status: 'Medžiotojas'
        });
        setSubmitted(false);
        setMemberDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setMemberDialog(false);
    };

    const hideDeleteMemberDialog = () => {
        setDeleteMemberDialog(false);
    };

    const saveMember = async () => {
        setSubmitted(true);

        if (!newMember.userId) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Please select a user', life: 3000 });
            return;
        }

        try {
            const res = await fetch('https://localhost:7091/api/Members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(newMember)
            });

            if (res.ok) {
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Member Created', life: 3000 });
                fetchMembers();
                fetchNonMemberUsers();
                setMemberDialog(false);
            } else {
                const error = await res.text();
                toast.current?.show({ severity: 'error', summary: 'Error', detail: error || 'Failed to create member', life: 3000 });
            }
        } catch (error) {
            console.error('Error creating member:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to create member', life: 3000 });
        }
    };

    const confirmDeleteMember = (member: Member) => {
        setSelectedMember(member);
        setDeleteMemberDialog(true);
    };

    const deleteMember = async () => {
        if (!selectedMember) return;

        try {
            const res = await fetch(`https://localhost:7091/api/Members/${selectedMember.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            });

            if (res.ok) {
                setMembers(members.filter(m => m.id !== selectedMember.id));
                setDeleteMemberDialog(false);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Member Deleted', life: 3000 });
                fetchNonMemberUsers(); // Refresh available users
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete member', life: 3000 });
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete member', life: 3000 });
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <Button label="Add New Member" icon="pi pi-plus" severity="success" onClick={openNew} />
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Club Members</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Search..." />
            </span>
        </div>
    );

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
            <div 
                className="flex align-items-center justify-content-center bg-primary" 
                style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            >
                <i className="pi pi-user text-white" style={{ fontSize: '1.5rem' }}></i>
            </div>
        );
    };

    const activityTemplate = (rowData: Member) => {
        return (
            <div className="flex align-items-center">
                <div className="relative h-1.5 w-24 bg-gray-200 rounded">
                    <div 
                        className="absolute h-1.5 bg-primary rounded" 
                        style={{ width: `${rowData.activity}%` }}
                    ></div>
                </div>
                <span className="ml-2">{rowData.activity}%</span>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Member) => {
        return (
            <Button 
                icon="pi pi-trash" 
                rounded 
                severity="danger" 
                onClick={() => confirmDeleteMember(rowData)} 
                tooltip="Remove Member" 
                tooltipOptions={{ position: 'top' }}
            />
        );
    };

    const memberDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" onClick={saveMember} />
        </>
    );

    const deleteDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteMemberDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteMember} />
        </>
    );

    return (
        <RoleGuard requiredRoles={['Admin']}>
            <div className="grid crud-demo">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                        <DataTable
                            ref={dt}
                            value={members}
                            dataKey="id"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            className="datatable-responsive"
                            globalFilter={globalFilter}
                            emptyMessage="No members found."
                            header={header}
                            responsiveLayout="scroll"
                        >
                            <Column field="name" header="Name" sortable></Column>
                            <Column header="Photo" body={photoBodyTemplate}></Column>
                            <Column field="email" header="Email" sortable></Column>
                            <Column field="phoneNumber" header="Phone" sortable></Column>
                            <Column field="age" header="Age" sortable></Column>
                            <Column 
                                field="huntingSince" 
                                header="Hunter Since" 
                                sortable 
                                body={(rowData) => formatDate(rowData.huntingSince)}
                            ></Column>
                            <Column field="status" header="Status" sortable></Column>
                            <Column header="Activity" body={activityTemplate} sortable field="activity"></Column>
                            <Column body={actionBodyTemplate}></Column>
                        </DataTable>

                        {/* Add New Member Dialog */}
                        <Dialog 
                            visible={memberDialog} 
                            style={{ width: '450px' }} 
                            header="Add New Member" 
                            modal 
                            className="p-fluid" 
                            footer={memberDialogFooter} 
                            onHide={hideDialog}
                        >
                            <div className="field">
                                <label htmlFor="user">Select User</label>
                                <Dropdown
                                    id="user"
                                    value={newMember.userId}
                                    options={nonMemberUsers.map(user => ({
                                        label: `${user.firstName} ${user.lastName} (${user.email})`,
                                        value: user.id
                                    }))}
                                    onChange={(e) => setNewMember({...newMember, userId: e.value})}
                                    placeholder="Select a User"
                                    className={submitted && !newMember.userId ? 'p-invalid' : ''}
                                />
                                {submitted && !newMember.userId && (
                                    <small className="p-error">User is required.</small>
                                )}
                            </div>
                            <div className="field">
                                <label htmlFor="status">Status</label>
                                <Dropdown
                                    id="status"
                                    value={newMember.status}
                                    options={[
                                        { label: 'Member', value: 'Medžiotojas' },
                                        { label: 'Administrator', value: 'Administratorius' }
                                    ]}
                                    onChange={(e) => setNewMember({...newMember, status: e.value})}
                                />
                            </div>
                        </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <Dialog 
                            visible={deleteMemberDialog} 
                            style={{ width: '450px' }} 
                            header="Confirm" 
                            modal 
                            footer={deleteDialogFooter} 
                            onHide={hideDeleteMemberDialog}
                        >
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {selectedMember && (
                                    <span>
                                        Are you sure you want to remove <b>{selectedMember.name}</b> from the club? 
                                        This will not delete the user account, only remove their membership.
                                    </span>
                                )}
                            </div>
                        </Dialog>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
};

export default MembersCrud;
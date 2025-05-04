'use client';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import RoleGuard from '../../../../context/RoleGuard';

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
}

const MembersCrud = () => {
    const emptyMember: Member = {
        id: '',
        name: '',
        birthDate: '',
        photo: '',
        activity: 0,
        huntingSince: '',
        status: 'Medziotojas'
    };

    const [members, setMembers] = useState<Member[]>([]);
    const [memberDialog, setMemberDialog] = useState(false);
    const [deleteMemberDialog, setDeleteMemberDialog] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
    const [member, setMember] = useState<Member>(emptyMember);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<Member>>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
      const res = await fetch('https://localhost:7091/api/Member');
      const data = await res.json();
        setMembers(data);
    };

    const openNew = () => {
        setMember(emptyMember);
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

        if (member.name.trim()) {
            if (!member.id) {
              const res = await fetch('https://localhost:7091/api/Member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(member)
            });
                const newMember = await res.json();
                setMembers((prev) => [...prev, newMember]);
                toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Member Created', life: 3000 });
            }
            setMemberDialog(false);
            setMember(emptyMember);
        }
    };

    const confirmDeleteMember = (member: Member) => {
        setMember(member);
        setDeleteMemberDialog(true);
    };

    const deleteMember = async () => {
        if (member.id) {
          await fetch(`https://localhost:7091/api/Member/${member.id}`, { method: 'DELETE' });
          setMembers(members.filter(m => m.id !== member.id));
            setDeleteMemberDialog(false);
            toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Member Deleted', life: 3000 });
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Member) => {
        const val = e.target.value || '';
        setMember({ ...member, [field]: val });
    };

    const leftToolbarTemplate = () => {
        return (
            <Button label="Naujas narys" icon="pi pi-plus" severity="success" className="mr-2" onClick={openNew} />
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Klubo narių administravimas</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Paieška..." />
            </span>
        </div>
    );

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('lt-LT'); // or 'en-GB' if you want dd/mm/yyyy
  };

    const memberDialogFooter = (
        <>
            <Button label="Atšaukti" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Išsaugoti" icon="pi pi-check" text onClick={saveMember} />
        </>
    );

    const deleteMemberDialogFooter = (
        <>
            <Button label="Ne" icon="pi pi-times" text onClick={hideDeleteMemberDialog} />
            <Button label="Taip" icon="pi pi-check" text onClick={deleteMember} />
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
                        selection={selectedMembers}
                        onSelectionChange={(e) => setSelectedMembers(e.value as Member[])}
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
                        <Column field="name" header="Vardas Pavardė" sortable></Column>
                        <Column field="birthDate" header="Gimimo data" sortable body={(rowData) => formatDate(rowData.birthDate)}></Column>                        
                        <Column field="photo" header="Nuotrauka" body={(rowData) => <img src={rowData.photo} alt={rowData.name} width="50" height="50" style={{ borderRadius: '50%' }} />} />
                        <Column field="activity" header="Aktyvumas (%)" sortable></Column>
                        <Column field="huntingSince" header="Medžioja nuo" sortable body={(rowData) => formatDate(rowData.huntingSince)}></Column>
                        <Column field="status" header="Statusas" sortable></Column>
                        <Column body={(rowData) => (
                            <>
                                <Button icon="pi pi-trash" severity="danger" onClick={() => confirmDeleteMember(rowData)} />
                            </>
                        )}></Column>
                    </DataTable>

                    <Dialog visible={memberDialog} style={{ width: '450px' }} header="Nario informacija" modal className="p-fluid" footer={memberDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="name">Vardas Pavardė</label>
                            <InputText id="name" value={member.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus />
                        </div>
                        <div className="field">
                            <label htmlFor="birthDate">Gimimo data</label>
                            <InputText id="birthDate" value={member.birthDate} onChange={(e) => onInputChange(e, 'birthDate')} placeholder="yyyy-mm-dd" required />
                        </div>
                        <div className="field">
                            <label htmlFor="photo">Nuotrauka</label>
                            <InputText id="photo" value={member.photo} onChange={(e) => onInputChange(e, 'photo')} />
                        </div>
                        <div className="field">
                            <label htmlFor="activity">Aktyvumas</label>
                            <InputText id="activity" value={member.activity.toString()} onChange={(e) => onInputChange(e, 'activity')} />
                        </div>
                        <div className="field">
                            <label htmlFor="huntingSince">Medžioja nuo</label>
                            <InputText id="huntingSince" value={member.huntingSince} onChange={(e) => onInputChange(e, 'huntingSince')} placeholder="yyyy-mm-dd" />
                        </div>
                        <div className="field">
                            <label htmlFor="status">Statusas</label>
                            <InputText id="status" value={member.status} onChange={(e) => onInputChange(e, 'status')} />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteMemberDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteMemberDialogFooter} onHide={hideDeleteMemberDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {member && (<span>Ar tikrai norite ištrinti <b>{member.name}</b>?</span>)}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
        </RoleGuard>
    );
};

export default MembersCrud;

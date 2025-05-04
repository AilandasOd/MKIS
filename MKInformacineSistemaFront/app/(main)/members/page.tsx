/* eslint-disable @next/next/no-img-element */
'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useState } from 'react';

interface Member {
    id: string;
    name: string;
    birthDate: string;
    photo: string;
    activity: number;
    huntingSince: string;
    status: string;
}

const MemberTable = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    useEffect(() => {
        setMembers([
            {
                id: '1',
                name: 'Rimas Rimauskas',
                birthDate: '1990-05-15',
                photo: 'https://randomuser.me/api/portraits/men/1.jpg',
                activity: 75,
                huntingSince: '2015-06-01',
                status: 'Medžiotojas'
            },
            {
                id: '2',
                name: 'Kotryna Kotrynaite',
                birthDate: '1985-11-22',
                photo: 'https://randomuser.me/api/portraits/women/2.jpg',
                activity: 55,
                huntingSince: '2017-03-14',
                status: 'Medžiotojas'
            },
            {
                id: '3',
                name: 'Tomas Tomauskas',
                birthDate: '1993-01-10',
                photo: 'https://randomuser.me/api/portraits/men/3.jpg',
                activity: 90,
                huntingSince: '2019-09-20',
                status: 'Medžiotojas'
            }
        ]);
    }, []);

    const calculateAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const photoBodyTemplate = (rowData: Member) => {
        return <img src={rowData.photo} alt={rowData.name} width={50} height={50} style={{ borderRadius: '50%' }} />;
    };

    const ageBodyTemplate = (rowData: Member) => {
        return <span>{calculateAge(rowData.birthDate)} years</span>;
    };

    const activityBodyTemplate = (rowData: Member) => {
        return <div className="flex align-items-center">
            <span className="font-bold mr-2">{rowData.activity}%</span>
            <div style={{ height: '6px', background: '#ccc', width: '100px', borderRadius: '4px' }}>
                <div style={{ width: `${rowData.activity}%`, background: '#4caf50', height: '100%', borderRadius: '4px' }}></div>
            </div>
        </div>;
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between">
                <h5 className="m-0">Klubo nariai</h5>
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={(e) => setGlobalFilterValue(e.target.value)} placeholder="Ieškoti pagal vardą" />
                </span>
            </div>
        );
    };

    const filteredMembers = members.filter((m) => m.name.toLowerCase().includes(globalFilterValue.toLowerCase()));

    return (
        <div className="card">
            <DataTable value={filteredMembers} paginator rows={10} header={renderHeader()} responsiveLayout="scroll">
                <Column header="Photo" body={photoBodyTemplate} style={{ width: '80px' }}></Column>
                <Column field="name" header="Vardas Pavardė" sortable></Column>
                <Column field="birthDate" header="Gimimo data" sortable></Column>
                <Column header="Metai" body={ageBodyTemplate}></Column>
                <Column header="Aktyvumas varyminėse medžioklėse" body={activityBodyTemplate}></Column>
                <Column field="huntingSince" header="Medžioklės bilieto išdavimo data" sortable></Column>
                <Column field="status" header="Statusas" sortable></Column>
            </DataTable>
        </div>
    );
};

export default MemberTable;

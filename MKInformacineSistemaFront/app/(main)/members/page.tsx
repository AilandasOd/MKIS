'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';

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

const nameBodyTemplate = (rowData: Member) => {
    const router = useRouter();

    return (
        <a 
            className="text-primary cursor-pointer hover:underline" 
            onClick={() => router.push(`/members/${rowData.id}`)}
        >
            {rowData.name}
        </a>
    );
};

const MembersView = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
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
        } finally {
            setLoading(false);
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
                severity={rowData.status === 'Administratorius' ? 'danger' : 'success'}
            />
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Club Members</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText 
                    type="search" 
                    onInput={(e) => setGlobalFilter(e.currentTarget.value)} 
                    placeholder="Search..." 
                />
            </span>
        </div>
    );

    return (
        <div className="card">
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
            >
                <Column header="Name" body={nameBodyTemplate} field="name" sortable />
                <Column header="Photo" body={photoBodyTemplate} style={{ width: '70px' }} />
                <Column field="age" header="Age" sortable style={{ width: '70px' }} />
                <Column 
                    field="huntingSince" 
                    header="Hunter Since" 
                    body={(rowData) => formatDate(rowData.huntingSince)} 
                    sortable 
                />
                <Column header="Activity" body={activityBodyTemplate} field="activity" sortable />
                <Column header="Status" body={statusBodyTemplate} field="status" sortable style={{ width: '120px' }} />
            </DataTable>

            <div className="mt-4">
                <h5>Activity Legend</h5>
                <div className="grid">
                    <div className="col-12 md:col-4">
                        <Card className="p-3">
                            <div className="flex align-items-center">
                                <div className="relative h-1.5 w-24 bg-gray-200 rounded mr-3">
                                    <div className="absolute h-1.5 rounded bg-green-500" style={{ width: '90%' }}></div>
                                </div>
                                <span>High Activity (75%)</span>
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
    );
};

export default MembersView;
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useClub } from '../../../../context/ClubContext';
import ClubGuard from '../../../../context/ClubGuard';

const BloodTestsListPage = () => {
    const [tests, setTests] = useState([]);
    const [expandedRows, setExpandedRows] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const router = useRouter();
    const toast = useRef(null);
    const { selectedClub } = useClub();

    useEffect(() => {
        // Prevent multiple fetch attempts
        if (hasAttemptedFetch || !selectedClub) return;
        
        const fetchBloodTests = async () => {
            try {
                setLoading(true);
                setHasAttemptedFetch(true); // Mark that we've attempted to fetch
                
                const response = await fetch(`https://localhost:7091/api/BloodTests?clubId=${selectedClub.id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                setTests(data);
            } catch (error) {
                console.error('Error fetching blood tests:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load blood tests: ' + error.message,
                    life: 3000
                });
                // Set empty array to prevent infinite loading
                setTests([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchBloodTests();
    }, [selectedClub, hasAttemptedFetch]); // Only run when selectedClub changes and we haven't attempted fetch

    const statusTemplate = (rowData) => {
        const severity = 
            rowData.status === 'Patvirtinta' ? 'success' : 
            rowData.status === 'Laukiama' ? 'info' : 'warning';
        return <Tag value={rowData.status} severity={severity} />;
    };

    const dateTemplate = (rowData, field) => {
        return rowData[field] ? new Date(rowData[field]).toLocaleDateString() : '';
    };

    // Add action buttons template
    const actionTemplate = (rowData) => {
        return (
            <div className="flex gap-2 justify-content-center">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text"
                    tooltip="Edit Test"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent row expansion
                        router.push(`/tests/edit/${rowData.id}`);
                    }}
                />
            </div>
        );
    };

    const rowExpansionTemplate = (data) => {
        return (
            <div className="p-3">
                <h5>Test Description</h5>
                <p>{data.description}</p>
                
                <h5 className="mt-4">Participants</h5>
                {data.participants && data.participants.length > 0 ? (
                    <DataTable value={data.participants} responsiveLayout="scroll">
                        <Column field="userName" header="Name" />
                    </DataTable>
                ) : (
                    <p>No participants assigned</p>
                )}
            </div>
        );
    };

    const header = (
        <div className="flex justify-content-between align-items-center">
            <h5 className="m-0">Tyrimai</h5>
            <Button 
                label="Pridėti tyrimą" 
                icon="pi pi-plus" 
                onClick={() => router.push('/tests/create')} 
            />
        </div>
    );

    return (
        <ClubGuard>
            <div className="card">
                <Toast ref={toast} />
                
                <DataTable 
                    value={tests} 
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    header={header}
                    loading={loading}
                    dataKey="id"
                    paginator 
                    rows={10} 
                    rowsPerPageOptions={[5, 10, 25]} 
                    className="p-datatable-gridlines"
                    emptyMessage="No blood tests found"
                >
                    <Column expander style={{ width: '3em' }} />
                    <Column field="testName" header="Tyrimų pavadinimas" sortable />
                    <Column field="animalType" header="Žvėris" sortable />
                    <Column field="dateHunted" header="Sumedžiojimo data" body={(rowData) => dateTemplate(rowData, 'dateHunted')} sortable />
                    <Column field="testStartDate" header="Tyrimų pridavimo data" body={(rowData) => dateTemplate(rowData, 'testStartDate')} sortable />
                    <Column field="status" header="Statusas" body={statusTemplate} sortable />
                    <Column field="completedDate" header="Rezultatų gavimo data" body={(rowData) => dateTemplate(rowData, 'completedDate')} sortable />
                    <Column body={actionTemplate} header="Actions" style={{ width: '8rem' }} />
                </DataTable>
            </div>
        </ClubGuard>
    );
};

export default BloodTestsListPage;
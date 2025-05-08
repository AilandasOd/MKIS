'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useClub } from '../../../../context/ClubContext';
import { useAuth } from '../../../../context/AuthContext';
import ClubGuard from '../../../../context/ClubGuard';

const BloodTestsListPage = () => {
    const [tests, setTests] = useState([]);
    const [expandedRows, setExpandedRows] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const router = useRouter();
    const toast = useRef(null);
    const { selectedClub } = useClub();
    const { userId } = useAuth();  // Get current user ID from auth context

    useEffect(() => {
        if (hasAttemptedFetch || !selectedClub) return;

        const fetchBloodTests = async () => {
            try {
                setLoading(true);
                setHasAttemptedFetch(true);
                const response = await fetch(`https://localhost:7091/api/BloodTests?clubId=${selectedClub.id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP klaida! Statusas: ${response.status}`);
                }

                const data = await response.json();
                setTests(data);
            } catch (error) {
                console.error('Klaida gaunant tyrimus:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Klaida',
                    detail: 'Nepavyko įkelti kraujo tyrimų: ' + error.message,
                    life: 3000
                });
                setTests([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBloodTests();
    }, [selectedClub, hasAttemptedFetch]);

    const statusTemplate = (rowData) => {
        const severity =
            rowData.status === 'Patvirtinta' ? 'success' :
            rowData.status === 'Laukiama' ? 'info' : 'warning';
        return <Tag value={rowData.status} severity={severity} />;
    };

    const dateTemplate = (rowData, field) => {
        return rowData[field] ? new Date(rowData[field]).toLocaleDateString('lt-LT') : '';
    };

    // Modified name template to show star if current user is a participant
    const nameTemplate = (rowData) => {
        // Check if current user is a participant in this test
        const isUserParticipant = rowData.participants && 
            rowData.participants.some(participant => participant.userId === userId);

        return (
            <div className="flex align-items-center">
                <span>{rowData.testName}</span>
                {isUserParticipant && (
                    <i className="pi pi-star-fill text-yellow-500 ml-2" 
                       style={{ fontSize: '0.85rem' }} 
                       title="Jūs esate šio tyrimo dalyvis" />
                )}
            </div>
        );
    };

    const actionTemplate = (rowData) => {
        return (
            <div className="flex gap-2 justify-content-center">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text"
                    tooltip="Redaguoti tyrimą"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tests/edit/${rowData.id}`);
                    }}
                />
            </div>
        );
    };

    const rowExpansionTemplate = (data) => {
        return (
            <div className="p-3">
                <h5>Tyrimo aprašymas</h5>
                <p>{data.description}</p>

                <h5 className="mt-4">Dalyviai</h5>
                {data.participants && data.participants.length > 0 ? (
                    <DataTable value={data.participants} responsiveLayout="scroll">
                        <Column field="userName" header="Vardas" />
                    </DataTable>
                ) : (
                    <p>Dalyviai nepriskirti</p>
                )}
            </div>
        );
    };

    const header = (
        <div className="flex justify-content-between align-items-center">
            <h5 className="m-0">Kraujo tyrimai</h5>
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
                    emptyMessage="Kraujo tyrimų nerasta"
                >
                    <Column expander style={{ width: '3em' }} />
                    <Column field="testName" header="Tyrimo pavadinimas" body={nameTemplate} sortable />
                    <Column field="animalType" header="Žvėries tipas" sortable />
                    <Column field="dateHunted" header="Sumedžiojimo data" body={(rowData) => dateTemplate(rowData, 'dateHunted')} sortable />
                    <Column field="testStartDate" header="Tyrimo pradžios data" body={(rowData) => dateTemplate(rowData, 'testStartDate')} sortable />
                    <Column field="status" header="Statusas" body={statusTemplate} sortable />
                    <Column field="completedDate" header="Rezultatų data" body={(rowData) => dateTemplate(rowData, 'completedDate')} sortable />
                    <Column body={actionTemplate} header="Veiksmai" style={{ width: '8rem' }} />
                </DataTable>
            </div>
        </ClubGuard>
    );
};

export default BloodTestsListPage;
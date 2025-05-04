'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import router for navigation
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

const TestTable = () => {
    const [tests, setTests] = useState<any[]>([]);
    const [expandedRows, setExpandedRows] = useState<any[]>([]);
    const [allExpanded, setAllExpanded] = useState(false);

    const router = useRouter(); // Initialize router

    const loggedInMemberId = '056618';

    useEffect(() => {
        setTests([
            {
                id: 'T001',
                testName: 'Šerno kraujo tyrimai',
                animalType: 'Šernas',
                dateHunted: '2025-04-01',
                testStartDate: '2025-04-03',
                status: 'Patvirtinta',
                completedDate: '2025-04-07',
                description: 'Priduoti šerno tyrimai iš medžioklės vykusios 2025-04-01.',
                members: [
                    { id: '056618', name: 'Tomas Tomauskas' },
                    { id: '124816', name: 'Kotryna Kotrynaitė' }
                ]
            },
            {
                id: 'T002',
                testName: 'Šerno kraujo tyrimai',
                animalType: 'Šernas',
                dateHunted: '2025-04-10',
                testStartDate: '2025-04-12',
                status: 'Laukiama',
                completedDate: null,
                description: 'Šerno kraujo tyrimai, kurį sumedžiojo Rimas.',
                members: [
                    { id: '562614', name: 'Rimas Rimauskas' },
                    { id: '124816', name: 'Kotryna Kontrynaitė' }
                ]
            },
            {
                id: 'T003',
                testName: 'Šerno kraujo tyrimai',
                animalType: 'Šernas',
                dateHunted: '2025-04-08',
                testStartDate: '2025-04-12',
                status: 'Netinkamas',
                completedDate: '2025-04-15',
                description: 'Tyrimai atiduoti, dėl vykstančio AKM.',
                members: [
                    { id: '562614', name: 'Rimas Rimauskas' },
                    { id: '124816', name: 'Kotryna Kotrynaitė' }
                ]
            }
        ]);
    }, []);

    const statusTemplate = (status: string) => {
        const severity = status === 'Patvirtinta' ? 'success' : status === 'Laukiama' ? 'info' : 'warning';
        return <Tag value={status} severity={severity} />;
    };

    const testNameBodyTemplate = (row: any) => {
        const isAssigned = row.members.some((m: any) => m.id === loggedInMemberId);
        return (
            <div className="flex align-items-center gap-2">
                <span>{row.testName}</span>
                {isAssigned && <i className="pi pi-star-fill text-yellow-500" title="Priskirta Jums"></i>}
            </div>
        );
    };

    const rowExpansionTemplate = (data: any) => {
        return (
            <div className="m-3">
                <h6 className="text-lg font-bold mb-2">Tyrimo aprašymas</h6>
                <p className="mb-4">{data.description}</p>

                <h6 className="text-lg font-bold mb-2">Priskirti klubo nariai</h6>
                <DataTable value={data.members} responsiveLayout="scroll">
                    <Column field="id" header="Medžiotojo bilieto numeris" />
                    <Column field="name" header="Vardas Pavardė" />
                </DataTable>
            </div>
        );
    };

    const toggleAll = () => {
        allExpanded ? collapseAll() : expandAll();
    };

    const expandAll = () => {
        const _expanded: any = {};
        tests.forEach((t) => (_expanded[t.id] = true));
        setExpandedRows(_expanded);
        setAllExpanded(true);
    };

    const collapseAll = () => {
        setExpandedRows([]);
        setAllExpanded(false);
    };

    const header = (
        <div className="flex align-items-center mb-3 gap-3">
            <Button label="Pridėti tyrimą" icon="pi pi-plus" onClick={() => router.push('/tests/create')} />
            <Button icon={allExpanded ? 'pi pi-minus' : 'pi pi-plus'} label={allExpanded ? 'Suskleisti' : 'Išskleisti'} onClick={toggleAll} />
        </div>
    );

    return (
        <div className="card">
            <h5>Tyrimai</h5>
            {header}
            <DataTable
                value={tests}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                dataKey="id"
                rowExpansionTemplate={rowExpansionTemplate}
                responsiveLayout="scroll"
            >
                <Column expander style={{ width: '3em' }} />
                <Column header="Tyrimų pavadinimas" body={testNameBodyTemplate} />
                <Column field="animalType" header="Žvėris" />
                <Column field="dateHunted" header="Sumedžiojimo data" body={(row) => row.dateHunted} />
                <Column field="testStartDate" header="Tyrimų pridavimo data" body={(row) => row.testStartDate} />
                <Column field="status" header="Statusas" body={(row) => statusTemplate(row.status)} />
                <Column field="completedDate" header="Rezultatų gavimo data" body={(row) => row.completedDate} />
            </DataTable>
        </div>
    );
};

export default TestTable;

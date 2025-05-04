'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { addLocale } from 'primereact/api'; // Important for localization

const CreateTestPage = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        testName: '',
        animalType: 'Šernas',
        dateHunted: null as Date | null,
        testStartDate: null as Date | null,
        description: '',
        status: '',
        members: [] as any[]
    });

    const clubMembers = [
        { id: 'M001', name: 'Tomas Tomauskas' },
        { id: 'M002', name: 'Kotryna Kotrynaitė' },
        { id: 'M003', name: 'Rimas Rimauskas' },
    ];

    const statusOptions = [
        { label: 'Patvirtinta', value: 'Patvirtinta' },
        { label: 'Laukiama', value: 'Laukiama' },
        { label: 'Netinkamas', value: 'Netinkamas' }
    ];

    const saveTest = () => {
        console.log('Saving test:', formData);

        router.push('/tests/list');
    };

    // Add Lithuanian locale settings
    addLocale('lt', {
        firstDayOfWeek: 1,
        dayNames: ['sekmadienis', 'pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis', 'šeštadienis'],
        dayNamesShort: ['Sek', 'Pir', 'Ant', 'Tre', 'Ket', 'Pen', 'Šeš'],
        dayNamesMin: ['S', 'P', 'A', 'T', 'K', 'Pn', 'Š'],
        monthNames: ['sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis', 'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis'],
        monthNamesShort: ['Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir', 'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Grd'],
        today: 'Šiandien',
        clear: 'Išvalyti'
    });

    return (
        <div className="card p-5">
            <h5>Pridėti naują tyrimą</h5>
            <div className="grid formgrid p-fluid">

                <div className="field col-12 md:col-6">
                    <label>Pavadinimas</label>
                    <InputText value={formData.testName} onChange={(e) => setFormData({ ...formData, testName: e.target.value })} />
                </div>

                <div className="field col-12 md:col-6">
                    <label>Žvėries tipas</label>
                    <InputText value={formData.animalType} onChange={(e) => setFormData({ ...formData, animalType: e.target.value })} />
                </div>

                <div className="field col-12 md:col-6">
                    <label>Sumedžiojimo data</label>
                    <Calendar
                        value={formData.dateHunted}
                        onChange={(e) => setFormData({ ...formData, dateHunted: e.value })}
                        dateFormat="yy-mm-dd"
                        showIcon
                        locale="lt"
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label>Tyrimų pridavimo data</label>
                    <Calendar
                        value={formData.testStartDate}
                        onChange={(e) => setFormData({ ...formData, testStartDate: e.value })}
                        dateFormat="yy-mm-dd"
                        showIcon
                        locale="lt"
                    />
                </div>

                <div className="field col-12">
                    <label>Aprašymas</label>
                    <InputText value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="field col-12 md:col-6">
                    <label>Statusas</label>
                    <Dropdown
                        value={formData.status}
                        options={statusOptions}
                        onChange={(e) => setFormData({ ...formData, status: e.value })}
                        placeholder="Pasirinkite statusą"
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label>Priskirti nariai</label>
                    <MultiSelect
                        value={formData.members}
                        options={clubMembers}
                        onChange={(e) => setFormData({ ...formData, members: e.value })}
                        optionLabel="name"
                        placeholder="Pasirinkite narius"
                        filter
                        filterPlaceholder="Ieškoti nario"
                        display="chip" // nice visual
                    />
                </div>

            </div>

            <div className="flex gap-3 mt-4">
                <Button label="Išsaugoti" icon="pi pi-save" onClick={saveTest} />
                <Button label="Atšaukti" icon="pi pi-times" severity="secondary" onClick={() => router.push('/tests/list')} />
            </div>
        </div>
    );
};

export default CreateTestPage;

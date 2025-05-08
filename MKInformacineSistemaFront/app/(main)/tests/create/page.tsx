'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useClub } from '../../../../context/ClubContext';
import ClubGuard from '../../../../context/ClubGuard';

const CreateBloodTestPage = () => {
    const router = useRouter();
    const toast = useRef(null);
    const { selectedClub } = useClub();
    const [members, setMembers] = useState([]);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        testName: '',
        animalType: 'Šernas',
        dateHunted: null,
        testStartDate: null,
        description: '',
        status: 'Laukiama',
        participantIds: []
    });

    const statusOptions = [
        { label: 'Patvirtinta', value: 'Patvirtinta' },
        { label: 'Laukiama', value: 'Laukiama' },
        { label: 'Netinkamas', value: 'Netinkamas' }
    ];

    useEffect(() => {
        if (hasAttemptedFetch || !selectedClub) return;

        const fetchMembers = async () => {
            try {
                setLoading(true);
                setHasAttemptedFetch(true);

                const response = await fetch(`https://localhost:7091/api/Members?clubId=${selectedClub.id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP klaida! Statusas: ${response.status}`);
                }

                const data = await response.json();
                setMembers(data);
            } catch (error) {
                console.error('Klaida gaunant narius:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Klaida',
                    detail: 'Nepavyko įkelti narių: ' + error.message,
                    life: 3000
                });
                setMembers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [selectedClub, hasAttemptedFetch]);

    const saveTest = async () => {
        if (!formData.testName || !formData.animalType || !formData.dateHunted || !formData.testStartDate) {
            toast.current?.show({
                severity: 'error',
                summary: 'Validacijos klaida',
                detail: 'Prašome užpildyti visus privalomus laukus',
                life: 3000
            });
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(`https://localhost:7091/api/BloodTests?clubId=${selectedClub.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP klaida! Statusas: ${response.status}`);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Pavyko',
                detail: 'Kraujo tyrimas sėkmingai sukurtas',
                life: 3000
            });

            setTimeout(() => {
                router.push('/tests/list');
            }, 1500);
        } catch (error) {
            console.error('Klaida kuriant tyrimą:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Klaida',
                detail: 'Nepavyko sukurti tyrimo: ' + error.message,
                life: 3000
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ClubGuard>
            <div className="card p-5">
                <Toast ref={toast} />
                <h5>Pridėti naują kraujo tyrimą</h5>
                <div className="grid formgrid p-fluid">
                    <div className="field col-12 md:col-6">
                        <label>Pavadinimas</label>
                        <InputText
                            value={formData.testName}
                            onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Žvėries tipas</label>
                        <InputText
                            value={formData.animalType}
                            onChange={(e) => setFormData({ ...formData, animalType: e.target.value })}
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Sumedžiojimo data</label>
                        <Calendar
                            value={formData.dateHunted}
                            onChange={(e) => setFormData({ ...formData, dateHunted: e.value })}
                            dateFormat="yy-mm-dd"
                            showIcon
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Tyrimo pradžios data</label>
                        <Calendar
                            value={formData.testStartDate}
                            onChange={(e) => setFormData({ ...formData, testStartDate: e.value })}
                            dateFormat="yy-mm-dd"
                            showIcon
                        />
                    </div>

                    <div className="field col-12">
                        <label>Aprašymas</label>
                        <InputText
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
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
                            value={formData.participantIds}
                            options={members}
                            onChange={(e) => setFormData({ ...formData, participantIds: e.value })}
                            optionLabel="name"
                            optionValue="userId"
                            placeholder="Pasirinkite narius"
                            filter
                            filterPlaceholder="Ieškoti nario"
                            display="chip"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <Button
                        label="Išsaugoti"
                        icon="pi pi-save"
                        onClick={saveTest}
                        loading={submitting}
                    />
                    <Button
                        label="Atšaukti"
                        icon="pi pi-times"
                        severity="secondary"
                        onClick={() => router.push('/tests/list')}
                        disabled={submitting}
                    />
                </div>
            </div>
        </ClubGuard>
    );
};

export default CreateBloodTestPage;

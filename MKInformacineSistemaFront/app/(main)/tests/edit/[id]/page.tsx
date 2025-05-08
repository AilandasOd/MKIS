'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useClub } from '../../../../../context/ClubContext';
import ClubGuard from '../../../../../context/ClubGuard';

const EditBloodTestPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const toast = useRef(null);
    const { selectedClub } = useClub();

    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        testName: '',
        animalType: '',
        dateHunted: null,
        testStartDate: null,
        description: '',
        status: '',
        participantIds: []
    });

    const statusOptions = [
        { label: 'Patvirtinta', value: 'Patvirtinta' },
        { label: 'Laukiama', value: 'Laukiama' },
        { label: 'Netinkamas', value: 'Netinkamas' }
    ];

    useEffect(() => {
        if (!selectedClub || !id) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                const testResponse = await fetch(`https://localhost:7091/api/BloodTests/${id}?clubId=${selectedClub.id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });

                if (!testResponse.ok) {
                    throw new Error(`HTTP klaida! Statusas: ${testResponse.status}`);
                }

                const testData = await testResponse.json();
                setTest(testData);

                setFormData({
                    testName: testData.testName,
                    animalType: testData.animalType,
                    dateHunted: testData.dateHunted ? new Date(testData.dateHunted) : null,
                    testStartDate: testData.testStartDate ? new Date(testData.testStartDate) : null,
                    description: testData.description,
                    status: testData.status,
                    participantIds: testData.participants ? testData.participants.map(p => p.userId) : []
                });

                const membersResponse = await fetch(`https://localhost:7091/api/Members?clubId=${selectedClub.id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });

                if (!membersResponse.ok) {
                    throw new Error(`HTTP klaida! Statusas: ${membersResponse.status}`);
                }

                const membersData = await membersResponse.json();
                setMembers(membersData);
            } catch (error) {
                console.error('Klaida gaunant duomenis:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Klaida',
                    detail: 'Nepavyko įkelti tyrimo duomenų: ' + error.message,
                    life: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedClub, id]);

    const handleSubmit = async () => {
        if (!formData.testName || !formData.animalType || !formData.dateHunted || !formData.testStartDate || !formData.status) {
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

            const updateData = {
                ...formData,
                id: parseInt(id)
            };

            const response = await fetch(`https://localhost:7091/api/BloodTests/${id}?clubId=${selectedClub.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP klaida! Statusas: ${response.status}`);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Pavyko',
                detail: 'Tyrimas sėkmingai atnaujintas',
                life: 3000
            });

            setTimeout(() => {
                router.push('/tests/list');
            }, 1500);
        } catch (error) {
            console.error('Klaida atnaujinant tyrimą:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Klaida',
                detail: 'Nepavyko atnaujinti tyrimo: ' + error.message,
                life: 3000
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: '70vh' }}>
                <ProgressSpinner />
            </div>
        );
    }

    if (!test) {
        return (
            <div className="card p-5 text-center">
                <Toast ref={toast} />
                <i className="pi pi-exclamation-triangle text-3xl text-yellow-500 mb-3"></i>
                <h3>Tyrimas nerastas</h3>
                <p>Tyrimas, kurio ieškote, nerastas arba nepasiekiamas.</p>
                <Button
                    label="Grįžti į sąrašą"
                    icon="pi pi-arrow-left"
                    onClick={() => router.push('/tests/list')}
                    className="mt-3"
                />
            </div>
        );
    }

    return (
        <ClubGuard>
            <div className="card p-5">
                <Toast ref={toast} />
                <h5>Redaguoti kraujo tyrimą</h5>
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
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <Button
                        label="Išsaugoti"
                        icon="pi pi-save"
                        onClick={handleSubmit}
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

export default EditBloodTestPage;

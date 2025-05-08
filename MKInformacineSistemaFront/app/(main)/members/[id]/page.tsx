'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { useParams } from 'next/navigation';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { useApiClient } from '../../../../utils/apiClient';
import ClubGuard from '../../../../context/ClubGuard';

interface Member {
    id: string | number;
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

const MemberDetailPage = () => {
    const { id } = useParams();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const toast = useRef<Toast>(null);
    const { fetchWithClub, selectedClub } = useApiClient();
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (!id || !selectedClub || hasFetchedRef.current) return;

        const fetchMember = async () => {
            try {
                setLoading(true);
                const data = await fetchWithClub(`Members/${id}`);
                setMember(data);
                setError(null);
                hasFetchedRef.current = true;
            } catch (err) {
                console.error('Klaida gaunant nario informaciją:', err);
                setError('Įvyko klaida gaunant nario informaciją.');
                toast.current?.show({
                    severity: 'error',
                    summary: 'Klaida',
                    detail: 'Nepavyko įkelti nario duomenų',
                    life: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMember();
    }, [id, selectedClub, fetchWithClub]);

    if (loading) {
        return <div className="flex justify-content-center my-5">Įkeliama nario informacija...</div>;
    }

    if (error || !member) {
        return (
            <Card className="p-4 my-3">
                <div className="text-center text-xl text-red-500">{error || 'Narys nerastas'}</div>
            </Card>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('lt-LT');
    };

    return (
        <ClubGuard>
            <div className="p-3">
                <Toast ref={toast} />
                <Card className="p-4">
                    <div className="grid">
                        <div className="col-12 md:col-4 flex flex-column align-items-center">
                            <h2 className="text-2xl font-bold mb-2">{member.name}</h2>
                            <Tag
                                value={
                                    member.status === 'Owner' ? 'Vadovas' :
                                    member.status === 'Admin' ? 'Administratorius' : 'Narys'
                                }
                                severity={member.status === 'Administratorius' ? 'danger' : 'success'}
                                className="mb-3"
                            />

                            <div className="w-full mt-3">
                                <div className="mb-2">
                                    <span className="font-semibold">Aktyvumas varyminėse medžioklėse</span>
                                </div>
                                <ProgressBar
                                    value={member.activity}
                                    showValue={true}
                                    className="h-2rem"
                                />
                            </div>
                        </div>

                        <div className="col-12 md:col-8">
                            <h3 className="text-xl font-semibold mb-3">Nario informacija</h3>
                            <Divider />

                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-600">El. paštas</div>
                                        <div className="font-medium">{member.email}</div>
                                    </div>
                                </div>

                                <div className="col-12 md:col-6">
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-600">Telefono numeris</div>
                                        <div className="font-medium">{member.phoneNumber || 'Nenurodytas'}</div>
                                    </div>
                                </div>

                                <div className="col-12 md:col-6">
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-600">Amžius</div>
                                        <div className="font-medium">{member.age} metų</div>
                                    </div>
                                </div>

                                <div className="col-12 md:col-6">
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-600">Gimimo data</div>
                                        <div className="font-medium">{formatDate(member.birthDate)}</div>
                                    </div>
                                </div>

                                <div className="col-12 md:col-6">
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-600">Medžioja nuo</div>
                                        <div className="font-medium">{formatDate(member.huntingSince)}</div>
                                    </div>
                                </div>

                                <div className="col-12 md:col-6">
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-600">Medžioklės patirtis</div>
                                        <div className="font-medium">
                                            {new Date().getFullYear() - new Date(member.huntingSince).getFullYear()} metų
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </ClubGuard>
    );
};

export default MemberDetailPage;

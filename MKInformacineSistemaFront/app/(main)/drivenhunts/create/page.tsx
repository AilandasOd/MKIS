'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { useApiClient } from '../../../../utils/apiClient';
import ClubGuard from '../../../../context/ClubGuard';

interface Member {
  id: string;
  name: string;
  status: string;
  userId: string;
}

interface CreateDrivenHuntDto {
  name: string;
  location: string;
  date: Date | null;
  game: string;
  leaderId: string;
  participantIds: string[];
}

const DrivenHuntCreate = () => {
  const [formData, setFormData] = useState<CreateDrivenHuntDto>({
    name: '',
    location: '',
    date: null,
    game: '',
    leaderId: '',
    participantIds: []
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { fetchWithClub, selectedClub } = useApiClient();
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current || !selectedClub) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchWithClub('Members');
        setMembers(data);

        const defaultLeader = data.find(m => m.status === 'Owner' || m.status === 'Admin');
        if (defaultLeader) {
          setFormData(prev => ({
            ...prev,
            leaderId: defaultLeader.userId
          }));
        }

        hasFetchedRef.current = true;
      } catch (error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Klaida',
          detail: 'Nepavyko įkelti klubo narių',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [fetchWithClub, selectedClub]);

  const gameTypes = [
    { label: 'Šernai', value: 'Šernai' },
    { label: 'Elniai', value: 'Elniai' },
    { label: 'Stirnos', value: 'Stirnos' },
    { label: 'Lapės', value: 'Lapės' },
    { label: 'Šernai, stirnos', value: 'Šernai, stirnos' },
    { label: 'Stirnos, lapės', value: 'Stirnos, lapės' },
    { label: 'Šernai, stirnos, lapės', value: 'Šernai, stirnos, lapės' },
    { label: 'Įvairūs žvėrys', value: 'Įvairūs žvėrys' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.name || !formData.location || !formData.date || !formData.leaderId) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validacijos klaida',
        detail: 'Prašome užpildyti visus privalomus laukus',
        life: 3000
      });
      return;
    }

    const participantIds = [...formData.participantIds];
    if (participantIds.length === 0 || !participantIds.includes(formData.leaderId)) {
      participantIds.push(formData.leaderId);
    }

    setSubmitting(true);

    try {
      const payload = { ...formData, participantIds };

      const response = await fetch(`https://localhost:7091/api/DrivenHunts?clubId=${selectedClub?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Serverio klaida. Statusas: ${response.status}`);
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Pavyko',
        detail: 'Medžioklė sėkmingai sukurta',
        life: 3000
      });

      setTimeout(() => {
        router.push('/drivenhunts/list');
      }, 1500);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: error instanceof Error ? error.message : 'Nepavyko sukurti medžioklės',
        life: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/drivenhunts/list');
  };

  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        <Card className="mb-0">
          <div className="flex justify-content-between align-items-center mb-5">
            <h2 className="text-2xl font-bold m-0">Sukurti varyminę medžioklę</h2>
            <Button
              icon="pi pi-arrow-left"
              label="Grįžti į sąrašą"
              className="p-button-outlined"
              onClick={handleCancel}
              type="button"
            />
          </div>

          <form onSubmit={handleSubmit} className="grid formgrid p-fluid">
            <div className="field col-12 md:col-6">
              <label htmlFor="name" className="font-bold">Pavadinimas*</label>
              <InputText
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={classNames({ 'p-invalid': submitted && !formData.name })}
                placeholder="Įveskite medžioklės pavadinimą"
                disabled={loading}
              />
              {submitted && !formData.name && <small className="p-error">Pavadinimas yra privalomas</small>}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="location" className="font-bold">Vieta*</label>
              <InputText
                id="location"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className={classNames({ 'p-invalid': submitted && !formData.location })}
                placeholder="Įveskite vietą"
                disabled={loading}
              />
              {submitted && !formData.location && <small className="p-error">Vieta yra privaloma</small>}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="date" className="font-bold">Data*</label>
              <Calendar
                id="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.value as Date })}
                showIcon
                className={classNames({ 'p-invalid': submitted && !formData.date })}
                placeholder="Pasirinkite datą"
                minDate={new Date()}
                disabled={loading}
              />
              {submitted && !formData.date && <small className="p-error">Data yra privaloma</small>}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="leader" className="font-bold">Vadovas*</label>
              <Dropdown
                id="leader"
                value={formData.leaderId}
                options={members}
                onChange={e => setFormData({ ...formData, leaderId: e.value })}
                optionLabel="name"
                optionValue="userId"
                filter
                placeholder="Pasirinkite vadovą"
                className={classNames({ 'p-invalid': submitted && !formData.leaderId })}
                disabled={loading}
              />
              {submitted && !formData.leaderId && <small className="p-error">Vadovas yra privalomas</small>}
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="participants" className="font-bold">Dalyviai</label>
              <MultiSelect
                id="participants"
                value={formData.participantIds}
                options={members}
                onChange={e => setFormData({ ...formData, participantIds: e.value })}
                optionLabel="name"
                optionValue="userId"
                filter
                placeholder="Pasirinkite dalyvius"
                display="chip"
                disabled={loading}
              />
              <small className="text-color-secondary">Vadovas bus automatiškai įtrauktas į dalyvius</small>
            </div>

            <div className="col-12 flex gap-2 justify-content-end mt-4">
              <Button
                label="Atšaukti"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={handleCancel}
                disabled={submitting}
                type="button"
              />
              <Button
                label="Sukurti"
                icon="pi pi-check"
                type="submit"
                loading={submitting}
                disabled={loading}
              />
            </div>
          </form>
        </Card>
      </div>
    </ClubGuard>
  );
};

export default DrivenHuntCreate;

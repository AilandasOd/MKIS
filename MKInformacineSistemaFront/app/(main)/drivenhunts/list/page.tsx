'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { format, isBefore, isAfter, isToday, parseISO } from 'date-fns';
import { useApiClient } from '../../../../utils/api';
import ClubGuard from '../../../../context/ClubGuard';

const DrivenHuntsPage = () => {
  const router = useRouter();
  const { fetchWithClub } = useApiClient();
  const [hunts, setHunts] = useState([]);
  const [filteredHunts, setFilteredHunts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const toast = useRef(null);
  const rows = 5;

  useEffect(() => {
    const fetchHunts = async () => {
      try {
        setLoading(true);
        const data = await fetchWithClub('DrivenHunts');
        setHunts(data);
        setFilteredHunts(data);
        setTotalRecords(data.length);
      } catch (error) {
        console.error('Error fetching driven hunts:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load driven hunts',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHunts();
  }, [fetchWithClub]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHunts(hunts);
      setTotalRecords(hunts.length);
    } else {
      const filtered = hunts.filter(hunt => 
        hunt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hunt.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHunts(filtered);
      setTotalRecords(filtered.length);
    }
  }, [searchTerm, hunts]);

  const getStatus = (dateString) => {
    const huntDate = parseISO(dateString);
    const today = new Date();

    if (isToday(huntDate)) return "Vykstanti";
    if (isAfter(huntDate, today)) return "Būsima";
    if (isBefore(huntDate, today)) return "Įvykusi";
    return "";
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case 'Būsima':
        return 'primary';
      case 'Vykstanti':
        return 'warning';
      case 'Įvykusi':
        return 'success';
      default:
        return null;
    }
  };

  const onPageChange = (e) => {
    setFirst(e.first);
  };

  const handleCardClick = (huntId) => {
    router.push(`/drivenhunts/drivenhunt/${huntId}`);
  };

  if (loading) {
    return <div className="flex justify-content-center">Loading driven hunts...</div>;
  }

  return (
    <ClubGuard>
      <div className="p-8">
        <Toast ref={toast} />
        <h1 className="text-4xl font-bold mb-8">Varyminės medžioklės</h1>
        <div className="mb-6">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setFirst(0); }}
              placeholder="Ieškoti pagal medžiojimo vardą"
              className="w-full md:w-30rem"
            />
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHunts.slice(first, first + rows).map((hunt) => {
            const status = getStatus(hunt.date);
            return (
              <div
                key={hunt.id}
                className="w-full cursor-pointer transition-transform transform hover:scale-105"
                onClick={() => handleCardClick(hunt.id)}
              >
                <Card
                  title={hunt.name}
                  subTitle={`${hunt.location} | ${format(parseISO(hunt.date), 'yyyy-MM-dd')}`}
                  className="rounded-2xl shadow-md h-full"
                >
                  <div className="text-base">
                    <p><strong>Vieta:</strong> {hunt.location}</p>
                    <p><strong>Data:</strong> {format(parseISO(hunt.date), 'yyyy-MM-dd')}</p>
                    <p><strong>Sumedžioti žvėrys:</strong> {hunt.game}</p>
                    <p><strong>Vadovas:</strong> {hunt.leaderName}</p>
                    <p>
                      <strong>Statusas:</strong>{' '}
                      <Tag value={status} severity={getStatusSeverity(status)} />
                    </p>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
        <Paginator first={first} rows={rows} totalRecords={totalRecords} onPageChange={onPageChange} className="mt-6" />
      </div>
    </ClubGuard>
  );
};

export default DrivenHuntsPage;
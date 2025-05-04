'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { format, isBefore, isAfter, isToday, parseISO } from 'date-fns';

const hunts = [
  {
    id: 1,
    name: "Rudeninis miško medžiojimas",
    location: "Juodmedžio miškas",
    date: "2025-10-15",
    game: "Šernas, Elnis",
    leader: "Tomas Tomauskas",
  },
  {
    id: 2,
    name: "žieminis kalnų varymas",
    location: "Sniego viršūnės",
    date: "2025-12-03",
    game: "Briedis, Vilkas",
    leader: "Rimas Rimauskas",
  },
  {
    id: 3,
    name: "Pavasario upės vaikymasis",
    location: "Gluosnio upės krantas",
    date: "2025-04-07",
    game: "Antis, Triušis",
    leader: "Rimas Rimauskas",
  },
  {
    id: 4,
    name: "Pavasario upės vaikymasis",
    location: "Gluosnio upės krantas",
    date: "2025-04-07",
    game: "Antis, Triušis",
    leader: "Kotryna Kotrynaitė",
  },
];

function getStatus(dateString) {
  const huntDate = parseISO(dateString);
  const today = new Date();

  if (isToday(huntDate)) return "Vykstanti";
  if (isAfter(huntDate, today)) return "Būsima";
  if (isBefore(huntDate, today)) return "Įvykusi";
  return "";
}

function getStatusSeverity(status) {
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
}

export default function DrivenHuntsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [first, setFirst] = useState(0);
  const rows = 5;

  const filteredHunts = hunts
    .filter(hunt => hunt.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const onPageChange = (e) => {
    setFirst(e.first);
  };

  const handleCardClick = () => {
    router.push('/drivenhunts/drivenhunt');
  };

  return (
    <div className="p-8">
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
              onClick={handleCardClick}
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
                  <p><strong>Vadovas:</strong> {hunt.leader}</p>
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
      <Paginator first={first} rows={rows} totalRecords={filteredHunts.length} onPageChange={onPageChange} className="mt-6" />
    </div>
  );
}

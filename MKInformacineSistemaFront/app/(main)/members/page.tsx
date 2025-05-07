'use client';
import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import { useApiClient } from '../../.././utils/api';
import ClubGuard from '../../.././context/ClubGuard';

const MembersView = () => {
  const [members, setMembers] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { fetchWithClub } = useApiClient();
  const toast = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchWithClub('Members');
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load members',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [fetchWithClub]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('lt-LT');
  };

  const activityBodyTemplate = (rowData) => {
    let severity = 'info';
    if (rowData.activity > 75) severity = 'success';
    else if (rowData.activity < 25) severity = 'danger';
    else severity = 'warning';

    return (
      <div className="flex align-items-center">
        <div className="relative h-1.5 w-24 bg-gray-200 rounded">
          <div 
            className={`absolute h-1.5 rounded`} 
            style={{ 
              width: `${rowData.activity}%`,
              backgroundColor: severity === 'success' ? 'var(--green-500)' : 
                              severity === 'warning' ? 'var(--yellow-500)' : 
                              severity === 'danger' ? 'var(--red-500)' : 
                              'var(--primary-color)'
            }}
          ></div>
        </div>
        <span className="ml-2">{rowData.activity}%</span>
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.status} 
        severity={
          rowData.status === 'Owner' ? 'danger' : 
          rowData.status === 'Admin' ? 'warning' : 
          'success'
        }
      />
    );
  };
  
  const nameBodyTemplate = (rowData) => {
    return (
      <a 
        className="text-primary cursor-pointer hover:underline" 
        onClick={() => router.push(`/members/${rowData.id}`)}
      >
        {rowData.name}
      </a>
    );
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h5 className="m-0">Club Members</h5>
      <span className="block mt-2 md:mt-0 p-input-icon-left">
        <i className="pi pi-search" />
        <InputText 
          type="search" 
          onInput={(e) => setGlobalFilter(e.currentTarget.value)} 
          placeholder="Search..." 
        />
      </span>
    </div>
  );

  return (
    <ClubGuard>
      <div className="card">
        <Toast ref={toast} />
        <DataTable 
          value={members} 
          header={header}
          globalFilter={globalFilter}
          emptyMessage="No members found."
          loading={loading}
          paginator 
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          dataKey="id"
          responsiveLayout="scroll"
          rowHover
          stripedRows
        >
          <Column header="Name" body={nameBodyTemplate} field="name" sortable />
          <Column field="age" header="Age" sortable style={{ width: '70px' }} />
          <Column 
            field="huntingSince" 
            header="Hunter Since" 
            body={(rowData) => formatDate(rowData.huntingSince)} 
            sortable 
          />
          <Column header="Activity" body={activityBodyTemplate} field="activity" sortable />
          <Column header="Role" body={statusBodyTemplate} field="status" sortable style={{ width: '120px' }} />
        </DataTable>
      </div>
    </ClubGuard>
  );
};

export default MembersView;
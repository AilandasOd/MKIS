'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useApiClient } from '../../../../utils/apiClient';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import ClubGuard from '../../../../context/ClubGuard';

interface StatisticsData {
  year: number;
  totalDrivenHunts: number;
  completedDrivenHunts: number;
  animalsHunted: Record<string, number>;
  totalShotsTaken: number;
  totalShotsHit: number;
  activeMembersCount: number;
  topHunters: Array<{
    userId: string;
    name: string;
    count: number;
  }>;
  accuracyPercentage: number;
}

const ClubStatisticsPage = () => {
  const { fetchWithClub, selectedClub } = useApiClient();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>({});
  const [chartOptions, setChartOptions] = useState<any>({});
  const toast = useRef<Toast>(null);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current || !selectedClub) return;

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        hasFetchedRef.current = true;

        let data;
        try {
          data = await fetchWithClub(`Statistics/club?clubId=${selectedClub.id}`);
        } catch (error) {
          data = await fetchWithClub(`Statistics/club/${selectedClub.id}`);
        }

        setStatistics(data);

        if (data && data.animalsHunted && Object.keys(data.animalsHunted).length > 0) {
          prepareChartData(data.animalsHunted);
        }
      } catch (error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Klaida',
          detail: 'Nepavyko įkelti klubo statistikos: ' + (error instanceof Error ? error.message : 'Nežinoma klaida'),
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [fetchWithClub, selectedClub]);

  const prepareChartData = (animalsData: Record<string, number>) => {
    const documentStyle = getComputedStyle(document.documentElement);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8BC34A', '#9C27B0', '#607D8B', '#E91E63'];
    const backgroundColor = Object.keys(animalsData).map((_, index) => colors[index % colors.length]);

    setChartData({
      labels: Object.keys(animalsData),
      datasets: [
        {
          data: Object.values(animalsData),
          backgroundColor,
          hoverBackgroundColor: backgroundColor.map(color => color.replace(')', ', 0.8)').replace('rgb', 'rgba'))
        }
      ]
    });

    setChartOptions({
      plugins: {
        legend: {
          labels: {
            color: documentStyle.getPropertyValue('--text-color')
          }
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `${context.label}: ${context.raw} gyvūnų`;
            }
          }
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <i className="pi pi-spin pi-spinner text-4xl"></i>
      </div>
    );
  }

  if (!statistics) {
    return (
      <Card className="text-center p-5">
        <Toast ref={toast} />
        <i className="pi pi-chart-bar text-6xl text-primary mb-3"></i>
        <h2 className="text-2xl font-semibold">Statistikos nėra</h2>
        <p className="text-lg">Šiam klubui dar nėra medžioklės statistikos.</p>
        <p>Statistika atsiras po varyminių medžioklių ir sumedžiotų gyvūnų registravimo.</p>
      </Card>
    );
  }

  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        <h2 className="text-2xl font-bold mb-4">Klubo statistika</h2>

        <div className="grid">
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Varyminės medžioklės</h3>
                <div className="text-4xl font-bold mb-2">{statistics.completedDrivenHunts} / {statistics.totalDrivenHunts}</div>
                <p className="text-sm text-500">Įvykdytos medžioklės</p>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Šaudymo tikslumas</h3>
                <div className="flex flex-column align-items-center">
                  <div className="text-4xl font-bold mb-2">{statistics.accuracyPercentage.toFixed(2)}%</div>
                  <ProgressBar value={statistics.accuracyPercentage.toFixed(2)} className="w-full h-2rem" />
                </div>
                <p className="text-sm text-500 mt-2">{statistics.totalShotsHit} pataikymų iš {statistics.totalShotsTaken} šūvių</p>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Iš viso sumedžiotų žvėrių</h3>
                <div className="text-4xl font-bold mb-2">
                  {Object.values(statistics.animalsHunted).reduce((a, b) => a + b, 0)}
                </div>
                <p className="text-sm text-500">Sumedžioti žvėrys</p>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Aktyvūs nariai</h3>
                <div className="text-4xl font-bold mb-2">{statistics.activeMembersCount}</div>
                <p className="text-sm text-500">Klubo nariai</p>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-7">
            <Card className="mb-4">
              <h3 className="text-xl font-semibold mb-3">Sumedžioti žvėrys</h3>
              {Object.keys(statistics.animalsHunted).length > 0 ? (
                <div className="flex justify-content-center">
                  <Chart type="pie" data={chartData} options={chartOptions} style={{ maxHeight: '400px', maxWidth: '100%' }} />
                </div>
              ) : (
                <div className="text-center p-5">
                  <i className="pi pi-info-circle text-3xl text-primary mb-3"></i>
                  <p>Dar nėra užregistruotų gyvūnų.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="col-12 md:col-5">
            <Card className="mb-4">
              <h3 className="text-xl font-semibold mb-3">Daugiausiai sumedžioję medžiotojai</h3>
              {statistics.topHunters && statistics.topHunters.length > 0 ? (
                <DataTable value={statistics.topHunters} stripedRows showGridlines>
                  <Column field="name" header="Medžiotojo vardas"></Column>
                  <Column field="count" header="Sumedžiota" style={{ width: '120px' }}></Column>
                </DataTable>
              ) : (
                <div className="text-center p-5">
                  <i className="pi pi-users text-3xl text-primary mb-3"></i>
                  <p>Dar nėra duomenų apie geriausius medžiotojus.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ClubGuard>
  );
};

export default ClubStatisticsPage;

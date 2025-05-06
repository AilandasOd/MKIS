import React, { useEffect, useState } from 'react';
import { useApiClient } from '../../../../utils/api';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';

const ClubStatisticsPage = () => {
  const { fetchWithClub } = useApiClient();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});
  
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await fetchWithClub('statistics/club');
        setStatistics(data);
        
        // Prepare chart data
        if (data) {
          setChartData({
            labels: Object.keys(data.animalsHunted),
            datasets: [{
              data: Object.values(data.animalsHunted),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, [fetchWithClub]);
  
  if (loading) {
    return <div>Loading statistics...</div>;
  }
  
  if (!statistics) {
    return <div>No statistics available</div>;
  }
  
  return (
    <div>
      <h2>Club Statistics</h2>
      <div className="grid">
        <div className="col-12 md:col-6">
          <div className="card">
            <h5>Hunted Animals</h5>
            <Chart type="pie" data={chartData} />
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="card">
            <h5>Shooting Accuracy</h5>
            <ProgressBar value={statistics.accuracyPercentage} showValue={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubStatisticsPage;
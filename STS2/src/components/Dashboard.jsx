import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard = ({ title, value }) => (
  <div className="stat-card">
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const Dashboard = ({ stats, onReset }) => {
  const [pieMode, setPieMode] = useState('runs');
  const [barMode, setBarMode] = useState('picks');

  if (!stats) return null;

  const winRate = stats.totalRuns > 0 ? ((stats.wins / stats.totalRuns) * 100).toFixed(1) : 0;
  
  const characterLabels = Object.keys(stats.winRatesByCharacter);
  
  let pieDataValues = [];
  let pieTitle = 'Character Play Rate (Runs)';

  if (pieMode === 'runs') {
    pieDataValues = characterLabels.map(char => stats.characterPlayCounts[char]);
    pieTitle = 'Character Play Rate (Runs)';
  } else if (pieMode === 'playtime') {
    pieDataValues = characterLabels.map(char => Math.round(stats.characterPlaytimes[char] / 60));
    pieTitle = 'Character Playtime (Minutes)';
  } else if (pieMode === 'winrate') {
    pieDataValues = characterLabels.map(char => parseFloat(stats.winRatesByCharacter[char].rate.toFixed(1)));
    pieTitle = 'Character Win Rate (%)';
  }

  const characterColors = {
    'IRONCLAD': 'rgba(239, 68, 68, 0.8)',      // Red
    'SILENT': 'rgba(16, 185, 129, 0.8)',       // Green
    'REGENT': 'rgba(249, 115, 22, 0.8)',       // Orange
    'NECROBINDER': 'rgba(168, 85, 247, 0.8)',  // Purple
    'DEFECT': 'rgba(56, 189, 248, 0.8)',       // Light Blue
  };

  const pieData = {
    labels: characterLabels,
    datasets: [
      {
        data: pieDataValues,
        backgroundColor: characterLabels.map(char => characterColors[char] || 'rgba(156, 163, 175, 0.8)'),
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    ],
  };

  let barDataValues = [];
  let barLabels = [];
  let barTitle = 'Most Picked Cards';
  let barLabel = 'Times Picked';

  if (barMode === 'picks') {
    barLabels = stats.topCards.map(c => c.name);
    barDataValues = stats.topCards.map(c => c.count);
    barTitle = 'Most Picked Cards';
    barLabel = 'Times Picked';
  } else if (barMode === 'winrate') {
    barLabels = stats.topCardsByWinrate.map(c => c.name);
    barDataValues = stats.topCardsByWinrate.map(c => c.winrate);
    barTitle = 'Top Cards by Win Rate (%)';
    barLabel = 'Win Rate (%)';
  }

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: barLabel,
        data: barDataValues,
        backgroundColor: 'rgba(167, 139, 250, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#f0f4f8' }
      }
    },
    scales: {
      x: { ticks: { color: '#9aa5b1' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#9aa5b1' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#f0f4f8' }
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard title="Total Runs" value={stats.totalRuns} />
        <StatCard title="Overall Win Rate" value={`${winRate}%`} />
        <StatCard title="Total Wins" value={stats.wins} />
        <StatCard title="Average Floor" value={stats.averageFloor} />
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3 style={{margin: 0}}>{pieTitle}</h3>
            <select 
              value={pieMode} 
              onChange={(e) => setPieMode(e.target.value)}
              className="pie-toggle"
            >
              <option value="runs">Runs Played</option>
              <option value="playtime">Total Playtime</option>
              <option value="winrate">Win Rate</option>
            </select>
          </div>
          <div className="chart-wrapper">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
        <div className="chart-container">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3 style={{margin: 0}}>{barTitle}</h3>
            <select 
              value={barMode} 
              onChange={(e) => setBarMode(e.target.value)}
              className="pie-toggle"
            >
              <option value="picks">Most Picked</option>
              <option value="winrate">Win Rate</option>
            </select>
          </div>
          <div className="chart-wrapper">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn-reset btn-danger" onClick={onReset}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          Clear All Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

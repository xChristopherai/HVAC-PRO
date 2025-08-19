import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Import auth service
import authService from '../utils/auth';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const OwnerInsights = ({ companyId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOwnerInsights();
  }, [companyId]);

  const fetchOwnerInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/api/owner-insights?company_id=${companyId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Failed to fetch owner insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading owner insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>🚨 Unable to Load Owner Insights</h3>
        <p>Error: {error}</p>
        <button onClick={fetchOwnerInsights} className="action-btn primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="error-container">
        <h3>📊 No Insights Available</h3>
        <p>Unable to load analytics data. Please try again later.</p>
      </div>
    );
  }

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
        },
      },
      x: {
        grid: {
          color: '#f1f5f9',
        },
      },
    },
  };

  // Prepare chart data
  const trendLabels = insights.seven_day_trends.map(day => 
    new Date(day.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  );

  const appointmentsTrendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Appointments',
        data: insights.seven_day_trends.map(day => day.appointments),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const completionsTrendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Completed Jobs',
        data: insights.seven_day_trends.map(day => day.completed),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueTrendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Revenue ($)',
        data: insights.seven_day_trends.map(day => day.revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="owner-insights">
      <header className="insights-header">
        <h1>📈 Owner Insights Dashboard</h1>
        <p>Comprehensive business analytics and performance metrics</p>
      </header>

      {/* Today's Performance Cards */}
      <div className="performance-cards">
        <div className="performance-card appointments">
          <div className="card-icon">📅</div>
          <h3>{insights.today_performance.appointments}</h3>
          <p>Today's Appointments</p>
          <div className="card-trend">
            {insights.today_performance.appointments > 0 ? '📈' : '📊'} 
            Scheduled Today
          </div>
        </div>

        <div className="performance-card completed">
          <div className="card-icon">✅</div>
          <h3>{insights.today_performance.completed}</h3>
          <p>Jobs Completed</p>
          <div className="card-trend">
            {insights.today_performance.completed > 0 ? '🎯' : '⏳'} 
            Today's Progress
          </div>
        </div>

        <div className="performance-card revenue">
          <div className="card-icon">💰</div>
          <h3>${insights.today_performance.revenue.toFixed(2)}</h3>
          <p>Revenue Generated</p>
          <div className="card-trend">
            {insights.today_performance.revenue > 0 ? '💵' : '🏷️'} 
            Today's Earnings
          </div>
        </div>

        <div className="performance-card metrics">
          <div className="card-icon">⚡</div>
          <h3>{insights.performance_metrics.avg_response_time.toFixed(1)}m</h3>
          <p>Avg Response Time</p>
          <div className="card-trend">
            {insights.performance_metrics.avg_response_time < 20 ? '🚀' : '⏰'} 
            Customer Service
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="kpi-section">
        <div className="kpi-card">
          <h4>📊 Conversion Rate</h4>
          <div className="kpi-value">
            {insights.performance_metrics.conversion_rate.toFixed(1)}%
          </div>
          <div className="kpi-description">
            Inquiries converted to appointments
          </div>
        </div>

        <div className="kpi-card">
          <h4>⚡ Response Time</h4>
          <div className="kpi-value">
            {insights.performance_metrics.avg_response_time.toFixed(1)} min
          </div>
          <div className="kpi-description">
            Average time to first response
          </div>
        </div>

        <div className="kpi-card">
          <h4>🏆 Top Technician</h4>
          <div className="kpi-value">
            {insights.technician_leaderboard[0]?.name || 'N/A'}
          </div>
          <div className="kpi-description">
            {insights.technician_leaderboard[0]?.jobs_completed || 0} jobs completed
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>📈 7-Day Appointments Trend</h3>
          <div className="chart-wrapper">
            <Line data={appointmentsTrendData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h3>✅ Job Completions Trend</h3>
          <div className="chart-wrapper">
            <Line data={completionsTrendData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container full-width">
          <h3>💰 Daily Revenue Performance</h3>
          <div className="chart-wrapper">
            <Bar data={revenueTrendData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Technician Leaderboard */}
      <div className="leaderboard">
        <h3>🏆 Technician Performance Leaderboard</h3>
        <div className="leaderboard-list">
          {insights.technician_leaderboard.length === 0 ? (
            <div className="no-data">
              <p>No technician data available</p>
            </div>
          ) : (
            insights.technician_leaderboard.slice(0, 10).map((tech, index) => (
              <div key={tech.id} className="leaderboard-item">
                <div className="leaderboard-rank">
                  <span className={`rank-${index + 1}`}>{index + 1}</span>
                </div>
                
                <div className="leaderboard-info">
                  <h4>{tech.name}</h4>
                  <p>{tech.jobs_completed} jobs completed this week</p>
                </div>
                
                <div className="leaderboard-stats">
                  <div className="rating">
                    {'⭐'.repeat(Math.floor(tech.average_rating))} {tech.average_rating.toFixed(1)}
                  </div>
                  <div className="total-ratings">
                    ({tech.total_ratings} reviews)
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Insights Actions */}
      <div className="insights-actions">
        <button onClick={fetchOwnerInsights} className="action-btn primary">
          🔄 Refresh Data
        </button>
        <button className="action-btn secondary">
          📊 Export Report
        </button>
        <button className="action-btn secondary">
          📧 Email Summary
        </button>
        <button className="action-btn secondary">
          ⚙️ Configure Alerts
        </button>
      </div>

      <style jsx>{`
        .owner-insights {
          padding: 2rem 0;
          space-y: 2rem;
        }

        .insights-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .insights-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .insights-header p {
          font-size: 1.125rem;
          color: #64748b;
        }

        .performance-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .performance-card {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 2rem;
          border-radius: 1rem;
          text-align: center;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          position: relative;
          overflow: hidden;
        }

        .performance-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%);
          pointer-events: none;
        }

        .card-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }

        .performance-card h3 {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .performance-card p {
          opacity: 0.9;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .card-trend {
          opacity: 0.8;
          font-size: 0.875rem;
        }

        .kpi-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .kpi-card {
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .kpi-card h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 1rem;
        }

        .kpi-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #3b82f6;
          margin-bottom: 0.5rem;
        }

        .kpi-description {
          color: #64748b;
          font-size: 0.875rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .chart-container.full-width {
          grid-column: 1 / -1;
        }

        .leaderboard {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 3rem;
        }

        .leaderboard h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2rem;
          text-align: center;
        }

        .leaderboard-list {
          space-y: 1rem;
        }

        .leaderboard-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }

        .leaderboard-item:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
          transform: translateX(4px);
        }

        .leaderboard-rank {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          margin-right: 1rem;
        }

        .rank-1 { 
          background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
        }

        .rank-2 { 
          background: linear-gradient(135deg, #9ca3af, #6b7280) !important;
        }

        .rank-3 { 
          background: linear-gradient(135deg, #f97316, #ea580c) !important;
        }

        .leaderboard-info {
          flex: 1;
        }

        .leaderboard-info h4 {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .leaderboard-info p {
          color: #64748b;
          font-size: 0.875rem;
        }

        .leaderboard-stats {
          text-align: right;
        }

        .rating {
          color: #f59e0b;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .total-ratings {
          color: #64748b;
          font-size: 0.75rem;
        }

        .insights-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .loading-container, .error-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-container .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .error-container h3 {
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .error-container p {
          color: #64748b;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .performance-cards {
            grid-template-columns: 1fr;
          }
          
          .kpi-section {
            grid-template-columns: 1fr;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .leaderboard-item {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          
          .insights-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default OwnerInsights;
import { useState, useEffect } from 'react';
import { getDashboardStats, getJobs } from '../utils/storage';
import { formatCurrency } from '../utils/pricing';
import { JOB_STATUSES } from '../utils/constants';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const dashboardStats = getDashboardStats();
    setStats(dashboardStats);

    const jobs = getJobs();
    setAllJobs(jobs);
    const recent = jobs
      .filter(job => !['COMPLETE', 'CANCELLED'].includes(job.status))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
    setRecentJobs(recent);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'ENQUIRY': 'enquiry',
      'QUOTED': 'quoted',
      'DEPOSIT DUE': 'deposit-due',
      'IN PRODUCTION': 'in-production',
      'DISPATCHED': 'dispatched',
      'COMPLETE': 'complete',
      'ON HOLD': 'on-hold',
      'CANCELLED': 'cancelled'
    };
    return statusMap[status] || 'enquiry';
  };

  const getDaysSince = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  };

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((date - now) / (1000 * 60 * 60 * 24));
  };

  if (!stats) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with PSS today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('quote-builder')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Quote
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.activeJobs}</div>
          <div className="stat-label">Active Jobs</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.depositsOverdue.length}</div>
          <div className="stat-label">Deposits Overdue</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.inProduction}</div>
          <div className="stat-label">In Production</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{formatCurrency(stats.revenueThisMonth)}</div>
          <div className="stat-label">Revenue This Month</div>
        </div>
      </div>

      {/* Alerts Section */}
      {(stats.depositsOverdue.length > 0 || stats.quotesUnanswered.length > 0 || stats.upcomingDeadlines.length > 0) && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Alerts & Actions Required
            </h2>
          </div>

          {stats.depositsOverdue.map(job => (
            <div key={job.id} className="alert-card danger">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="alert-content">
                <div className="alert-title">Deposit Overdue - {job.clientName}</div>
                <div className="alert-text">
                  {job.jobNumber} • {getDaysSince(job.statusChangedAt || job.createdAt)} days waiting for deposit • {formatCurrency(job.depositAmount || job.totalValue * 0.5)}
                </div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('job-tracker')}>
                View Job
              </button>
            </div>
          ))}

          {stats.quotesUnanswered.map(job => (
            <div key={job.id} className="alert-card warning">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div className="alert-content">
                <div className="alert-title">Quote Unanswered - {job.clientName}</div>
                <div className="alert-text">
                  {job.jobNumber} • Quoted {getDaysSince(job.statusChangedAt || job.createdAt)} days ago • Follow up required
                </div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('job-tracker')}>
                View Job
              </button>
            </div>
          ))}

          {stats.upcomingDeadlines.map(job => (
            <div key={job.id} className="alert-card info">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div className="alert-content">
                <div className="alert-title">Deadline Approaching - {job.clientName}</div>
                <div className="alert-text">
                  {job.jobNumber} • Due in {getDaysUntil(job.deadline)} day{getDaysUntil(job.deadline) !== 1 ? 's' : ''} • {new Date(job.deadline).toLocaleDateString('en-ZA')}
                </div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('job-tracker')}>
                View Job
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Active Jobs</h2>
          <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('job-tracker')}>
            View All Jobs
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
            <div className="empty-state-title">No active jobs</div>
            <p>Create a new quote to get started</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Deadline</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map(job => (
                  <tr key={job.id} onClick={() => onNavigate('job-tracker')}>
                    <td>
                      <strong>{job.jobNumber}</strong>
                    </td>
                    <td>{job.clientName}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="currency">{formatCurrency(job.totalValue || 0)}</td>
                    <td>
                      {job.deadline ? (
                        <span style={{
                          color: getDaysUntil(job.deadline) <= 3 && getDaysUntil(job.deadline) >= 0 ? '#E74C3C' : 'inherit'
                        }}>
                          {new Date(job.deadline).toLocaleDateString('en-ZA')}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>Not set</span>
                      )}
                    </td>
                    <td style={{ color: '#666', fontSize: '13px' }}>
                      {new Date(job.updatedAt).toLocaleDateString('en-ZA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stats by Status */}
      <div className="mini-grid" style={{ marginTop: '24px' }}>
        {Object.values(JOB_STATUSES).slice(0, 6).map(status => {
          const jobs = allJobs.filter(j => j.status === status);
          return (
            <div
              key={status}
              style={{
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E5E5',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A' }}>
                {jobs.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                {status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

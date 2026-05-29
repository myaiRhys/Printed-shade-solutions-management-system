import { useState, useEffect, useMemo } from 'react';
import { getJobs, saveJob, addJobNote, getSettings } from '../utils/storage';
import { formatCurrency } from '../utils/pricing';
import { generateJobCardPDF, generateQuotePDF, downloadPDF } from '../utils/pdfGenerator';
import { JOB_STATUSES, STATUS_ACTIONS, STATUS_ORDER } from '../utils/constants';

export default function JobTracker({ onRefresh }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showJobCard, setShowJobCard] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = () => {
    const allJobs = getJobs();
    setJobs(allJobs);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
      const matchesSearch = !searchQuery ||
        job.jobNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [jobs, statusFilter, searchQuery]);

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

  const getCurrentStatusIndex = (status) => {
    return STATUS_ORDER.indexOf(status);
  };

  const handleStatusChange = (job, newStatus) => {
    const updatedJob = {
      ...job,
      status: newStatus,
      statusChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Handle specific status transitions
    if (newStatus === JOB_STATUSES.IN_PRODUCTION) {
      updatedJob.depositPaid = true;
      updatedJob.productionStartedAt = new Date().toISOString();
    }
    if (newStatus === JOB_STATUSES.DISPATCHED) {
      updatedJob.dispatchedAt = new Date().toISOString();
    }
    if (newStatus === JOB_STATUSES.COMPLETE) {
      updatedJob.balancePaid = true;
      updatedJob.completedDate = new Date().toISOString();
    }

    saveJob(updatedJob);
    loadJobs();
    setSelectedJob(updatedJob);
    if (onRefresh) onRefresh();
  };

  const handleAdvanceStatus = (job) => {
    const nextStatus = STATUS_ACTIONS[job.status]?.next;
    if (nextStatus) {
      handleStatusChange(job, nextStatus);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedJob) return;

    addJobNote(selectedJob.id, newNote.trim());
    setNewNote('');
    loadJobs();

    // Refresh selected job
    const updatedJob = getJobs().find(j => j.id === selectedJob.id);
    setSelectedJob(updatedJob);
  };

  const handleGenerateJobCard = () => {
    if (!selectedJob) return;
    const doc = generateJobCardPDF(selectedJob);
    downloadPDF(doc, `JobCard-${selectedJob.jobNumber}.pdf`);
  };

  const handleGenerateQuotePDF = () => {
    if (!selectedJob) return;
    const settings = getSettings();

    // Prefer the breakdown saved with the job so the PDF matches the original
    // quote exactly. Fall back to a derived breakdown for older jobs that were
    // saved before the breakdown was stored.
    const total = selectedJob.totalValue || 0;
    const breakdown = selectedJob.breakdown || {
      unitPrice: selectedJob.numberOfPrints ? total / selectedJob.numberOfPrints : 0,
      numberOfPrints: selectedJob.numberOfPrints,
      printSubtotal: total / (1 + 0.15),
      volumeDiscountRate: 0,
      volumeDiscountAmount: 0,
      screenFees: 0,
      clothCost: 0,
      clothMetres: selectedJob.linearMetres || 0,
      clothLinearMetres: selectedJob.linearMetres || 0,
      rollsNeeded: selectedJob.rollsNeeded || 0,
      subtotal: total / (1 + 0.15),
      vatRate: 0.15,
      vat: total - total / (1 + 0.15),
      total,
      deposit: selectedJob.depositAmount || 0,
      balance: selectedJob.balanceAmount || 0
    };

    const quoteData = {
      ...selectedJob,
      quoteNumber: selectedJob.jobNumber,
      breakdown,
      createdAt: selectedJob.createdAt
    };
    const doc = generateQuotePDF(quoteData, settings);
    downloadPDF(doc, `Quote-${selectedJob.jobNumber}.pdf`);
  };

  const handlePutOnHold = (job) => {
    handleStatusChange(job, JOB_STATUSES.ON_HOLD);
  };

  const handleCancelJob = (job) => {
    if (window.confirm('Are you sure you want to cancel this job?')) {
      handleStatusChange(job, JOB_STATUSES.CANCELLED);
    }
  };

  const getDaysInStatus = (job) => {
    const statusDate = new Date(job.statusChangedAt || job.createdAt);
    const now = new Date();
    return Math.floor((now - statusDate) / (1000 * 60 * 60 * 24));
  };

  const getDaysUntilDeadline = (job) => {
    if (!job.deadline) return null;
    const deadline = new Date(job.deadline);
    const now = new Date();
    return Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Job Tracker</h1>
          <p className="page-subtitle">Manage and track all jobs through the production pipeline</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          {Object.values(JOB_STATUSES).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className={selectedJob ? 'master-detail' : ''}>
        {/* Jobs Table */}
        <div className="card">
          {filteredJobs.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              <div className="empty-state-title">No jobs found</div>
              <p>Create a quote to add jobs to the tracker</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Client</th>
                    <th>Cloth</th>
                    <th>Prints</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => {
                    const daysUntil = getDaysUntilDeadline(job);
                    const isDeadlineClose = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;
                    const isOverdue = daysUntil !== null && daysUntil < 0;

                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        style={{
                          background: selectedJob?.id === job.id ? '#E8F6F4' : 'transparent'
                        }}
                      >
                        <td>
                          <strong style={{ color: '#2A9D8F' }}>{job.jobNumber}</strong>
                        </td>
                        <td>
                          <div>{job.clientName}</div>
                          {job.contactPerson && (
                            <div style={{ fontSize: '12px', color: '#666' }}>{job.contactPerson}</div>
                          )}
                        </td>
                        <td>
                          {job.rollsNeeded
                            ? `${job.rollsNeeded} roll${job.rollsNeeded !== 1 ? 's' : ''}`
                            : job.clothSupply === 'Client Supplied'
                              ? 'Client'
                              : `${job.linearMetres || 0}m`}
                        </td>
                        <td>{job.numberOfPrints}</td>
                        <td className="currency">{formatCurrency(job.totalValue || 0)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>
                          {job.deadline ? (
                            <span style={{
                              color: isOverdue ? '#E74C3C' : isDeadlineClose ? '#F39C12' : 'inherit',
                              fontWeight: isDeadlineClose || isOverdue ? '600' : 'normal'
                            }}>
                              {new Date(job.deadline).toLocaleDateString('en-ZA')}
                              {isOverdue && <span style={{ marginLeft: '4px' }}>(!)</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedJob && (
          <div className="card" style={{ alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                  {selectedJob.jobNumber}
                </h2>
                <span className={`status-badge ${getStatusClass(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
              </div>
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => setSelectedJob(null)}
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps" style={{ marginBottom: '24px' }}>
              {STATUS_ORDER.slice(0, 6).map((status, index) => {
                const currentIndex = getCurrentStatusIndex(selectedJob.status);
                const isCompleted = index < currentIndex;
                const isActive = status === selectedJob.status;

                return (
                  <div
                    key={status}
                    className={`progress-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  >
                    <div className="progress-step-circle">
                      {isCompleted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="progress-step-label" style={{ fontSize: '10px' }}>
                      {status.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {STATUS_ACTIONS[selectedJob.status]?.next && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAdvanceStatus(selectedJob)}
                >
                  {STATUS_ACTIONS[selectedJob.status].action}
                </button>
              )}
              {selectedJob.status === JOB_STATUSES.IN_PRODUCTION && (
                <button className="btn btn-secondary btn-sm" onClick={handleGenerateJobCard}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print Job Card
                </button>
              )}
              {!['COMPLETE', 'CANCELLED', 'ON HOLD'].includes(selectedJob.status) && (
                <button className="btn btn-secondary btn-sm" onClick={() => handlePutOnHold(selectedJob)}>
                  Put On Hold
                </button>
              )}
              {selectedJob.status === JOB_STATUSES.ON_HOLD && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleStatusChange(selectedJob, JOB_STATUSES.DEPOSIT_DUE)}
                >
                  Resume Job
                </button>
              )}
            </div>

            {/* Client Details */}
            <div className="detail-section">
              <div className="detail-section-title">Client Details</div>
              <div className="detail-row">
                <span className="detail-label">Company</span>
                <span className="detail-value">{selectedJob.clientName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact</span>
                <span className="detail-value">{selectedJob.contactPerson || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{selectedJob.clientPhone || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{selectedJob.clientEmail || '-'}</span>
              </div>
            </div>

            {/* Job Specs */}
            <div className="detail-section">
              <div className="detail-section-title">Job Specifications</div>
              <div className="detail-row">
                <span className="detail-label">Number of Prints</span>
                <span className="detail-value">{selectedJob.numberOfPrints}</span>
              </div>
              {selectedJob.printLength && (
                <div className="detail-row">
                  <span className="detail-label">Print Size (L × H)</span>
                  <span className="detail-value">{selectedJob.printLength}m × {selectedJob.printHeight || 1.8}m</span>
                </div>
              )}
              {selectedJob.printsPerRoll && (
                <div className="detail-row">
                  <span className="detail-label">Prints / Roll</span>
                  <span className="detail-value">{selectedJob.printsPerRoll}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Rolls Needed</span>
                <span className="detail-value">
                  {selectedJob.rollsNeeded
                    ? `${selectedJob.rollsNeeded} (${selectedJob.linearMetres}m)`
                    : '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Print Type</span>
                <span className="detail-value">{selectedJob.printSize || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Colours</span>
                <span className="detail-value">{selectedJob.numberOfColours || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ink Coverage</span>
                <span className="detail-value">{selectedJob.inkCoverage || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Cloth Supply</span>
                <span className="detail-value">{selectedJob.clothSupply || '-'}</span>
              </div>
            </div>

            {/* Financials */}
            <div className="detail-section">
              <div className="detail-section-title">Financial</div>
              <div className="detail-row">
                <span className="detail-label">Total Value</span>
                <span className="detail-value font-bold">{formatCurrency(selectedJob.totalValue || 0)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Deposit (50%)</span>
                <span className="detail-value" style={{ color: selectedJob.depositPaid ? '#27AE60' : '#F39C12' }}>
                  {formatCurrency(selectedJob.depositAmount || 0)}
                  {selectedJob.depositPaid && ' (Paid)'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Balance</span>
                <span className="detail-value" style={{ color: selectedJob.balancePaid ? '#27AE60' : 'inherit' }}>
                  {formatCurrency(selectedJob.balanceAmount || 0)}
                  {selectedJob.balancePaid && ' (Paid)'}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="detail-section">
              <div className="detail-section-title">Dates</div>
              <div className="detail-row">
                <span className="detail-label">Created</span>
                <span className="detail-value">{new Date(selectedJob.createdAt).toLocaleDateString('en-ZA')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Deadline</span>
                <span className="detail-value" style={{
                  color: getDaysUntilDeadline(selectedJob) !== null && getDaysUntilDeadline(selectedJob) <= 3 ? '#E74C3C' : 'inherit'
                }}>
                  {selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString('en-ZA') : 'Not set'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Days in Status</span>
                <span className="detail-value">{getDaysInStatus(selectedJob)} days</span>
              </div>
            </div>

            {/* Special Instructions */}
            {(selectedJob.layoutNotes || selectedJob.specialInstructions) && (
              <div className="detail-section">
                <div className="detail-section-title">Instructions</div>
                {selectedJob.layoutNotes && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Layout Notes:</div>
                    <div style={{ fontSize: '14px' }}>{selectedJob.layoutNotes}</div>
                  </div>
                )}
                {selectedJob.specialInstructions && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Special Instructions:</div>
                    <div style={{ fontSize: '14px' }}>{selectedJob.specialInstructions}</div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="detail-section">
              <div className="detail-section-title">Notes</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddNote}>Add</button>
              </div>
              <div className="notes-list">
                {selectedJob.notes && selectedJob.notes.length > 0 ? (
                  selectedJob.notes.slice().reverse().map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-header">
                        <span className="note-date">
                          {new Date(note.createdAt).toLocaleString('en-ZA')}
                        </span>
                      </div>
                      <div className="note-text">{note.text}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', padding: '12px' }}>
                    No notes yet
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E5E5' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleGenerateQuotePDF}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Download Quote
              </button>
              {!['COMPLETE', 'CANCELLED'].includes(selectedJob.status) && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleCancelJob(selectedJob)}
                  style={{ marginLeft: 'auto' }}
                >
                  Cancel Job
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

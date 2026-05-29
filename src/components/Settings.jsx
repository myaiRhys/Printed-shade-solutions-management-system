import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportAllData, importData, getJobs, getClients, getQuotes } from '../utils/storage';

export default function Settings() {
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'Business Current'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [storageStats, setStorageStats] = useState({ jobs: 0, clients: 0, quotes: 0 });

  useEffect(() => {
    const settings = getSettings();
    setFormData(settings);
    refreshStorageStats();
  }, []);

  const refreshStorageStats = () => {
    setStorageStats({
      jobs: getJobs().length,
      clients: getClients().length,
      quotes: getQuotes().length
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
  };

  const handleSave = () => {
    saveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pss-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (window.confirm('This will replace all existing data. Are you sure you want to continue?')) {
          importData(data);
          window.location.reload();
        }
      } catch (error) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    if (window.confirm('This will delete ALL data including jobs, quotes, and clients. This cannot be undone. Are you sure?')) {
      if (window.confirm('FINAL WARNING: All data will be permanently deleted. Continue?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your company details and system preferences</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert-card" style={{ background: '#D1FAE5', borderLeftColor: '#27AE60', marginBottom: '24px' }}>
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="alert-content">
            <div className="alert-title" style={{ color: '#1E8449' }}>Settings Saved</div>
            <div className="alert-text">Your changes have been saved successfully.</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          Company Details
        </button>
        <button
          className={`tab ${activeTab === 'banking' ? 'active' : ''}`}
          onClick={() => setActiveTab('banking')}
        >
          Banking Details
        </button>
        <button
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data Management
        </button>
      </div>

      {/* Company Details Tab */}
      {activeTab === 'company' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
            Company Information
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            These details will appear on quotes and invoices.
          </p>

          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Printed Shade Solutions"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tagline</label>
            <input
              type="text"
              name="tagline"
              className="form-input"
              value={formData.tagline}
              onChange={handleInputChange}
              placeholder="Innovative Brand Exposure Through Printed Shadenet Products"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="marketing@printedshade.co.za"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="082 331 5379"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Unit 10, Celie Industrial Park, Celie Rd, Retreat, Cape Town"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="text"
              name="website"
              className="form-input"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="www.printedshade.co.za"
            />
          </div>

          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Banking Details Tab */}
      {activeTab === 'banking' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
            Banking Details
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            These details will appear on quotes and invoices for client payments.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                name="bankName"
                className="form-input"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="e.g. FNB, Standard Bank"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select
                name="accountType"
                className="form-select"
                value={formData.accountType}
                onChange={handleInputChange}
              >
                <option value="Business Current">Business Current</option>
                <option value="Business Savings">Business Savings</option>
                <option value="Cheque Account">Cheque Account</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                className="form-input"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Your account number"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Branch Code</label>
              <input
                type="text"
                name="branchCode"
                className="form-input"
                value={formData.branchCode}
                onChange={handleInputChange}
                placeholder="e.g. 250655"
              />
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div>
          {/* Storage Status */}
          <div className="card" style={{ marginBottom: '24px', background: '#E8F6F4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                Storage Status
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={refreshStorageStats}>
                Refresh
              </button>
            </div>
            <div className="mini-grid">
              <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#2A9D8F' }}>{storageStats.jobs}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>Jobs</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#2A9D8F' }}>{storageStats.clients}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>Clients</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#2A9D8F' }}>{storageStats.quotes}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>Quotes</div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', marginBottom: 0 }}>
              Data is stored in your browser's localStorage. It persists until you clear browser data or use "Clear All Data" below.
            </p>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Export Data
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Download a backup of all your data including jobs, clients, quotes, and settings.
              Keep this file safe to restore your data if needed.
            </p>
            <button className="btn btn-secondary" onClick={handleExportData}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Backup
            </button>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Import Data
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Restore data from a previous backup. This will replace all existing data.
            </p>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Backup File
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="card" style={{ borderColor: '#E74C3C' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#E74C3C' }}>
              Danger Zone
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Clear all data from the system. This action cannot be undone.
              Make sure to download a backup first.
            </p>
            <button className="btn btn-danger" onClick={handleClearData}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Clear All Data
            </button>
          </div>

          {/* Pricing Reference */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Pricing Reference
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Current pricing configuration (hardcoded in system):
            </p>

            <div className="pricing-ref-grid">
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2A9D8F' }}>
                  Print Size Base Prices
                </h4>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    <tr><td>Small</td><td style={{ textAlign: 'right' }}>R350</td></tr>
                    <tr><td>Medium</td><td style={{ textAlign: 'right' }}>R450</td></tr>
                    <tr><td>Large</td><td style={{ textAlign: 'right' }}>R550</td></tr>
                    <tr><td>XLarge</td><td style={{ textAlign: 'right' }}>R750</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2A9D8F' }}>
                  Ink Coverage Multipliers
                </h4>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    <tr><td>Low</td><td style={{ textAlign: 'right' }}>1.0x</td></tr>
                    <tr><td>Medium</td><td style={{ textAlign: 'right' }}>1.2x</td></tr>
                    <tr><td>High</td><td style={{ textAlign: 'right' }}>1.4x</td></tr>
                    <tr><td>Full</td><td style={{ textAlign: 'right' }}>1.6x</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2A9D8F' }}>
                  Colour Multipliers
                </h4>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    <tr><td>1 Colour</td><td style={{ textAlign: 'right' }}>1.0x</td></tr>
                    <tr><td>2 Colours</td><td style={{ textAlign: 'right' }}>1.25x</td></tr>
                    <tr><td>3 Colours</td><td style={{ textAlign: 'right' }}>1.5x</td></tr>
                    <tr><td>4 Colours</td><td style={{ textAlign: 'right' }}>1.75x</td></tr>
                    <tr><td>5 Colours</td><td style={{ textAlign: 'right' }}>2.0x</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2A9D8F' }}>
                  Volume Discounts
                </h4>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    <tr><td>25+ prints</td><td style={{ textAlign: 'right' }}>2.5%</td></tr>
                    <tr><td>50+ prints</td><td style={{ textAlign: 'right' }}>5%</td></tr>
                    <tr><td>100+ prints</td><td style={{ textAlign: 'right' }}>10%</td></tr>
                    <tr><td>200+ prints</td><td style={{ textAlign: 'right' }}>15%</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2A9D8F' }}>
                  Screen Fees
                </h4>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    <tr><td>New Client</td><td style={{ textAlign: 'right' }}>R1,850/screen</td></tr>
                    <tr><td>Return (6 months)</td><td style={{ textAlign: 'right' }}>R0</td></tr>
                    <tr><td>Return (after 6 mo)</td><td style={{ textAlign: 'right' }}>R950/screen</td></tr>
                    <tr><td>Loyal/Regular</td><td style={{ textAlign: 'right' }}>R0</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2A9D8F' }}>
                  Other
                </h4>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    <tr><td>Shade Cloth (PSS)</td><td style={{ textAlign: 'right' }}>R55/m</td></tr>
                    <tr><td>Standard Roll</td><td style={{ textAlign: 'right' }}>50m × 1.8m</td></tr>
                    <tr><td>Cloth Charged</td><td style={{ textAlign: 'right' }}>Per roll</td></tr>
                    <tr><td>VAT</td><td style={{ textAlign: 'right' }}>15%</td></tr>
                    <tr><td>Deposit</td><td style={{ textAlign: 'right' }}>50%</td></tr>
                    <tr><td>Min. Order</td><td style={{ textAlign: 'right' }}>5 prints</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

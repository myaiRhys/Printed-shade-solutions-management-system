import { useState, useEffect, useMemo } from 'react';
import { getClients, saveClient, deleteClient } from '../utils/storage';
import { formatCurrency } from '../utils/pricing';
import { CLIENT_TIERS } from '../utils/constants';

const initialClientState = {
  companyName: '',
  shortName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  vatNumber: '',
  tier: CLIENT_TIERS.OPPORTUNITY,
  totalRevenue: 0,
  lastOrderDate: null,
  totalOrders: 0,
  notes: '',
  preferredColours: '',
  typicalQuantity: ''
};

export default function ClientDatabase({ onSelectForQuote }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(initialClientState);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    setClients(getClients());
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesTier = tierFilter === 'ALL' || client.tier === tierFilter;
      const matchesSearch = !searchQuery ||
        client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTier && matchesSearch;
    }).sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
  }, [clients, tierFilter, searchQuery]);

  const getTierClass = (tier) => {
    const tierMap = {
      'PLATINUM': 'platinum',
      'VIP': 'vip',
      'REGULAR': 'regular',
      'OPPORTUNITY': 'opportunity'
    };
    return tierMap[tier] || 'opportunity';
  };

  const getDaysSinceLastOrder = (lastOrderDate) => {
    if (!lastOrderDate) return null;
    const date = new Date(lastOrderDate);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  };

  const handleOpenAddModal = () => {
    setFormData(initialClientState);
    setEditingClient(null);
    setShowAddModal(true);
  };

  const handleEditClient = (client) => {
    setFormData(client);
    setEditingClient(client);
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClient = () => {
    if (!formData.companyName.trim()) {
      alert('Company name is required');
      return;
    }

    const clientData = {
      ...formData,
      id: editingClient?.id || `client-${Date.now()}`,
      totalRevenue: parseFloat(formData.totalRevenue) || 0,
      totalOrders: parseInt(formData.totalOrders) || 0
    };

    saveClient(clientData);
    loadClients();
    setShowAddModal(false);
    setFormData(initialClientState);
    setEditingClient(null);
  };

  const handleDeleteClient = (client) => {
    if (window.confirm(`Are you sure you want to delete ${client.companyName}?`)) {
      deleteClient(client.id);
      loadClients();
      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
      }
    }
  };

  const handleSelectForQuote = (client) => {
    if (onSelectForQuote) {
      onSelectForQuote(client);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Client Database</h1>
          <p className="page-subtitle">Manage your client relationships and history</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Client
        </button>
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
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
        >
          <option value="ALL">All Tiers</option>
          {Object.values(CLIENT_TIERS).map(tier => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {Object.values(CLIENT_TIERS).map(tier => {
          const tierClients = clients.filter(c => c.tier === tier);
          const tierRevenue = tierClients.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
          return (
            <div
              key={tier}
              className="card"
              style={{ padding: '16px', cursor: 'pointer' }}
              onClick={() => setTierFilter(tier)}
            >
              <span className={`tier-badge ${getTierClass(tier)}`} style={{ marginBottom: '8px' }}>
                {tier}
              </span>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                {tierClients.length}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {formatCurrency(tierRevenue)} revenue
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1fr 400px' : '1fr', gap: '24px' }}>
        {/* Client List */}
        <div className="card">
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div className="empty-state-title">No clients found</div>
              <p>Add your first client to get started</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Tier</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                    <th>Last Order</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => {
                    const daysSince = getDaysSinceLastOrder(client.lastOrderDate);

                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        style={{
                          background: selectedClient?.id === client.id ? '#E8F6F4' : 'transparent'
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: '600' }}>{client.companyName}</div>
                          {client.shortName && (
                            <div style={{ fontSize: '12px', color: '#666' }}>{client.shortName}</div>
                          )}
                        </td>
                        <td>
                          <div>{client.contactPerson}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{client.email}</div>
                        </td>
                        <td>
                          <span className={`tier-badge ${getTierClass(client.tier)}`}>
                            {client.tier}
                          </span>
                        </td>
                        <td className="currency">{formatCurrency(client.totalRevenue || 0)}</td>
                        <td>{client.totalOrders || 0}</td>
                        <td>
                          {client.lastOrderDate ? (
                            <span style={{
                              color: daysSince > 180 ? '#E74C3C' : daysSince > 90 ? '#F39C12' : 'inherit'
                            }}>
                              {new Date(client.lastOrderDate).toLocaleDateString('en-ZA')}
                              {daysSince > 180 && (
                                <span style={{ display: 'block', fontSize: '11px' }}>
                                  ({daysSince} days ago)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>Never</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSelectForQuote(client)}
                            title="Create quote for this client"
                          >
                            Quote
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Client Detail Panel */}
        {selectedClient && (
          <div className="card" style={{ alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                  {selectedClient.companyName}
                </h2>
                <span className={`tier-badge ${getTierClass(selectedClient.tier)}`}>
                  {selectedClient.tier}
                </span>
              </div>
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => setSelectedClient(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Contact Info */}
            <div className="detail-section">
              <div className="detail-section-title">Contact Information</div>
              <div className="detail-row">
                <span className="detail-label">Contact Person</span>
                <span className="detail-value">{selectedClient.contactPerson || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{selectedClient.phone || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{selectedClient.email || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address</span>
                <span className="detail-value">{selectedClient.address || '-'}</span>
              </div>
              {selectedClient.vatNumber && (
                <div className="detail-row">
                  <span className="detail-label">VAT Number</span>
                  <span className="detail-value">{selectedClient.vatNumber}</span>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="detail-section">
              <div className="detail-section-title">Financial Summary</div>
              <div className="detail-row">
                <span className="detail-label">Total Revenue</span>
                <span className="detail-value font-bold">{formatCurrency(selectedClient.totalRevenue || 0)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Orders</span>
                <span className="detail-value">{selectedClient.totalOrders || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Average Order</span>
                <span className="detail-value">
                  {selectedClient.totalOrders > 0
                    ? formatCurrency((selectedClient.totalRevenue || 0) / selectedClient.totalOrders)
                    : '-'
                  }
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Order</span>
                <span className="detail-value">
                  {selectedClient.lastOrderDate
                    ? new Date(selectedClient.lastOrderDate).toLocaleDateString('en-ZA')
                    : 'Never'
                  }
                </span>
              </div>
            </div>

            {/* Preferences */}
            {(selectedClient.preferredColours || selectedClient.typicalQuantity) && (
              <div className="detail-section">
                <div className="detail-section-title">Preferences</div>
                {selectedClient.preferredColours && (
                  <div className="detail-row">
                    <span className="detail-label">Preferred Colours</span>
                    <span className="detail-value">{selectedClient.preferredColours}</span>
                  </div>
                )}
                {selectedClient.typicalQuantity && (
                  <div className="detail-row">
                    <span className="detail-label">Typical Quantity</span>
                    <span className="detail-value">{selectedClient.typicalQuantity}</span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedClient.notes && (
              <div className="detail-section">
                <div className="detail-section-title">Notes</div>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{selectedClient.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E5E5' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSelectForQuote(selectedClient)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Quote
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleEditClient(selectedClient)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteClient(selectedClient)}
                style={{ marginLeft: 'auto' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-input"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Full company name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Name</label>
                  <input
                    type="text"
                    name="shortName"
                    className="form-input"
                    value={formData.shortName}
                    onChange={handleInputChange}
                    placeholder="Abbreviation or nickname"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    className="form-input"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Primary contact name"
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
                    placeholder="Phone number"
                  />
                </div>
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
                    placeholder="Email address"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Tier</label>
                  <select
                    name="tier"
                    className="form-select"
                    value={formData.tier}
                    onChange={handleInputChange}
                  >
                    {Object.values(CLIENT_TIERS).map(tier => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
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
                  placeholder="Full address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">VAT Number</label>
                  <input
                    type="text"
                    name="vatNumber"
                    className="form-input"
                    value={formData.vatNumber}
                    onChange={handleInputChange}
                    placeholder="VAT registration number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Revenue (R)</label>
                  <input
                    type="number"
                    name="totalRevenue"
                    className="form-input"
                    value={formData.totalRevenue}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Orders</label>
                  <input
                    type="number"
                    name="totalOrders"
                    className="form-input"
                    value={formData.totalOrders}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Order Date</label>
                  <input
                    type="date"
                    name="lastOrderDate"
                    className="form-input"
                    value={formData.lastOrderDate || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preferred Colours</label>
                  <input
                    type="text"
                    name="preferredColours"
                    className="form-input"
                    value={formData.preferredColours}
                    onChange={handleInputChange}
                    placeholder="e.g. Green and white"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Typical Quantity</label>
                  <input
                    type="text"
                    name="typicalQuantity"
                    className="form-input"
                    value={formData.typicalQuantity}
                    onChange={handleInputChange}
                    placeholder="e.g. 40+ prints per order"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about this client..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveClient}>
                {editingClient ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

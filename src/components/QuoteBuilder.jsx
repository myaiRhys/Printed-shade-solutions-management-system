import { useState, useEffect, useMemo } from 'react';
import { getClients, saveJob, saveQuote, generateQuoteNumber, getSettings } from '../utils/storage';
import { calculateQuote, formatCurrency, getClientTypeLabel, getScreenFeeDescription } from '../utils/pricing';
import { generateQuotePDF, downloadPDF } from '../utils/pdfGenerator';
import {
  PRINT_SIZES,
  INK_COVERAGE,
  CLOTH_SUPPLY,
  CLIENT_TYPES,
  PRICING,
  JOB_STATUSES
} from '../utils/constants';

const initialFormState = {
  clientId: '',
  clientName: '',
  contactPerson: '',
  clientEmail: '',
  clientPhone: '',
  linearMetres: '',
  printHeight: PRICING.defaultPrintHeight.toString(),
  numberOfColours: '1',
  printSize: PRINT_SIZES.MEDIUM,
  inkCoverage: INK_COVERAGE.MEDIUM,
  numberOfPrints: '',
  clothSupply: CLOTH_SUPPLY.PSS,
  clientType: CLIENT_TYPES.NEW,
  deadline: '',
  layoutNotes: '',
  specialInstructions: ''
};

export default function QuoteBuilder({ selectedClient, onQuoteSaved, onClearClient }) {
  const [formData, setFormData] = useState(initialFormState);
  const [clients, setClients] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setClients(getClients());
  }, []);

  useEffect(() => {
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId: selectedClient.id,
        clientName: selectedClient.companyName,
        contactPerson: selectedClient.contactPerson || '',
        clientEmail: selectedClient.email || '',
        clientPhone: selectedClient.phone || '',
        clientType: determineClientType(selectedClient)
      }));
    }
  }, [selectedClient]);

  const determineClientType = (client) => {
    if (!client.lastOrderDate) return CLIENT_TYPES.NEW;

    const lastOrder = new Date(client.lastOrderDate);
    const now = new Date();
    const monthsDiff = (now - lastOrder) / (1000 * 60 * 60 * 24 * 30);

    if (client.totalOrders >= 5 || client.tier === 'PLATINUM' || client.tier === 'VIP') {
      return CLIENT_TYPES.LOYAL;
    }

    if (monthsDiff <= 6) {
      return CLIENT_TYPES.RETURN_WITHIN_6;
    }

    return CLIENT_TYPES.RETURN_AFTER_6;
  };

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.companyName.toLowerCase().includes(search) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(search))
    );
  }, [clients, clientSearch]);

  const quote = useMemo(() => {
    const linearMetres = parseFloat(formData.linearMetres) || 0;
    const numberOfPrints = parseInt(formData.numberOfPrints) || 0;
    const numberOfColours = parseInt(formData.numberOfColours) || 1;

    if (numberOfPrints < PRICING.minimumPrints || linearMetres <= 0) {
      return null;
    }

    return calculateQuote({
      printSize: formData.printSize,
      inkCoverage: formData.inkCoverage,
      numberOfColours,
      numberOfPrints,
      linearMetres,
      clientType: formData.clientType,
      isClientSuppliedCloth: formData.clothSupply === CLOTH_SUPPLY.CLIENT
    });
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSaveSuccess(false);
  };

  const handleClientSelect = (client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.companyName,
      contactPerson: client.contactPerson || '',
      clientEmail: client.email || '',
      clientPhone: client.phone || '',
      clientType: determineClientType(client)
    }));
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const handleClearForm = () => {
    setFormData(initialFormState);
    setError('');
    setSaveSuccess(false);
    if (onClearClient) onClearClient();
  };

  const validateForm = () => {
    if (!formData.clientName.trim()) {
      return 'Client name is required';
    }
    if (!formData.linearMetres || parseFloat(formData.linearMetres) <= 0) {
      return 'Linear metres must be greater than 0';
    }
    if (!formData.numberOfPrints || parseInt(formData.numberOfPrints) < PRICING.minimumPrints) {
      return `Minimum order is ${PRICING.minimumPrints} prints`;
    }
    return null;
  };

  const handleSaveQuote = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!quote || !quote.isValid) {
      setError('Unable to calculate quote. Please check all fields.');
      return;
    }

    const quoteNumber = generateQuoteNumber();
    const now = new Date().toISOString();

    const quoteData = {
      id: `quote-${Date.now()}`,
      quoteNumber,
      ...formData,
      numberOfColours: parseInt(formData.numberOfColours),
      linearMetres: parseFloat(formData.linearMetres),
      printHeight: parseFloat(formData.printHeight),
      numberOfPrints: parseInt(formData.numberOfPrints),
      breakdown: quote.breakdown,
      createdAt: now
    };

    // Save quote
    saveQuote(quoteData);

    // Create job in tracker with QUOTED status
    const jobData = {
      id: `job-${Date.now()}`,
      jobNumber: quoteNumber,
      quoteId: quoteData.id,
      clientId: formData.clientId,
      clientName: formData.clientName,
      contactPerson: formData.contactPerson,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      linearMetres: parseFloat(formData.linearMetres),
      printHeight: parseFloat(formData.printHeight),
      numberOfColours: parseInt(formData.numberOfColours),
      printSize: formData.printSize,
      inkCoverage: formData.inkCoverage,
      numberOfPrints: parseInt(formData.numberOfPrints),
      clothSupply: formData.clothSupply,
      clientType: formData.clientType,
      deadline: formData.deadline || null,
      layoutNotes: formData.layoutNotes,
      specialInstructions: formData.specialInstructions,
      totalValue: quote.breakdown.total,
      depositAmount: quote.breakdown.deposit,
      balanceAmount: quote.breakdown.balance,
      status: JOB_STATUSES.QUOTED,
      statusChangedAt: now,
      depositPaid: false,
      balancePaid: false,
      notes: [],
      createdAt: now,
      updatedAt: now
    };

    saveJob(jobData);

    setSaveSuccess(true);
    setError('');

    // Reset form after short delay
    setTimeout(() => {
      handleClearForm();
      if (onQuoteSaved) onQuoteSaved();
    }, 2000);
  };

  const handleGeneratePDF = () => {
    if (!quote || !quote.isValid) {
      setError('Please complete the quote form first');
      return;
    }

    const settings = getSettings();
    const quoteData = {
      quoteNumber: 'PREVIEW',
      ...formData,
      numberOfColours: parseInt(formData.numberOfColours),
      linearMetres: parseFloat(formData.linearMetres),
      printHeight: parseFloat(formData.printHeight),
      numberOfPrints: parseInt(formData.numberOfPrints),
      breakdown: quote.breakdown,
      createdAt: new Date().toISOString()
    };

    const doc = generateQuotePDF(quoteData, settings);
    downloadPDF(doc, `PSS-Quote-Preview.pdf`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quote Builder</h1>
          <p className="page-subtitle">Create a new quote with live pricing calculations</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleClearForm}>
            Clear Form
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert-card" style={{ background: '#D1FAE5', borderLeftColor: '#27AE60', marginBottom: '24px' }}>
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="alert-content">
            <div className="alert-title" style={{ color: '#1E8449' }}>Quote Saved Successfully!</div>
            <div className="alert-text">The quote has been saved and added to the Job Tracker.</div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-card danger" style={{ marginBottom: '24px' }}>
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="alert-content">
            <div className="alert-title">Error</div>
            <div className="alert-text">{error}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Form Section */}
        <div className="card">
          {/* Client Details */}
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#2A9D8F' }}>
            Client Details
          </h3>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Client Name *</label>
            <input
              type="text"
              name="clientName"
              className="form-input"
              value={formData.clientName}
              onChange={(e) => {
                handleInputChange(e);
                setClientSearch(e.target.value);
                setShowClientDropdown(true);
              }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Search or enter client name..."
              autoComplete="off"
            />
            {showClientDropdown && clientSearch && filteredClients.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10
              }}>
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F0F0F0'
                    }}
                    onClick={() => handleClientSelect(client)}
                    onMouseOver={(e) => e.currentTarget.style.background = '#E8F6F4'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontWeight: '500' }}>{client.companyName}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {client.contactPerson} • {client.tier}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                placeholder="Contact name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                name="clientPhone"
                className="form-input"
                value={formData.clientPhone}
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
                name="clientEmail"
                className="form-input"
                value={formData.clientEmail}
                onChange={handleInputChange}
                placeholder="Email address"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client Type</label>
              <select
                name="clientType"
                className="form-select"
                value={formData.clientType}
                onChange={handleInputChange}
              >
                <option value={CLIENT_TYPES.NEW}>New Client</option>
                <option value={CLIENT_TYPES.RETURN_WITHIN_6}>Return (within 6 months)</option>
                <option value={CLIENT_TYPES.RETURN_AFTER_6}>Return (after 6 months)</option>
                <option value={CLIENT_TYPES.LOYAL}>Loyal/Regular Client</option>
              </select>
              <div className="form-hint">{getScreenFeeDescription(formData.clientType)}</div>
            </div>
          </div>

          {/* Job Details */}
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '16px', color: '#2A9D8F' }}>
            Job Specifications
          </h3>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Linear Metres *</label>
              <input
                type="number"
                name="linearMetres"
                className="form-input"
                value={formData.linearMetres}
                onChange={handleInputChange}
                placeholder="e.g. 50"
                min="1"
                step="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Print Height (m)</label>
              <input
                type="number"
                name="printHeight"
                className="form-input"
                value={formData.printHeight}
                onChange={handleInputChange}
                placeholder="1.8"
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Prints *</label>
              <input
                type="number"
                name="numberOfPrints"
                className="form-input"
                value={formData.numberOfPrints}
                onChange={handleInputChange}
                placeholder={`Min ${PRICING.minimumPrints}`}
                min={PRICING.minimumPrints}
                step="1"
              />
            </div>
          </div>

          <div className="form-row-4">
            <div className="form-group">
              <label className="form-label">Print Size</label>
              <select
                name="printSize"
                className="form-select"
                value={formData.printSize}
                onChange={handleInputChange}
              >
                {Object.values(PRINT_SIZES).map(size => (
                  <option key={size} value={size}>
                    {size} (R{PRICING.basePrices[size]})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ink Coverage</label>
              <select
                name="inkCoverage"
                className="form-select"
                value={formData.inkCoverage}
                onChange={handleInputChange}
              >
                {Object.values(INK_COVERAGE).map(coverage => (
                  <option key={coverage} value={coverage}>
                    {coverage} ({PRICING.coverageMultipliers[coverage]}x)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Number of Colours</label>
              <select
                name="numberOfColours"
                className="form-select"
                value={formData.numberOfColours}
                onChange={handleInputChange}
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>
                    {num} ({PRICING.colourMultipliers[num]}x)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cloth Supply</label>
              <select
                name="clothSupply"
                className="form-select"
                value={formData.clothSupply}
                onChange={handleInputChange}
              >
                <option value={CLOTH_SUPPLY.PSS}>PSS Supplied</option>
                <option value={CLOTH_SUPPLY.CLIENT}>Client Supplied</option>
              </select>
            </div>
          </div>

          {/* Additional Details */}
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '16px', color: '#2A9D8F' }}>
            Additional Details
          </h3>

          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input
              type="date"
              name="deadline"
              className="form-input"
              value={formData.deadline}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Layout / Spacing Notes</label>
            <textarea
              name="layoutNotes"
              className="form-textarea"
              value={formData.layoutNotes}
              onChange={handleInputChange}
              placeholder="e.g. 5 prints per roll with 2m gaps"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Special Instructions</label>
            <textarea
              name="specialInstructions"
              className="form-textarea"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              placeholder="Any special requirements..."
              rows="2"
            />
          </div>
        </div>

        {/* Quote Summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Quote Summary
            </h3>

            {!quote && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', opacity: 0.5 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p>Enter job details to see pricing</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>Min. {PRICING.minimumPrints} prints required</p>
              </div>
            )}

            {quote && !quote.isValid && (
              <div className="alert-card warning">
                <div className="alert-content">
                  <div className="alert-text">{quote.error}</div>
                </div>
              </div>
            )}

            {quote && quote.isValid && (
              <>
                <div className="quote-summary">
                  <div className="quote-summary-row">
                    <span className="quote-summary-label">Unit Price</span>
                    <span className="quote-summary-value">{formatCurrency(quote.breakdown.unitPrice)}</span>
                  </div>
                  <div className="quote-summary-row">
                    <span className="quote-summary-label">Print Cost ({quote.breakdown.numberOfPrints} prints)</span>
                    <span className="quote-summary-value">{formatCurrency(quote.breakdown.printSubtotal)}</span>
                  </div>

                  {quote.breakdown.screenFees > 0 && (
                    <div className="quote-summary-row">
                      <span className="quote-summary-label">Screen Fees ({formData.numberOfColours} screen{parseInt(formData.numberOfColours) > 1 ? 's' : ''})</span>
                      <span className="quote-summary-value">{formatCurrency(quote.breakdown.screenFees)}</span>
                    </div>
                  )}

                  {quote.breakdown.clothCost > 0 && (
                    <div className="quote-summary-row">
                      <span className="quote-summary-label">Cloth ({quote.breakdown.clothMetres}m @ R{PRICING.clothPricePerMetre}/m)</span>
                      <span className="quote-summary-value">{formatCurrency(quote.breakdown.clothCost)}</span>
                    </div>
                  )}

                  {quote.breakdown.volumeDiscountAmount > 0 && (
                    <div className="quote-summary-row" style={{ color: '#27AE60' }}>
                      <span className="quote-summary-label">Volume Discount ({(quote.breakdown.volumeDiscountRate * 100).toFixed(1)}%)</span>
                      <span className="quote-summary-value">-{formatCurrency(quote.breakdown.volumeDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="quote-summary-row subtotal">
                    <span className="quote-summary-label">Subtotal</span>
                    <span className="quote-summary-value">{formatCurrency(quote.breakdown.subtotal)}</span>
                  </div>
                  <div className="quote-summary-row">
                    <span className="quote-summary-label">VAT (15%)</span>
                    <span className="quote-summary-value">{formatCurrency(quote.breakdown.vat)}</span>
                  </div>
                  <div className="quote-summary-row total">
                    <span className="quote-summary-label">TOTAL</span>
                    <span className="quote-summary-value">{formatCurrency(quote.breakdown.total)}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '16px', background: '#F5F5F5', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>50% Deposit Required:</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(quote.breakdown.deposit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Balance on Completion:</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(quote.breakdown.balance)}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-primary btn-lg" onClick={handleSaveQuote}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Quote
                  </button>
                  <button className="btn btn-secondary" onClick={handleGeneratePDF}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 18 15 15" />
                    </svg>
                    Preview PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

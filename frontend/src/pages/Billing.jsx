import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { CreditCard, IndianRupee, CheckCircle2, Clock, AlertCircle, Printer, Plus, ShieldCheck } from 'lucide-react';

export const Billing = () => {
  const { role, user } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paying, setPaying] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [addBillModalOpen, setAddBillModalOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    patient_id: '',
    total_amount: 1000.0,
    description: 'Inpatient Ward Nursing & Medication Care',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    payment_status: 'Pending'
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/billing?status=${statusFilter}` : '/billing';
      const data = await api.get(url);
      setBills(data.bills || []);
    } catch (err) {
      console.error('Error fetching billing records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    if (role === 'admin') {
      try {
        const data = await api.get('/patients');
        setPatients(data.patients || []);
        if (data.patients?.length > 0 && !newBill.patient_id) {
          setNewBill(prev => ({ ...prev, patient_id: data.patients[0].id }));
        }
      } catch (err) {
        console.error('Error fetching patients for billing:', err);
      }
    }
  };

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const openPayModal = (bill) => {
    setSelectedBill(bill);
    setPaymentMethod('Credit Card');
    setPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    setPaying(true);
    try {
      await api.put(`/billing/${selectedBill.id}/pay`, { payment_method: paymentMethod });
      setPayModalOpen(false);
      fetchBills();
    } catch (err) {
      alert(err.message || 'Payment processing failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing', newBill);
      setAddBillModalOpen(false);
      fetchBills();
    } catch (err) {
      alert(err.message || 'Failed to create invoice.');
    }
  };

  const renderStatusBadge = (st) => {
    switch (st) {
      case 'Paid':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Paid</span>;
      case 'Pending':
        return <span className="badge badge-warning"><Clock size={12} /> Pending</span>;
      case 'Overdue':
        return <span className="badge badge-danger"><AlertCircle size={12} /> Overdue</span>;
      default:
        return <span className="badge badge-secondary">{st}</span>;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Payment Management</h1>
          <p className="page-subtitle">Itemized invoices, insurance settlements, online card payments, and printable receipts.</p>
        </div>

        {role === 'admin' && (
          <button onClick={() => setAddBillModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Create Invoice
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'Paid', 'Pending', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                backgroundColor: statusFilter === st ? 'var(--primary)' : 'white',
                color: statusFilter === st ? 'white' : 'var(--text-secondary)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {st === '' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading hospital billing records...
          </div>
        ) : bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No invoice records found.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Description</th>
                  <th>Issued Date</th>
                  <th>Due Date</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {b.bill_number}
                      </div>
                      {b.payment_method && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Method: {b.payment_method}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.patient_phone || b.patient_email}</div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ fontSize: '0.85rem' }}>{b.description || 'Hospital Care Consultation'}</div>
                    </td>
                    <td>{b.issued_date}</td>
                    <td>{b.due_date}</td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f766e' }}>
                        ₹{b.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Tax: ₹{b.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td>{renderStatusBadge(b.payment_status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {b.payment_status !== 'Paid' && (
                          <button
                            onClick={() => openPayModal(b)}
                            className="btn btn-primary btn-sm"
                          >
                            <CreditCard size={13} /> Pay Now
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBill(b);
                            setReceiptModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Print Receipt"
                        >
                          <Printer size={13} /> Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={selectedBill ? `Settle Invoice: ${selectedBill.bill_number}` : 'Process Payment'}
      >
        {selectedBill && (
          <form onSubmit={handleProcessPayment}>
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Invoice For:</span>
                <strong>{selectedBill.patient_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Service Description:</span>
                <span>{selectedBill.description}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#0f766e', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                <span>Total Amount Due:</span>
                <span>₹{selectedBill.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Payment Method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm, QR)</option>
                <option value="Credit Card">Credit / Debit Card</option>
                <option value="Online">Net Banking</option>
                <option value="Insurance">Cashless Health Insurance Claim</option>
                <option value="Cash">Cash at Hospital Desk</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setPayModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-success" disabled={paying}>
                {paying ? 'Processing...' : `Confirm Payment of ₹${selectedBill.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Hospital Payment Receipt"
        maxWidth="650px"
      >
        {selectedBill && (
          <div style={{ border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>MediPulse Hospital</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Financial Invoicing Department</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax Registration: MP-HOSP-78291</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>{selectedBill.bill_number}</div>
                <div style={{ fontSize: '0.8rem' }}>Issued: {selectedBill.issued_date}</div>
                <div style={{ marginTop: '0.25rem' }}>{renderStatusBadge(selectedBill.payment_status)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Billed To:</strong> {selectedBill.patient_name}</div>
              <div><strong>Contact:</strong> {selectedBill.patient_phone || selectedBill.patient_email}</div>
              {selectedBill.paid_date && (
                <div style={{ color: '#065f46', marginTop: '0.2rem' }}>
                  <strong>Paid On:</strong> {selectedBill.paid_date} via {selectedBill.payment_method}
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Item Description</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.65rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>{selectedBill.description}</td>
                  <td style={{ textAlign: 'right', padding: '0.65rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>₹{selectedBill.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Applicable Taxes (5%)</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-muted)' }}>+₹{selectedBill.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                {selectedBill.discount_amount > 0 && (
                  <tr>
                    <td style={{ padding: '0.5rem', color: '#16a34a' }}>Promotional / TPA Discount</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#16a34a' }}>-₹{selectedBill.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr style={{ fontWeight: 800, fontSize: '1rem', borderTop: '2px solid #0f172a' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>Total Paid / Due</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#0f766e' }}>₹{selectedBill.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Bill Modal (Admin) */}
      <Modal
        isOpen={addBillModalOpen}
        onClose={() => setAddBillModalOpen(false)}
        title="Generate Hospital Invoice"
      >
        <form onSubmit={handleCreateBill}>
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select
              className="form-select"
              value={newBill.patient_id}
              onChange={(e) => setNewBill({ ...newBill, patient_id: e.target.value })}
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} - ID #{p.id}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description of Hospital Services *</label>
            <input
              type="text"
              className="form-input"
              value={newBill.description}
              onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Base Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={newBill.total_amount}
                onChange={(e) => setNewBill({ ...newBill, total_amount: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={newBill.due_date}
                onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddBillModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

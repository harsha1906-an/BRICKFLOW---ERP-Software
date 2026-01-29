import { useState, useEffect } from 'react';
import api from '../services/api';
import './Customer.css';

const Customer = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [customers, setCustomers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    // Forms state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [customerForm, setCustomerForm] = useState({
        name: '', phone: '', email: '', address: '', source: 'Walk-in', current_status: 'New'
    });

    const [visitForm, setVisitForm] = useState({
        visit_date: new Date().toISOString().split('T')[0],
        visit_type: 'Walk-in',
        notes: '',
        budget_min: '',
        budget_max: ''
    });

    useEffect(() => {
        fetchCustomers();
        fetchAnalytics();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            if (response.data.success) {
                setCustomers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/customers/analytics/dashboard');
            if (response.data.success) {
                setAnalytics(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers', customerForm);
            setShowAddModal(false);
            setCustomerForm({ name: '', phone: '', email: '', address: '', source: 'Walk-in', current_status: 'New' });
            fetchCustomers();
            fetchAnalytics();
        } catch (error) {
            alert('Failed to add customer');
        }
    };

    const handleAddVisit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers/visits', {
                ...visitForm,
                customer_id: selectedCustomer.id
            });
            setShowVisitModal(false);
            setVisitForm({
                visit_date: new Date().toISOString().split('T')[0],
                visit_type: 'Walk-in',
                notes: '',
                budget_min: '',
                budget_max: ''
            });
            alert('Visit recorded successfully');
        } catch (error) {
            alert('Failed to record visit');
        }
    };

    const handleStatusUpdate = async (customerId, newStatus) => {
        try {
            await api.put(`/customers/status/${customerId}`, {
                status: newStatus,
                follow_up_date: new Date().toISOString().split('T')[0] // Default follow-up today
            });
            fetchCustomers();
            fetchAnalytics();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'new': '#17a2b8',
            'contacted': '#ffc107',
            'interested': '#007bff',
            'negotiating': '#6610f2',
            'converted': '#28a745',
            'lost': '#dc3545'
        };
        return colors[status?.toLowerCase()] || '#6c757d';
    };

    return (
        <div className="customer-page">
            <div className="page-header">
                <h1>Customer Analytics</h1>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        + New Customer
                    </button>
                </div>
            </div>

            {/* Analytics Dashboard */}
            {analytics && (
                <div className="analytics-grid">
                    <div className="stat-card">
                        <h3>Conversion Rate</h3>
                        <div className="stat-value">{analytics.conversionRate}%</div>
                        <div className="stat-label">Leads to Bookings</div>
                    </div>
                    <div className="stat-card">
                        <h3>Total Leads</h3>
                        <div className="stat-value">
                            {analytics.totalByStatus?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Pending Follow-ups</h3>
                        <div className="stat-value warning">
                            {analytics.pendingFollowUps?.length || 0}
                        </div>
                    </div>
                </div>
            )}

            <div className="tabs">
                <button
                    className={activeTab === 'list' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('list')}
                >
                    All Customers
                </button>
                <button
                    className={activeTab === 'pipeline' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('pipeline')}
                >
                    Pipeline View
                </button>
            </div>

            {activeTab === 'list' && (
                <div className="tab-content">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Source</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(customer => (
                                <tr key={customer.id}>
                                    <td data-label="Name">
                                        <div className="customer-name">{customer.name}</div>
                                        <div className="customer-email">{customer.email}</div>
                                    </td>
                                    <td data-label="Status">
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(customer.current_status) }}
                                        >
                                            {customer.current_status}
                                        </span>
                                    </td>
                                    <td data-label="Source">{customer.source}</td>
                                    <td data-label="Phone">{customer.phone}</td>
                                    <td data-label="Actions">
                                        <button
                                            className="btn-small"
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setShowVisitModal(true);
                                            }}
                                        >
                                            Add Visit
                                        </button>
                                        <select
                                            className="status-select"
                                            value={customer.current_status}
                                            onChange={(e) => handleStatusUpdate(customer.id, e.target.value)}
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="interested">Interested</option>
                                            <option value="negotiating">Negotiating</option>
                                            <option value="converted">Converted</option>
                                            <option value="lost">Lost</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Add New Customer</h2>
                        <form onSubmit={handleAddCustomer}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={customerForm.name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={customerForm.phone}
                                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Source</label>
                                <select
                                    value={customerForm.source}
                                    onChange={(e) => setCustomerForm({ ...customerForm, source: e.target.value })}
                                >
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Reference">Reference</option>
                                    <option value="Online">Online</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Visit Modal */}
            {showVisitModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Record Visit - {selectedCustomer?.name}</h2>
                        <form onSubmit={handleAddVisit}>
                            <div className="form-group">
                                <label>Visit Date</label>
                                <input
                                    type="date"
                                    value={visitForm.visit_date}
                                    onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={visitForm.visit_type}
                                    onChange={(e) => setVisitForm({ ...visitForm, visit_type: e.target.value })}
                                >
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Follow-up">Follow-up</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={visitForm.notes}
                                    onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowVisitModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Record Visit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer;

import { useState, useEffect } from 'react';
import api from '../services/api';
import './Payments.css';

const Payments = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [customers, setCustomers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [units, setUnits] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]); // Added state
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const [customerForm, setCustomerForm] = useState({
        name: '', phone: '', email: '', address: ''
    });

    const [bookingForm, setBookingForm] = useState({
        customer_id: '', unit_id: '', booking_date: new Date().toISOString().split('T')[0],
        agreed_price: '', notes: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        booking_id: '', payment_date: new Date().toISOString().split('T')[0],
        amount: '', payment_method: '', reference_number: '', notes: '', // Default empty
        has_gst: false, gst_percentage: 0, accounting_type: 'ACCOUNTABLE' // Updated to accounting_type
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [overpaymentWarning, setOverpaymentWarning] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [customersRes, bookingsRes, paymentsRes, unitsRes, summaryRes, methodsRes] = await Promise.all([
                api.get('/customers'),
                api.get('/bookings'),
                api.get('/payments'),
                api.get('/units'),
                api.get('/payments/summary'),
                api.get('/payment-methods') // Fetch methods
            ]);

            if (customersRes.data.success) setCustomers(customersRes.data.data);
            if (bookingsRes.data.success) setBookings(bookingsRes.data.data);
            if (paymentsRes.data.success) setPayments(paymentsRes.data.data);
            if (unitsRes.data.success) setUnits(unitsRes.data.data.filter(u => u.status === 'available'));
            if (summaryRes.data.success) setSummary(summaryRes.data.data);
            // Handle Payment Methods
            if (methodsRes.data.success) {
                setPaymentMethods(methodsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Customer functions
    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/customers', customerForm);
            setSuccess('Customer created successfully');
            setShowCustomerForm(false);
            setCustomerForm({ name: '', phone: '', email: '', address: '' });
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create customer');
        }
    };

    // Booking functions
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/bookings', bookingForm);
            setSuccess('Booking created successfully');
            setShowBookingForm(false);
            setBookingForm({
                customer_id: '', unit_id: '', booking_date: new Date().toISOString().split('T')[0],
                agreed_price: '', notes: ''
            });
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create booking');
        }
    };

    // Payment functions
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/payments', paymentForm);

            if (response.data.warning) {
                setSuccess(`Payment recorded with warning: Overpayment of ₹${formatNumber(response.data.warning.excessAmount)}`);
            } else {
                setSuccess('Payment recorded successfully');
            }

            setShowPaymentForm(false);
            setPaymentForm({
                booking_id: '', payment_date: new Date().toISOString().split('T')[0],
                amount: '', payment_method: '', reference_number: '', notes: '',
                has_gst: false, gst_percentage: 0, accounting_type: 'ACCOUNTABLE'
            });
            setOverpaymentWarning(null);
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to record payment');
        }
    };

    // Enhanced Payment States
    const [schedule, setSchedule] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // EMI Generation Form
    const [pScheduleForm, setPScheduleForm] = useState({
        booking_id: '',
        months: 12,
        interest_rate: 0,
        start_date: new Date().toISOString().split('T')[0]
    });

    // Loan Form
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [loanForm, setLoanForm] = useState({
        booking_id: '',
        bank_name: '',
        loan_account_number: '',
        sanctioned_amount: ''
    });

    const fetchSchedule = async (bookingId) => {
        try {
            setPScheduleForm(prev => ({ ...prev, booking_id: bookingId })); // Set context
            const res = await api.get(`/finance/schedule/${bookingId}`);
            if (res.data.success) {
                setSchedule(res.data.data);
                setShowScheduleModal(true);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to fetch schedule');
        }
    };

    const handleGenerateEMI = async (e) => {
        e.preventDefault();
        try {
            // Calculate total amount (mock logic: assuming we schedule the whole agreed price or balance?)
            // For simplicity, we'll ask user for amount or default to balance?
            // Let's assume we are scheduling the *Balance* amount. 
            // In a real app complexity is higher (down payment vs loan vs emi).
            // We'll trust the user to know effectively "Amount to EMI".
            // Adding 'totalAmount' to pScheduleForm might be needed, or we fetch booking balance.

            const booking = bookings.find(b => b.id == pScheduleForm.booking_id);
            if (!booking) return;

            await api.post(`/finance/schedule/${pScheduleForm.booking_id}/generate`, {
                totalAmount: booking.balance, // Defaulting to balance
                months: pScheduleForm.months,
                startDate: pScheduleForm.start_date,
                interestRate: pScheduleForm.interest_rate
            });
            alert('EMI Schedule Generated');
            fetchSchedule(pScheduleForm.booking_id); // Refresh view
        } catch (error) {
            alert('Failed to generate schedule');
        }
    };

    const handleLoanSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/loans', loanForm);
            alert('Loan details added');
            setShowLoanForm(false);
            setLoanForm({ booking_id: '', bank_name: '', loan_account_number: '', sanctioned_amount: '' });
        } catch (error) {
            alert('Failed to add loan');
        }
    };

    const checkOverpayment = async (bookingId, amount) => {
        if (!amount || amount <= 0) {
            setOverpaymentWarning(null);
            return;
        }

        try {
            const response = await api.post(`/payments/check-overpayment/${bookingId}`, { amount: parseFloat(amount) });
            if (response.data.success && response.data.data.isOverpayment) {
                setOverpaymentWarning(response.data.data);
            } else {
                setOverpaymentWarning(null);
            }
        } catch (error) {
            console.error('Error checking overpayment:', error);
        }
    };

    const openPaymentForm = (booking) => {
        setSelectedBooking(booking);
        setPaymentForm({
            ...paymentForm,
            booking_id: booking.id
        });
        setShowPaymentForm(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const getStatusBadge = (status) => {
        const colors = {
            booked: 'status-booked',
            completed: 'status-completed',
            cancelled: 'status-cancelled'
        };
        return <span className={`status-badge ${colors[status]}`}>{status}</span>;
    };

    const getPaymentMethodBadge = (method) => {
        const colors = {
            cash: 'method-cash',
            bank: 'method-bank',
            online: 'method-online',
            cheque: 'method-cheque'
        };
        return <span className={`method-badge ${colors[method]}`}>{method}</span>;
    };

    const handleDownloadReceipt = async (paymentId) => {
        try {
            const response = await api.get(`/payments/${paymentId}/pdf`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt-${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading receipt:', error);
            alert('Failed to download receipt');
        }
    };

    return (
        <div className="payments-page">
            <div className="page-header">
                <h1>Payments &amp; Bookings</h1>
            </div>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>
                <button
                    className={activeTab === 'customers' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('customers')}
                >
                    Customers
                </button>
                <button
                    className={activeTab === 'bookings' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('bookings')}
                >
                    Bookings
                </button>
                <button
                    className={activeTab === 'payments' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('payments')}
                >
                    Payment History
                </button>
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && summary && (
                <div className="dashboard-tab">
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="card-icon">📋</div>
                            <div className="card-content">
                                <div className="card-label">Total Bookings</div>
                                <div className="card-value">{summary.total_bookings || 0}</div>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="card-icon">💰</div>
                            <div className="card-content">
                                <div className="card-label">Total Value</div>
                                <div className="card-value">{formatCurrency(summary.total_agreed_value || 0)}</div>
                            </div>
                        </div>
                        <div className="summary-card success">
                            <div className="card-icon">✅</div>
                            <div className="card-content">
                                <div className="card-label">Collected</div>
                                <div className="card-value">{formatCurrency(summary.total_collected || 0)}</div>
                            </div>
                        </div>
                        <div className="summary-card warning">
                            <div className="card-icon">⏳</div>
                            <div className="card-content">
                                <div className="card-label">Outstanding</div>
                                <div className="card-value">{formatCurrency(summary.total_outstanding || 0)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bookings-overview">
                        <h2>Active Bookings</h2>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Unit</th>
                                            <th>Agreed Price</th>
                                            <th>Paid</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.filter(b => b.status === 'booked').map((booking) => (
                                            <tr key={booking.id}>
                                                <td className="customer-name">{booking.customer_name}</td>
                                                <td>{booking.unit_number}</td>
                                                <td>{formatCurrency(booking.agreed_price)}</td>
                                                <td className="paid-amount">{formatCurrency(booking.total_paid)}</td>
                                                <td className={booking.balance > 0 ? 'balance outstanding' : 'balance paid'}>
                                                    {formatCurrency(booking.balance)}
                                                </td>
                                                <td>{getStatusBadge(booking.status)}</td>
                                                <td>
                                                    <button className="btn-action" onClick={() => openPaymentForm(booking)}>Record Payment</button>
                                                    <button className="btn-small" onClick={() => fetchSchedule(booking.id)} style={{ marginLeft: '5px' }}>📅 Schedule</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div className="customers-tab">
                    <div className="tab-header">
                        <h2>Customers</h2>
                        <button className="btn-primary" onClick={() => setShowCustomerForm(true)}>
                            + Add Customer
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Address</th>
                                    <th>Bookings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="customer-name">{customer.name}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.email || '-'}</td>
                                        <td>{customer.address || '-'}</td>
                                        <td>{customer.booking_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="bookings-tab">
                    <div className="tab-header">
                        <h2>All Bookings</h2>
                        <button className="btn-primary" onClick={() => setShowBookingForm(true)}>
                            + New Booking
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Unit</th>
                                    <th>Project</th>
                                    <th>Agreed Price</th>
                                    <th>Paid</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                                        <td className="customer-name">{booking.customer_name}</td>
                                        <td>{booking.unit_number}</td>
                                        <td>{booking.project_name}</td>
                                        <td>{formatCurrency(booking.agreed_price)}</td>
                                        <td className="paid-amount">{formatCurrency(booking.total_paid)}</td>
                                        <td className={booking.balance > 0 ? 'balance outstanding' : booking.balance < 0 ? 'balance overpaid' : 'balance paid'}>
                                            {formatCurrency(booking.balance)}
                                        </td>
                                        <td>{getStatusBadge(booking.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
                <div className="payments-tab">
                    <h2>Payment History</h2>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Unit</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Reference</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                        <td className="customer-name">{payment.customer_name}</td>
                                        <td>{payment.unit_number}</td>
                                        <td className="paid-amount">{formatCurrency(payment.amount)}</td>
                                        <td>{getPaymentMethodBadge(payment.payment_method)}</td>
                                        <td>{payment.reference_number || '-'}</td>
                                        <td className="notes">{payment.notes || '-'}</td>
                                        <td>
                                            <button className="btn-small" onClick={() => handleDownloadReceipt(payment.id)}>
                                                📄 Receipt
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Customer Form Modal */}
            {showCustomerForm && (
                <div className="modal-overlay" onClick={() => setShowCustomerForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Customer</h2>
                        <form onSubmit={handleCustomerSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        value={customerForm.name}
                                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input
                                        type="tel"
                                        value={customerForm.phone}
                                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={customerForm.email}
                                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    value={customerForm.address}
                                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCustomerForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Create Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Form Modal */}
            {showBookingForm && (
                <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>New Booking</h2>
                        <form onSubmit={handleBookingSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Customer *</label>
                                    <select
                                        value={bookingForm.customer_id}
                                        onChange={(e) => setBookingForm({ ...bookingForm, customer_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit *</label>
                                    <select
                                        value={bookingForm.unit_id}
                                        onChange={(e) => setBookingForm({ ...bookingForm, unit_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.unit_number} - {u.type} (₹{formatNumber(u.price)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Booking Date *</label>
                                    <input
                                        type="date"
                                        value={bookingForm.booking_date}
                                        onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Agreed Price *</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={bookingForm.agreed_price}
                                        onChange={(e) => setBookingForm({ ...bookingForm, agreed_price: e.target.value })}
                                        required
                                        min="0"
                                        placeholder="₹"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={bookingForm.notes}
                                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowBookingForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Create Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Form Modal */}
            {showPaymentForm && selectedBooking && (
                <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Record Payment</h2>

                        <div className="booking-info">
                            <h3>Booking Details</h3>
                            <p><strong>Customer:</strong> {selectedBooking.customer_name}</p>
                            <p><strong>Unit:</strong> {selectedBooking.unit_number}</p>
                            <p><strong>Agreed Price:</strong> {formatCurrency(selectedBooking.agreed_price)}</p>
                            <p><strong>Total Paid:</strong> {formatCurrency(selectedBooking.total_paid)}</p>
                            <p className="balance-highlight">
                                <strong>Outstanding Balance:</strong> {formatCurrency(selectedBooking.balance)}
                            </p>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Payment Date *</label>
                                    <input
                                        type="date"
                                        value={paymentForm.payment_date}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paymentForm.amount}
                                        onChange={(e) => {
                                            setPaymentForm({ ...paymentForm, amount: e.target.value });
                                            checkOverpayment(selectedBooking.id, e.target.value);
                                        }}
                                        required
                                        min="0.01"
                                        placeholder="₹"
                                    />
                                </div>
                            </div>

                            {overpaymentWarning && overpaymentWarning.isOverpayment && (
                                <div className="warning-message">
                                    ⚠️ Warning: This payment exceeds the outstanding balance by {formatCurrency(overpaymentWarning.excessAmount)}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Payment Method *</label>
                                    <select
                                        value={paymentForm.payment_method}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Method</option>
                                        {paymentMethods.map(method => (
                                            <option key={method.id} value={method.id}>
                                                {method.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Reference Number</label>
                                    <input
                                        type="text"
                                        value={paymentForm.reference_number}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                                        placeholder="Transaction ID, Cheque No, etc."
                                    />
                                </div>
                            </div>

                            {/* Accountable & GST Tracking */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={paymentForm.accounting_type === 'ACCOUNTABLE'}
                                            onChange={(e) => setPaymentForm({
                                                ...paymentForm,
                                                accounting_type: e.target.checked ? 'ACCOUNTABLE' : 'NON_ACCOUNTABLE'
                                            })}
                                        />
                                        Accountable (Official)
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={paymentForm.has_gst}
                                            onChange={(e) => setPaymentForm({
                                                ...paymentForm,
                                                has_gst: e.target.checked,
                                                gst_percentage: e.target.checked ? 18 : 0
                                            })}
                                        />
                                        Has GST
                                    </label>
                                </div>
                            </div>

                            {paymentForm.has_gst && (
                                <div className="form-group">
                                    <label>GST Percentage</label>
                                    <select
                                        value={paymentForm.gst_percentage}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, gst_percentage: parseFloat(e.target.value) })}
                                    >
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                    </select>
                                    {paymentForm.amount && (
                                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                            GST Amount: ₹{((paymentForm.amount * paymentForm.gst_percentage) / 100).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => {
                                    setShowPaymentForm(false);
                                    setOverpaymentWarning(null);
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <h2>Payment Schedule</h2>

                        {schedule.length === 0 ? (
                            <div className="no-schedule">
                                <p>No schedule found. Generate EMIs?</p>
                                <form onSubmit={handleGenerateEMI} className="emi-form">
                                    <input type="hidden" value={pScheduleForm.booking_id} />
                                    {/* Ideally we set booking_id when opening modal, need to track selected Booking for schedule */}

                                    <div className="form-row">
                                        <input
                                            type="number" placeholder="Months"
                                            value={pScheduleForm.months}
                                            onChange={e => setPScheduleForm({ ...pScheduleForm, months: e.target.value })}
                                        />
                                        <input
                                            type="number" placeholder="Interest %"
                                            value={pScheduleForm.interest_rate}
                                            onChange={e => setPScheduleForm({ ...pScheduleForm, interest_rate: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            value={pScheduleForm.start_date}
                                            onChange={e => setPScheduleForm({ ...pScheduleForm, start_date: e.target.value })}
                                        />
                                        <button className="btn-primary">Generate Plan</button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Due Date</th>
                                        <th>Amount</th>
                                        <th>Paid</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.description}</td>
                                            <td>{new Date(item.due_date).toLocaleDateString()}</td>
                                            <td>{formatCurrency(item.amount)}</td>
                                            <td>{formatCurrency(item.paid_amount)}</td>
                                            <td>{item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <button className="btn-secondary" onClick={() => setShowScheduleModal(false)} style={{ marginTop: '20px' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;

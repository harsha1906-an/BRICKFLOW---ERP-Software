import { useState, useEffect } from 'react';
import api from '../services/api';
import './PaymentRequests.css';

const PaymentRequests = () => {
    const [requests, setRequests] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        booking_id: '',
        customer_id: '',
        amount_requested: '',
        due_date: '',
        notes: ''
    });
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        fetchRequests();
        fetchBookings();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const queryParams = filterStatus ? `?status=${filterStatus}` : '';
            const response = await api.get(`/payment-requests${queryParams}`);
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching payment requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const response = await api.get('/bookings');
            if (response.data.success) {
                // Only show bookings with outstanding balance
                const bookingsWithBalance = response.data.data.filter(b => b.balance > 0);
                setBookings(bookingsWithBalance);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/payment-requests', formData);
            if (response.data.success) {
                alert('Payment request created successfully!');
                setShowCreateForm(false);
                setFormData({
                    booking_id: '',
                    customer_id: '',
                    amount_requested: '',
                    due_date: '',
                    notes: ''
                });
                fetchRequests();
            }
        } catch (error) {
            console.error('Error creating payment request:', error);
            alert('Failed to create payment request');
        }
    };

    const handleBookingChange = (bookingId) => {
        const booking = bookings.find(b => b.id == bookingId);
        if (booking) {
            setFormData({
                ...formData,
                booking_id: bookingId,
                customer_id: booking.customer_id,
                amount_requested: booking.balance
            });
        }
    };

    const handleSendReminder = async (requestId) => {
        if (!confirm('Send payment reminder?')) return;
        try {
            await api.post(`/payment-requests/${requestId}/remind`);
            alert('Reminder sent successfully!');
            fetchRequests();
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    const handleMarkAsPaid = async (requestId) => {
        if (!confirm('Mark this request as paid?')) return;
        try {
            await api.put(`/payment-requests/${requestId}/status`, { status: 'paid' });
            alert('Marked as paid');
            fetchRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: 'badge-yellow',
            paid: 'badge-green',
            overdue: 'badge-red',
            cancelled: 'badge-gray'
        };
        return <span className={`status-badge ${colors[status]}`}>{status}</span>;
    };

    return (
        <div className="payment-requests-page">
            <div className="page-header">
                <h1>Payment Requests</h1>
                <button className="btn-primary" onClick={() => setShowCreateForm(true)}>+ New Request</button>
            </div>

            <div className="filters">
                <label>Filter by Status:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Request Date</th>
                            <th>Customer</th>
                            <th>Unit</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Reminders</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-data">No payment requests found</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td>{new Date(req.request_date).toLocaleDateString()}</td>
                                    <td>{req.customer_name}<br /><small>{req.customer_phone}</small></td>
                                    <td>{req.unit_number} - {req.project_name}</td>
                                    <td>₹{req.amount_requested?.toLocaleString()}</td>
                                    <td>{new Date(req.due_date).toLocaleDateString()}</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                    <td>{req.reminder_count}</td>
                                    <td>
                                        {req.status === 'pending' || req.status === 'overdue' ? (
                                            <>
                                                <button className="btn-small" onClick={() => handleSendReminder(req.id)}>📧 Remind</button>
                                                <button className="btn-small btn-success" onClick={() => handleMarkAsPaid(req.id)} style={{ marginLeft: '5px' }}>✓ Paid</button>
                                            </>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {showCreateForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Create Payment Request</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Booking</label>
                                <select
                                    value={formData.booking_id}
                                    onChange={(e) => handleBookingChange(e.target.value)}
                                    required
                                >
                                    <option value="">Select Booking</option>
                                    {bookings.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.customer_name} - {b.unit_number} (Balance: ₹{b.balance?.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Amount Requested</label>
                                <input
                                    type="number"
                                    value={formData.amount_requested}
                                    onChange={(e) => setFormData({ ...formData, amount_requested: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentRequests;

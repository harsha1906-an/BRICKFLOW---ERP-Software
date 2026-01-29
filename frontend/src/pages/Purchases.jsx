import { useState, useEffect } from 'react';
import api from '../services/api';
import './Purchases.css';

const Purchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ material_id: '', quantity: '', rate: '', amount: 0 }]
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchPurchases();
        fetchSuppliers();
        fetchMaterials();
    }, []);

    const fetchPurchases = async () => {
        try {
            const response = await api.get('/purchases');
            if (response.data.success) {
                setPurchases(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            if (response.data.success) {
                setSuppliers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await api.get('/materials');
            if (response.data.success) {
                setMaterials(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Calculate amount
        if (field === 'quantity' || field === 'rate') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const rate = parseFloat(newItems[index].rate) || 0;
            newItems[index].amount = qty * rate;
        }

        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { material_id: '', quantity: '', rate: '', amount: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const total = calculateTotal();
            await api.post('/purchases', {
                ...formData,
                total_amount: total
            });

            setSuccess('Purchase created successfully');
            setShowForm(false);
            setFormData({
                supplier_id: '',
                purchase_date: new Date().toISOString().split('T')[0],
                notes: '',
                items: [{ material_id: '', quantity: '', rate: '', amount: 0 }]
            });
            fetchPurchases();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create purchase');
        }
    };

    const handleConfirm = async (id) => {
        if (!window.confirm('Confirm this purchase? This will update inventory stock.')) {
            return;
        }

        try {
            await api.post(`/purchases/${id}/confirm`);
            setSuccess('Purchase confirmed and inventory updated');
            fetchPurchases();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to confirm purchase');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this purchase? This will reverse the inventory stock.')) {
            return;
        }

        try {
            await api.post(`/purchases/${id}/cancel`);
            setSuccess('Purchase cancelled and inventory reversed');
            fetchPurchases();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to cancel purchase');
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            draft: 'status-draft',
            confirmed: 'status-confirmed',
            cancelled: 'status-cancelled'
        };
        return <span className={`status-badge ${statusColors[status]}`}>{status}</span>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return <div className="loading">Loading purchases...</div>;
    }

    return (
        <div className="purchases-page">
            <div className="page-header">
                <h1>Purchases</h1>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    + New Purchase
                </button>
            </div>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                        <h2>New Purchase Order</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Supplier *</label>
                                    <select
                                        value={formData.supplier_id}
                                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Purchase Date *</label>
                                    <input
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                    placeholder="Purchase notes..."
                                />
                            </div>

                            <h3>Items</h3>
                            <div className="items-section">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="item-row">
                                        <div className="item-fields">
                                            <select
                                                value={item.material_id}
                                                onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Material</option>
                                                {materials.map((m) => (
                                                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                placeholder="Quantity"
                                                required
                                                min="0.01"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                placeholder="Rate"
                                                required
                                                min="0"
                                            />
                                            <div className="item-amount">
                                                {formatCurrency(item.amount)}
                                            </div>
                                        </div>
                                        {formData.items.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-remove"
                                                onClick={() => removeItem(index)}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn-add-item" onClick={addItem}>
                                    + Add Item
                                </button>
                            </div>

                            <div className="total-section">
                                <strong>Total Amount: {formatCurrency(calculateTotal())}</strong>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Purchase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="purchases-table-container">
                {purchases.length === 0 ? (
                    <div className="empty-state">
                        <p>No purchases found. Create your first purchase order!</p>
                    </div>
                ) : (
                    <table className="purchases-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Supplier</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((purchase) => (
                                <tr key={purchase.id}>
                                    <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                                    <td className="supplier-name">{purchase.supplier_name}</td>
                                    <td className="amount">{formatCurrency(purchase.total_amount)}</td>
                                    <td>{getStatusBadge(purchase.status)}</td>
                                    <td>{purchase.notes || '-'}</td>
                                    <td className="actions">
                                        {purchase.status === 'draft' && (
                                            <button className="btn-confirm" onClick={() => handleConfirm(purchase.id)}>
                                                Confirm
                                            </button>
                                        )}
                                        {purchase.status === 'confirmed' && (
                                            <button className="btn-cancel" onClick={() => handleCancel(purchase.id)}>
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Purchases;

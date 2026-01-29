import { useState, useEffect } from 'react';
import api from '../services/api';
import './Inventory.css';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('stock');
    const [stockSummary, setStockSummary] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter State
    const [selectedProject, setSelectedProject] = useState('');

    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [materialFormData, setMaterialFormData] = useState({ name: '', unit: '' });

    const [stockInData, setStockInData] = useState({
        material_id: '',
        quantity: '',
        reference_type: 'purchase',
        reference_id: '',
        notes: '',
        project_id: '', // New field for Site-wise IN
        usage_reason: '' // New field
    });

    const [stockOutData, setStockOutData] = useState({
        material_id: '',
        project_id: '',
        quantity: '',
        reference_type: 'usage',
        notes: '',
        usage_reason: '' // New field
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProjects();
        if (activeTab === 'materials') {
            fetchMaterials();
        } else if (activeTab === 'stock') {
            fetchStockSummary();
        } else if (activeTab === 'history') {
            fetchTransactions();
        }
    }, [activeTab]);

    // Refetch stock when project filter changes
    useEffect(() => {
        if (activeTab === 'stock') {
            fetchStockSummary();
        }
    }, [selectedProject]);

    const fetchStockSummary = async () => {
        setLoading(true);
        try {
            const params = selectedProject ? { projectId: selectedProject } : {};
            const response = await api.get('/inventory/stock', { params });
            if (response.data.success) {
                setStockSummary(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        // ... (same as before)
        setLoading(true);
        try {
            const response = await api.get('/materials');
            if (response.data.success) {
                setMaterials(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        // ... (same as before)
        setLoading(true);
        try {
            const response = await api.get('/inventory/transactions');
            if (response.data.success) {
                setTransactions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleCreateMaterial = async (e) => {
        // ... (same as before)
        e.preventDefault();
        setError('');
        try {
            await api.post('/materials', materialFormData);
            setSuccess('Material created successfully');
            setShowMaterialForm(false);
            setMaterialFormData({ name: '', unit: '' });
            fetchMaterials();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create material');
        }
    };

    const handleStockIn = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/inventory/in', {
                ...stockInData,
                quantity: parseFloat(stockInData.quantity),
                project_id: stockInData.project_id || null // Handle Optional project ID
            });
            setSuccess('Stock IN recorded successfully');
            setStockInData({ material_id: '', quantity: '', reference_type: 'purchase', reference_id: '', notes: '', project_id: '', usage_reason: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to record stock IN');
        }
    };

    const handleStockOut = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/inventory/out', {
                ...stockOutData,
                quantity: parseFloat(stockOutData.quantity),
                project_id: stockOutData.project_id || null
            });
            setSuccess('Stock OUT recorded successfully');
            setStockOutData({ material_id: '', project_id: '', quantity: '', reference_type: 'usage', notes: '', usage_reason: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to record stock OUT');
        }
    };

    return (
        <div className="inventory-page">
            <div className="page-header">
                <h1>Inventory Management</h1>
            </div>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="tabs">
                <button className={activeTab === 'stock' ? 'active' : ''} onClick={() => setActiveTab('stock')}>
                    Stock Summary
                </button>
                <button className={activeTab === 'materials' ? 'active' : ''} onClick={() => setActiveTab('materials')}>
                    Materials
                </button>
                <button className={activeTab === 'in' ? 'active' : ''} onClick={() => setActiveTab('in')}>
                    Stock IN
                </button>
                <button className={activeTab === 'out' ? 'active' : ''} onClick={() => setActiveTab('out')}>
                    Stock OUT
                </button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
                    Transaction History
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'stock' && (
                    <div className="stock-summary">
                        <div className="tab-header">
                            <h2>Current Stock Levels</h2>
                            <div className="filters">
                                <select
                                    className="filter-select"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">All Locations (Global)</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button className="btn-secondary" onClick={fetchStockSummary}>Refresh</button>
                            </div>
                        </div>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Material</th>
                                            <th>Unit</th>
                                            <th>Total IN</th>
                                            <th>Total OUT</th>
                                            <th>Current Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockSummary.map((item) => (
                                            <tr key={item.id}>
                                                <td className="material-name">{item.name}</td>
                                                <td>{item.unit}</td>
                                                <td className="stock-in">{item.total_in}</td>
                                                <td className="stock-out">{item.total_out}</td>
                                                <td className="current-stock">{item.current_stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'materials' && (
                    <div className="materials-tab">
                        {/* ... (Keep existing Materials View) */}
                        <div className="tab-header">
                            <h2>Materials Master</h2>
                            <button className="btn-primary" onClick={() => setShowMaterialForm(true)}>+ Add Material</button>
                        </div>

                        {showMaterialForm && (
                            <div className="form-card">
                                <h3>Add New Material</h3>
                                <form onSubmit={handleCreateMaterial}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Material Name *</label>
                                            <input
                                                type="text"
                                                value={materialFormData.name}
                                                onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Unit *</label>
                                            <input
                                                type="text"
                                                value={materialFormData.unit}
                                                onChange={(e) => setMaterialFormData({ ...materialFormData, unit: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn-secondary" onClick={() => setShowMaterialForm(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary">Create</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>Material Name</th>
                                        <th>Unit</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials.map((material) => (
                                        <tr key={material.id}>
                                            <td className="material-name">{material.name}</td>
                                            <td>{material.unit}</td>
                                            <td>{new Date(material.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'in' && (
                    <div className="stock-in-tab">
                        <h2>Record Stock IN</h2>
                        <div className="form-card">
                            <form onSubmit={handleStockIn}>
                                <div className="form-group">
                                    <label>Material *</label>
                                    <select
                                        value={stockInData.material_id}
                                        onChange={(e) => setStockInData({ ...stockInData, material_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Material</option>
                                        {materials.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Quantity *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={stockInData.quantity}
                                        onChange={(e) => setStockInData({ ...stockInData, quantity: e.target.value })}
                                        required
                                        min="0.01"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Site/Location (Optional)</label>
                                    <select
                                        value={stockInData.project_id}
                                        onChange={(e) => setStockInData({ ...stockInData, project_id: e.target.value })}
                                    >
                                        <option value="">Central Store / Warehouse</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Reference Type *</label>
                                    <select
                                        value={stockInData.reference_type}
                                        onChange={(e) => setStockInData({ ...stockInData, reference_type: e.target.value })}
                                        required
                                    >
                                        <option value="purchase">Purchase</option>
                                        <option value="return">Return from Project</option>
                                        <option value="adjustment">Adjustment</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Ref ID / PO Number</label>
                                    <input
                                        type="text"
                                        value={stockInData.reference_id}
                                        onChange={(e) => setStockInData({ ...stockInData, reference_id: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea
                                        value={stockInData.notes}
                                        onChange={(e) => setStockInData({ ...stockInData, notes: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                <button type="submit" className="btn-primary">Record Stock IN</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'out' && (
                    <div className="stock-out-tab">
                        <h2>Record Stock OUT</h2>
                        <div className="form-card">
                            <form onSubmit={handleStockOut}>
                                <div className="form-group">
                                    <label>Material *</label>
                                    <select
                                        value={stockOutData.material_id}
                                        onChange={(e) => setStockOutData({ ...stockOutData, material_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Material</option>
                                        {materials.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Project / Site *</label>
                                    <select
                                        value={stockOutData.project_id}
                                        onChange={(e) => setStockOutData({ ...stockOutData, project_id: e.target.value })}
                                        required // OUT usually implies usage at a project
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Usage Reason</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Foundation, Plastering"
                                        value={stockOutData.usage_reason}
                                        onChange={(e) => setStockOutData({ ...stockOutData, usage_reason: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Quantity *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={stockOutData.quantity}
                                        onChange={(e) => setStockOutData({ ...stockOutData, quantity: e.target.value })}
                                        required
                                        min="0.01"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Reference Type *</label>
                                    <select
                                        value={stockOutData.reference_type}
                                        onChange={(e) => setStockOutData({ ...stockOutData, reference_type: e.target.value })}
                                        required
                                    >
                                        <option value="usage">Usage</option>
                                        <option value="adjustment">Adjustment</option>
                                        <option value="transfer">Transfer</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea
                                        value={stockOutData.notes}
                                        onChange={(e) => setStockOutData({ ...stockOutData, notes: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                <button type="submit" className="btn-primary">Record Stock OUT</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="history-tab">
                        {/* ... (Keep existing History View) */}
                        <div className="tab-header">
                            <h2>Transaction History</h2>
                            <button className="btn-secondary" onClick={fetchTransactions}>Refresh</button>
                        </div>
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : (
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Material</th>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Project</th>
                                        <th>Reference</th>
                                        <th>Reason/Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((txn) => (
                                        <tr key={txn.id}>
                                            <td>{new Date(txn.created_at).toLocaleString()}</td>
                                            <td>{txn.material_name}</td>
                                            <td>
                                                <span className={`type-badge type-${txn.type.toLowerCase()}`}>
                                                    {txn.type}
                                                </span>
                                            </td>
                                            <td>{txn.quantity} {txn.material_unit}</td>
                                            <td>{txn.project_name || '-'}</td>
                                            <td>{txn.reference_type}</td>
                                            <td>
                                                {txn.usage_reason && <strong>[{txn.usage_reason}] </strong>}
                                                {txn.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;

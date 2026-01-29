import { useState, useEffect } from 'react';
import api from '../services/api';
import './PettyCash.css';

const PettyCash = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(null);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'disbursement',
        amount: '',
        category: 'transport',
        description: '',
        receipt_number: '',
        transaction_date: new Date().toISOString().split('T')[0],
        has_gst: false,
        gst_percentage: 0,
        is_accountable: true
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchProjectData();
        }
    }, [selectedProject]);

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

    const fetchProjectData = async () => {
        setLoading(true);
        try {
            const [transRes, balRes, sumRes] = await Promise.all([
                api.get(`/petty-cash/project/${selectedProject}`),
                api.get(`/petty-cash/balance/${selectedProject}`),
                api.get(`/petty-cash/summary/${selectedProject}`)
            ]);

            if (transRes.data.success) setTransactions(transRes.data.data);
            if (balRes.data.success) setBalance(balRes.data.data);
            if (sumRes.data.success) setSummary(sumRes.data.data);
        } catch (error) {
            console.error('Error fetching project data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = formData.type === 'replenishment' ? '/petty-cash/replenish' : '/petty-cash';
            const response = await api.post(endpoint, {
                ...formData,
                project_id: selectedProject
            });

            if (response.data.success) {
                alert('Transaction recorded successfully!');
                setShowTransactionForm(false);
                setFormData({
                    type: 'disbursement',
                    amount: '',
                    category: 'transport',
                    description: '',
                    receipt_number: '',
                    transaction_date: new Date().toISOString().split('T')[0],
                    has_gst: false,
                    gst_percentage: 0,
                    is_accountable: true
                });
                fetchProjectData();
            }
        } catch (error) {
            console.error('Error recording transaction:', error);
            alert(error.response?.data?.message || 'Failed to record transaction');
        }
    };

    const getTypeIcon = (type) => {
        return type === 'disbursement' ? '📤' : type === 'replenishment' ? '💰' : '📥';
    };

    return (
        <div className="petty-cash-page">
            <div className="page-header">
                <h1>Petty Cash Management</h1>
            </div>

            <div className="project-selector">
                <label>Select Project:</label>
                <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                >
                    <option value="">Choose a project</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {selectedProject && (
                <>
                    <div className="cash-dashboard">
                        <div className="balance-card">
                            <h3>Current Balance</h3>
                            <div className="balance-amount">
                                ₹{balance?.current_balance?.toLocaleString() || '0'}
                            </div>
                            {balance?.last_replenishment_date && (
                                <div className="last-replenishment">
                                    Last replenished: {new Date(balance.last_replenishment_date).toLocaleDateString()}
                                    (₹{balance.last_replenishment_amount?.toLocaleString()})
                                </div>
                            )}
                        </div>

                        <div className="summary-cards">
                            {summary.map((item, idx) => (
                                <div key={idx} className="summary-card">
                                    <div className="category-name">{item.category || 'N/A'}</div>
                                    <div className="category-amount">₹{item.total_disbursed?.toLocaleString()}</div>
                                    <div className="category-count">{item.disbursement_count} transactions</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="actions-bar">
                        <button className="btn-primary" onClick={() => setShowTransactionForm(true)}>+ New Transaction</button>
                    </div>

                    {loading ? (
                        <div className="loading">Loading transactions...</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Details</th>
                                    <th>Balance After</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="no-data">No transactions yet</td>
                                    </tr>
                                ) : (
                                    transactions.map((trans) => (
                                        <tr key={trans.id}>
                                            <td>{new Date(trans.transaction_date).toLocaleDateString()}</td>
                                            <td>{getTypeIcon(trans.type)} {trans.type}</td>
                                            <td>{trans.category || '-'}</td>
                                            <td>{trans.description}</td>
                                            <td className={trans.type === 'disbursement' ? 'amount-negative' : 'amount-positive'}>
                                                {trans.type === 'disbursement' ? '-' : '+'}₹{trans.amount?.toLocaleString()}
                                                {trans.has_gst && <small style={{ color: '#666' }}> (incl. GST)</small>}
                                            </td>
                                            <td>
                                                {trans.is_accountable ?
                                                    <span className="badge badge-success">Official</span> :
                                                    <span className="badge badge-warning">Non-Acc</span>
                                                }
                                                {trans.has_gst && <span className="badge badge-info">GST</span>}
                                            </td>
                                            <td>₹{trans.balance_after?.toLocaleString()}</td>
                                            <td>{trans.user_name}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {showTransactionForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Record Transaction</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="disbursement">Disbursement</option>
                                    <option value="receipt">Receipt</option>
                                    <option value="replenishment">Replenishment</option>
                                </select>
                            </div>

                            {formData.type === 'disbursement' && (
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="transport">Transport</option>
                                        <option value="food">Food</option>
                                        <option value="materials">Materials</option>
                                        <option value="utilities">Utilities</option>
                                        <option value="misc">Miscellaneous</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Amount (Total)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row" style={{ alignItems: 'center', gap: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_accountable}
                                        onChange={(e) => setFormData({ ...formData, is_accountable: e.target.checked })}
                                    />
                                    Accountable (Official Records)
                                </label>
                                {!formData.is_accountable && (
                                    <small style={{ color: '#ff9800', margin: 0 }}>⚠️ Non-accountable transaction</small>
                                )}
                            </div>

                            <div className="form-row" style={{ gap: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.has_gst}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            has_gst: e.target.checked,
                                            gst_percentage: e.target.checked ? 18 : 0
                                        })}
                                    />
                                    Has GST
                                </label>
                                {formData.has_gst && (
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>GST %</label>
                                        <select
                                            value={formData.gst_percentage}
                                            onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) })}
                                        >
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {formData.has_gst && formData.amount && (
                                <div className="info-box">
                                    <strong>GST Breakdown:</strong><br />
                                    Base: ₹{((formData.amount || 0) / (1 + formData.gst_percentage / 100)).toFixed(2)}
                                    {' | '}
                                    GST ({formData.gst_percentage}%): ₹{(formData.amount - (formData.amount / (1 + formData.gst_percentage / 100))).toFixed(2)}
                                    {' | '}
                                    <strong>Total: ₹{(formData.amount || 0).toFixed(2)}</strong>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="2"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Receipt Number</label>
                                    <input
                                        type="text"
                                        value={formData.receipt_number}
                                        onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.transaction_date}
                                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowTransactionForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Record Transaction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PettyCash;

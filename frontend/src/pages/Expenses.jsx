import { useState, useEffect } from 'react';
import api from '../services/api';
import './Expenses.css';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState('');
    const [showNonAccountable, setShowNonAccountable] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [correctionExpense, setCorrectionExpense] = useState(null);
    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        project_id: '',
        category: 'labour',
        amount: '',
        notes: '',
        has_gst: false,
        gst_percentage: 0,
        is_accountable: true
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = [
        { value: 'labour', label: 'Labour' },
        { value: 'transport', label: 'Transport' },
        { value: 'machinery', label: 'Machinery' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'permits', label: 'Permits' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        fetchProjects();
        fetchExpenses();
        fetchSummary();
    }, [selectedProject, showNonAccountable]);

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

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            let url = '/expenses?';
            if (selectedProject) url += `project_id=${selectedProject}&`;
            if (showNonAccountable) url += 'include_non_accountable=true';
            const response = await api.get(url);
            if (response.data.success) {
                setExpenses(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            let url = '/expenses/summary?';
            if (selectedProject) url += `project_id=${selectedProject}&`;
            if (showNonAccountable) url += 'include_non_accountable=true';
            const response = await api.get(url);
            if (response.data.success) {
                setSummary(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/expenses', formData);
            setSuccess('Expense created successfully');
            setShowForm(false);
            setFormData({
                expense_date: new Date().toISOString().split('T')[0],
                project_id: '',
                category: 'labour',
                amount: '',
                notes: '',
                has_gst: false,
                gst_percentage: 0,
                is_accountable: true
            });
            fetchExpenses();
            fetchSummary();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create expense');
        }
    };

    const handleCorrection = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.post(`/expenses/${correctionExpense.id}/correct`, formData);
            setSuccess('Correction entries created successfully');
            setShowCorrectionForm(false);
            setCorrectionExpense(null);
            setFormData({
                expense_date: new Date().toISOString().split('T')[0],
                project_id: '',
                category: 'labour',
                amount: '',
                notes: ''
            });
            fetchExpenses();
            fetchSummary();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create correction');
        }
    };

    const openCorrectionForm = (expense) => {
        setCorrectionExpense(expense);
        setFormData({
            expense_date: expense.expense_date,
            project_id: expense.project_id,
            category: expense.category,
            amount: Math.abs(expense.amount),
            notes: expense.notes || ''
        });
        setShowCorrectionForm(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getCategoryBadge = (category) => {
        const colors = {
            labour: 'category-labour',
            transport: 'category-transport',
            machinery: 'category-machinery',
            utilities: 'category-utilities',
            permits: 'category-permits',
            other: 'category-other'
        };
        return <span className={`category-badge ${colors[category]}`}>{category}</span>;
    };

    const getTotalByCategory = (category) => {
        const categorySum = summary
            .filter(s => s.category === category)
            .reduce((sum, s) => sum + s.total_amount, 0);
        return categorySum;
    };

    const getGrandTotal = () => {
        return summary.reduce((sum, s) => sum + s.total_amount, 0);
    };

    const calculateGSTAmount = () => {
        if (!formData.has_gst || !formData.gst_percentage || !formData.amount) return 0;
        const amount = parseFloat(formData.amount);
        const gst = (amount * formData.gst_percentage) / 100;
        return gst.toFixed(2);
    };

    const getTotalAmount = () => {
        const base = parseFloat(formData.amount) || 0;
        const gst = parseFloat(calculateGSTAmount()) || 0;
        return (base + gst).toFixed(2);
    };

    return (
        <div className="expenses-page">
            <div className="page-header">
                <h1>Expense Tracking</h1>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    + Add Expense
                </button>
            </div>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Summary Cards */}
            <div className="summary-section">
                <h2>Expense Summary</h2>
                <div className="summary-cards">
                    {categories.map((cat) => {
                        const total = getTotalByCategory(cat.value);
                        if (total === 0 && !selectedProject) return null;
                        return (
                            <div key={cat.value} className="summary-card">
                                <div className="card-header">{cat.label}</div>
                                <div className="card-amount">{formatCurrency(total)}</div>
                            </div>
                        );
                    })}
                    <div className="summary-card total-card">
                        <div className="card-header">Total Expenses</div>
                        <div className="card-amount">{formatCurrency(getGrandTotal())}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Filter by Project:</label>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        <option value="">All Projects</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={showNonAccountable}
                            onChange={(e) => setShowNonAccountable(e.target.checked)}
                        />
                        Show Non-Accountable (Cash/Black Money)
                    </label>
                </div>
            </div>

            {/* Add Expense Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Expense</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input
                                        type="date"
                                        value={formData.expense_date}
                                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Project *</label>
                                    <select
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount (Base) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        min="0"
                                        placeholder="₹"
                                    />
                                </div>
                            </div>

                            {/* Accountable/GST Section */}
                            <div className="form-section">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_accountable}
                                                onChange={(e) => setFormData({ ...formData, is_accountable: e.target.checked })}
                                            />
                                            Accountable (White Money / Official)
                                        </label>
                                        <small className="help-text">
                                            {formData.is_accountable ? '✓ This will be included in official books' : '⚠️ Cash transaction (not in official books)'}
                                        </small>
                                    </div>
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.has_gst}
                                                onChange={(e) => setFormData({ ...formData, has_gst: e.target.checked, gst_percentage: e.target.checked ? 18 : 0 })}
                                            />
                                            Has GST
                                        </label>
                                    </div>
                                </div>

                                {formData.has_gst && (
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>GST Percentage *</label>
                                            <select
                                                value={formData.gst_percentage}
                                                onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) })}
                                            >
                                                <option value="0">0%</option>
                                                <option value="5">5%</option>
                                                <option value="12">12%</option>
                                                <option value="18">18%</option>
                                                <option value="28">28%</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>GST Amount</label>
                                            <input
                                                type="text"
                                                value={`₹${calculateGSTAmount()}`}
                                                disabled
                                                className="calculated-field"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Total Amount</label>
                                            <input
                                                type="text"
                                                value={`₹${getTotalAmount()}`}
                                                disabled
                                                className="calculated-field total-amount"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Create Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Correction Form Modal */}
            {showCorrectionForm && correctionExpense && (
                <div className="modal-overlay" onClick={() => setShowCorrectionForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Correct Expense</h2>
                        <div className="correction-info">
                            <p><strong>Original Expense:</strong></p>
                            <p>Date: {new Date(correctionExpense.expense_date).toLocaleDateString()}</p>
                            <p>Category: {correctionExpense.category}</p>
                            <p>Amount: {formatCurrency(correctionExpense.amount)}</p>
                            <p className="correction-note">
                                Note: This will create a reversal entry and a new expense with corrected values.
                            </p>
                        </div>
                        <form onSubmit={handleCorrection}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>New Date *</label>
                                    <input
                                        type="date"
                                        value={formData.expense_date}
                                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>New Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    min="0"
                                    placeholder="₹"
                                />
                            </div>
                            <div className="form-group">
                                <label>New Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCorrectionForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">Create Correction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Expenses Table */}
            <div className="expenses-table-container">
                <h2>Expense List</h2>
                {loading ? (
                    <div className="loading">Loading expenses...</div>
                ) : expenses.length === 0 ? (
                    <div className="empty-state">
                        <p>No expenses found. Add your first expense!</p>
                    </div>
                ) : (
                    <table className="expenses-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Project</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((expense) => (
                                <tr
                                    key={expense.id}
                                    className={expense.is_correction ? 'correction-row' : ''}
                                >
                                    <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                                    <td className="project-name">{expense.project_name}</td>
                                    <td>{getCategoryBadge(expense.category)}</td>
                                    <td>
                                        <div className="type-badges">
                                            {expense.is_accountable ? (
                                                <span className="badge badge-accountable" title="Accountable - White Money">✓ Accountable</span>
                                            ) : (
                                                <span className="badge badge-non-accountable" title="Non-Accountable - Cash/Black">⚠ Cash</span>
                                            )}
                                            {expense.has_gst && (
                                                <span className="badge badge-gst" title={`GST ${expense.gst_percentage}%`}>GST {expense.gst_percentage}%</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={expense.amount < 0 ? 'amount negative' : 'amount'}>
                                        <div>
                                            {expense.has_gst ? (
                                                <>
                                                    <div className="amount-breakdown">
                                                        <small>Base: {formatCurrency(expense.base_amount || expense.amount)}</small>
                                                        {expense.gst_amount > 0 && <small>+GST: {formatCurrency(expense.gst_amount)}</small>}
                                                    </div>
                                                    <strong>{formatCurrency(expense.amount)}</strong>
                                                </>
                                            ) : (
                                                formatCurrency(expense.amount)
                                            )}
                                        </div>
                                        {expense.is_correction && <span className="correction-badge">Correction</span>}
                                    </td>
                                    <td className="notes">{expense.notes || '-'}</td>
                                    <td>
                                        {!expense.is_correction && expense.amount > 0 && (
                                            <button
                                                className="btn-correct"
                                                onClick={() => openCorrectionForm(expense)}
                                            >
                                                Correct
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

export default Expenses;

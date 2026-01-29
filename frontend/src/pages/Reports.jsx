import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import './Reports.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reports = () => {
    const [activeTab, setActiveTab] = useState('stock');
    const [loading, setLoading] = useState(true);

    // Report data
    const [stockSummary, setStockSummary] = useState([]);
    const [materialConsumption, setMaterialConsumption] = useState([]);
    const [projectCosts, setProjectCosts] = useState([]);
    const [incomeExpense, setIncomeExpense] = useState(null);
    const [projectProfit, setProjectProfit] = useState([]);

    // Filters
    const [selectedProject, setSelectedProject] = useState('');
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetchProjects();
        fetchReports();
    }, []);

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

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [stock, consumption, costs, income, profit] = await Promise.all([
                api.get('/reports/stock-summary'),
                api.get('/reports/material-consumption'),
                api.get('/reports/project-costs'),
                api.get('/reports/income-expense'),
                api.get('/reports/project-profit')
            ]);

            if (stock.data.success) setStockSummary(stock.data.data);
            if (consumption.data.success) setMaterialConsumption(consumption.data.data);
            if (costs.data.success) setProjectCosts(costs.data.data);
            if (income.data.success) setIncomeExpense(income.data.data);
            if (profit.data.success) setProjectProfit(profit.data.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
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

    const getStockStatus = (stock) => {
        if (stock <= 0) return 'out-of-stock';
        if (stock < 50) return 'low-stock';
        return 'in-stock';
    };

    const filteredConsumption = selectedProject
        ? materialConsumption.filter(item => item.project_id === parseInt(selectedProject))
        : materialConsumption;

    // Chart Data Preparation
    const stockChartData = stockSummary.map(item => ({
        name: item.name,
        value: item.current_stock
    }));

    const incomeExpenseChartData = incomeExpense ? [
        { name: 'Income', amount: incomeExpense.total_income },
        { name: 'Expenses', amount: incomeExpense.total_expenses },
        { name: 'Purchases', amount: incomeExpense.total_purchases },
    ] : [];

    return (
        <div className="reports-page">
            <div className="page-header">
                <h1>Reports & Analytics</h1>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={activeTab === 'stock' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('stock')}
                >
                    Stock Summary
                </button>
                <button
                    className={activeTab === 'consumption' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('consumption')}
                >
                    Material Consumption
                </button>
                <button
                    className={activeTab === 'costs' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('costs')}
                >
                    Project Costs
                </button>
                <button
                    className={activeTab === 'income' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('income')}
                >
                    Income vs Expense
                </button>
                <button
                    className={activeTab === 'profit' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('profit')}
                >
                    Project Profit
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading reports...</div>
            ) : (
                <>
                    {/* Stock Summary Tab */}
                    {activeTab === 'stock' && (
                        <div className="report-tab">
                            <div className="report-visuals">
                                <div className="chart-card liquid-glass">
                                    <h3>Stock Level Distribution</h3>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={stockChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {stockChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <h2>Stock Summary</h2>
                            <p className="report-description">Current stock levels for all materials</p>

                            <div className="table-responsive">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Material</th>
                                            <th>Unit</th>
                                            <th>Current Stock</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockSummary.map((item) => (
                                            <tr key={item.id}>
                                                <td className="material-name">{item.name}</td>
                                                <td>{item.unit}</td>
                                                <td className="stock-value">{formatNumber(item.current_stock)}</td>
                                                <td>
                                                    <span className={`stock-badge ${getStockStatus(item.current_stock)}`}>
                                                        {item.current_stock <= 0 ? 'Out of Stock' :
                                                            item.current_stock < 50 ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Material Consumption Tab */}
                    {activeTab === 'consumption' && (
                        <div className="report-tab">
                            <div className="tab-header">
                                <div>
                                    <h2>Material Consumption by Project</h2>
                                    <p className="report-description">Track material usage across projects</p>
                                </div>
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
                            </div>

                            <div className="table-responsive">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Material</th>
                                            <th>Unit</th>
                                            <th>Quantity Used</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredConsumption.length > 0 ? (
                                            filteredConsumption.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="project-name">{item.project_name}</td>
                                                    <td>{item.material_name}</td>
                                                    <td>{item.unit}</td>
                                                    <td className="quantity-value">{formatNumber(item.quantity_used)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="empty-state">No material consumption data</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Project Costs Tab */}
                    {activeTab === 'costs' && (
                        <div className="report-tab">
                            <h2>Project Cost Report</h2>
                            <p className="report-description">Total expenses per project</p>

                            <div className="table-responsive">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Total Expenses</th>
                                            <th>Expense Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectCosts.map((item) => (
                                            <tr key={item.id}>
                                                <td className="project-name">{item.project_name}</td>
                                                <td className="cost-value">{formatCurrency(item.total_expenses)}</td>
                                                <td>{item.expense_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Income vs Expense Tab */}
                    {activeTab === 'income' && incomeExpense && (
                        <div className="report-tab">
                            <div className="report-visuals">
                                <div className="chart-card liquid-glass">
                                    <h3>Financial Comparison</h3>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={incomeExpenseChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="name" stroke="#71717a" />
                                                <YAxis stroke="#71717a" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                                    {incomeExpenseChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.name === 'Income' ? '#10b981' : '#ef4444'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <h2>Income vs Expense</h2>
                            <p className="report-description">Overall financial health</p>

                            <div className="financial-summary">
                                <div className="summary-card income-card liquid-glass">
                                    <div className="card-icon">💰</div>
                                    <div className="card-content">
                                        <div className="card-label">Total Income</div>
                                        <div className="card-value">{formatCurrency(incomeExpense.total_income)}</div>
                                        <div className="card-sublabel">From payments</div>
                                    </div>
                                </div>

                                <div className="summary-card expense-card liquid-glass">
                                    <div className="card-icon">💸</div>
                                    <div className="card-content">
                                        <div className="card-label">Total Expenses</div>
                                        <div className="card-value">{formatCurrency(incomeExpense.total_expenses)}</div>
                                        <div className="card-sublabel">Direct expenses</div>
                                    </div>
                                </div>

                                <div className="summary-card purchase-card liquid-glass">
                                    <div className="card-icon">🛒</div>
                                    <div className="card-content">
                                        <div className="card-label">Total Purchases</div>
                                        <div className="card-value">{formatCurrency(incomeExpense.total_purchases)}</div>
                                        <div className="card-sublabel">Material purchases</div>
                                    </div>
                                </div>

                                <div className="summary-card total-cost-card liquid-glass">
                                    <div className="card-icon">📊</div>
                                    <div className="card-content">
                                        <div className="card-label">Total Costs</div>
                                        <div className="card-value">{formatCurrency(incomeExpense.total_costs)}</div>
                                        <div className="card-sublabel">Expenses + Purchases</div>
                                    </div>
                                </div>

                                <div className={`summary-card profit-card liquid-glass ${incomeExpense.net_profit >= 0 ? 'positive' : 'negative'}`}>
                                    <div className="card-icon">{incomeExpense.net_profit >= 0 ? '✅' : '⚠️'}</div>
                                    <div className="card-content">
                                        <div className="card-label">Net Profit</div>
                                        <div className="card-value">{formatCurrency(incomeExpense.net_profit)}</div>
                                        <div className="card-sublabel">
                                            Margin: {incomeExpense.profit_margin.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="breakdown-table">
                                <h3>Financial Breakdown</h3>
                                <div className="table-responsive">
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th>Category</th>
                                                <th>Amount</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Income</td>
                                                <td className="income-value">{formatCurrency(incomeExpense.total_income)}</td>
                                                <td>100%</td>
                                            </tr>
                                            <tr>
                                                <td>Expenses</td>
                                                <td className="expense-value">{formatCurrency(incomeExpense.total_expenses)}</td>
                                                <td>
                                                    {incomeExpense.total_income > 0
                                                        ? ((incomeExpense.total_expenses / incomeExpense.total_income) * 100).toFixed(1)
                                                        : 0}%
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Purchases</td>
                                                <td className="expense-value">{formatCurrency(incomeExpense.total_purchases)}</td>
                                                <td>
                                                    {incomeExpense.total_income > 0
                                                        ? ((incomeExpense.total_purchases / incomeExpense.total_income) * 100).toFixed(1)
                                                        : 0}%
                                                </td>
                                            </tr>
                                            <tr className="total-row">
                                                <td><strong>Net Profit</strong></td>
                                                <td className={incomeExpense.net_profit >= 0 ? 'profit-value' : 'loss-value'}>
                                                    <strong>{formatCurrency(incomeExpense.net_profit)}</strong>
                                                </td>
                                                <td><strong>{incomeExpense.profit_margin.toFixed(2)}%</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Project Profit Tab */}
                    {activeTab === 'profit' && (
                        <div className="report-tab">
                            <h2>Project Profit Estimation</h2>
                            <p className="report-description">Profitability analysis per project</p>

                            <div className="table-responsive">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Units</th>
                                            <th>Booked</th>
                                            <th>Revenue</th>
                                            <th>Collected</th>
                                            <th>Outstanding</th>
                                            <th>Expenses</th>
                                            <th>Est. Profit</th>
                                            <th>Margin %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectProfit.map((item) => (
                                            <tr key={item.id}>
                                                <td className="project-name">{item.project_name}</td>
                                                <td>{item.total_units}</td>
                                                <td>{item.booked_units}</td>
                                                <td className="revenue-value">{formatCurrency(item.total_revenue)}</td>
                                                <td className="collected-value">{formatCurrency(item.total_collected)}</td>
                                                <td className="outstanding-value">{formatCurrency(item.outstanding)}</td>
                                                <td className="expense-value">{formatCurrency(item.total_expenses)}</td>
                                                <td className={item.estimated_profit >= 0 ? 'profit-value' : 'loss-value'}>
                                                    {formatCurrency(item.estimated_profit)}
                                                </td>
                                                <td className={parseFloat(item.profit_margin) >= 0 ? 'margin-positive' : 'margin-negative'}>
                                                    {item.profit_margin}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;

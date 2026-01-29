import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const data = [
    { name: 'Week 1', expenses: 400000, income: 600000 },
    { name: 'Week 2', expenses: 300000, income: 800000 },
    { name: 'Week 3', expenses: 500000, income: 700000 },
    { name: 'Week 4', expenses: 278000, income: 900000 },
];

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <p className="welcome-text">Welcome back, {user?.name}!</p>

            <div className="stats-grid">
                <div className="stat-card liquid-glass">
                    <div className="stat-icon">🏗️</div>
                    <div className="stat-content">
                        <h3>Total Projects</h3>
                        <p className="stat-value">3</p>
                    </div>
                </div>

                <div className="stat-card liquid-glass">
                    <div className="stat-icon">🏘️</div>
                    <div className="stat-content">
                        <h3>Total Villas</h3>
                        <p className="stat-value">50</p>
                    </div>
                </div>

                <div className="stat-card liquid-glass">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <h3>Inventory Items</h3>
                        <p className="stat-value">12</p>
                    </div>
                </div>

                <div className="stat-card liquid-glass">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Expenses This Month</h3>
                        <p className="stat-value">₹18,40,000</p>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card liquid-glass">
                    <h2>Financial Overview</h2>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#71717a" />
                                <YAxis stroke="#71717a" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

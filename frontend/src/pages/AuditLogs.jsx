import { useState, useEffect } from 'react';
import api from '../services/api';
import './AuditLogs.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        entityType: '',
        action: '',
        startDate: '',
        endDate: '',
        userId: ''
    });
    const [expandedLog, setExpandedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.entityType) queryParams.append('entityType', filters.entityType);
            if (filters.action) queryParams.append('action', filters.action);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.userId) queryParams.append('userId', filters.userId);
            queryParams.append('limit', '100');

            const response = await api.get(`/audit?${queryParams.toString()}`);
            if (response.data.success) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = () => {
        fetchLogs();
    };

    const handleClearFilters = () => {
        setFilters({
            entityType: '',
            action: '',
            startDate: '',
            endDate: '',
            userId: ''
        });
        setTimeout(() => fetchLogs(), 100);
    };

    const toggleLogDetails = (logId) => {
        setExpandedLog(expandedLog === logId ? null : logId);
    };

    const getActionBadge = (action) => {
        const colors = {
            CREATE: 'badge-green',
            UPDATE: 'badge-blue',
            DELETE: 'badge-red',
            LOGIN: 'badge-purple',
            LOGOUT: 'badge-gray'
        };
        return <span className={`action-badge ${colors[action] || 'badge-gray'}`}>{action}</span>;
    };

    const renderJsonDiff = (oldValues, newValues) => {
        if (!oldValues && !newValues) return <div className="no-data">No data</div>;

        try {
            const old = oldValues ? JSON.parse(oldValues) : {};
            const newV = newValues ? JSON.parse(newValues) : {};

            return (
                <div className="json-diff">
                    {oldValues && (
                        <div className="diff-section">
                            <h4>Old Values</h4>
                            <pre>{JSON.stringify(old, null, 2)}</pre>
                        </div>
                    )}
                    {newValues && (
                        <div className="diff-section">
                            <h4>New Values</h4>
                            <pre>{JSON.stringify(newV, null, 2)}</pre>
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return <div className="error-data">Invalid JSON data</div>;
        }
    };

    return (
        <div className="audit-logs-page">
            <div className="page-header">
                <h1>Audit Logs</h1>
            </div>

            <div className="filters-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>Entity Type</label>
                        <select
                            value={filters.entityType}
                            onChange={(e) => handleFilterChange('entityType', e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="projects">Projects</option>
                            <option value="expenses">Expenses</option>
                            <option value="purchase_orders">Purchase Orders</option>
                            <option value="payments">Payments</option>
                            <option value="bookings">Bookings</option>
                            <option value="customers">Customers</option>
                            <option value="materials">Materials</option>
                            <option value="inventory_transactions">Inventory</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Action</label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>

                    <div className="filter-actions">
                        <button className="btn-primary" onClick={handleApplyFilters}>Apply</button>
                        <button className="btn-secondary" onClick={handleClearFilters}>Clear</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading audit logs...</div>
            ) : (
                <div className="logs-table">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity Type</th>
                                <th>Entity ID</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">No audit logs found</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <>
                                        <tr key={log.id}>
                                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                                            <td>{log.user_name || 'System'}</td>
                                            <td>{getActionBadge(log.action)}</td>
                                            <td>{log.entity_type}</td>
                                            <td>{log.entity_id || '-'}</td>
                                            <td>
                                                <button
                                                    className="btn-small"
                                                    onClick={() => toggleLogDetails(log.id)}
                                                >
                                                    {expandedLog === log.id ? '▼ Hide' : '▶ View'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedLog === log.id && (
                                            <tr className="expanded-row">
                                                <td colSpan="6">
                                                    <div className="log-details">
                                                        <div className="details-header">
                                                            <span><strong>IP:</strong> {log.ip_address || 'N/A'}</span>
                                                            <span><strong>User Agent:</strong> {log.user_agent || 'N/A'}</span>
                                                        </div>
                                                        {renderJsonDiff(log.old_values, log.new_values)}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;

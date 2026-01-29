import { useState, useEffect } from 'react';
import api from '../services/api';
import './Labour.css';

const Labour = () => {
    const [activeTab, setActiveTab] = useState('workers');
    const [labours, setLabours] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    // Forms state
    const [showAddWorker, setShowAddWorker] = useState(false);
    const [newWorker, setNewWorker] = useState({
        name: '', type: 'helper', gender: 'male', phone: '', daily_wage: ''
    });

    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProject, setSelectedProject] = useState('');
    const [attendanceData, setAttendanceData] = useState({}); // { labourId: status }

    useEffect(() => {
        fetchLabours();
        fetchProjects();
    }, []);

    const fetchLabours = async () => {
        try {
            const response = await api.get('/labour');
            if (response.data.success) {
                setLabours(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching labours:', error);
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

    const handleAddWorker = async (e) => {
        e.preventDefault();
        try {
            await api.post('/labour', newWorker);
            setShowAddWorker(false);
            fetchLabours();
            setNewWorker({ name: '', type: 'helper', gender: 'male', phone: '', daily_wage: '' });
        } catch (error) {
            alert('Failed to add worker');
        }
    };

    const handleAttendanceChange = (labourId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [labourId]: status
        }));
    };

    const submitAttendance = async () => {
        if (!selectedProject) return alert('Please select a project');

        try {
            const promises = Object.entries(attendanceData).map(([labourId, status]) => {
                return api.post('/labour/attendance', {
                    labour_id: labourId,
                    project_id: selectedProject,
                    attendance_date: attendanceDate,
                    status
                });
            });

            await Promise.all(promises);
            alert('Attendance marked successfully');
            setAttendanceData({});
        } catch (error) {
            alert('Failed to mark attendance');
        }
    };

    return (
        <div className="labour-page">
            <div className="page-header">
                <h1>Labour Management</h1>
                {activeTab === 'workers' && (
                    <button className="btn-primary" onClick={() => setShowAddWorker(true)}>
                        + Add Worker
                    </button>
                )}
            </div>

            <div className="tabs">
                <button
                    className={activeTab === 'workers' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('workers')}
                >
                    Workers
                </button>
                <button
                    className={activeTab === 'attendance' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('attendance')}
                >
                    Daily Attendance
                </button>
                <button
                    className={activeTab === 'payments' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('payments')}
                >
                    Payments
                </button>
            </div>

            {/* Workers Tab */}
            {activeTab === 'workers' && (
                <div className="tab-content">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Daily Wage</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labours.map(worker => (
                                <tr key={worker.id}>
                                    <td>{worker.name}</td>
                                    <td><span className="badge">{worker.type}</span></td>
                                    <td>₹{worker.daily_wage}</td>
                                    <td>{worker.phone}</td>
                                    <td>{worker.status}</td>
                                    <td>
                                        <button className="btn-small">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="tab-content">
                    <div className="attendance-controls">
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Project</label>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Worker</th>
                                <th>Type</th>
                                <th>Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labours.map(worker => (
                                <tr key={worker.id}>
                                    <td>{worker.name}</td>
                                    <td>{worker.type}</td>
                                    <td>
                                        <div className="attendance-options">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`att-${worker.id}`}
                                                    checked={attendanceData[worker.id] === 'present'}
                                                    onChange={() => handleAttendanceChange(worker.id, 'present')}
                                                /> Present
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`att-${worker.id}`}
                                                    checked={attendanceData[worker.id] === 'absent'}
                                                    onChange={() => handleAttendanceChange(worker.id, 'absent')}
                                                /> Absent
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`att-${worker.id}`}
                                                    checked={attendanceData[worker.id] === 'half_day'}
                                                    onChange={() => handleAttendanceChange(worker.id, 'half_day')}
                                                /> Half Day
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="actions-footer">
                        <button className="btn-primary" onClick={submitAttendance}>
                            Save Attendance
                        </button>
                    </div>
                </div>
            )}

            {/* Add Worker Modal */}
            {showAddWorker && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Add New Worker</h2>
                        <form onSubmit={handleAddWorker}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={newWorker.name}
                                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={newWorker.type}
                                    onChange={(e) => setNewWorker({ ...newWorker, type: e.target.value })}
                                >
                                    <option value="helper">Helper</option>
                                    <option value="mason">Mason</option>
                                    <option value="carpenter">Carpenter</option>
                                    <option value="electrician">Electrician</option>
                                    <option value="plumber">Plumber</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Daily Wage (₹)</label>
                                <input
                                    type="number"
                                    value={newWorker.daily_wage}
                                    onChange={(e) => setNewWorker({ ...newWorker, daily_wage: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={newWorker.phone}
                                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddWorker(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Worker</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Labour;

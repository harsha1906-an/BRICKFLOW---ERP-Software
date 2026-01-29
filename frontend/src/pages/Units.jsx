import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Units.css';

const Units = () => {
    const [searchParams] = useSearchParams();
    const projectIdParam = searchParams.get('project');

    const [units, setUnits] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(projectIdParam || '');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [formData, setFormData] = useState({
        project_id: projectIdParam || '',
        unit_number: '',
        type: '3BHK',
        price: '',
        status: 'available'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchUnits(selectedProject);
        } else {
            fetchAllUnits();
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

    const fetchAllUnits = async () => {
        try {
            const response = await api.get('/units');
            if (response.data.success) {
                setUnits(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
            setError('Failed to load units');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnits = async (projectId) => {
        try {
            setLoading(true);
            const response = await api.get(`/units/project/${projectId}`);
            if (response.data.success) {
                setUnits(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
            setError('Failed to load units');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingUnit) {
                await api.put(`/units/${editingUnit.id}`, {
                    unit_number: formData.unit_number,
                    type: formData.type,
                    price: parseFloat(formData.price),
                    status: formData.status
                });
            } else {
                await api.post('/units', {
                    ...formData,
                    price: parseFloat(formData.price)
                });
            }

            setShowForm(false);
            setEditingUnit(null);
            setFormData({
                project_id: selectedProject || '',
                unit_number: '',
                type: '3BHK',
                price: '',
                status: 'available'
            });

            if (selectedProject) {
                fetchUnits(selectedProject);
            } else {
                fetchAllUnits();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save unit');
        }
    };

    const handleEdit = (unit) => {
        setEditingUnit(unit);
        setFormData({
            project_id: unit.project_id,
            unit_number: unit.unit_number,
            type: unit.type,
            price: unit.price,
            status: unit.status
        });
        setShowForm(true);
    };

    const handleDelete = async (unit) => {
        if (!window.confirm(`Are you sure you want to delete unit "${unit.unit_number}"?`)) {
            return;
        }

        try {
            await api.delete(`/units/${unit.id}`);
            if (selectedProject) {
                fetchUnits(selectedProject);
            } else {
                fetchAllUnits();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete unit');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingUnit(null);
        setFormData({
            project_id: selectedProject || '',
            unit_number: '',
            type: '3BHK',
            price: '',
            status: 'available'
        });
        setError('');
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            available: 'status-available',
            booked: 'status-booked',
            sold: 'status-sold'
        };
        return <span className={`status-badge ${statusColors[status]}`}>{status}</span>;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return <div className="loading">Loading units...</div>;
    }

    return (
        <div className="units-page">
            <div className="page-header">
                <h1>Units</h1>
                <div className="header-actions">
                    <select
                        className="project-filter"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        <option value="">All Projects</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        + Add Unit
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={handleCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</h2>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            {!editingUnit && (
                                <div className="form-group">
                                    <label>Project *</label>
                                    <select
                                        name="project_id"
                                        value={formData.project_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Unit Number *</label>
                                <input
                                    type="text"
                                    name="unit_number"
                                    value={formData.unit_number}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., A101"
                                />
                            </div>

                            <div className="form-group">
                                <label>Type *</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="3BHK">3BHK</option>
                                    <option value="4BHK">4BHK</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="1000"
                                    placeholder="e.g., 8500000"
                                />
                            </div>

                            <div className="form-group">
                                <label>Status *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="available">Available</option>
                                    <option value="booked">Booked</option>
                                    <option value="sold">Sold</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={handleCancel}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingUnit ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="units-table-container">
                {units.length === 0 ? (
                    <div className="empty-state">
                        <p>No units found. {selectedProject ? 'Add units to this project!' : 'Create your first unit!'}</p>
                    </div>
                ) : (
                    <table className="units-table">
                        <thead>
                            <tr>
                                {!selectedProject && <th>Project</th>}
                                <th>Unit Number</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.id}>
                                    {!selectedProject && <td>{unit.project_name}</td>}
                                    <td className="unit-number">{unit.unit_number}</td>
                                    <td>{unit.type}</td>
                                    <td className="price">{formatPrice(unit.price)}</td>
                                    <td>{getStatusBadge(unit.status)}</td>
                                    <td className="actions">
                                        <button className="btn-edit" onClick={() => handleEdit(unit)}>
                                            Edit
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDelete(unit)}>
                                            Delete
                                        </button>
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

export default Units;

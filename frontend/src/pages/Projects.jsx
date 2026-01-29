import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Projects.css';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_date: '',
        status: 'planning'
    });
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects');
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
            if (editingProject) {
                await api.put(`/projects/${editingProject.id}`, formData);
            } else {
                await api.post('/projects', formData);
            }

            setShowForm(false);
            setEditingProject(null);
            setFormData({ name: '', location: '', start_date: '', status: 'planning' });
            fetchProjects();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save project');
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            location: project.location,
            start_date: project.start_date,
            status: project.status
        });
        setShowForm(true);
    };

    const handleDelete = async (project) => {
        if (!window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/projects/${project.id}`);
            fetchProjects();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete project');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingProject(null);
        setFormData({ name: '', location: '', start_date: '', status: 'planning' });
        setError('');
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            planning: 'status-planning',
            ongoing: 'status-ongoing',
            completed: 'status-completed'
        };
        return <span className={`status-badge ${statusColors[status]}`}>{status}</span>;
    };

    if (loading) {
        return <div className="loading">Loading projects...</div>;
    }

    return (
        <div className="projects-page">
            <div className="page-header">
                <h1>Projects</h1>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    + Add Project
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={handleCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Location *</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter location"
                                />
                            </div>

                            <div className="form-group">
                                <label>Start Date *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    required
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
                                    <option value="planning">Planning</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={handleCancel}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingProject ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="projects-table-container">
                {projects.length === 0 ? (
                    <div className="empty-state">
                        <p>No projects found. Create your first project!</p>
                    </div>
                ) : (
                    <table className="projects-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Start Date</th>
                                <th>Status</th>
                                <th>Units</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td className="project-name">{project.name}</td>
                                    <td>{project.location}</td>
                                    <td>{new Date(project.start_date).toLocaleDateString()}</td>
                                    <td>{getStatusBadge(project.status)}</td>
                                    <td>
                                        <button
                                            className="btn-link"
                                            onClick={() => navigate(`/units?project=${project.id}`)}
                                        >
                                            {project.unit_count} units
                                        </button>
                                    </td>
                                    <td className="actions">
                                        <button className="btn-edit" onClick={() => handleEdit(project)}>
                                            Edit
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDelete(project)}>
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

export default Projects;

import { useState, useEffect } from 'react';
import api from '../services/api';
import './Approvals.css';

const Approvals = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionModal, setActionModal] = useState({ show: false, id: null, type: null });
    const [comments, setComments] = useState('');

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const response = await api.get('/approvals/pending');
            if (response.data.success) {
                setPending(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (id, type) => {
        setActionModal({ show: true, id, type });
        setComments('');
    };

    const submitAction = async () => {
        try {
            await api.put(`/approvals/${actionModal.id}`, {
                status: actionModal.type, // 'approved' or 'rejected'
                comments,
                entity_type: 'purchase_order', // Ideally obtained from item, but for now assuming PO logic matches backend
                entity_id: pending.find(p => p.id === actionModal.id)?.entity_id
            });
            alert(`Request ${actionModal.type} successfully`);
            setActionModal({ show: false, id: null, type: null });
            fetchPending();
        } catch (error) {
            console.error(error);
            alert('Action failed');
        }
    };

    return (
        <div className="approvals-page">
            <div className="page-header">
                <h1>Pending Approvals</h1>
                <button className="btn-secondary" onClick={fetchPending}>Refresh</button>
            </div>

            {loading ? <div className="loading">Loading...</div> : (
                <div className="approval-cards">
                    {pending.length === 0 ? <p>No pending approvals.</p> : (
                        pending.map(item => (
                            <div key={item.id} className="approval-card liquid-glass">
                                <div className="approval-header">
                                    <span className="entity-type">{item.entity_type.replace('_', ' ').toUpperCase()}</span>
                                    <span className="date">{new Date(item.request_date).toLocaleDateString()}</span>
                                </div>
                                <div className="approval-body">
                                    <h3>{item.project_name || 'General'}</h3>
                                    <p><strong>Requester:</strong> {item.requester_name}</p>
                                    <p><strong>Ref:</strong> {item.po_number ? `PO #${item.po_number}` : `#${item.entity_id}`}</p>
                                    <p><strong>Amount:</strong> ₹{item.amount?.toLocaleString()}</p>
                                    {item.comments && <p className="comments">"{item.comments}"</p>}
                                </div>
                                <div className="approval-actions">
                                    <button className="btn-approve" onClick={() => handleAction(item.id, 'approved')}>Approve</button>
                                    <button className="btn-reject" onClick={() => handleAction(item.id, 'rejected')}>Reject</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {actionModal.show && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{actionModal.type === 'approved' ? 'Approve' : 'Reject'} Request</h2>
                        <textarea
                            placeholder="Add comments..."
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            rows="4"
                        />
                        <div className="modal-actions">
                            <button onClick={() => setActionModal({ show: false, id: null, type: null })}>Cancel</button>
                            <button className={actionModal.type === 'approved' ? 'btn-success' : 'btn-danger'} onClick={submitAction}>
                                Confirm {actionModal.type}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Approvals;

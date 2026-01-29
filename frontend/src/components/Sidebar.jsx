import { NavLink } from 'react-router-dom';
import logo from '../assets/colour logo.png';
import './Sidebar.css';

const Sidebar = ({ onClose }) => {
    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/approvals', label: 'Approvals', icon: '✅' },
        { path: '/customers', label: 'Customers', icon: '👥' },
        { path: '/projects', label: 'Projects', icon: '🏗️' },
        { path: '/purchase-orders', label: 'Purchase Orders', icon: '🛒' },
        { path: '/inventory', label: 'Inventory', icon: '📦' },
        { path: '/expenses', label: 'Expenses', icon: '💰' },
        { path: '/payments', label: 'Payments', icon: '💳' },
        { path: '/payment-requests', label: 'Payment Requests', icon: '📨' },
        { path: '/petty-cash', label: 'Petty Cash', icon: '💵' },
        { path: '/labour', label: 'Labour', icon: '👷' },
        { path: '/reports', label: 'Reports', icon: '📈' },
        { path: '/audit-logs', label: 'Audit Logs', icon: '📋' }
    ];

    const handleItemClick = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="Brick Flow" className="company-logo" style={{ maxWidth: '100%', height: 'auto', padding: '10px' }} />
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive ? 'nav-item active' : 'nav-item'
                        }
                        onClick={handleItemClick}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-text">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;

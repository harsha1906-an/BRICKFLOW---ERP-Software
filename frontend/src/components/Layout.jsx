import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="app-container">
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
            <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
                <Sidebar onClose={closeSidebar} />
            </div>

            <div className="main-content">
                <header className="header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={toggleSidebar}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <h2 className="page-title">Brick Flow</h2>
                    </div>
                    <div className="header-right">
                        <span className="user-info">
                            {user?.name} ({user?.role})
                        </span>
                        <button onClick={logout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </header>
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;

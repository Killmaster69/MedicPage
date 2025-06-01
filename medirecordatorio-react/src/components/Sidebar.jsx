// src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { FaHospital,FaSignOutAlt, FaUserInjured, FaPills, FaCalendarAlt, FaChartLine, FaBell, FaCog, FaChartPie } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', icon: <FaChartPie />, path: '/dashboard' },
    { label: 'Pacientes', icon: <FaUserInjured />, path: '/pacientes' },
    { label: 'Medicamentos', icon: <FaPills />, path: '/medicamentos' },
    { label: 'Citas', icon: <FaCalendarAlt />, path: '/citas' },
    { label: 'Reportes', icon: <FaChartLine />, path: '/reportes' },
    { label: 'Notificaciones', icon: <FaBell />, path: '/notificaciones' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        
      <div className="medical-logo">
        <FaHospital />
        <h1>MediRecordatorio</h1>
      </div>

        <p className="medical-subtitle">Portal Médico</p>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map(item => (
            <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <Link to="/">
          <FaSignOutAlt />
          <span>Cerrar Sesion</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;

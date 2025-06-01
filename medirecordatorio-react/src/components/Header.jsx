// src/components/Header.jsx
import { FaBars, FaBell, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Header = ({ onToggleMenu }) => {
  const { user } = useAuth();

  return (
    <header className="top-bar">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleMenu}>
          <FaBars />
        </button>
      </div>

      <div className="header-right">


        <div className="user-profile">
          <div className="avatar">DR</div>
          <div className="user-info">
            <span className="user-name">{user?.nombre || 'Usuario'}</span>
            <span className="user-role">{user?.especialidad || 'Médico'}</span>
          </div>
          <FaChevronDown className="dropdown-toggle" />
        </div>
      </div>
    </header>
  );
};

export default Header;

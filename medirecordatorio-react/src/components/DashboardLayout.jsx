// src/layouts/MainLayout.jsx
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet } from 'react-router-dom';

const MainLayout = () => (
  <div className="dashboard-container">
    <Sidebar />
    <main className="main-content">
      <Header />
      <div className="content-area">
        <Outlet />
      </div>
    </main>
  </div>
);

export default MainLayout;
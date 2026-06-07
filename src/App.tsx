import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import EmployeeLayout from './components/EmployeeLayout';
import AdminDashboard from './pages/admin/Dashboard';
import EmployeeBeranda from './pages/employee/Beranda';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* Tambahkan rute admin lainnya di sini */}
          <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="/employee" element={<EmployeeLayout />}>
          <Route path="beranda" element={<EmployeeBeranda />} />
          {/* Tambahkan rute employee lainnya di sini */}
          <Route path="" element={<Navigate to="/employee/beranda" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

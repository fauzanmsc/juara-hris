import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import EmployeeLayout from './components/EmployeeLayout';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminApproval from './pages/admin/Approval';
import AdminApprovalDetail from './pages/admin/ApprovalDetail';
import AdminAttendance from './pages/admin/Attendance';
import AdminLeaveReport from './pages/admin/LeaveReport';
import AdminPositions from './pages/admin/Positions';
import AdminTasks from './pages/admin/Tasks';
import AdminHolidays from './pages/admin/Holidays';
import AdminConfig from './pages/admin/Config';

import EmployeeBeranda from './pages/employee/Beranda';
import EmployeeAttendance from './pages/employee/Attendance';
import EmployeeLeave from './pages/employee/Leave';
import EmployeeTasks from './pages/employee/Tasks';
import EmployeeHistory from './pages/employee/History';
import PwaInstallPrompt from './components/PwaInstallPrompt';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <PwaInstallPrompt />
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="approval" element={<AdminApproval />} />
          <Route path="approval/:id" element={<AdminApprovalDetail />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="leave-report" element={<AdminLeaveReport />} />
          <Route path="positions" element={<AdminPositions />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="holidays" element={<AdminHolidays />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="/employee" element={<EmployeeLayout />}>
          <Route path="beranda" element={<EmployeeBeranda />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="leave" element={<EmployeeLeave />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="history" element={<EmployeeHistory />} />
          <Route path="" element={<Navigate to="/employee/beranda" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

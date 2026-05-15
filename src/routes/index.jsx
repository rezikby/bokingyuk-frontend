// Semua route + guard (ProtectedRoute, AdminRoute, SuperAdminRoute) + halaman 404
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import Login         from '../pages/auth/Login';
import Register      from '../pages/auth/Register';
import Home          from '../pages/customer/Home';
import FieldDetail   from '../pages/customer/FieldDetail';
import BookingList   from '../pages/customer/BookingList';
import BookingDetail from '../pages/customer/BookingDetail';
import Payment       from '../pages/customer/Payment';
import Dashboard     from '../pages/admin/Dashboard';
import AdminFields   from '../pages/admin/Fields';
import AdminBookings from '../pages/admin/Bookings';
import CheckIn       from '../pages/admin/CheckIn';
import Reports       from '../pages/admin/Reports';
import NotFound      from '../pages/NotFound';

import SuperAdminDashboard from '../pages/superadmin/Dashboard';
import SuperAdminUsers     from '../pages/superadmin/Users';
import SuperAdminRequests  from '../pages/superadmin/AdminRequests';

import PengaduanPage      from '../pages/customer/Pengaduan';
import PengajuanAdminPage from '../pages/customer/Pengajuanadmin';
import LogAktivitas       from '../pages/customer/LogAktivitas';
import Profile            from '../pages/customer/Profile';
import PengaduanSuperAdmin from '../pages/superadmin/Pengaduan';

// Fase 2 — Customer Enhancement
import PaymentHistory from '../pages/customer/PaymentHistory';
import Notifications  from '../pages/customer/Notifications';

// Fase 3 — Admin Enhancement
import Maintenance    from '../pages/admin/Maintenance';
import ExportReports  from '../pages/admin/ExportReports';
import RatingManagement from '../pages/admin/RatingManagement';

// Fase 4 — Super Admin Enhancement
import AuditLog       from '../pages/superadmin/AuditLog';
import SiteSettings   from '../pages/superadmin/SiteSettings';

// === BARU: Super Admin Full Access ===
import SuperAdminCustomers      from '../pages/superadmin/Customers';
import SuperAdminAllBookings    from '../pages/superadmin/AllBookings';
import SuperAdminAllTransactions from '../pages/superadmin/AllTransactions';
import SuperAdminStatistics     from '../pages/superadmin/Statistics';
import SuperAdminPermissions    from '../pages/superadmin/Permissions';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, user } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (!['admin', 'super_admin'].includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function SuperAdminRoute({ children }) {
  const { token, user } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer */}
      <Route path="/"               element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/fields/:id"     element={<ProtectedRoute><FieldDetail /></ProtectedRoute>} />
      <Route path="/bookings"       element={<ProtectedRoute><BookingList /></ProtectedRoute>} />
      <Route path="/bookings/:code" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
      <Route path="/payment/:code"  element={<ProtectedRoute><Payment /></ProtectedRoute>} />

      {/* Settings */}
      <Route path="/settings/pengaduan"       element={<ProtectedRoute><PengaduanPage /></ProtectedRoute>} />
      <Route path="/settings/pengajuan-admin" element={<ProtectedRoute><PengajuanAdminPage /></ProtectedRoute>} />
      <Route path="/settings/log-aktivitas"   element={<ProtectedRoute><LogAktivitas /></ProtectedRoute>} />

      {/* Customer extras */}
      <Route path="/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
      <Route path="/notifications"   element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"                element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/fields"         element={<AdminRoute><AdminFields /></AdminRoute>} />
      <Route path="/admin/bookings"       element={<AdminRoute><AdminBookings /></AdminRoute>} />
      <Route path="/admin/check-in"       element={<AdminRoute><CheckIn /></AdminRoute>} />
      <Route path="/admin/reports"        element={<AdminRoute><Reports /></AdminRoute>} />
      <Route path="/admin/ratings"        element={<AdminRoute><RatingManagement /></AdminRoute>} />
      <Route path="/admin/maintenance"    element={<AdminRoute><Maintenance /></AdminRoute>} />
      <Route path="/admin/export"         element={<AdminRoute><ExportReports /></AdminRoute>} />

      {/* Super Admin — existing */}
      <Route path="/super-admin"                element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
      <Route path="/super-admin/users"          element={<SuperAdminRoute><SuperAdminUsers /></SuperAdminRoute>} />
      <Route path="/super-admin/admin-requests" element={<SuperAdminRoute><SuperAdminRequests /></SuperAdminRoute>} />
      <Route path="/super-admin/pengaduan"      element={<SuperAdminRoute><PengaduanSuperAdmin /></SuperAdminRoute>} />
      <Route path="/super-admin/audit-log"      element={<SuperAdminRoute><AuditLog /></SuperAdminRoute>} />
      <Route path="/super-admin/settings"       element={<SuperAdminRoute><SiteSettings /></SuperAdminRoute>} />

      {/* Super Admin — new full-access pages */}
      <Route path="/super-admin/customers"        element={<SuperAdminRoute><SuperAdminCustomers /></SuperAdminRoute>} />
      <Route path="/super-admin/all-bookings"     element={<SuperAdminRoute><SuperAdminAllBookings /></SuperAdminRoute>} />
      <Route path="/super-admin/all-transactions" element={<SuperAdminRoute><SuperAdminAllTransactions /></SuperAdminRoute>} />
      <Route path="/super-admin/statistics"       element={<SuperAdminRoute><SuperAdminStatistics /></SuperAdminRoute>} />
      <Route path="/super-admin/permissions"      element={<SuperAdminRoute><SuperAdminPermissions /></SuperAdminRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { TrackingProvider } from "./context/TrackingContext";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

// User Pages
import Dashboard from "./pages/user/Dashboard";
import Contacts from "./pages/user/Contacts";
import AlertHistory from "./pages/user/AlertHistory";
import LiveLocation from "./pages/user/LiveLocation";
import Settings from "./pages/user/Settings";

// Family Pages
import FamilyDashboard from "./pages/family/FamilyDashboard";
import VerifyEmail from "./pages/VerifyEmail";

import ScrollManager from "./utils/ScrollManager";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading SafeGuard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // ✅ Redirect to correct dashboard based on role
    if (user?.role === "family") {
      return <Navigate to="/family/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.role === "family" ? "/family/dashboard" : "/dashboard"}
        replace
      />
    );
  }
  return children;
};

function AppRoutes() {
  return (
    <>
      {/* ✅ Add this — works globally for all pages */}
      <ScrollManager />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* User only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <AlertHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/location"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <LiveLocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["user", "admin", "family"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Family only */}
        <Route
          path="/family/dashboard"
          element={
            <ProtectedRoute allowedRoles={["family"]}>
              <FamilyDashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-[#E91E8C]">404</h1>
                <p className="text-gray-500 mt-2">Page not found</p>
                <a
                  href="/"
                  className="mt-4 inline-block text-[#E91E8C] underline"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <TrackingProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { fontFamily: "Poppins, sans-serif", fontSize: "14px" },
                success: { style: { background: "#4CAF50", color: "white" } },
                error: { style: { background: "#FF6B6B", color: "white" } },
              }}
            />
            <AppRoutes />
          </BrowserRouter>
        </TrackingProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

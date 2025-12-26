import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { isLoggedIn } from "./utils/auth";

function App() {
  useEffect(() => {
    // Prevent back/forward button navigation
    const preventNavigation = () => {
      window.history.pushState(null, null, window.location.href);
    };

    // Push initial state
    window.history.pushState(null, null, window.location.href);

    // Listen for popstate (back/forward button clicks)
    window.addEventListener('popstate', preventNavigation);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', preventNavigation);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Login Route - Always show login page */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Quiz Route - Commissioner and Engineer */}
        <Route
          path="/quiz"
          element={
            <ProtectedRoute allowedRoles={["commissioner", "engineer"]}>
              <Quiz />
            </ProtectedRoute>
          }
        />

        {/* Admin Route - Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root Route - Always redirect to login */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

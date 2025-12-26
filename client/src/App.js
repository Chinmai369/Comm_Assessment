import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { isLoggedIn } from "./utils/auth";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isLoggedIn() ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* Quiz Route - Commissioner only */}
        <Route
          path="/quiz"
          element={
            <ProtectedRoute allowedRoles={["commissioner"]}>
              <Quiz />
            </ProtectedRoute>
          }
        />

        {/* Admin Route - Admin and Engineer */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "engineer"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root Route - Redirect based on login status */}
        <Route
          path="/"
          element={
            isLoggedIn() ? (
              <Navigate to="/quiz" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

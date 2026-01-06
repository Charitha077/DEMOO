import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import RegisterFace from "./pages/RegisterFace.jsx";

import SuperAdminLayout from "./layouts/SuperAdminLayout.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import Notifications from "./pages/Notifications.jsx";
import UserOperation from "./components/UserOperation.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import HODDashboard from "./pages/HODDashboard.jsx";
import GuardDashboard from "./pages/GuardDashboard.jsx";
import GuardVerifyFace from "./pages/GuardVerifyFace.jsx";
import Profile from "./pages/Profile.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import StudentHistory from "./pages/StudentHistory.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const StudentRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const faceId = localStorage.getItem("face_id");

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "STUDENT") return <Navigate to="/login" replace />;

  // 🔥 IMPORTANT FIX
  if (faceId === null || faceId === "") {
    return <Navigate to="/student/register-face" replace />;
  }

  return children;
};


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/student/register-face"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <RegisterFace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          }
        />

        <Route
          path="/student/history"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path=":action" element={<UserOperation />} />
        </Route>

        <Route
          path="/hod"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <HODDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/guard"
          element={
            <ProtectedRoute allowedRoles={["GUARD"]}>
              <GuardDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mentor"
          element={
            <ProtectedRoute allowedRoles={["MENTOR"]}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
                  path="/guard/profile"
                  element={
                    <ProtectedRoute allowedRoles={["GUARD"]}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

           <Route
                  path="/hod/profile"
                  element={
                    <ProtectedRoute allowedRoles={["HOD"]}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

             <Route
                  path="/student/profile"
                  element={
                    <ProtectedRoute allowedRoles={["STUDENT"]}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

        <Route
          path="/guard/verify-face/:studentId/:requestId"
          element={
            <ProtectedRoute allowedRoles={["GUARD"]}>
              <GuardVerifyFace />
            </ProtectedRoute>
          }
        />


        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
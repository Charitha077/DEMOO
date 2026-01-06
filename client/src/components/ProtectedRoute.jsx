import { Navigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("access_token");

  // ❌ No token → login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // ❌ Token expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }

    const userRole = localStorage.getItem("role");

    // ❌ Role not allowed
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }

    // ✅ Access granted
    return children;

  } catch (err) {
    // ❌ Invalid token
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
}

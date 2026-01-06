import { useEffect, useState } from "react";
import api from "../services/api";

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-2 border-b last:border-b-0 py-3 px-6 hover:bg-gray-50 transition">
      <div className="text-gray-500 font-bold uppercase text-xs tracking-wider">{label}</div>
      <div className="text-indigo-700 font-semibold">{value || "—"}</div>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  
  // Get credentials from localStorage
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

 useEffect(() => {
  const fetchProfile = async () => {
    // 1. Get exact values from storage
    const role = localStorage.getItem("role"); 
    const userId = localStorage.getItem("userId");

    if (!userId || !role) {
      setError("No session found. Please login.");
      return;
    }

    // 2. Logic: SUPER_ADMIN and ADMIN both use the "/admin" route prefix
    const pathPrefix = (role === "SUPER_ADMIN" || role === "ADMIN") 
      ? "admin" 
      : role.toLowerCase();
    
    try {
      // This will now call: GET http://127.0.0.1:5000/admin/SA001
      const res = await api.get(`/${pathPrefix}/${userId}`);
      
      console.log("Profile API Response:", res.data);
      
      // Dig into the standardized success wrapper: res.data.data
      if (res.data && res.data.data) {
        console.log("Profile: Using res.data.data");
        setUser(res.data.data);
      } else {
        console.log("Profile: Using res.data directly");
        setUser(res.data);
      }
    } catch (err) {
      console.error("Profile Fetch Error:", err.response?.data || err.message);
      setError(`Profile not found (ID: ${userId})`);
    }
  };
  
  fetchProfile();
}, [role, userId]);

  if (error) return <div className="p-10 text-red-500 font-bold text-center">{error}</div>;
  if (!user) return <div className="p-10 animate-pulse font-bold text-center">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <h2 className="text-xl font-black uppercase tracking-tighter">My Profile</h2>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest">{role}</span>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
          {/* Avatar Column */}
          <div className="flex flex-col items-center">
            <img
              src={user.student_face ? `data:image/jpeg;base64,${user.student_face}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=200`}
              className="w-48 h-56 object-cover rounded-xl shadow-lg border-4 border-gray-100 bg-gray-50"
              alt="User"
            />
            <p className="mt-4 font-mono text-xs text-gray-400">ID: {user._id || userId}</p>
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
              {user.name}
            </h1>
            
            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <Row label="Full Name" value={user.name} />
              <Row label="Phone" value={user.phone} />
              <Row label="College" value={user.college} />

              {/* Dynamic Content based on Role */}
              {role === "STUDENT" && (
                <>
                  <Row label="Year" value={user.year} />
                  <Row label="Branch" value={user.course} />
                  <Row label="Section" value={user.section} />
                </>
              )}

              {role === "HOD" && (
                <>
                  <Row label="Managed Years" value={Array.isArray(user.years) ? user.years.join(", ") : user.years} />
                  <Row label="Branch" value={user.course} />
                </>
              )}

              {role === "GUARD" && (
                 <Row label="Designation" value="Security Personnel" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
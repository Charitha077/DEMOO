import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [openProfile, setOpenProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch Student Profile to get real name and face status
      const profileRes = await api.get(`/student/${userId}`);
      const studentData = profileRes.data.data;
      setUser(studentData);

      // 2. Fetch today's requests
      const requestsRes = await api.get(`/request/student/today/${userId}`);
      setRequests(requestsRes.data.data || []);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
  if (!user?.face_id) {
    alert("You must register your face before sending a Gate Pass request.");
    navigate("/student/register-face");
    return;
  }

  const reason = prompt("Enter reason for Gate Pass:");
  if (!reason) return;

  try {
    const payload = {
      student_id: user.id || userId,
      reason,
    };

    console.log("Sending request with payload:", payload);
    console.log("Token exists:", !!localStorage.getItem("access_token"));
    
    const response = await api.post("/request/create", payload);
    console.log("Response:", response);
    alert("Request sent successfully!");
    fetchInitialData();
  } catch (err) {
    console.error("Request error:", err);
    console.error("Error response:", err.response);
    const errorMsg = err.response?.data?.detail || err.response?.statusText || err.message;
    alert("Failed to send request: " + errorMsg);
  }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* HEADER */}
      <header className="bg-indigo-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-black tracking-tighter uppercase">FaceSure</h1>
        
        <div className="relative">
          <button 
            onClick={() => setOpenProfile(!openProfile)} 
            className="flex items-center gap-4 bg-white/10 p-1 pr-4 rounded-full hover:bg-white/20 transition"
          >
            <img 
              src={user?.student_face ? `data:image/jpeg;base64,${user.student_face}` : `https://ui-avatars.com/api/?name=${user?.name}&background=random`} 
              alt="profile" 
              className="w-10 h-10 rounded-full border-2 border-indigo-400 object-cover" 
            />
            <span className="text-sm font-bold uppercase">{user?.name || "Student"}</span>
          </button>

          {openProfile && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase font-bold">Logged in as</p>
                <p className="text-sm font-black text-indigo-600 truncate">{userId}</p>
              </div>
              <button 
                onClick={() => navigate("/student/profile")}
                className="block w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold"
              >
                My Profile
              </button>
              <button 
                onClick={() => { localStorage.clear(); navigate("/login"); }} 
                className="block w-full text-left px-5 py-3 hover:bg-red-50 text-red-600 text-sm font-bold"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-10">
        {/* WELCOME SECTION */}
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
            Welcome back, <span className="text-indigo-600">{user?.name?.split(' ')[0]}</span>!
          </h2>
          <p className="text-gray-500 mt-1">Manage your gate passes and account profile.</p>
        </div>

        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: New Request */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700 hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase mb-2">Gate Pass</h3>
            <p className="text-gray-500 text-sm mb-6">Need to leave the campus? Submit a request to your HOD for approval.</p>
            <button 
              onClick={handleSendRequest}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition active:scale-95"
            >
              Request Pass
            </button>
          </div>

          {/* Card 2: History */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700 hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase mb-2">Pass History</h3>
            <p className="text-gray-500 text-sm mb-6">View all your previous requests and their current approval status.</p>
            <button 
              onClick={() => navigate("/student/history")}
              className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold hover:bg-gray-200 transition"
            >
              View History
            </button>
          </div>
        </div>

        {/* RECENT REQUESTS TABLE */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
            <h3 className="font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-xs">Today's Activity</h3>
            {user && !user.face_id && (
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
                FACE NOT REGISTERED
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b dark:border-gray-700">
                  <th className="px-8 py-4">Reason</th>
                  <th className="px-8 py-4">Time</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {requests.length > 0 ? requests.map((r) => (
                  <tr key={r.request_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-8 py-5 text-sm font-semibold text-gray-700 dark:text-gray-200">{r.reason}</td>
                    <td className="px-8 py-5 text-sm text-gray-500">{new Date(r.request_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        r.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : 
                        r.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {r.status === "PENDING" && (
                        <button className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Cancel</button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center py-20 text-gray-400 italic text-sm">No activity recorded for today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import GetUser from "../components/GetUser";
import RequestsTable from "../components/RequestsTable";
import ManageMentorAssignments from "../components/ManageMentorAssignments";
import api from "../services/api";

export default function HODDashboard() {
  const userId = localStorage.getItem("userId");

  const [hod, setHod] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⭐ controls which panel is open
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const fetchHod = async () => {
      if (!userId) return setLoading(false);

      try {
        const res = await api.get(`/hod/${userId}`);
        setHod(res.data?.data || null);
      } catch (err) {
        console.error("HOD fetch error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHod();
  }, [userId]);

  const deptLabel = hod?.course || "Loading...";

  const toggle = (section) => {
    setOpen(open === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <Navbar basePath="/hod" />

      <div className="pt-14 px-6">

        {/* HEADER */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">
            Welcome!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {loading
              ? "Loading..."
              : `HOD of ${deptLabel}${hod?.college ? ` @ ${hod.college}` : ""}`}
          </p>
        </div>

        {/* ===== CARD BUTTONS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          {/* Requests */}
          <button
            onClick={() => toggle("requests")}
            className={`rounded-2xl px-10 py-8 border shadow-sm transition 
              ${open === "requests"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 hover:shadow-xl"
              }`}
          >
            <h3 className="text-lg font-bold">Get Today’s Requests</h3>
          </button>

          {/* Get User */}
          <button
            onClick={() => toggle("user")}
            className={`rounded-2xl px-10 py-8 border shadow-sm transition 
              ${open === "user"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 hover:shadow-xl"
              }`}
          >
            <h3 className="text-lg font-bold">Get User Details</h3>
          </button>

          {/* Assign Mentors */}
          <button
            onClick={() => toggle("mentors")}
            className={`rounded-2xl px-10 py-8 border shadow-sm transition 
              ${open === "mentors"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 hover:shadow-xl"
              }`}
          >
            <h3 className="text-lg font-bold">Assign Mentors</h3>
          </button>
        </div>

        {/* ===== CONTENT PANELS ===== */}

        {open === "requests" && (
          <RequestsTable
            title="Pending Leave Requests"
            url={`/request/hod/pending/${userId}`}
            mode="HOD"
            hodInfo={{ id: userId, name: hod?.name }}
          />
        )}

        {open === "user" && (
          <div className="mb-12">
            <GetUser />
          </div>
        )}

        {open === "mentors" && (
          <div className="mb-12">
            <ManageMentorAssignments onClose={() => setOpen(null)} />
          </div>
        )}

      </div>
    </div>
  );
}

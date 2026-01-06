import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RequestsTable from "../components/RequestsTable";
import api from "../services/api";

export default function GuardDashboard() {
  const userId = localStorage.getItem("userId");
  const [guard, setGuard] = useState(null);

  /* ================= FETCH GUARD ================= */
  useEffect(() => {
    const fetchGuard = async () => {
      const res = await api.get(`/guard/${userId}`);
      setGuard(res.data?.data);
    };
    fetchGuard();
  }, [userId]);

  if (!guard) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar basePath="/guard" />

      <div className="pt-14 px-6 max-w-6xl mx-auto">
        <RequestsTable
          title="Approved Gate Passes"
          url={`/request/guard/approved/${guard.college}`}
          mode="GUARD"
        />
      </div>
    </div>
  );
}

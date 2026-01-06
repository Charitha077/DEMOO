import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function StudentHistory() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    const fetchHistory = async () => {
      setError("");
      try {
        const res = await api.get(`/request/student/${userId}`);
        const list = res?.data?.data || [];

        // Normalize records (stringify ids, timestamps)
        const normalized = list.map((r) => ({
          request_id: r._id?.$oid || r._id || String(r._id || ""),
          reason: r.reason,
          status: r.status,
          mentor_status: r.mentor_status,
          mentor_name: r.mentor_name,
          mentor_remark: r.mentor_remark,
          mentor_parent_contacted: r.mentor_parent_contacted,
          hod_name: r.hod_name,
          semester: r.semester,
          academic_year: r.academic_year,
          request_time: r.request_time,
          approval_time: r.approval_time,
          exit_mark_time: r.exit_mark_time,
        }));

        // Group by semester
        const bySem = normalized.reduce((acc, r) => {
          const key = r.semester ? `Semester ${r.semester}` : "Unknown Semester";
          acc[key] = acc[key] || [];
          acc[key].push(r);
          return acc;
        }, {});

        // Sort each group's entries by request_time desc
        Object.keys(bySem).forEach((key) => {
          bySem[key].sort((a, b) => new Date(b.request_time) - new Date(a.request_time));
        });

        setGrouped(bySem);
      } catch (err) {
        const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to load history";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const formatTime = (t) => {
    if (!t) return "-";
    try {
      return new Date(t).toLocaleString();
    } catch {
      return String(t);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading history…</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-indigo-900 text-white px-8 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-black uppercase">Gate Pass History</h1>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm font-bold">
          Back
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">{error}</div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="p-12 text-center text-gray-500">No history found</div>
        ) : (
          Object.entries(grouped).sort((a, b) => {
            // Sort semesters numerically desc (Unknown at bottom)
            const getSem = (label) => (label.startsWith("Semester ") ? parseInt(label.replace("Semester ", ""), 10) : -1);
            return getSem(b[0]) - getSem(a[0]);
          }).map(([semLabel, items]) => (
            <section key={semLabel} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden">
              <div className="px-8 py-6 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase">{semLabel}</h2>
                  <p className="text-xs text-gray-500">Academic Year: {items[0]?.academic_year || "-"}</p>
                </div>
                <span className="text-xs text-gray-500">Total: {items.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b dark:border-gray-700">
                      <th className="px-8 py-4">Reason</th>
                      <th className="px-8 py-4">Requested</th>
                      <th className="px-8 py-4">Mentor</th>
                      <th className="px-8 py-4">HOD</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {items.map((r) => (
                      <tr key={r.request_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                        <td className="px-8 py-5 text-sm font-semibold text-gray-700 dark:text-gray-200">{r.reason}</td>
                        <td className="px-8 py-5 text-sm text-gray-500">{formatTime(r.request_time)}</td>
                        <td className="px-8 py-5 text-sm text-gray-500">
                          <div className="space-y-1">
                            <div className="font-semibold">{r.mentor_name || "-"}</div>
                            <div className="text-xs text-gray-500">{r.mentor_status || "-"}</div>
                            {r.mentor_remark && (
                              <div className="text-xs text-gray-500 italic">{r.mentor_remark}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-500">{r.hod_name || "-"}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            r.status === "PENDING_MENTOR" ? "bg-yellow-100 text-yellow-700" :
                            r.status === "PENDING_HOD" ? "bg-blue-100 text-blue-700" :
                            r.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            r.status === "EXIT_ALLOWED" ? "bg-purple-100 text-purple-700" :
                            r.status === "UNCHECKED" ? "bg-gray-100 text-gray-600" :
                            r.status === "APPROVED_NOT_LEFT" ? "bg-orange-100 text-orange-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

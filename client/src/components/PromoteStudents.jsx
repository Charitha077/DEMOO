import { useState } from "react";
import api from "../services/api";
import Alert from "../components/Alert";

export default function PromoteStudents() {
  const [admissionYear, setAdmissionYear] = useState("");
  const [college, setCollege] = useState("KMIT");
  const [msg, setMsg] = useState("");
  const [alertType, setAlertType] = useState("");
  const [loading, setLoading] = useState(false);
  const [promotionResult, setPromotionResult] = useState(null);

  const handlePromote = async () => {
    if (!admissionYear) {
      setMsg("❌ Please select an admission year");
      setAlertType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/student/promote", {
        admission_year: parseInt(admissionYear),
        college
      });

      setMsg(response.data.message || "✅ Students promoted successfully!");
      setAlertType("success");
      setPromotionResult(response.data.data);
      setAdmissionYear("");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Promotion failed";
      setMsg(`❌ ${errorMsg}`);
      setAlertType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div ref={null}>
        <Alert msg={msg} type={alertType} onClose={() => setMsg("")} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          📚 Promote Students to Next Semester
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center text-sm">
          This action will increment all students' semesters by 2 and their admission year by 1.
          <br />
          <strong>Example:</strong> Sem 1→3, Sem 3→5, etc. | Year increments automatically.
        </p>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Admission Year *
              </label>
              <input
                type="number"
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                placeholder="e.g. 2022"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the admission year of students to promote
              </p>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                College *
              </label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="KMIT">KMIT</option>
                <option value="KMEC">KMEC</option>
                <option value="NGIT">NGIT</option>
              </select>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
              ⚠️ Promotion Logic
            </h4>
            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 ml-6 list-disc">
              <li><strong>Semester increment:</strong> +2 (1→3, 3→5, 5→7, 7→8 max)</li>
              <li><strong>Year increment:</strong> +1 (auto-adjusted)</li>
              <li><strong>Scope:</strong> Only affects students with selected admission year & college</li>
              <li><strong>Locked assignments:</strong> HODs can assign new mentors after promotion</li>
            </ul>
          </div>

          {promotionResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">✅ Promotion Result</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>{promotionResult.promoted_count}</strong> students promoted successfully
              </p>
              {promotionResult.errors?.length > 0 && (
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                  ⚠️ {promotionResult.errors.length} students already in final semester (skipped)
                </p>
              )}
            </div>
          )}

          <button
            onClick={handlePromote}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-white text-lg transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
            }`}
          >
            {loading ? "🔄 Promoting..." : "🚀 Promote Students"}
          </button>
        </div>
      </div>
    </div>
  );
}

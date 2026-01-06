import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function DeleteUser() {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  
  // States for retrieval and inline UI
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetName, setTargetName] = useState("");
  const [loading, setLoading] = useState(false);

  const alertRef = useRef(null);
  const loggedInRole = localStorage.getItem("role");

  /* ================= RESET ON ROLE CHANGE ================= */
  useEffect(() => {
    setUserId("");
    setStatus("");
    setSuccess(false);
    setShowConfirm(false);
    setTargetName("");
  }, [role]);

  /* ================= SCROLL HELPER ================= */
  const scrollAlert = () => {
    setTimeout(() => {
      alertRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  /* ================= STEP 1: RETRIEVE NAME FROM DB ================= */
  const initiateDelete = async () => {
    setStatus("");
    setSuccess(false);
    const id = userId.trim();

    if (!id) {
      setStatus("Please enter User ID");
      scrollAlert();
      return;
    }

    // 🔒 ADMIN restrictions
    if (loggedInRole === "ADMIN" && (role === "ADMIN" || role === "SUPER_ADMIN")) {
      setStatus("Admins cannot delete Admin or Super Admin");
      scrollAlert();
      return;
    }

    setLoading(true);
    try {
      // Calls your GET endpoint: e.g., /student/2455E1
      const fetchPath = `/${role.toLowerCase()}/${id}`;
      const res = await api.get(fetchPath);
      
      // Standardize data extraction based on typical FastAPI/Express responses
      const userData = res.data.data || res.data;
      
      if (userData && (userData.name || userData.username)) {
        setTargetName(userData.name || userData.username);
        setShowConfirm(true); // Switch to the YES/NO UI
      } else {
        setStatus(`USERID: ${id} FOUND BUT NAME NOT RETRIEVABLE`);
        scrollAlert();
      }
    } catch (err) {
      // If DB returns 404 or other error
      setStatus(`USERID: ${id} DOESN'T EXIST`);
      scrollAlert();
    } finally {
      setLoading(false);
    }
  };

  /* ================= STEP 2: ACTUAL DELETE FROM DB ================= */
  const confirmDelete = async () => {
    try {
      // Calls your DELETE endpoint: e.g., /student/delete/2455E1
      await api.delete(`/${role.toLowerCase()}/delete/${userId}`);
      
      setSuccess(true);
      setStatus(`${role}: ${targetName.toUpperCase()} DELETED SUCCESSFULLY`);
      setUserId("");
      setShowConfirm(false);
    } catch (err) {
      setSuccess(false);
      setStatus(err.response?.data?.message || "DELETE FAILED");
      setShowConfirm(false);
    }
    scrollAlert();
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-3xl mx-auto">
      {/* ALERT BOX */}
      {status && (
        <div
          ref={alertRef}
          className={`mx-auto mb-6 flex items-center gap-3 px-6 py-4 rounded-lg border shadow-md text-base font-semibold max-w-xl justify-center ${
            success
              ? "bg-green-100 text-green-800 border-green-400 dark:bg-green-900/40 dark:text-green-200 dark:border-green-500"
              : "bg-red-100 text-red-800 border-red-400 dark:bg-red-900/40 dark:text-red-200 dark:border-red-500"
          }`}
        >
          <span className="text-xl">{success ? "✓" : "⚠️"}</span>
          <span>{status}</span>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <div className="mb-8 bg-gray-500 rounded-lg py-3 text-center">
          <h2 className="text-lg font-semibold text-white">Delete User</h2>
        </div>

        {!showConfirm ? (
          /* --- VIEW 1: ID ENTRY --- */
          <>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Role <span className="text-red-500">*</span></label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 w-full"
              >
                <option value="">Select Role</option>
                <option value="STUDENT">Student</option>
                <option value="HOD">HOD</option>
                <option value="GUARD">Guard</option>
                {loggedInRole === "SUPER_ADMIN" && <option value="ADMIN">Admin</option>}
              </select>
            </div>

            <div className="mb-8">
              <label className="block mb-2 font-medium">User ID <span className="text-red-500">*</span></label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 w-full"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={initiateDelete}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition disabled:opacity-50"
              >
                {loading ? "SEARCHING DB..." : "Delete User"}
              </button>
            </div>
          </>
        ) : (
          /* --- VIEW 2: INLINE CONFIRMATION --- */
          <div className="text-center py-6">
            <p className="text-xl font-bold text-gray-800 dark:text-white mb-8">
              ARE YOU SURE TO DELETE <span className="text-red-600 underline">{targetName.toUpperCase()}'S</span> DATA?
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={confirmDelete}
                className="px-12 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg"
              >
                YES
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-12 py-3 bg-gray-300 text-gray-800 rounded-lg font-bold hover:bg-gray-400 transition"
              >
                NO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
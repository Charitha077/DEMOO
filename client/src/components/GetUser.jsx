import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/* ===============================
    TABLE ROW COMPONENT
   =============================== */
function Row({ label, value }) {
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className="grid grid-cols-2 border-b last:border-b-0 hover:bg-gray-50 transition">
      <div className="px-6 py-4 bg-gray-50 font-medium text-gray-700">
        {label}
      </div>
      <div className="px-6 py-4 text-indigo-600 font-semibold">
        {displayValue || "—"}
      </div>
    </div>
  );
}

export default function GetUser() {
  const [role, setRole] = useState("");
  const [searchId, setSearchId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loggedInRole = localStorage.getItem("role");
  const topRef = useRef(null);

  /* ===============================
     FORCE ROLE FOR HOD
     =============================== */
  useEffect(() => {
    if (loggedInRole === "HOD") {
      setRole("STUDENT");
    }
  }, [loggedInRole]);

  useEffect(() => {
    setSearchId("");
    setResult(null);
    setError("");
  }, [role]);

  const getUser = async () => {
    setError("");
    setResult(null);

    if (!role || !searchId.trim()) {
      setError("Please enter User ID");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/${role.toLowerCase()}/${searchId}`);

      // unwrap nested success responses safely
      const finalData =
        res.data?.data?.data ||
        res.data?.data ||
        res.data;

      setResult(finalData);

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth"
        });
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20" ref={topRef}>
      {error && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center px-4 py-2 rounded-md bg-red-100 text-red-700 border border-red-400 text-sm font-medium">
            ❌ {error}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <div className="mb-8 bg-gray-500 rounded-lg py-3 text-center">
          <h2 className="text-lg font-semibold text-white">
            Get User Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ROLE SELECT — HIDDEN FOR HOD */}
          {loggedInRole !== "HOD" && (
            <div>
              <label className="block mb-2 font-medium">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 w-full outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Role</option>
                <option value="STUDENT">Student</option>
                <option value="HOD">HOD</option>
                <option value="GUARD">Guard</option>
                {loggedInRole === "SUPER_ADMIN" && (
                  <option value="ADMIN">Admin</option>
                )}
              </select>
            </div>
          )}

          {/* USER ID */}
          <div>
            <label className="block mb-2 font-medium">
              {loggedInRole === "HOD" ? "Student ID" : "User ID"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter ID"
              className="px-4 py-2 bg-gray-100 rounded text-gray-700 w-full outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={getUser}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2 rounded-lg bg-blue-800 text-white font-semibold hover:bg-blue-900 transition shadow-lg disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            {loading ? "Searching..." : "Search User"}
          </button>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            <div className="flex flex-col items-center">
              <img
                src={
                  result.student_face || result.face_id
                    ? `data:image/jpeg;base64,${result.student_face || result.face_id}`
                    : "https://placehold.co/220x280?text=No+Photo"
                }
                alt="Profile"
                className="w-56 h-72 object-cover rounded-lg border shadow-lg bg-gray-50"
              />
              <span className="mt-4 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-widest uppercase">
                {role}
              </span>
            </div>

            <div className="md:col-span-2">
              <div className="mb-6 text-center md:text-left border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-800">
                  {result.name}
                </h2>
                <p className="text-gray-500 font-mono mt-1">
                  {result._id || result.id}
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                {role === "STUDENT" && (
                  <>
                    <Row label="College" value={result.college} />
                    <Row label="Year" value={result.year} />
                    <Row label="Branch" value={result.course} />
                    <Row label="Section" value={result.section} />
                    <Row label="Phone Number" value={result.phone} />
                    <Row label="Created By" value={result.created_by} />
                  </>
                )}

                {role === "HOD" && (
                  <>
                    <Row label="College" value={result.college} />
                    <Row label="Managed Years" value={result.years} />
                    <Row label="Branches" value={result.courses} />
                  </>
                )}

                {(role === "ADMIN" || role === "GUARD") && (
                  <>
                    <Row label="College" value={result.college} />
                    <Row label="Phone Number" value={result.phone} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

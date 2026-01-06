import { useState, useRef } from "react";
import api from "../services/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function GetRequests() {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const topRef = useRef(null);

  const getUrl = () => {
    if (role === "STUDENT") return `/requests/student/${userId}`;
    if (role === "HOD") return `/requests/hod/${userId}`;
    return "";
  };

  const fetchRequests = async () => {
    setError("");
    setResult(null);

    if (!role || !userId.trim()) {
      setError("Please select role and enter User ID");
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    try {
      const res = await api.get(getUrl());
      setResult(res.data.data || res.data);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setError("Invalid data or no requests found");
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto" ref={topRef}>

      {/* ❌ ERROR ALERT */}
      {error && (
  <div className="flex justify-center mb-6">
    <div className="inline-flex items-center px-4 py-2
                    rounded-md bg-red-100 text-red-700
                    border border-red-400 shadow-sm
                    text-sm font-medium">
      ❌ {error}
    </div>
  </div>
)}


      {/* MAIN CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">

        {/* TITLE BAR */}
        <div className="mb-8 bg-gray-500 rounded-lg py-3 text-center">
          <h2 className="text-lg font-semibold text-white">
            Get Requests 
          </h2>
        </div>

        {/* ROLE DROPDOWN */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 bg-gray-100 rounded text-gray-700 w-full"
          >
            <option value="">Select Role</option>
            <option value="STUDENT">Student</option>
            <option value="HOD">HOD</option>
          </select>
        </div>

        {/* USER ID */}
        <div className="mb-8">
          <label className="block mb-2 font-medium">
            User ID <span className="text-red-500">*</span>
          </label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID"
            className="px-4 py-2 bg-gray-100 rounded text-gray-700 w-full"
          />
        </div>

        {/* SEARCH BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-6 py-2
                       rounded-lg bg-blue-800 text-white font-semibold
                       hover:bg-blue-900 transition"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            Search
          </button>
        </div>

        {/* RESULT */}
        {result && (
          <div className="mt-8">
            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Result
            </h3>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg
                            text-sm overflow-auto text-left">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}

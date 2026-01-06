import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function ChangePassword() {
  const [role, setRole] = useState("");

  const [searchId, setSearchId] = useState("");
  const [lockedId, setLockedId] = useState(null);

  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);

  const alertRef = useRef(null);

  const loggedInRole = localStorage.getItem("role");

  /* ================= RESET ON ROLE CHANGE ================= */
  useEffect(() => {
    setSearchId("");
    setLockedId(null);
    setUserData(null);
    setPassword("");
    setStatus("");
    setSuccess(false);
  }, [role]);

  /* ================= SCROLL ================= */
  const scrollAlert = () => {
    setTimeout(() => {
      alertRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  /* ================= FIND USER ================= */
  const findUser = async () => {
    setStatus("");
    setSuccess(false);

    if (!searchId.trim()) {
      setStatus("Please enter User ID");
      scrollAlert();
      return;
    }

    // 🔒 ADMIN restriction
    if (loggedInRole === "ADMIN" && role === "ADMIN") {
      setStatus("Admins cannot change Admin password");
      scrollAlert();
      return;
    }

    try {
      const res = await api.get(`/${role.toLowerCase()}/${searchId}`);
      const data = res.data.data || res.data;

      const resolvedId = data._id || data.id || searchId;

      setLockedId(resolvedId);
      setSearchId(resolvedId);
      setUserData(data);
      setPassword("");

      setSuccess(true);
      setStatus("User found successfully");
    } catch (err) {
      setUserData(null);
      setLockedId(null);
      setSuccess(false);
      setStatus(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "User not found"
      );
    }

    scrollAlert();
  };

  /* ================= UPDATE PASSWORD ================= */
  const updatePassword = async () => {
    setStatus("");
    setSuccess(false);

    if (!lockedId) {
      setStatus("Find user first");
      scrollAlert();
      return;
    }

    if (searchId !== lockedId) {
      setStatus("User ID changed. Password update blocked.");
      scrollAlert();
      return;
    }

    if (!password.trim()) {
      setStatus("Please enter new password");
      scrollAlert();
      return;
    }

    try {
      await api.put(`/${role.toLowerCase()}/update/${lockedId}`, {
        password,
      });

      setPassword("");
      setSuccess(true);
      setStatus("Password updated successfully");
    } catch (err) {
      setSuccess(false);
      setStatus(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Password update failed"
      );
    }

    scrollAlert();
  };

  const idMismatch = lockedId && searchId !== lockedId;

  /* ================= UI ================= */
  return (
    <div className="max-w-3xl mx-auto">

      {/* ================= ALERT ================= */}
      {status && (
        <div
          ref={alertRef}
          className={`
            mx-auto mb-6
            flex items-center gap-3
            px-6 py-4
            rounded-lg
            border
            shadow-md
            text-base font-semibold
            max-w-xl
            justify-center
            ${
              success
                ? "bg-green-100 text-green-800 border-green-400 dark:bg-green-900/40 dark:text-green-200 dark:border-green-500"
                : "bg-red-100 text-red-800 border-red-400 dark:bg-red-900/40 dark:text-red-200 dark:border-red-500"
            }
          `}
          role="alert"
        >
          <span className="text-xl">{success ? "✓" : "⚠️"}</span>
          <span>{status}</span>
        </div>
      )}

      {/* ================= MAIN CARD ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">

        {/* TITLE */}
        <div className="mb-8 bg-gray-500 rounded-lg py-3 text-center">
          <h2 className="text-lg font-semibold text-white">
            Change Password
          </h2>
        </div>

        {/* ROLE */}
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
            <option value="GUARD">Guard</option>
            {loggedInRole === "SUPER_ADMIN" && (
              <option value="ADMIN">Admin</option>
            )}
          </select>
        </div>

        {/* USER ID */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            User ID <span className="text-red-500">*</span>
          </label>
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className={`px-4 py-2 bg-gray-100 rounded w-full ${
              idMismatch ? "border border-red-500" : ""
            }`}
          />
        </div>

        <button
          onClick={findUser}
          className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
        >
          Find User
        </button>

        {/* USER DETAILS */}
        {userData && (
          <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
            <p><b>ID:</b> {lockedId}</p>
            <p><b>Name:</b> {userData.name}</p>
            <p><b>Phone:</b> {userData.phone}</p>
            <p><b>Role:</b> {role}</p>
          </div>
        )}

        {/* PASSWORD */}
        <div className="mt-6">
          <label className="block mb-2 font-medium">
            New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 bg-gray-100 rounded w-full"
          />
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            onClick={updatePassword}
            disabled={!lockedId || idMismatch}
            className="
              mt-6 px-6 py-2
              rounded-lg
              bg-blue-800 text-white
              font-semibold
              hover:bg-blue-900
              transition
              disabled:opacity-50
            "
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

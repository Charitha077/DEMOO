import { useState, useRef, useEffect } from "react";
import api from "../services/api";

const EMPTY_FORM = {};

export default function UpdateUser() {
  const [role, setRole] = useState("");
  const [searchId, setSearchId] = useState("");
  const [lockedId, setLockedId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState(EMPTY_FORM);

  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);

  const alertRef = useRef(null);
  const loggedInRole = localStorage.getItem("role");

  /* ================= RESET ON ROLE CHANGE ================= */
  useEffect(() => {
    setSearchId("");
    setLockedId(null);
    setForm(EMPTY_FORM);
    setOriginalForm(EMPTY_FORM);
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

  /* ================= API HELPERS ================= */
  const fetchUrl = (id) => {
    if (role === "ADMIN") return `/admin/${id}`;
    if (role === "STUDENT") return `/student/${id}`;
    if (role === "HOD") return `/hod/${id}`;
    if (role === "GUARD") return `/guard/${id}`;
  };

  const submitUrl = () => `/${role.toLowerCase()}/update/${lockedId}`;

  /* ================= FORM HANDLER ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "id") {
      setSearchId(value);
      return;
    }

    if (type === "checkbox") {
      const list = form[name] || [];
      setForm({
        ...form,
        [name]: checked
          ? [...list, value]
          : list.filter((v) => v !== value),
      });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  /* ================= LOAD USER ================= */
  const loadUser = async () => {
    setStatus("");
    setSuccess(false);

    if (!searchId.trim()) {
      setStatus("Please enter User ID");
      scrollAlert();
      return;
    }

    if (loggedInRole === "ADMIN" && role === "ADMIN") {
      setStatus("Admins cannot update other admins");
      scrollAlert();
      return;
    }

    try {
      const res = await api.get(fetchUrl(searchId));
      const data = res.data.data || res.data;

      const resolvedId = data._id || data.id || searchId;

      setLockedId(resolvedId);
      setSearchId(resolvedId);
      setForm(data);
      setOriginalForm(data);

      setSuccess(true);
      setStatus("User loaded successfully");
    } catch {
      setSuccess(false);
      setStatus("User not found");
    }

    scrollAlert();
  };

  /* ================= CHANGE CHECK ================= */
  const fieldsChanged =
    JSON.stringify(form) !== JSON.stringify(originalForm);

  const idMismatch = lockedId && searchId !== lockedId;

  const adminBlocked =
    loggedInRole === "ADMIN" && role === "ADMIN";

  const canSubmit =
    lockedId && !idMismatch && !adminBlocked && fieldsChanged;

  /* ================= SUBMIT ================= */
  const submit = async () => {
  setStatus("");
  setSuccess(false);

  if (!canSubmit) {
    setStatus("No changes to update");
    scrollAlert();
    return;
  }

  try {
    const payload = { ...form };
    delete payload.id;
    delete payload._id;

    // ✅ STUDENT: year → int
    if (role === "STUDENT" && payload.year !== undefined && payload.year !== "") {
      payload.year = parseInt(payload.year, 10);
    }

    // ✅ HOD: years[] → int[]
    if (role === "HOD" && Array.isArray(payload.years)) {
      payload.years = payload.years.map((y) => parseInt(y, 10));
    }

    await api.put(submitUrl(), payload);

    setOriginalForm(form);
    setSuccess(true);
    setStatus("User updated successfully");
  } catch {
    setSuccess(false);
    setStatus("Update failed");
  }

  scrollAlert();
  };


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
            Update User
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
            name="id"
            value={searchId}
            onChange={handleChange}
            className={`px-4 py-2 bg-gray-100 rounded w-full ${
              idMismatch ? "border border-red-500" : ""
            }`}
          />
        </div>

        <button
          onClick={loadUser}
          className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
        >
          Find User
        </button>

        {/* ================= FORM ================= */}
        {lockedId && (
          <div className="mt-8 space-y-6">

            {/* NAME */}
            <div>
              <label className="block mb-2">Name</label>
              <input
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                className="px-4 py-2 bg-gray-100 rounded w-full"
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="block mb-2">Phone</label>
              <input
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                className="px-4 py-2 bg-gray-100 rounded w-full"
              />
            </div>

            {/* HOD EXTRA */}
            {role === "HOD" && (
              <>
                <div>
                  <label className="block mb-2">Courses</label>
                  <select
                    name="courses"
                    value={form.courses || []}
                    onChange={handleChange}
                    className="px-4 py-2 bg-gray-100 rounded w-full"
                  >
                    <option value="CSE">CSE</option>
                    <option value="CSM">CSM</option>
                    <option value="CSD">CSD</option>
                    <option value="IT">IT</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">Years</label>
                  <div className="flex gap-4 bg-gray-50 p-3 rounded">
                    {["1", "2", "3", "4"].map((y) => (
                      <label key={y} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="years"
                          value={y}
                          checked={form.years?.includes(y) || false}
                          onChange={handleChange}
                        />
                        Year {y}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* SUBMIT */}
            <div className="flex justify-end">
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="
                  px-6 py-2
                  rounded-lg
                  bg-blue-800 text-white
                  font-semibold
                  hover:bg-blue-900
                  transition
                  disabled:opacity-50
                "
              >
                Update User
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

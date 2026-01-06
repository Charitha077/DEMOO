import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Alert from "../components/Alert";

const EMPTY_FORM = {
  id: "", name: "", phone: "", password: "",
  section: "", college: "", admission_year: "", current_semester: "", course: "",
  years: [], department: ""
};

export default function CreateUser() {
  const [role, setRole] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [msg, setMsg] = useState("");
  const [alertType, setAlertType] = useState("");

  const alertRef = useRef(null);
  const loggedInUser = localStorage.getItem("userId");
  const loggedInRole = localStorage.getItem("role");

  // Clear msg only when changing roles manually, 
  // but don't clear it in a way that hides the success alert.
  useEffect(() => {
    setForm(EMPTY_FORM);
  }, [role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name" || name === "section") {
      setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (name, val) => {
    setForm((prev) => {
      const currentList = prev[name];
      const newList = currentList.includes(val)
        ? currentList.filter((item) => item !== val)
        : [...currentList, val];
      return { ...prev, [name]: newList };
    });
  };

  const submit = async () => {
    setMsg("");
    try {
      let payload = {
        id: form.id,
        name: form.name,
        phone: form.phone,
        password: form.password,
        college: form.college,
        created_by: loggedInUser
      };

      if (role === "STUDENT") {
        payload = { 
          ...payload, 
          admission_year: parseInt(form.admission_year), 
          current_semester: parseInt(form.current_semester),
          course: form.course, 
          section: form.section 
        };
      } else if (role === "MENTOR") {
        payload = {
          ...payload,
          department: form.department
        };
      } else if (role === "HOD") {
        // Convert years to ints and send single course (not courses array)
        payload = { 
          ...payload, 
          years: form.years.map((y) => parseInt(y, 10)), 
          course: form.course
        };
      }

      const response = await api.post(`/${role.toLowerCase()}/create`, payload);

      // Extract message from your backend success helper: response.data.message
      setAlertType("success");
      setMsg(response.data.message || `${role} created successfully!`); 
      
      // RESET FORM
      setForm(EMPTY_FORM);
      setRole(""); // This hides the form, but Alert stays because it's outside the role check

    } catch (err) {
      setAlertType("error");
      // Fallback chain to find the error message
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Invalid data entered";
      setMsg(errorMsg);
    }
    
    // Scroll to top where the alert is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* 1. ALERT IS OUTSIDE THE ROLE CONDITION - ALWAYS VISIBLE IF MSG EXISTS */}
      <div ref={alertRef}>
        <Alert msg={msg} type={alertType} onClose={() => setMsg("")} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <div className="mb-8 bg-gray-500 rounded-lg py-3 text-center text-white">
          <h2 className="text-lg font-semibold uppercase tracking-wide">
            {role ? `Create ${role}` : "Select a Role to Create New User"}
          </h2>
        </div>

        {/* ROLE SELECTION */}
        <div className="mb-8">
          <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300">Select Role *</label>
          <div className="flex flex-wrap gap-4">
            {["STUDENT", "HOD", "GUARD", "MENTOR", ...(loggedInRole === "SUPER_ADMIN" ? ["ADMIN"] : [])].map((r) => (
              <label key={r} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition ${role === r ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                <input
                  type="radio"
                  name="role-select"
                  checked={role === r}
                  onChange={() => {
                    setMsg(""); // Clear old alerts when user switches role
                    setRole(r);
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* FORM FIELDS - ONLY SHOW IF ROLE SELECTED */}
        {role && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["id", "name", "phone", "password"].map((field) => (
                <div key={field}>
                  <label className="block mb-1 text-xs font-bold uppercase text-gray-500">{field} *</label>
                  <input
                    type={field === "password" ? "password" : "text"}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300">
              <label className="block mb-3 text-xs font-bold uppercase text-gray-500">Assign to College *</label>
              <div className="flex gap-6">
                {["KMIT", "NGIT", "KMEC"].map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="college" 
                      value={c} 
                      checked={form.college === c} 
                      onChange={handleChange} 
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium group-hover:text-blue-600 transition">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {role === "HOD" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100">
                <div>
                  <label className="block mb-3 text-sm font-bold text-blue-800 dark:text-blue-300">Managed Years *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["1", "2", "3", "4"].map((y) => (
                      <label key={y} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.years.includes(y)}
                          onChange={() => handleCheckboxChange("years", y)}
                          className="rounded text-blue-600"
                        />
                        Year {y}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block mb-3 text-sm font-bold text-blue-800 dark:text-blue-300">Managed Branch *</label>
                  <select name="course" value={form.course} onChange={handleChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 border text-blue-800 dark:text-white font-semibold">
                    <option value="">Select One Branch</option>
                    {["CSE", "CSM", "ECE", "IT"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {role === "STUDENT" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100">
                <div>
                  <label className="block mb-1 text-xs font-bold text-green-800 uppercase">Admission Year</label>
                  <input 
                    type="number" 
                    name="admission_year" 
                    placeholder="e.g. 2022" 
                    value={form.admission_year} 
                    onChange={handleChange} 
                    className="w-full p-2 rounded bg-white dark:bg-gray-700 border"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-green-800 uppercase">Current Sem *</label>
                  <select name="current_semester" value={form.current_semester} onChange={handleChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 border">
                    <option value="">Select</option>
                    {(() => {
                      // Calculate which semesters are valid based on admission year
                      const admissionYr = parseInt(form.admission_year);
                      const currentYr = new Date().getFullYear();
                      const currentMonth = new Date().getMonth() + 1;
                      
                      if (!admissionYr) return [];
                      
                      // Year level = how many years have passed since admission
                      let yearLevel = currentYr - admissionYr;
                      if (currentMonth < 6) yearLevel--; // Before June = previous academic year
                      yearLevel = Math.max(1, Math.min(4, yearLevel + 1)); // Ensure 1-4
                      
                      // Map year to allowed semesters
                      const allowedSems = {
                        1: [1, 2],
                        2: [3, 4],
                        3: [5, 6],
                        4: [7, 8]
                      };
                      
                      return allowedSems[yearLevel]?.map(s => 
                        <option key={s} value={s}>Sem {s}</option>
                      ) || [];
                    })()}
                  </select>
                  {form.admission_year && (
                    <p className="text-xs text-green-700 mt-1">
                      ✓ Year {Math.max(1, Math.min(4, new Date().getFullYear() - parseInt(form.admission_year) + (new Date().getMonth() >= 5 ? 1 : 0)))} (allowed: {
                        (() => {
                          const admissionYr = parseInt(form.admission_year);
                          const currentYr = new Date().getFullYear();
                          const currentMonth = new Date().getMonth() + 1;
                          let yearLevel = currentYr - admissionYr;
                          if (currentMonth < 6) yearLevel--;
                          yearLevel = Math.max(1, Math.min(4, yearLevel + 1));
                          const allowedSems = { 1: [1, 2], 2: [3, 4], 3: [5, 6], 4: [7, 8] };
                          return allowedSems[yearLevel]?.join(', ') || '';
                        })()
                      })
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-green-800 uppercase">Branch</label>
                  <select name="course" value={form.course} onChange={handleChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 border">
                    <option value="">Select</option>
                    {["CSE", "CSM", "ECE"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-green-800 uppercase">Section</label>
                  <input name="section" placeholder="e.g. A" value={form.section} onChange={handleChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 border uppercase" />
                </div>
              </div>
            )}

            {role === "MENTOR" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100">
                <div>
                  <label className="block mb-1 text-xs font-bold text-purple-800 uppercase">Mentor ID (Employee ID)</label>
                  <input name="id" placeholder="e.g. EMP123" value={form.id} onChange={handleChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 border" />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-purple-800 uppercase">Department</label>
                  <select name="department" value={form.department || ""} onChange={handleChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 border">
                    <option value="">Select</option>
                    {["CSE", "CSM", "ECE", "IT"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            )}

            <button onClick={submit} className="w-full py-3 mt-4 rounded-xl bg-blue-800 text-white font-bold hover:bg-blue-900 shadow-lg transition transform active:scale-95 uppercase tracking-widest">
              Register {role}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
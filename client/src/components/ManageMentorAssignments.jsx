import { useState, useEffect } from "react";
import api from "../services/api";

export default function ManageMentorAssignments() {
  const [mentors, setMentors] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [batchRules, setBatchRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assignments");
  
  // 🔥 NEW: Store HOD profile info
  const [hodProfile, setHodProfile] = useState({
    id: "",
    name: "",
    college: "",
    course: "",
    years: [],
    phone: ""
  });

  const [formData, setFormData] = useState({
    mentor_id: "",
    college: "",
    course: "",
    section: "A",
    batch_name: "B1",
    semester: 1,
    academic_year: "2025-2026",
    active_status: true,
    roll_start: 1,
    roll_end: 30,
  });

  const [batchRuleForm, setBatchRuleForm] = useState({
    college: "",
    course: "",
    section: "A",
    semester: 1,
    academic_year: "2025-2026",
    batch_name: "B1",
    roll_start: 1,
    roll_end: 30,
    lateral_entry: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const assignmentsRes = await api.get("/mentor-assignment/assign");
      const batchRulesRes = await api.get("/mentor-assignment/batch-rule");

      // Fetch HOD profile using same pattern as Profile.jsx
      const hodId = localStorage.getItem("userId");
      const role = localStorage.getItem("role");
      
      let mentorList = [];
      let hodData = {
        id: hodId,
        name: "",
        college: "",
        course: "",
        years: [],
        phone: ""
      };
      
      if (!hodId || !role) {
        console.error("No userId or role in localStorage");
        alert("Session expired. Please login again.");
        setLoading(false);
        return;
      }
      
      try {
        // Use same prefix logic as Profile.jsx: SUPER_ADMIN and ADMIN both use "admin"
        const pathPrefix = (role === "SUPER_ADMIN" || role === "ADMIN") 
          ? "admin" 
          : role.toLowerCase();
        const hodRes = await api.get(`/${pathPrefix}/${hodId}`);
        console.log("HOD API Response:", hodRes.data);
        
        // Handle both response formats: { data: {...} } or direct object
        const data = hodRes.data?.data || hodRes.data;
        console.log("Extracted HOD data:", data);
        console.log("All keys in data:", data ? Object.keys(data) : "No data");
        console.log("Raw course field:", data?.course);
        console.log("Raw courses field:", data?.courses);
        
        if (data && data._id) {
          // Backend now normalizes to 'course' field
          hodData = {
            id: hodId,
            name: data.name || "Not Set",
            college: data.college || "Not Set",
            course: data.course || "Not Set",
            years: Array.isArray(data.years) ? data.years : [],
            phone: data.phone || ""
          };
          
          console.log("Parsed HOD Data:", hodData);
          console.log("Years array:", hodData.years, "Length:", hodData.years.length);
          console.log("Course value:", hodData.course);
          
          // Update HOD profile state immediately
          setHodProfile(hodData);
          
          // Set form defaults from HOD profile
          setFormData(prev => {
            const updated = {
              ...prev,
              college: hodData.college,
              course: hodData.course
            };
            console.log("Updated formData:", updated);
            return updated;
          });
          
          // Update batch rule form too
          setBatchRuleForm(prev => ({
            ...prev,
            college: hodData.college,
            course: hodData.course
          }));
          
          // Fetch mentors for HOD's college AND department/course
          if (hodData.course && hodData.course !== "Not Set" && hodData.college && hodData.college !== "Not Set") {
            try {
              console.log(`Fetching mentors for college: ${hodData.college}, department: ${hodData.course}`);
              const mRes = await api.get(`/mentor/by-college-course/${hodData.college}/${hodData.course}`);
              console.log("Mentor API Response:", mRes.data);
              
              // Handle both response formats
              mentorList = mRes.data?.data || mRes.data || [];
              console.log(`Found ${mentorList.length} mentors for ${hodData.college}/${hodData.course}:`, mentorList);
            } catch (e) {
              console.error("Mentor fetch failed for college/course", hodData.college, hodData.course, e.response?.data || e.message);
              alert(`Failed to load mentors for ${hodData.college}/${hodData.course}. Please contact admin.`);
            }
          } else {
            console.warn("HOD college or course is empty or 'Not Set', cannot fetch mentors. HOD data:", hodData);
            alert("HOD college and department not properly configured. Please contact admin.");
          }
        } else {
          console.error("No data in HOD response");
          alert("HOD profile data is empty. Please contact admin.");
        }
      } catch (e) {
        console.error("HOD profile fetch failed", e.response?.data || e.message);
        alert("Failed to load HOD profile. Please refresh the page.");
      }

      setMentors(mentorList);
      setAllMentors(mentorList);
      setAssignments(assignmentsRes.data.data || []);
      setBatchRules(batchRulesRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // When college selection changes in form, filter mentors for that college
  const handleCollegeChange = (e) => {
    const newCollege = e.target.value;
    setFormData({ ...formData, college: newCollege, mentor_id: "" });
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/mentor-assignment/assign", formData);
      alert("✅ Mentor assignment created successfully!");
      fetchData();
      // Reset form
      setFormData({
        ...formData,
        mentor_id: "",
        section: "",
        semester: 1,
      });
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || "Failed to create assignment"));
    }
  };

  const handleCreateBatchRule = async (e) => {
    e.preventDefault();
    try {
      await api.post("/mentor-assignment/batch-rule", batchRuleForm);
      alert("✅ Batch rule created successfully!");
      fetchData();
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || "Failed to create batch rule"));
    }
  };

  const handleDeleteBatchRule = async (ruleId) => {
    if (!confirm("Delete this batch rule?")) return;
    try {
      await api.delete(`/mentor-assignment/batch-rule/${ruleId}`);
      alert("✅ Batch rule deleted");
      fetchData();
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || "Failed to delete"));
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading mentor data...</div>;
  }

  // Get allowed semesters based on managed years
  const allowedSemesters = [];
  if (hodProfile.years.includes(1)) allowedSemesters.push(1, 2);
  if (hodProfile.years.includes(2)) allowedSemesters.push(3, 4);
  if (hodProfile.years.includes(3)) allowedSemesters.push(5, 6);
  if (hodProfile.years.includes(4)) allowedSemesters.push(7, 8);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border dark:border-gray-700 overflow-hidden">
      {/* 🔥 HOD PROFILE HEADER */}
      <div className="px-8 py-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">HOD Name</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {hodProfile.name && hodProfile.name !== "Not Set" ? hodProfile.name : "Loading..."}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Department</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {hodProfile.course && hodProfile.course !== "Not Set" ? hodProfile.course : "Loading..."}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">College</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {hodProfile.college && hodProfile.college !== "Not Set" ? hodProfile.college : "Loading..."}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Managed Years</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {hodProfile.years && hodProfile.years.length > 0 ? hodProfile.years.join(", ") : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* HEADER WITH TABS */}
      <div className="px-8 py-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-sm">
            Mentor Management
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition ${
              activeTab === "assignments"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Mentor Assignments
          </button>
          <button
            onClick={() => setActiveTab("batch-rules")}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition ${
              activeTab === "batch-rules"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Batch Rules
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-8">
        {activeTab === "assignments" && (
          <div>
            {/* 🔥 CREATE ASSIGNMENT FORM - NEW LAYOUT */}
            <form onSubmit={handleCreateAssignment} className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-700">
              <h4 className="font-bold text-lg mb-6 text-gray-800 dark:text-white">📋 Assign Mentor to Class Batch</h4>
              
              {/* SECTION 1: FIXED INFO (DEPT, COLLEGE) */}
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-100 dark:border-green-700">
                <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Your Department & College</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">DEPT</label>
                    <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg font-bold text-blue-700 dark:text-blue-300 text-center">
                      {formData.course && formData.course !== "Not Set" ? formData.course : "Loading..."}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">COLLEGE</label>
                    <div className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg font-bold text-indigo-700 dark:text-indigo-300 text-center">
                      {formData.college && formData.college !== "Not Set" ? formData.college : "Loading..."}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">MANAGED YEARS</label>
                    <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg font-bold text-purple-700 dark:text-purple-300 text-center">
                      {hodProfile.years && hodProfile.years.length > 0 ? hodProfile.years.join(", ") : "Loading..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SELECT MENTOR */}
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-100 dark:border-green-700">
                <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">👨‍🏫 Select Mentor for this Class</h5>
                <select
                  value={formData.mentor_id}
                  onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-semibold focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Mentor --</option>
                  {mentors.length === 0 ? (
                    <option disabled>No mentors found for {formData.course} department</option>
                  ) : (
                    mentors.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} (ID: {m._id} | Dept: {m.department})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  💡 Showing {mentors.length} mentor(s) from <strong>{formData.course}</strong> department
                </p>
              </div>

              {/* SECTION 3: CLASS DETAILS */}
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-100 dark:border-green-700">
                <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">📚 Class Details</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">SECTION *</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white font-semibold focus:ring-2 focus:ring-green-500"
                      maxLength="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">BATCH *</label>
                    <select 
                      value={formData.batch_name} 
                      onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white font-semibold focus:ring-2 focus:ring-green-500"
                    >
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">SEMESTER *</label>
                    <select 
                      value={formData.semester} 
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white font-semibold focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select Sem</option>
                      {allowedSemesters.length === 0 ? (
                        <option disabled>No semesters available for your managed years</option>
                      ) : (
                        allowedSemesters.map(s => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Available: {allowedSemesters.join(", ") || "None"} (based on Years {hodProfile.years.join(", ")})
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">ACADEMIC YEAR *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2025-2026"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white font-semibold focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: ROLL RANGE */}
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-100 dark:border-green-700">
                <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">📍 Roll Number Range (Required)</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">ROLL START *</label>
                    <input
                      type="number"
                      placeholder="1"
                      value={formData.roll_start}
                      onChange={(e) => setFormData({ ...formData, roll_start: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white font-semibold focus:ring-2 focus:ring-green-500"
                      min="1"
                      max="99"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">ROLL END *</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={formData.roll_end}
                      onChange={(e) => setFormData({ ...formData, roll_end: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white font-semibold focus:ring-2 focus:ring-green-500"
                      min="1"
                      max="99"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold transition shadow-lg"
              >
                ✅ Assign Mentor
              </button>
            </form>

            {/* ASSIGNMENTS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase font-bold border-b dark:border-gray-700">
                    <th className="px-4 py-3">Mentor</th>
                    <th className="px-4 py-3">College</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Semester</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Lock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {assignments.map((a) => {
                    const isLocked = a.locked_at !== null && a.locked_at !== undefined;
                    return (
                      <tr key={a._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isLocked ? 'opacity-75' : ''}`}>
                        <td className="px-4 py-3 text-sm font-semibold">{a.mentor_id}</td>
                        <td className="px-4 py-3 text-sm">{a.college}</td>
                        <td className="px-4 py-3 text-sm">{a.course}</td>
                        <td className="px-4 py-3 text-sm">{a.section}</td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-600">{a.batch_name}</td>
                        <td className="px-4 py-3 text-sm">{a.semester}</td>
                        <td className="px-4 py-3 text-sm">{a.academic_year}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              a.active_status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {a.active_status ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isLocked ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1">
                              🔒 LOCKED
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                              ⏳ UNLOCKED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "batch-rules" && (
          <div>
            {/* CREATE BATCH RULE FORM */}
            <form onSubmit={handleCreateBatchRule} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl">
              <h4 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Create Batch Rule</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <select
                  value={batchRuleForm.college}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, college: e.target.value })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                >
                  <option value="KMIT">KMIT</option>
                  <option value="KMEC">KMEC</option>
                  <option value="NGIT">NGIT</option>
                </select>

                <input
                  type="text"
                  placeholder="Course"
                  value={batchRuleForm.course}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, course: e.target.value })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                  required
                />

                <input
                  type="text"
                  placeholder="Section"
                  value={batchRuleForm.section}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, section: e.target.value })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                  required
                />

                <input
                  type="number"
                  placeholder="Semester"
                  value={batchRuleForm.semester}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, semester: parseInt(e.target.value) })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                  min="1"
                  max="8"
                  required
                />

                <input
                  type="text"
                  placeholder="Academic Year"
                  value={batchRuleForm.academic_year}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, academic_year: e.target.value })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                  required
                />

                <select
                  value={batchRuleForm.batch_name}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, batch_name: e.target.value })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                >
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                </select>

                <input
                  type="number"
                  placeholder="Roll Start"
                  value={batchRuleForm.roll_start}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, roll_start: parseInt(e.target.value) })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                />

                <input
                  type="number"
                  placeholder="Roll End"
                  value={batchRuleForm.roll_end}
                  onChange={(e) => setBatchRuleForm({ ...batchRuleForm, roll_end: parseInt(e.target.value) })}
                  className="px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 dark:text-white font-semibold"
                />
              </div>
              <button
                type="submit"
                className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                Create Batch Rule
              </button>
            </form>

            {/* BATCH RULES TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase font-bold border-b dark:border-gray-700">
                    <th className="px-4 py-3">College</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Semester</th>
                    <th className="px-4 py-3">Roll Range</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {batchRules.map((rule) => (
                    <tr key={rule._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-sm">{rule.college}</td>
                      <td className="px-4 py-3 text-sm">{rule.course}</td>
                      <td className="px-4 py-3 text-sm">{rule.section}</td>
                      <td className="px-4 py-3 text-sm font-bold text-indigo-600">{rule.batch_name}</td>
                      <td className="px-4 py-3 text-sm">{rule.semester}</td>
                      <td className="px-4 py-3 text-sm">
                        {rule.roll_start || "?"} - {rule.roll_end || "?"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteBatchRule(rule._id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

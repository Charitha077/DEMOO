import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";

export default function MentorDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [approvalModal, setApprovalModal] = useState({ open: false, request: null });
  const [comment, setComment] = useState("");
  const [parentContacted, setParentContacted] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await api.get("/request/mentor/pending");
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch mentor pending", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openApprovalModal = (req) => {
    setApprovalModal({ open: true, request: req });
    setComment("");
    setParentContacted(false);
  };

  const closeApprovalModal = () => {
    setApprovalModal({ open: false, request: null });
    setComment("");
    setParentContacted(false);
  };

  const submitApproval = async () => {
    if (!comment.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      const req = approvalModal.request;

      await api.post(`/request/${req._id || req.request_id}/mentor/approve`, {
        mentor_id: userId,
        mentor_name: userId,
        remark: comment,
        parent_contacted: parentContacted,
      });

      setToast("Request approved");
      closeApprovalModal();
      fetchPending();
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Approve failed", err);
    }
  };

  const reject = async (req) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const userId = localStorage.getItem("userId");

      await api.post(`/request/${req._id || req.request_id}/mentor/reject`, {
        mentor_id: userId,
        mentor_name: userId,
        remark: reason,
      });

      setToast("Request rejected");
      fetchPending();
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Reject failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

      {/* NAVBAR */}
      <Navbar basePath="/mentor" />

      <div className="p-8 pt-16">
        {toast && (
          <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50">
            {toast}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Mentor Dashboard
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border dark:border-gray-700 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr className="text-gray-700 dark:text-gray-200">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="text-gray-700 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    No pending requests
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr
                    key={r._id || r.request_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-3">{r.student_id}</td>
                    <td className="px-4 py-3">{r.student_name}</td>
                    <td className="px-4 py-3">{r.course}</td>
                    <td className="px-4 py-3">{r.section}</td>
                    <td className="px-4 py-3">{r.reason}</td>
                    <td className="px-4 py-3">{r.batch_name || "-"}</td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => openApprovalModal(r)}
                        className="px-3 py-1 bg-green-600 text-white rounded mr-2 hover:bg-green-700"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => reject(r)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* APPROVAL MODAL */}
        {approvalModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg border dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Approve Gate Pass Request
              </h2>

              <div className="mb-4 text-gray-700 dark:text-gray-300">
                <p className="text-sm mb-2">
                  <strong>Student:</strong>{" "}
                  {approvalModal.request?.student_name} (
                  {approvalModal.request?.student_id})
                </p>
                <p className="text-sm mb-2">
                  <strong>Reason:</strong> {approvalModal.request?.reason}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Comment *
                </label>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Enter your comment..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Parents Contacted?
                </label>

                <div className="flex gap-4 text-gray-700 dark:text-gray-300">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="parentContacted"
                      checked={parentContacted === true}
                      onChange={() => setParentContacted(true)}
                      className="mr-2"
                    />
                    Yes
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="parentContacted"
                      checked={parentContacted === false}
                      onChange={() => setParentContacted(false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeApprovalModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>

                <button
                  onClick={submitApproval}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit Approval
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

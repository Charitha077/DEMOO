import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function RequestsTable({
  url,
  mode = null, // "HOD" | "GUARD" | null
  title = "Requests",
  hodInfo = null,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmBox, setConfirmBox] = useState({
    open: false,
    action: null, // approve | reject | left
    request: null,
  });

  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const requestsRef = useRef(null);

  /* ================= FETCH ================= */
  const fetchRequests = async () => {
    try {
      const res = await api.get(url);
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [url]);

  /* ================= HOD ACTION ================= */
  const handleConfirmedHodAction = async () => {
    const { request, action } = confirmBox;
    if (!request || !action || !hodInfo) return;

    try {
      await api.post(
        `/request/${request._id || request.request_id}/${action}`,
        {
          hod_id: hodInfo.id,
          hod_name: hodInfo.name,
        }
      );

      setToast(
        action === "approve"
          ? "Request Approved Successfully"
          : "Request Rejected Successfully"
      );

      setConfirmBox({ open: false, action: null, request: null });
      fetchRequests();
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  /* ================= GUARD ACTION ================= */
  const handleConfirmLeft = async () => {
    const { request } = confirmBox;
    if (!request) return;

    try {
      await api.post(`/request/${request._id || request.request_id}/left`);

      localStorage.removeItem(`face_verified_${request._id || request.request_id}`);

      setToast(`Student ${request.student_name} marked as LEFT CAMPUS`);

      setConfirmBox({ open: false, action: null, request: null });
      fetchRequests();
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* ✅ TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* TABLE */}
      <div
        ref={requestsRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border p-4 overflow-x-auto"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {title}
        </h3>

        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-200">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Reason</th>
              {mode === "HOD" && (
                <>
                  <th className="px-4 py-3">Mentor</th>
                  <th className="px-4 py-3">Mentor Comment</th>
                  <th className="px-4 py-3">Parents?</th>
                </>
              )}
              <th className="px-4 py-3">Face</th>
              {mode !== "HOD" && (
              <th className="px-4 py-3">Status</th>
               )}


              {mode === "HOD" && (
                <>
                  <th className="px-4 py-3">Approve</th>
                  <th className="px-4 py-3">Reject</th>
                </>
              )}

              {mode === "GUARD" && (
                <>
                  <th className="px-4 py-3">Verify</th>
                  <th className="px-4 py-3">Left</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-10">
                  Loading requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-10">
                  No requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => {
                const requestId = r._id || r.request_id;
                const isVerified =
                  localStorage.getItem(`face_verified_${requestId}`) === "true";

                return (
                  <tr key={requestId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{r.student_id}</td>
                    <td className="px-4 py-3">{r.student_name}</td>
                    <td className="px-4 py-3">{r.course}</td>
                    <td className="px-4 py-3">{r.year}</td>
                    <td className="px-4 py-3">{r.section}</td>
                    <td className="px-4 py-3">{r.reason}</td>

                    {mode === "HOD" && (
                      <>
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          {r.mentor_name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-xs italic">
                          {r.mentor_remark || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            r.mentor_parent_contacted 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {r.mentor_parent_contacted ? "Yes" : "No"}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      {r.student_face ? (
                        <img
                          src={`data:image/jpeg;base64,${r.student_face}`}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>

                    {mode !== "HOD" && (
                    <td className="px-4 py-3 font-semibold">{r.status}</td>
                    )}


                    {/* HOD ACTIONS */}
                    {mode === "HOD" && (
                      <>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setConfirmBox({
                                open: true,
                                action: "approve",
                                request: r,
                              })
                            }
                            className="px-3 py-1 rounded text-white bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </button>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setConfirmBox({
                                open: true,
                                action: "reject",
                                request: r,
                              })
                            }
                            className="px-3 py-1 rounded text-white bg-red-600 hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </td>
                      </>
                    )}

                    {/* GUARD ACTIONS */}
                    {mode === "GUARD" && (
                      <>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              navigate(
                                `/guard/verify-face/${r.student_id}/${requestId}`
                              )
                            }
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            Verify
                          </button>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            disabled={!isVerified}
                            onClick={() =>
                              setConfirmBox({
                                open: true,
                                action: "left",
                                request: r,
                              })
                            }
                            className={`px-3 py-1 rounded text-white ${
                              isVerified
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "bg-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Left
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIRM MODAL (HOD + GUARD) */}
      {confirmBox.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-3 text-center">
              {confirmBox.action === "approve" && "Confirm Approval"}
              {confirmBox.action === "reject" && "Confirm Rejection"}
              {confirmBox.action === "left" && "Confirm Leave"}
            </h2>

            <p className="text-center mb-4">
              Are you sure you want to{" "}
              <b>{confirmBox.action.toUpperCase()}</b> the request of{" "}
              <span className="font-bold">
                {confirmBox.request.student_name} (
                {confirmBox.request.student_id})
              </span>
              ?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={
                  confirmBox.action === "left"
                    ? handleConfirmLeft
                    : handleConfirmedHodAction
                }
                className="px-6 py-2 bg-green-600 text-white rounded"
              >
                Confirm
              </button>

              <button
                onClick={() =>
                  setConfirmBox({ open: false, action: null, request: null })
                }
                className="px-6 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

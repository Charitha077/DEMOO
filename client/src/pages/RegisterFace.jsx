import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function RegisterFace() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [permission, setPermission] = useState("prompt");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const userId = localStorage.getItem("userId");
  const userType = localStorage.getItem("role") || "STUDENT";

  /* 🔒 BLOCK if already registered */
  useEffect(() => {
    const faceId = localStorage.getItem("face_id");
    if (faceId) {
      navigate("/student", { replace: true });
    }
  }, [navigate]);

  /* CAMERA PERMISSION */
  useEffect(() => {
    navigator.permissions?.query({ name: "camera" }).then((res) => {
      setPermission(res.state);
      res.onchange = () => setPermission(res.state);
    });
  }, []);

  /* CLEANUP CAMERA ON UNMOUNT */
  useEffect(() => {
    return () => {
      const stream = webcamRef.current?.video?.srcObject;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
  return () => {
    stopCamera();
  };
  }, []);
  
  useEffect(() => {
  const handlePageHide = () => {
    stopCamera();
  };

  window.addEventListener("pagehide", handlePageHide);

  return () => {
    window.removeEventListener("pagehide", handlePageHide);
  };
  }, []);
  
  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      stopCamera();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
  }, []);


  const requestCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission("granted");
    } catch {
      setPermission("denied");
      setError("Camera permission denied. Please allow access.");
    }
  };

  const stopCamera = () => {
  const video = webcamRef.current?.video;
  if (video && video.srcObject) {
    const stream = video.srcObject;
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null; // 🔥 CRITICAL
  }
  };


  const capture = useCallback(() => {
    if (!cameraReady) return;
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setImgSrc(imageSrc);
  }, [cameraReady]);

  const handleUpload = async () => {
    if (!imgSrc) return;
    setLoading(true);
    setError("");

    try {
      await api.post("/face/register", {
        user_id: userId,
        user_type: userType,
        image_b64: imgSrc.split(",")[1],
      });

      localStorage.setItem("face_id", "PRESENT");

      setToast({ type: "success", msg: "Face registered successfully" });

      // stop camera
      stopCamera();
      const stream = webcamRef.current?.video?.srcObject;
      if (stream) stream.getTracks().forEach((t) => t.stop());

      setTimeout(() => navigate("/student", { replace: true }), 1200);
    } catch (err) {
       const msg =
        err.response?.data?.detail ||err.response?.data?.message ||"Face registration failed";
        setToast({ type: "error", msg });
    }finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white p-6">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 px-6 py-3 rounded-xl shadow-lg text-sm font-bold z-50 ${
            toast.type === "success"
              ? "bg-green-600"
              : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-md w-full bg-gray-800 p-8 rounded-3xl text-center">
        <h2 className="text-2xl font-bold mb-2">Biometric Enrollment</h2>
        <p className="text-gray-400 mb-4">
          Center your face and ensure good lighting
        </p>

        {error && (
          <div className="bg-red-600/20 text-red-400 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {permission === "denied" && (
          <button
            onClick={() =>
              alert(
                "Go to browser address bar → 🔒 → Site settings → Allow Camera → Reload"
              )
            }
            className="w-full py-3 bg-red-600 rounded-xl font-bold"
          >
            How to Enable Camera
          </button>
        )}

        {permission === "prompt" && (
          <button
            onClick={requestCamera}
            className="w-full py-4 bg-indigo-600 rounded-xl font-bold mb-4"
          >
            Enable Camera
          </button>
        )}

        {permission === "granted" && (
          <>
            <div className="aspect-square rounded-2xl overflow-hidden border-4 border-indigo-500 mb-4">
              {!imgSrc ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  onUserMedia={() => setCameraReady(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={imgSrc} className="w-full h-full object-cover" />
              )}
            </div>

            {!imgSrc ? (
              <button
                onClick={capture}
                className="w-full py-4 bg-indigo-600 rounded-xl font-bold"
              >
                Capture
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setImgSrc(null)}
                  className="w-1/2 py-3 bg-gray-600 rounded-xl"
                >
                  Retake
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className={`w-1/2 py-3 rounded-xl font-bold ${
                    loading
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600"
                  }`}
                >
                  {loading ? "Registering..." : "Submit"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { ChevronDownIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function GuardVerifyFace() {
  const { studentId, requestId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
  return () => {
    stopCamera(); // 🔥 cleanup on unmount
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


  useEffect(() => {
  const handlePageHide = () => {
    stopCamera();
  };

  window.addEventListener("pagehide", handlePageHide);

  return () => {
    window.removeEventListener("pagehide", handlePageHide);
  };
  }, []);



  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setStatus("Camera started");
    } catch (err) {
      setStatus("Could not access camera");
    }
  };

  const stopCamera = () => {
  const video = videoRef.current;
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
   }
  };


  const captureAndVerify = async () => {
    if (!videoRef.current?.srcObject)
        return alert("Please start the camera first");

    setIsVerifying(true);
    setStatus("Capturing & Verifying...");

    const ctx = canvasRef.current.getContext("2d");
    // ✅ USE REAL VIDEO RESOLUTION (IMPORTANT)
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const image_b64 = canvasRef.current
        .toDataURL("image/jpeg")
        .split(",")[1];

    try {
        const res = await api.post("/face/verify", {
        user_id: studentId,
        image_b64,
        });

        if (res.data.data?.verified === true) {

        setStatus("Face verified successfully!");

        // ✅ Enable LEFT button in dashboard
        localStorage.setItem(`face_verified_${requestId}`, "true");

        
        stopCamera();
        setTimeout(() => navigate("/guard"), 800);
        } else {
        setStatus("Face mismatch. Access Denied.");
        }
    } catch(err) {
        const msg =err.response?.data?.detail ||err.response?.data?.message ||"Verification failed";
        setStatus(msg);
    } finally {
        setIsVerifying(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* SHARED HEADER */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        <h1 onClick={() => navigate("/guard")} className="text-xl font-bold text-blue-900 dark:text-blue-300 cursor-pointer">FaceSure</h1>
        <div className="flex items-center gap-4">
           <div onClick={() => setOpen(!open)} className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-semibold text-xs">G</div>
            <span className="text-sm dark:text-white">{userId}</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </div>
          {open && (
            <div className="absolute right-6 top-14 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-50">
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-full px-4 py-2 flex items-center gap-2 text-sm dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />} Theme
              </button>
              <button onClick={() => navigate('/login')} className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="p-10 flex justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-2 dark:text-white">Face Verification</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Verifying Student: <span className="font-mono text-blue-600 dark:text-blue-400">{studentId}</span></p>

          <div className="relative inline-block mb-6 overflow-hidden rounded-lg bg-black aspect-square w-full max-w-[300px] border-4 border-gray-100 dark:border-gray-700">
            <video ref={videoRef} autoPlay className="w-full h-full object-cover mirror" />
            <canvas ref={canvasRef} width="300" height="300" hidden />
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={startCamera} className="w-full py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Start Camera
            </button>
            <button onClick={captureAndVerify} disabled={isVerifying} className={`w-full py-3 rounded-lg font-bold text-white transition ${isVerifying ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900 shadow-md'}`}>
              {isVerifying ? "Verifying..." : "Verify Face"}
            </button>
            <button onClick={() =>{
                stopCamera();
                navigate("/guard");}} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2">
              Cancel & Go Back
            </button>
          </div>

          {status && (
            <div className={`mt-6 p-3 rounded-lg text-sm font-medium ${status.includes('success') ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 dark:bg-gray-900 dark:text-blue-300'}`}>
              {status}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
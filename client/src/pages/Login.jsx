import { useState, useRef } from "react";
import { loginApi } from "../services/authService";
import Captcha from "../components/Captcha";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [msg, setMsg] = useState("");
  const [alertType, setAlertType] = useState("");
  const [loading, setLoading] = useState(false);

  const alertRef = useRef(null);
  const navigate = useNavigate();

  const scrollToAlert = () => {
    setTimeout(() => {
      alertRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const res = await loginApi(userId, password);

    if (!res.success) {
      setLoading(false);
      setMsg(res.message || "Invalid credentials");
      setAlertType("error");
      scrollToAlert();
      return;
    }

    const { access_token, refresh_token, role, face_id } = res.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("role", role);
    if (face_id) {
       localStorage.setItem("face_id", face_id);
    } else {
       localStorage.removeItem("face_id");
    }

    const decoded = jwtDecode(access_token);
    localStorage.setItem("userId", decoded.sub);

    setMsg("Login successful!");
    setAlertType("success");
    scrollToAlert();

    setTimeout(() => {
      const id = userId.toUpperCase();
      const isStudent = /^\d{12}$/.test(id);

      if (role === "SUPER_ADMIN" || id.includes("A")) {
        navigate("/super-admin");
      } else if (isStudent) {
        if (!face_id) {
          navigate("/student/register-face");
        } else {
          navigate("/student");
        }
      } else if (id.includes("H")) {
        navigate("/hod");
      } else if (id.includes("G")) {
        navigate("/guard");
      } else if (id.includes("M")) {
        navigate("/mentor");
      } else {
        setMsg("Unauthorized ID format.");
        setAlertType("error");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-200 px-4">

      {/* ================= ALERT ================= */}
      {msg && (
       <div
  ref={alertRef}
  className={`mx-auto mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs shadow-sm
    ${alertType === "error"
      ? "bg-red-50 text-red-700 border border-red-300"
      : "bg-green-50 text-green-700 border border-green-300"}
  `}
>
          <span
            className={`w-5 h-5 flex items-center justify-center rounded-full text-white font-bold
              ${alertType === "error" ? "bg-red-500" : "bg-green-500"}
            `}
          >
            {alertType === "error" ? "✕" : "✓"}
          </span>

          <span className="text-sm font-medium">{msg}</span>
        </div>
      )}

      {/* ================= TITLE ================= */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-wider font-['Poppins']">
        FaceSure Login
      </h1>

      {/* ================= CARD ================= */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleLogin} className="space-y-5">

          {/* USER ID */}
          <div>
            <label className="block text-sm font-medium mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-100 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter user ID"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-12 bg-gray-100 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPassword ? (
                  /* Eye with LEFT diagonal strike */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5
                             c4.477 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.065 7-9.542 7
                             -4.477 0-8.268-2.943-9.542-7z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M20 4L4 20" />
                  </svg>
                ) : (
                  /* Normal eye */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5
                             c4.477 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.065 7-9.542 7
                             -4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="captcha-container">
            <Captcha onValidate={setCaptchaOk} />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={!captchaOk || loading}
            className={`w-full py-2 rounded-lg font-semibold transition
              bg-gray-200 text-gray-800
              ${captchaOk ? "hover:bg-gray-300" : ""}
              ${loading ? "cursor-not-allowed" : ""}
            `}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}

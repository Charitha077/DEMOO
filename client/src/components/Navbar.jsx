import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function Navbar({ basePath = "/hod" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  /* ================= THEME ================= */
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const name =
    localStorage.getItem("name") ||
    localStorage.getItem("userId") ||
    "HOD";
  const role = localStorage.getItem("role") || "HOD";

  return (
    <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
      <h1
        onClick={() => navigate(basePath)}
        className="text-xl font-bold text-blue-900 dark:text-blue-300 cursor-pointer"
      >
        FaceSure
      </h1>

      <div className="flex items-center gap-6 relative">
        <BellIcon className="w-6 h-6 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-700" />

        {/* PROFILE */}
        <div
          ref={profileRef}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setOpen((p) => !p)}
        >
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
            {(name[0] || "H").toUpperCase()}
            {(name[1] || "").toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {name}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </div>

        {/* DROPDOWN */}
        {open && (
          <div
            ref={dropdownRef}
            className="absolute right-2 top-14 w-52 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 overflow-hidden z-50"
          >
            {/* THEME TOGGLE */}
            <button
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
              className="w-full px-4 py-2 flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === "light" ? (
                <>
                  <MoonIcon className="w-4 h-4" />
                  Dark Mode
                </>
              ) : (
                <>
                  <SunIcon className="w-4 h-4 text-yellow-400" />
                  Light Mode
                </>
              )}
            </button>

            <div className="border-t dark:border-gray-700" />

            {/* PROFILE */}
            <div
              className="flex items-center gap-3 px-4 py-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setOpen(false);
                navigate(`${basePath}/profile`);
              }}
            >
              <UserIcon className="w-4 h-4" />
              Profile
            </div>

            {/* LOGOUT */}
            <div
              className="flex items-center gap-3 px-4 py-2 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Logout
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

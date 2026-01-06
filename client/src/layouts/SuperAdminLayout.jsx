import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  BellIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ArrowUpIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminLayout() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  /* 🔑 REFS FOR CLICK OUTSIDE */
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  /* ===============================
     THEME HANDLING
     =============================== */
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* ===============================
     CLICK OUTSIDE TO CLOSE DROPDOWN
     =============================== */
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

  /* ===============================
     SCROLL TO TOP VISIBILITY
     =============================== */
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* ================= HEADER ================= */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        {/* App Name */}
        <h1
          onClick={() => navigate("/super-admin")}
          className="text-xl font-bold text-blue-900 dark:text-blue-300 cursor-pointer hover:opacity-80"
        >
          FaceSure
        </h1>

        {/* Right Section */}
        <div className="flex items-center gap-6 relative">
          {/* Notification */}
          <BellIcon
            className="w-6 h-6 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-700"
            onClick={() => navigate("/super-admin/notifications")}
          />

          {/* Profile */}
          <div
            ref={profileRef}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-semibold">
              SA
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-200">
              SuperAdmin
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </div>

          {/* ================= DROPDOWN ================= */}
          {open && (
            <div
  ref={dropdownRef}
  className="
    absolute
    right-2           /* move slightly right */
    top-14            /* push dropdown lower */
    w-52
    bg-white dark:bg-gray-800
    rounded-md
    shadow-lg
    border dark:border-gray-700
    overflow-hidden
    z-50
  "
>

              {/* Theme Toggle */}
              <button
                onClick={() =>
                  setTheme(theme === "light" ? "dark" : "light")
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

              {/* Profile */}
              <div
  className="flex items-center gap-3 px-4 py-2 cursor-pointer
             text-gray-700 dark:text-gray-200
             hover:bg-gray-100 dark:hover:bg-gray-700"
  onClick={() => {
    setOpen(false);
    navigate("/super-admin/profile");
  }}
>
  <UserIcon className="w-4 h-4" />
  Profile
</div>


              {/* Logout */}
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

      {/* ================= CONTENT ================= */}
      <main className="p-8 pt-12">
        <Outlet />
      </main>

      {/* ================= SCROLL TO TOP ================= */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="
            fixed bottom-6 right-6
            bg-blue-600 dark:bg-blue-500
            text-white
            p-3
            rounded-full
            shadow-lg
            hover:bg-blue-700 dark:hover:bg-blue-600
            transition
            z-50
          "
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

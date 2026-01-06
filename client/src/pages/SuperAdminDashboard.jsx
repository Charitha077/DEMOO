import { useNavigate } from "react-router-dom";
import {
  UserGroupIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  KeyIcon,
  InboxIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const cards = [
    { label: "Create User", icon: UserGroupIcon, action: "create" },
    { label: "Update User", icon: PencilSquareIcon, action: "update" },
    { label: "Get User", icon: MagnifyingGlassIcon, action: "get" },
    { label: "Delete User", icon: TrashIcon, action: "delete" },
    { label: "Requests", icon: InboxIcon, action: "requests" },
    { label: "Update Password", icon: KeyIcon, action: "password" },
    { label: "Promote Students", icon: AcademicCapIcon, action: "promote" },
  ];

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Welcome Super Admin!
      </h2>
      <br></br><br></br>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            onClick={() => navigate(`/super-admin/${action}`)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center gap-3 border border-transparent hover:border-blue-900 dark:hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
            <Icon className="w-10 h-10 text-blue-900 dark:text-blue-900-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

import { InboxIcon } from "@heroicons/react/24/outline";

export default function Notifications() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-10 shadow-sm flex flex-col h-[60vh]">

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Notices
      </h2>

      {/* No Data Section */}
      <div className="flex flex-col items-center justify-center flex-1">
        <InboxIcon className="w-14 h-14 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No data
        </p>
      </div>

    </div>
  );
}

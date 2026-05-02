import { FiEdit2 } from "react-icons/fi";

export default function UserInfo({ user }) {
  if (!user) return null;

  const infoItems = [
    { label: "Full Name", value: user.name },
    { label: "Email Address", value: user.email },
    { label: "Phone Number", value: user.phone || "Not provided" },
  ];

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Personal Information</h3>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {infoItems.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0">
                <span className="text-sm font-medium text-gray-500 w-1/3">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 w-2/3">{item.value}</span>
              </div>
              <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all p-2 rounded-lg hover:bg-blue-50">
                <FiEdit2 size={16} />
              </button>
            </li>
          ))}
          <li className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0">
                <span className="text-sm font-medium text-gray-500 w-1/3">Account Type</span>
                <span className="text-sm font-semibold text-gray-900 w-2/3 flex items-center gap-3">
                  {user.role === "admin" ? "Administrator" : "Customer"}
                  {user.role === "admin" && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Admin</span>
                  )}
                </span>
              </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
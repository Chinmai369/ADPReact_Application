import React from "react";

export default function Header({ title, user, onLogout }) {
  // Display role name - capitalize first letter
  const getDisplayRole = (role) => {
    if (!role) return "";
    if (role === "engineer") return "Engineer";
    if (role === "Commissioner") return "Commissioner";
    // Capitalize first letter for other roles
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  
  const displayRole = getDisplayRole(user?.role);
  
  return (
    <header className="flex items-center mb-6 relative">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center shadow-md">
          {/* put ap-logo.jpeg in public/assets/ap-logo.jpeg or use this placeholder */}
          <img src="/ap-logo.jpeg" alt="AP Logo" className="w-9 h-9 rounded" />
        </div>
        <div>
          <div className="font-semibold text-lg">{title}</div>
          <div className="text-xs text-gray-500">Government of Andhra Pradesh</div>
        </div>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2">
        {user && (
          <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            ULB: Vijayawada | Name: {user.username} | Position: {displayRole}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end">
        <button
          onClick={onLogout}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

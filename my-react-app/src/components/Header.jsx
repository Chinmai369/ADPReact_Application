import React from "react";

export default function Header({ title, user, onLogout }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center shadow-md">
          {/* put ap-logo.jpeg in public/assets/ap-logo.jpeg or use this placeholder */}
          <img src="/assets/ap-logo.jpeg" alt="AP Logo" className="w-9 h-9 rounded" />
        </div>
        <div>
          <div className="font-semibold text-lg">{title}</div>
          <div className="text-xs text-gray-500">Government of Andhra Pradesh</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && <div className="px-3 py-1 text-sm bg-gray-100 rounded-full text-gray-700">Signed in as {user.username}</div>}
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

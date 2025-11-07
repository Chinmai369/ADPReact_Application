import React, { useState } from "react";

export default function SidebarMenu({ 
  menuItems = [], 
  selectedMenuItem, 
  onMenuItemSelect,
  isMenuOpen: externalIsMenuOpen,
  setIsMenuOpen: externalSetIsMenuOpen
}) {
  const [internalIsMenuOpen, setInternalIsMenuOpen] = useState(true);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  
  // Use external state if provided, otherwise use internal state
  const isMenuOpen = externalIsMenuOpen !== undefined ? externalIsMenuOpen : internalIsMenuOpen;
  const setIsMenuOpen = externalSetIsMenuOpen || setInternalIsMenuOpen;

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(menuSearchQuery.toLowerCase())
  );

  return (
    <>
      {/* Menu Toggle Button - Only visible when menu is closed */}
      {!isMenuOpen && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="fixed top-[88px] left-0 z-50 p-2 text-gray-700 hover:text-gray-900 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Left Sidebar Menu - Fixed */}
      <div className={`fixed top-20 left-0 w-64 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl h-[calc(100vh-80px)] border-r border-slate-700 overflow-y-auto z-40 transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Menu</h3>
            {/* Menu Toggle Button - Inside menu when open */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-slate-700 text-white p-1.5 rounded-md hover:bg-slate-600 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search menu..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-9 bg-slate-700 text-white placeholder-slate-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-slate-600"
            />
            <svg
              className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {menuSearchQuery && (
              <button
                onClick={() => setMenuSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <nav className="p-2 space-y-1">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onMenuItemSelect(item.id);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all duration-200 ${
                selectedMenuItem === item.id
                  ? "bg-emerald-600 text-white font-semibold shadow-lg transform scale-[1.02] border-l-4 border-emerald-300"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md hover:translate-x-1"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
            ))
          ) : (
            <div className="px-2.5 py-1.5 text-slate-400 text-xs text-center">
              No menu items found
            </div>
          )}
        </nav>
      </div>
    </>
  );
}


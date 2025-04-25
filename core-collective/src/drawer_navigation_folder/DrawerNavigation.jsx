import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

const DrawerNavigation = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Top Nav */}
        <div className="flex items-center bg-white px-4 py-3 shadow">
          <button onClick={() => setIsOpen(true)} className="text-gray-800">
            <Menu size={26} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">My Web App</h1>
        </div>
  
        {/* Drawer */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <span className="text-lg font-bold">Navigation</span>
            <button onClick={() => setIsOpen(false)} className="text-2xl text-gray-600">
              ×
            </button>
          </div>
          <nav className="p-4 space-y-4">
            <Link to="/" className="block hover:text-blue-600" onClick={() => setIsOpen(false)}>
              Home
            </Link>
            <Link to="/profile" className="block hover:text-blue-600" onClick={() => setIsOpen(false)}>
              Profile
            </Link>
            <Link to="/settings" className="block hover:text-blue-600" onClick={() => setIsOpen(false)}>
              Settings
            </Link>
          </nav>
        </div>
  
        {/* Overlay */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
          />
        )}
  
        {/* Main content */}
        <div className="p-6">{children}</div>
      </div>
    );
}


export default DrawerNavigation;
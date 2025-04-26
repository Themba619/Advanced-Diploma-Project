import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

const DrawerNavigation = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="min-h-screen bg-gray-100">

        {/* Top Nav: div for Tab on the top of the screen */}
        <div className="flex items-center bg-white px-4 py-3 shadow">
          <button onClick={() => setIsOpen(true)} className="text-gray-800">
            <Menu size={26} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">Core Collective</h1>
        </div>
  
        {/* Drawer: Content of opened left drawer*/}
        <div
          className={`fixed top-0 left-0 h-full w-70 bg-white z-50 shadow transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`} 
          >

          <div className="p-4 border-b flex justify-between items-center">
            <span className="text-lg font-bold">Hey there, User!</span>
            <button onClick={() => setIsOpen(false)} className="text-3xl text-gray-600">
              ×
            </button>
          </div>

          {/* Links to other pages */}
          <nav className="p-4 space-y-4"> 

            <Link to="/" className="block hover:text-blue-600"onClick={() => setIsOpen(false)}>
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
  
        {/* Overlay: Background of screen when drawer is open */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-transparent z-40"
          />
        )}
  
        {/* Main content */}
        <div className="">{children}</div>
      </div>
    );
}

export default DrawerNavigation;
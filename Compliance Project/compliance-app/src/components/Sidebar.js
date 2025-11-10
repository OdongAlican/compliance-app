import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

export const Sidebar = ({ sidebarToggle, setSidebarToggle }) => {
  return (
    <div
      className={`${
        sidebarToggle ? 'hidden' : 'block'
      } fixed inset-y-0 left-0 w-72 bg-primary2 px-6 py-6 overflow-y-auto shadow-lg z-40 hidden md:block`}
    >
      {/* Close button for mobile */}
      <button
        onClick={() => setSidebarToggle(true)}
        className="md:hidden absolute top-4 right-4 text-white text-xl"
      >
        &times;
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl text-blue-500 font-bold tracking-wide">Admin Dashboard</h2>
      </div>

      {/* Navigation Sections */}
      <nav className="space-y-8 text-sm font-medium text-blue-800">
        {/* Main */}
        <div >
          <h2 className="text-xs uppercase text-gray-400 mb-2">Menu</h2>
          <ul className="space-y-2 ">
            <SidebarItem to="/" icon="/home.png" label="Home" />
            <SidebarItem to="/inspection" icon="/setting2.png" label="Inspection" />
            <SidebarItem to="/hazard/report" icon="/alert2.png" label="Hazard & Risk Management" />
            <SidebarItem to="/incident-management" icon="/inc.png" label="Incidents Management" />
            <SidebarItem to="/health-and-safety" icon="/audit.png" label="Health & Safety Audit" />
          </ul>
        </div>

        {/* Management */}
        <div className="flex flex-col space-y-10 "></div>
        <div >
          <h2 className="text-xs uppercase text-gray-400 mb-2">Management</h2>
          <ul className="space-y-2">
            <SidebarItem to="/user-management" icon="/users.png" label="Users" />
          </ul>
        </div>

        {/* Others */}
         <div className="flex flex-col space-y-10 pt-40"></div>

        <div className='pt-10'>
          <h2 className="text-xs uppercase text-gray-400 mb-2">Others</h2>
          <ul className="space-y-2 ">
            <SidebarItem to="/capa" icon="/users.png" label="CAPA" />
            <SidebarItem to="/analytics" icon="/users.png" label="Analytics" />
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-10 border-t pt-6 text-gray-700 space-y-4 ">
        <h2 className="text-xs uppercase text-gray-400 pt-10">Account</h2>

        <div className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer">
          <img src="/setting2.png" alt="Help" className="w-6 h-6" />
          <span>Help Center</span>
        </div>

        <div className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer">
          <img src="/help2.png" alt="Settings" className="w-6 h-6" />
          <span>Settings</span>
        </div>

        {/* Profile */}
        <div className="flex items-center justify-between bg-white px-3 py-3 rounded-md shadow">
          <div className="flex items-center gap-3">
            <img src="/profile1.jpg" alt="Profile" className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-semibold text-gray-800">Paul Amegah</p>
              <p className="text-xs text-gray-500">paul@gmail.com</p>
            </div>
          </div>
          <FaChevronDown className="text-gray-500" />
        </div>
      </div>
    </div>
  );
};

// Reusable Sidebar Item Component
const SidebarItem = ({ to, icon, label }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-md transition-colors duration-200 ${
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow'
            : 'hover:bg-blue-100 text-blue-800'
        }`
      }
    >
      <img src={icon} alt={label} className="w-5 h-5" />
      {label}
    </NavLink>
  </li>
);

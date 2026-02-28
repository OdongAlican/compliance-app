import React from 'react';
import { 
  FaHome, 
  FaClipboard, 
  FaExclamationTriangle, 
  FaBell, 
  FaCheckCircle, 
  FaUsers, 
  FaCogs, 
  FaChartBar, 
  FaQuestionCircle, 
  FaSignOutAlt,
  FaChevronRight,
  FaChevronLeft,
} from 'react-icons/fa';
import { MdOutlineDashboard } from "react-icons/md";

import { NavLink } from 'react-router-dom';

export const Sidebar = ({ sidebarToggle, setSidebarToggle, isMinimized, setIsMinimized, darkMode }) => {

  return (
    <div
      className={`${sidebarToggle ? 'block' : 'hidden'} md:block fixed inset-y-0 left-0 overflow-y-auto z-40 transition-all duration-300 ${
        isMinimized ? 'w-24 px-3 py-8' : 'w-72 px-6 py-8'
      } ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-blue-900 border-r border-blue-900 shadow-lg' : 'bg-white/80 backdrop-blur border-r border-gray-200 shadow-sm'}`}
    >
      {/* Close button for mobile */}
      <button
        onClick={() => setSidebarToggle(false)}
        className={`md:hidden absolute top-4 right-4 text-xl ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
        aria-label="Close sidebar"
      >
        &times;
      </button>

      {/* Header */}
      {!isMinimized && (
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${darkMode ? 'bg-blue-900 text-white' : 'bg-primary text-white'}`}> 
              <MdOutlineDashboard size={24} />
            </div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>Admin Dashboard</h2>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-blue-900 text-blue-300' : 'hover:bg-gray-100 text-gray-600'}`}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <FaChevronLeft size={18} />
          </button>
        </div>
      )}

      {isMinimized && (
        <div className="mb-8 flex items-center justify-center">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-blue-950 text-blue-300' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Expand"
          >
            <FaChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className={`${isMinimized ? 'space-y-8' : 'space-y-8 pb-6'}`}>
        {/* Menu Section */}
        <div>
          {!isMinimized && <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>Menu</h3>}
          <ul className={isMinimized ? 'space-y-2 flex flex-col items-center' : 'space-y-3'}>
            <SidebarItem to="/" icon={FaHome} label="Home" minimized={isMinimized} darkMode={darkMode} />
            <SidebarItem to="/inspection" icon={FaClipboard} label="Inspection" minimized={isMinimized} darkMode={darkMode} />
            <SidebarItem to="/hazard/report" icon={FaExclamationTriangle} label="Hazard & Risk Management" minimized={isMinimized} darkMode={darkMode} />
            <SidebarItem to="/incident-management" icon={FaBell} label="Incidents Management" minimized={isMinimized} darkMode={darkMode} />
            <SidebarItem to="/health-and-safety" icon={FaCheckCircle} label="Health & Safety Audit" minimized={isMinimized} darkMode={darkMode} />
          </ul>
        </div>

        {/* Management Section */}
        <div className={`pt-20 border-t ${darkMode ? 'border-blue-900' : 'border-gray-200'}`}> 
          {!isMinimized && <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 mt-4 ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>Management</h3>}
          <ul className={isMinimized ? 'space-y-2 flex flex-col items-center' : 'space-y-3'}>
            <SidebarItem to="/user-management" icon={FaUsers} label="Users" minimized={isMinimized} darkMode={darkMode} />
          </ul>
        </div>

        {/* Others Section */}
        <div className={`pt-20 border-t ${darkMode ? 'border-blue-900' : 'border-gray-200'}`}> 
          {!isMinimized && <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 mt-4 ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>Others</h3>}
          <ul className={isMinimized ? 'space-y-2 flex flex-col items-center' : 'space-y-3'}>
            <SidebarItem to="/capa" icon={FaCogs} label="CAPA" minimized={isMinimized} darkMode={darkMode} />
            <SidebarItem to="/analytics" icon={FaChartBar} label="Analytics" minimized={isMinimized} darkMode={darkMode} />
          </ul>
        </div>
      </nav>

      {/* Divider */}
      {!isMinimized && <div className={`${darkMode ? 'border-t border-blue-900' : 'border-t border-gray-200'} my-6`}></div>}

      {/* Account Section */}
      {!isMinimized && (
        <div className="space-y-4">
          <h3 className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>Account</h3>
          <ul className="space-y-3">
            <AccountItem icon={FaQuestionCircle} label="Help Center" minimized={isMinimized} darkMode={darkMode} />
            <AccountItem icon={FaCogs} label="Settings" minimized={isMinimized} darkMode={darkMode} />
          </ul>
        </div>
      )}

      {/* Profile Card */}
      {!isMinimized && (
        <div className={`${darkMode ? 'bg-gradient-to-tr from-gray-900 via-blue-950 to-blue-900 border border-blue-900' : 'bg-white border border-gray-200'} rounded-lg p-4 shadow-sm mt-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/profile1.jpg" 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-400" 
              />
              <div>
                <p className={`font-semibold text-sm ${darkMode ? 'text-blue-100' : 'text-gray-800'}`}>Paul Amegah</p>
                <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>paul@gmail.com</p>
              </div>
            </div>
            <button className={`${darkMode ? 'text-blue-300 hover:text-blue-500' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
              <FaSignOutAlt size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Sidebar Item Component
const SidebarItem = ({ to, icon: IconComponent, label, minimized, darkMode }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
          isActive
            ? `${darkMode ? 'bg-blue-900 text-blue-200 border-l-4 border-blue-400' : 'bg-primary2 text-primary border-l-4 border-primary'}`
            : `${darkMode ? 'text-blue-200 hover:bg-blue-950' : 'text-gray-600 hover:bg-gray-50'}`
        } ${minimized ? 'justify-center p-2' : ''}`
      }
      title={minimized ? label : ''}
    >
      <IconComponent size={18} />
      {!minimized && label}
    </NavLink>
  </li>
);

// Account Item Component (non-clickable for now)
const AccountItem = ({ icon: IconComponent, label, minimized, darkMode }) => (
  <li>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${darkMode ? 'text-blue-200 hover:bg-blue-950' : 'text-gray-600 hover:bg-gray-50'} ${minimized ? 'justify-center p-2' : ''}`} title={minimized ? label : ''}>
      <IconComponent size={18} />
      {!minimized && label}
    </div>
  </li>
);
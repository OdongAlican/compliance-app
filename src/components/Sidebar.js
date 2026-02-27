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
  FaShieldAlt,
  FaSignOutAlt,
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

export const Sidebar = ({ sidebarToggle, setSidebarToggle, isMinimized, setIsMinimized }) => {

  return (
    <div
      className={`${sidebarToggle ? 'block' : 'hidden'} md:block fixed inset-y-0 left-0 bg-white overflow-y-auto border-r border-gray-200 shadow-sm z-40 transition-all duration-300 ${
        isMinimized ? 'w-24 px-3 py-8' : 'w-72 px-6 py-8'
      }`}
    >
      {/* Close button for mobile */}
      <button
        onClick={() => setSidebarToggle(false)}
        className="md:hidden absolute top-4 right-4 text-gray-800 text-xl"
        aria-label="Close sidebar"
      >
        &times;
      </button>

      {/* Header */}
      {!isMinimized && (
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
              <FaShieldAlt size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
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
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
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
          {!isMinimized && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Menu</h3>}
          <ul className={isMinimized ? 'space-y-2 flex flex-col items-center' : 'space-y-3'}>
            <SidebarItem to="/" icon={FaHome} label="Home" minimized={isMinimized} />
            <SidebarItem to="/inspection" icon={FaClipboard} label="Inspection" minimized={isMinimized} />
            <SidebarItem to="/hazard/report" icon={FaExclamationTriangle} label="Hazard & Risk Management" minimized={isMinimized} />
            <SidebarItem to="/incident-management" icon={FaBell} label="Incidents Management" minimized={isMinimized} />
            <SidebarItem to="/health-and-safety" icon={FaCheckCircle} label="Health & Safety Audit" minimized={isMinimized} />
          </ul>
        </div>

        {/* Management Section */}
        <div className='pt-20 border-t border-gray-200'>
          {!isMinimized && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 mt-4">Management</h3>}
          <ul className={isMinimized ? 'space-y-2 flex flex-col items-center' : 'space-y-3'}>
            <SidebarItem to="/user-management" icon={FaUsers} label="Users" minimized={isMinimized} />
          </ul>
        </div>

        {/* Others Section */}
        <div className='pt-20 border-t border-gray-200'>
          {!isMinimized && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 mt-4">Others</h3>}
          <ul className={isMinimized ? 'space-y-2 flex flex-col items-center' : 'space-y-3'}>
            <SidebarItem to="/capa" icon={FaCogs} label="CAPA" minimized={isMinimized} />
            <SidebarItem to="/analytics" icon={FaChartBar} label="Analytics" minimized={isMinimized} />
          </ul>
        </div>
      </nav>

      {/* Divider */}
      {!isMinimized && <div className="border-t border-gray-200 my-6"></div>}

      {/* Account Section */}
      {!isMinimized && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</h3>
          <ul className="space-y-3">
            <AccountItem icon={FaQuestionCircle} label="Help Center" minimized={isMinimized} />
            <AccountItem icon={FaCogs} label="Settings" minimized={isMinimized} />
          </ul>
        </div>
      )}

      {/* Profile Card */}
      {!isMinimized && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/profile1.jpg" 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover" 
              />
              <div>
                <p className="font-semibold text-gray-800 text-sm">Paul Amegah</p>
                <p className="text-xs text-gray-500">paul@gmail.com</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <FaSignOutAlt size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Sidebar Item Component
const SidebarItem = ({ to, icon: IconComponent, label, minimized }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
          isActive
            ? 'bg-primary2 text-primary border-l-4 border-primary'
            : 'text-gray-600 hover:bg-gray-50'
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
const AccountItem = ({ icon: IconComponent, label, minimized }) => (
  <li>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer ${minimized ? 'justify-center p-2' : ''}`} title={minimized ? label : ''}>
      <IconComponent size={18} />
      {!minimized && label}
    </div>
  </li>
);
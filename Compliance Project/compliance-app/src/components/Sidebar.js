import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

export const Sidebar = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(sidebarCollapsed);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
      setSidebarCollapsed(true);
    }
  }, [setSidebarCollapsed]);

  useEffect(() => {
    setSidebarCollapsed(isCollapsed);
  }, [isCollapsed, setSidebarCollapsed]);

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 bg-gray-100 overflow-y-auto shadow-lg transition-all duration-300
    ${isCollapsed ? '-translate-x-full md:translate-x-0 w-20 md:px-2' : 'translate-x-0 w-72 px-6'}
    py-6
  `}
    >{!sidebarCollapsed && (
      <button
        onClick={() => setSidebarCollapsed(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white px-3 py-2 rounded shadow"
      >
        Close Menu
      </button>
    )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-full w-auto object-contain"
                style={{ filter: "drop-shadow(0 4px 6px rgba(135, 206, 250, 0.3))" }}
              />
              <span className="text-base font-semibold text-gray-800">Admin Dashboard</span>
            </div>
            <button onClick={() => setIsCollapsed(true)}>
              <img src="/collapse-icon.svg" alt="Collapse" className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center w-full text-gray-800"
          >
            <FaChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      {!isCollapsed ? (
        <nav className="space-y-8 text-sm font-medium text-gray-500">
          {/* Menu */}
          <div>
            <h2 className="text-gray-400 text-xs uppercase mb-2">Menu</h2>
            <ul className="space-y-2">
              <SidebarItem to="/" icon="/dashboard-square-01.svg" activeIcon="/dashboard-square-01-blue.svg" label="Home" />
              <SidebarItem to="/inspection" icon="/license-maintenance.svg" activeIcon="/license-maintenance-blue.svg" label="Inspection" />
              <SidebarItem to="/hazard/report" icon="/alert-02.svg" activeIcon="/alert-02-blue.svg" label="Hazard & Risk Management" />
              <SidebarItem to="/incident-management" icon="/safe.svg" activeIcon="/safe-blue.svg" label="Incidents Management" />
              <SidebarItem to="/health-and-safety" icon="/audit-02.svg" activeIcon="/audit-02-blue.svg" label="Health & Safety Audit" />
            </ul>
          </div>

          {/* Management */}
          <div>
            <h2 className="text-gray-400 text-xs uppercase mb-2">Management</h2>
            <ul className="space-y-2">
              <SidebarItem to="/user-management" icon="/user-group.svg" activeIcon="/user-group-blue.svg" label="Users" />
            </ul>
          </div>

          {/* Others */}
          <div className="pt-10">
            <h2 className="text-gray-400 text-xs uppercase mb-2">Others</h2>
            <ul className="space-y-2">
              <SidebarItem to="/capa" icon="/analytics-01.svg" activeIcon="/analytics-01-blue.svg" label="CAPA" />
              <SidebarItem to="/analytics" icon="/analytics-01.svg" activeIcon="/analytics-01-blue.svg" label="Analytics" />
            </ul>
          </div>
        </nav>
      ) : (

        <nav className="space-y-8 text-sm font-medium text-gray-500">
          <ul className="space-y-4 flex flex-col items-center list-none p-0 m-0">
            <CollapsedIcon to="/" icon="/dashboard-square-01.svg" />
            <CollapsedIcon to="/inspection" icon="/license-maintenance.svg" />
            <CollapsedIcon to="/hazard/report" icon="/alert-02.svg" />
            <CollapsedIcon to="/incident-management" icon="/safe.svg" />
            <CollapsedIcon to="/health-and-safety" icon="/audit-02.svg" />
            <CollapsedIcon to="/user-management" icon="/user-group.svg" />
            <CollapsedIcon to="/analytics" icon="/analytics-01.svg" />
          </ul>
        </nav>
      )}

      {/* Footer / Account */}
      {!isCollapsed ? (
        <div className="mt-10 border-t pt-6 space-y-4">
          <h2 className="text-gray-400 text-xs uppercase">Account</h2>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-gray-500 hover:text-primary transition-colors duration-300">
            <img src="/help-circle.svg" alt="Help" className="w-6 h-6" />
            <span>Help Center</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-gray-500 hover:text-primary transition-colors duration-300">
            <img src="/setting-02.svg" alt="Settings" className="w-6 h-6" />
            <span>Settings</span>
          </div>
          <div className="flex items-center justify-between bg-white px-3 py-3 rounded-md shadow hover:shadow-[0_4px_10px_0_rgba(135,206,250,0.3)] transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <img src="/profile1.jpg" alt="Profile" className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold text-gray-800">Paul Amegah</p>
                <p className="text-xs text-gray-500">paul@gmail.com</p>
              </div>
            </div>
            <img src="/logout-02.svg" alt="Logout" className="w-5 h-5" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-10">
          <img src="/logout-02.svg" alt="Logout" className="w-6 h-6 cursor-pointer hover:opacity-80 transition" />
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ to, icon, activeIcon, label }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-md transition-colors duration-300 ${isActive ? 'bg-white text-black font-semibold shadow' : 'hover:bg-gray-100 text-gray-500 hover:text-primary'}`
      }
    >
      {({ isActive }) => (
        <>
          <img src={isActive ? activeIcon : icon} alt={label} className="w-5 h-5" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  </li>
);

const CollapsedIcon = ({ to, icon }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 transition ${isActive ? "bg-blue-100" : ""
        }`
      }
    >
      <img src={icon} alt="" className="w-5 h-5" />
    </NavLink>
  </li>
);


import { Sidebar } from './Sidebar';
import { useState } from 'react';
// import { Navbar } from './Navbar';

export function Layout({ children, sidebarToggle, setSidebarToggle }) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Sidebar */}
      <Sidebar 
        sidebarToggle={sidebarToggle} 
        setSidebarToggle={setSidebarToggle}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />

      {/* Mobile toggle button */}
      {sidebarToggle && (
        <button
          onClick={() => setSidebarToggle(false)}
          className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white px-3 py-2 rounded shadow"
        >
          Open Menu
        </button>
      )}

      {/* Main content */}
      <div className={`flex-1 px-4 md:px-8 py-6 overflow-auto transition-all duration-300 ${
        isMinimized ? 'md:ml-24' : 'md:ml-72'
      }`}>
        {/* <Navbar sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle} /> */}

        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
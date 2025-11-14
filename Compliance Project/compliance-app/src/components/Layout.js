import { Sidebar } from './Sidebar';

export function Layout({ children, sidebarCollapsed, setSidebarCollapsed }) {
  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Sidebar */}
      <Sidebar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />

      {/* Main content */}
      <div
        className={`flex-1 overflow-auto transition-all duration-300
          px-4 md:px-8 py-6
          ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}
        `}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

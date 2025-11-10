import { Sidebar } from './Sidebar';
// import { Navbar } from './Navbar';

export function Layout({ children, sidebarToggle, setSidebarToggle }) {
  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Sidebar */}
      <Sidebar sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle} />

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
      <div className="flex-1 px-4 md:px-8 py-6 overflow-auto">
        {/* <Navbar sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle} /> */}

        <div className="max-w-6xl mx-auto md:ml-72">
          {children}
        </div>
      </div>
    </div>
  );
}

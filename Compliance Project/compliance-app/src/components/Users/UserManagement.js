import React, { useState, useEffect } from 'react';
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";

function ActionMenu({ id, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1 text-gray-500 hover:text-gray-700"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={`Actions for user ${id}`}
          className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onEdit?.(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDelete?.(id);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  useEffect(() => {
    setUsers([
      {
        id: 1,
        name: "Alice Johnson",
        email: "alice@company.com",
        role: "Admin",
        department: "Management",
        status: "Active",
      },
      {
        id: 2,
        name: "Bob Smith",
        email: "bob@company.com",
        role: "Supervisor",
        department: "Operations",
        status: "Active",
      },
      {
        id: 3,
        name: "Carol White",
        email: "carol@company.com",
        role: "Safety Officer",
        department: "Safety",
        status: "Active",
      },
      {
        id: 4,
        name: "David Brown",
        email: "david@company.com",
        role: "Staff",
        department: "Operations",
        status: "Inactive",
      },
      {
        id: 5,
        name: "Emma Davis",
        email: "emma@company.com",
        role: "Contractor",
        department: "Maintenance",
        status: "Active",
      },
      {
        id: 6,
        name: "Frank Miller",
        email: "frank@company.com",
        role: "Auditors",
        department: "Compliance",
        status: "Active",
      },
      {
        id: 7,
        name: "Grace Lee",
        email: "grace@company.com",
        role: "Admin",
        department: "Management",
        status: "Active",
      },
    ]);
  }, []);

  const handleEdit = (id) => {
    console.log("Edit user:", id);
  };

  const handleDelete = (id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const roleColors = {
    Admin: "text-purple-600 bg-purple-100",
    Supervisor: "text-blue-600 bg-blue-100",
    "Safety Officer": "text-green-600 bg-green-100",
    Staff: "text-gray-600 bg-gray-100",
    Contractor: "text-orange-600 bg-orange-100",
    Auditors: "text-red-600 bg-red-100",
  };

  const statusColors = {
    Active: "text-green-600 bg-green-100",
    Inactive: "text-red-600 bg-red-100",
    Pending: "text-yellow-600 bg-yellow-100",
  };

  const filteredUsers = users.filter((user) => {
    const matchesTab = activeTab === "All" || user.role === activeTab;
    const matchesSearch = [user.name, user.email, user.department]
      .join(" ")
      .toLowerCase()
      .includes((searchTerm || "").toLowerCase());
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;
    const matchesDepartment = departmentFilter === "All" || user.department === departmentFilter;

    return matchesTab && matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = ["All", ...new Set(users.map((u) => u.department))];
  const statuses = ["All", ...new Set(users.map((u) => u.status))];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button className="px-4 py-2 bg-primary text-tertiary rounded">
          + Add User
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex space-x-4 mb-6 overflow-x-auto" role="tablist">
        {["All", "Admin", "Supervisor", "Safety Officer", "Staff", "Contractor", "Auditors"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded font-medium border whitespace-nowrap ${
              activeTab === tab
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          id="user-search"
          type="text"
          placeholder="Search by name, email, or department"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 bg-white"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              Status: {status}
            </option>
          ))}
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 bg-white"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              Department: {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {["ID", "Name", "Email", "Role", "Department", "Status", "Action"].map((header) => (
                <th
                  key={header}
                  className="border px-4 py-2 text-left text-sm font-medium text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="border px-4 py-2 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 text-sm">{user.id}</td>
                  <td className="border px-4 py-2 text-sm font-medium">{user.name}</td>
                  <td className="border px-4 py-2 text-sm">{user.email}</td>
                  <td className="border px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="border px-4 py-2 text-sm">{user.department}</td>
                  <td className="border px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    <ActionMenu
                      id={user.id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
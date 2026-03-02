import React, { useState, useEffect } from 'react';
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import UserCreateModal from "./UserStaffForm";
import UserAdminCreateModal from "./UserAdmin";
import UserAuditCreateModal from "./UserAudit";
import UserOfficersCreateModal from "./UserOfficersForm";
import UserSupervisorCreateModal from "./UserSupervisorForm";
import UserContractorCreateModal from "./UserContractorForm";
import UserViewFormModal from "./UserViewForm";

const ROLE_COLORS = {
  Admin:           { background: "color-mix(in srgb,#a371f7 15%,transparent)", color: "#a371f7" },
  Supervisor:      { background: "color-mix(in srgb,#58a6ff 15%,transparent)", color: "#58a6ff" },
  "Safety Officer":{ background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
  Staff:           { background: "color-mix(in srgb,#8b949e 15%,transparent)", color: "#8b949e" },
  Contractor:      { background: "color-mix(in srgb,#f0883e 15%,transparent)", color: "#f0883e" },
  Auditors:        { background: "color-mix(in srgb,#f85149 15%,transparent)", color: "#f85149" },
};

const STATUS_STYLE = {
  Active:   { background: "color-mix(in srgb,#3fb950 15%,transparent)", color: "#3fb950" },
  Inactive: { background: "color-mix(in srgb,#f85149 15%,transparent)", color: "#f85149" },
  Pending:  { background: "color-mix(in srgb,#d29922 15%,transparent)", color: "#d29922" },
};

const ROLE_OPTIONS = ["Staff", "Admin", "Auditors", "Safety Officer", "Supervisor", "Contractor"];
const ROLE_TABS = ["All", "Admin", "Supervisor", "Safety Officer", "Staff", "Contractor", "Auditors"];

function ActionMenu({ id, onEdit, onDelete, onView }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ color: "var(--text-muted)" }}
        className="p-1 rounded hover:opacity-80 transition-opacity"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" aria-label={`Actions for user ${id}`} className="ui-menu absolute right-0 mt-1 z-50">
            <button type="button" role="menuitem" className="ui-menu-item"
              style={{ color: "var(--accent)" }}
              onClick={() => { onView?.(id); setOpen(false); }}>
              View
            </button>
            <button type="button" role="menuitem" className="ui-menu-item"
              onClick={() => { onEdit?.(id); setOpen(false); }}>
              Edit
            </button>
            <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
            <button type="button" role="menuitem" className="ui-menu-item"
              style={{ color: "var(--danger)" }}
              onClick={() => { onDelete?.(id); setOpen(false); }}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter] = useState("All");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showReportExecute, setShowReportExecute] = useState(false);
  const [reportToView, setReportToView] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    setUsers([
      { id: 1, name: "Alice Johnson", email: "alice@company.com", role: "Admin", department: "Management", status: "Active" },
      { id: 2, name: "Bob Smith", email: "bob@company.com", role: "Supervisor", department: "Operations", status: "Active" },
      { id: 3, name: "Carol White", email: "carol@company.com", role: "Safety Officer", department: "Safety", status: "Active" },
      { id: 4, name: "David Brown", email: "david@company.com", role: "Staff", department: "Operations", status: "Inactive" },
      { id: 5, name: "Emma Davis", email: "emma@company.com", role: "Contractor", department: "Maintenance", status: "Active" },
      { id: 6, name: "Frank Miller", email: "frank@company.com", role: "Auditors", department: "Compliance", status: "Active" },
      { id: 7, name: "Grace Lee", email: "grace@company.com", role: "Admin", department: "Management", status: "Active" },
    ]);
  }, []);

  const handleAddUserRole = (role) => { setAddMenuOpen(false); setSelectedRole(role); setShowCreateModal(true); };
  const handleSaveNewUser = (userData) => { setUsers((prev) => [{ id: Date.now(), ...userData }, ...prev]); setShowCreateModal(false); setSelectedRole(null); };
  const handleEdit = (id) => console.log("Edit user:", id);
  const handleDelete = (id) => setUsers((prev) => prev.filter((user) => user.id !== id));
  const handleView = (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setReportToView(user);
    setShowReportExecute(true);
  };

  const statuses = ["All", ...new Set(users.map((u) => u.status))];

  const filteredUsers = users.filter((user) => {
    const matchesTab = activeTab === "All" || user.role === activeTab;
    const matchesSearch = [user.name, user.email, user.department].join(" ").toLowerCase().includes((searchTerm || "").toLowerCase());
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;
    const matchesDepartment = departmentFilter === "All" || user.department === departmentFilter;
    return matchesTab && matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>User Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage system users, roles, and permissions</p>
        </div>
        {/* Add User Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAddMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}
            aria-haspopup="menu"
            aria-expanded={addMenuOpen}
          >
            <PlusIcon className="h-4 w-4" />
            Add User
          </button>
          {addMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
              <div className="ui-menu absolute right-0 mt-1 z-50">
                {ROLE_OPTIONS.map((role) => (
                  <button key={role} type="button" className="ui-menu-item" onClick={() => handleAddUserRole(role)}>
                    {role}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto" role="tablist">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className="px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all"
            style={
              activeTab === tab
                ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                : { background: "transparent", color: "var(--text-muted)", borderColor: "var(--border)" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <input
            id="user-search"
            type="text"
            placeholder="Search by name, email, or department…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ui-input pl-9 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ui-select"
          style={{ minWidth: "160px" }}
        >
          {statuses.map((s) => <option key={s} value={s}>Status: {s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="ui-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                {["ID", "Name", "Email", "Role", "Department", "Status", "Action"].map((h) => (
                  <th key={h} className="ui-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>No users found.</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="ui-row">
                  <td className="ui-td font-mono text-xs">{user.id}</td>
                  <td className="ui-td font-semibold">{user.name}</td>
                  <td className="ui-td" style={{ color: "var(--text-muted)" }}>{user.email}</td>
                  <td className="ui-td">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={ROLE_COLORS[user.role] || { background: "color-mix(in srgb,var(--text-muted) 15%,transparent)", color: "var(--text-muted)" }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="ui-td">{user.department}</td>
                  <td className="ui-td">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={STATUS_STYLE[user.status] || {}}>
                      {user.status}
                    </span>
                  </td>
                  <td className="ui-td">
                    <ActionMenu id={user.id} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-specific create modals */}
      {showCreateModal && !selectedRole && (
        <UserCreateModal isOpen role={selectedRole} onClose={() => { setShowCreateModal(false); setSelectedRole(null); }} onSave={handleSaveNewUser} />
      )}
      {showCreateModal && selectedRole === "Admin" && (
        <UserAdminCreateModal isOpen role={selectedRole} onClose={() => { setShowCreateModal(false); setSelectedRole(null); }} onSave={handleSaveNewUser} />
      )}
      {showCreateModal && selectedRole === "Auditors" && (
        <UserAuditCreateModal isOpen role={selectedRole} onClose={() => { setShowCreateModal(false); setSelectedRole(null); }} onSave={handleSaveNewUser} />
      )}
      {showCreateModal && selectedRole === "Safety Officer" && (
        <UserOfficersCreateModal isOpen role={selectedRole} onClose={() => { setShowCreateModal(false); setSelectedRole(null); }} onSave={handleSaveNewUser} />
      )}
      {showCreateModal && selectedRole === "Supervisor" && (
        <UserSupervisorCreateModal isOpen role={selectedRole} onClose={() => { setShowCreateModal(false); setSelectedRole(null); }} onSave={handleSaveNewUser} />
      )}
      {showCreateModal && selectedRole === "Contractor" && (
        <UserContractorCreateModal isOpen role={selectedRole} onClose={() => { setShowCreateModal(false); setSelectedRole(null); }} onSave={handleSaveNewUser} />
      )}

      {showReportExecute && reportToView && (
        <UserViewFormModal isOpen={showReportExecute} user={reportToView} onClose={() => { setShowReportExecute(false); setReportToView(null); }} />
      )}
    </div>
  );
}


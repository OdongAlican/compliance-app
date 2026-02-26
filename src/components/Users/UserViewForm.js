import React, { useState, useEffect } from "react";

export default function UserViewFormModal({ isOpen = false, user = null, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("general");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    staffId: "",
    email: "",
    department: "",
    phone: "",
    status: "",
    photoUrl: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        staffId: user.staffId || user.id || "",
        email: user.email || "",
        department: user.department || "",
        phone: user.phone || "",
        status: user.status || "",
        photoUrl: user.photoUrl || "https://via.placeholder.com/100",
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const employee = user ?? form;

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    if (onSave) onSave({ ...form, id: user?.id });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    // reset form back to user values
    if (user) {
      setForm({
        name: user.name || "",
        staffId: user.staffId || user.id || "",
        email: user.email || "",
        department: user.department || "",
        phone: user.phone || "",
        status: user.status || "",
        photoUrl: user.photoUrl || "https://via.placeholder.com/100",
      });
    }
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-100">
          <h2 className="text-lg font-semibold">View user — {employee.name}</h2>

          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Edit
              </button>
            )}

            <button onClick={onClose} aria-label="Close" className="text-2xl font-bold text-gray-600 hover:text-gray-800 ml-2">×</button>
          </div>
        </div>

        <div className="p-6">
          {/* header */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <img src={form.photoUrl || "https://via.placeholder.com/100"} alt={employee.name} className="w-20 h-20 rounded-full object-cover" />
              <div>
                {editing ? (
                  <>
                    <input value={form.name} onChange={handleChange("name")} className="block w-full border p-2 rounded mb-1" />
                    <input value={form.staffId} onChange={handleChange("staffId")} className="block w-full border p-2 rounded mb-1" />
                    <input value={form.email} onChange={handleChange("email")} className="block w-full border p-2 rounded mb-1" />
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.staffId}</p>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {editing ? (
                <select value={form.status} onChange={handleChange("status")} className="px-3 py-1 border rounded text-sm">
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">⏳ {employee.status}</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            {["general", "incidents", "witness"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
              >
                {tab === "general" ? "General Information" : tab === "incidents" ? "Reported Incidents" : "Witness Statements"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Staff ID</label>
                {editing ? <input value={form.staffId} onChange={handleChange("staffId")} className="w-full border p-2 rounded" /> : <p className="text-gray-900">{employee.staffId}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                {editing ? <input value={form.name} onChange={handleChange("name")} className="w-full border p-2 rounded" /> : <p className="text-gray-900">{employee.name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">E-mail</label>
                {editing ? <input value={form.email} onChange={handleChange("email")} type="email" className="w-full border p-2 rounded" /> : <p className="text-gray-900">{employee.email}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Department</label>
                {editing ? <input value={form.department} onChange={handleChange("department")} className="w-full border p-2 rounded" /> : <p className="text-gray-900">{employee.department}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                {editing ? <input value={form.phone} onChange={handleChange("phone")} className="w-full border p-2 rounded" /> : <p className="text-gray-900">{employee.phone}</p>}
              </div>
            </div>
          )}

          {activeTab === "incidents" && <div className="text-gray-600">No reported incidents yet.</div>}
          {activeTab === "witness" && <div className="text-gray-600">No witness statements available.</div>}
        </div>
      </div>
    </div>
  );
}